/**
 * Socket.IO for DM typing, presence (partner-scoped), and inbox refresh signals.
 * Attach to the same HTTP server as the CCWEB API (see server.js).
 */

"use strict";

const { Server } = require("socket.io");
const authEngine = require("../../auth/authEngine");
const { parseAllowedOrigins } = require("../../security/expressHardDefaults");
const chatPg = require("../../db/persistenceChat");
const { logger } = require("../../logging/logger");

let ioInstance = null;

function corsOriginFn() {
  const parsed = parseAllowedOrigins();
  if (parsed.mode === "all") {
    return (origin, cb) => cb(null, true);
  }
  const allowed = new Set(parsed.origins || []);
  return (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowed.has(origin)) return cb(null, true);
    logger.warn({ msg: "socketio_cors_origin_rejected", origin, allowlistSize: allowed.size });
    // Match express `cors` behaviour: `false` skips CORS handling; empty list denies with a proper preflight.
    return cb(null, []);
  };
}

/** userId -> Set(socket.id) */
const socketCounts = new Map();
/** userId -> last disconnect timestamp (ms) */
const lastActiveAt = new Map();
/** chatId -> Map<userId, expiresAt> typing indicators */
const typingState = new Map();

function addPresence(uid, sid) {
  if (!socketCounts.has(uid)) socketCounts.set(uid, new Set());
  socketCounts.get(uid).add(sid);
}

function removePresence(uid, sid) {
  const s = socketCounts.get(uid);
  if (!s) return false;
  s.delete(sid);
  if (s.size === 0) {
    socketCounts.delete(uid);
    return true;
  }
  return false;
}

function isUserOnline(uid) {
  return socketCounts.has(uid) && socketCounts.get(uid).size > 0;
}

async function emitPresenceToPartners(io, userId, online) {
  try {
    const partners = await chatPg.listPartnerIds(userId);
    for (const pid of partners) {
      io.to(`user:${pid}`).emit("presence:update", { userId, online });
    }
  } catch (e) {
    logger.warn({ msg: "presence_partner_broadcast_failed", err: e.message });
  }
}

function clearTyping(chatId, userId) {
  const m = typingState.get(chatId);
  if (!m) return;
  m.delete(userId);
  if (m.size === 0) typingState.delete(chatId);
}

function setTyping(chatId, userId, active) {
  if (!chatId || !userId) return;
  if (!active) {
    clearTyping(chatId, userId);
    return;
  }
  if (!typingState.has(chatId)) typingState.set(chatId, new Map());
  typingState.get(chatId).set(userId, Date.now() + 4000);
}

function cleanupStaleTyping() {
  const now = Date.now();
  for (const [chatId, users] of typingState.entries()) {
    for (const [uid, exp] of users.entries()) {
      if (exp <= now) users.delete(uid);
    }
    if (users.size === 0) typingState.delete(chatId);
  }
}

const typingCleanupTimer = setInterval(cleanupStaleTyping, 5000);
if (typingCleanupTimer.unref) typingCleanupTimer.unref();

/**
 * @param {import("http").Server} httpServer
 */
function attachChatSocket(httpServer) {
  if (ioInstance) return ioInstance;
  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: corsOriginFn(),
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    const uid = authEngine.getUserIdFromAccess(String(token || "").trim());
    if (!uid) {
      return next(new Error("Unauthorized"));
    }
    socket.data.userId = uid;
    next();
  });

  io.on("connection", (socket) => {
    const uid = socket.data.userId;
    socket.data.joinedChats = socket.data.joinedChats || new Set();
    socket.join(`user:${uid}`);
    const wasNew = !socketCounts.has(uid) || socketCounts.get(uid).size === 0;
    addPresence(uid, socket.id);
    logger.info({ msg: "socket_connected", userId: uid, socketId: socket.id, wasNew });
    if (wasNew) {
      emitPresenceToPartners(io, uid, true).catch(() => {});
    }

    socket.on("join:chat", (chatId, ack) => {
      (async () => {
        try {
          if (!(await chatPg.verifyMember(chatId, uid))) {
            logger.warn({ msg: "socket_join_denied", userId: uid, chatId });
            ack?.({ ok: false, error: "forbidden" });
            return;
          }
          socket.join(`chat:${chatId}`);
          socket.data.joinedChats.add(chatId);
          logger.info({ msg: "socket_join_chat", userId: uid, chatId });
          ack?.({ ok: true });
        } catch (e) {
          ack?.({ ok: false, error: e.message });
        }
      })();
    });

    socket.on("leave:chat", (chatId) => {
      if (chatId) {
        socket.leave(`chat:${chatId}`);
        socket.data.joinedChats.delete(chatId);
        clearTyping(chatId, uid);
        logger.info({ msg: "socket_leave_chat", userId: uid, chatId });
      }
    });

    socket.on("typing", (payload, ack) => {
      (async () => {
        try {
          const chatId = payload?.chatId;
          if (!chatId) return ack?.({ ok: false });
          if (!(await chatPg.verifyMember(chatId, uid))) return ack?.({ ok: false, error: "forbidden" });
          const active = !!payload?.typing;
          setTyping(chatId, uid, active);
          socket.to(`chat:${chatId}`).emit("typing", {
            chatId,
            userId: uid,
            typing: active,
          });
          ack?.({ ok: true });
        } catch (e) {
          ack?.({ ok: false, error: e.message });
        }
      })();
    });

    socket.on("disconnect", (reason) => {
      for (const chatId of socket.data.joinedChats || []) {
        socket.leave(`chat:${chatId}`);
        clearTyping(chatId, uid);
      }
      socket.data.joinedChats.clear();
      const gone = removePresence(uid, socket.id);
      lastActiveAt.set(uid, Date.now());
      logger.info({ msg: "socket_disconnected", userId: uid, reason, gone });
      if (gone) {
        emitPresenceToPartners(io, uid, false).catch(() => {});
      }
    });
  });

  ioInstance = io;
  logger.info({ msg: "chat_socket_attached", path: "/socket.io" });
  return io;
}

function getChatIo() {
  return ioInstance;
}

function broadcastChatMessage(chatId, messagePayload) {
  if (!ioInstance) return;
  logger.info({ msg: "socket_broadcast_message", chatId, messageId: messagePayload?.id });
  ioInstance.to(`chat:${chatId}`).emit("message:new", messagePayload);
}

function broadcastInboxRefresh(userId, chatId) {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit("inbox:refresh", { chatId });
}

/** Push in-app notification list refresh (unread badge, center). */
function broadcastNotificationUpdate(userId, payload = {}) {
  if (!ioInstance || !userId) return;
  logger.info({ msg: "socket_notification_update", userId, kind: payload?.kind });
  ioInstance.to(`user:${userId}`).emit("notifications:update", payload);
}

/** Broadcast community feed / rooms / reaction changes to all connected clients (authenticated namespace). */
function broadcastCommunityUpdate(payload = {}) {
  if (!ioInstance) return;
  logger.info({ msg: "socket_community_update", kind: payload?.kind, postId: payload?.postId });
  ioInstance.emit("community:update", payload);
}

function onlineStatusForUserIds(userIds) {
  const out = {};
  for (const id of userIds) {
    out[id] = isUserOnline(id);
  }
  return out;
}

function lastActiveForUserIds(userIds) {
  const out = {};
  for (const id of userIds) {
    out[id] = lastActiveAt.get(id) ? new Date(lastActiveAt.get(id)).toISOString() : null;
  }
  return out;
}

function closeChatSocket() {
  if (ioInstance) {
    ioInstance.close();
    ioInstance = null;
  }
}

module.exports = {
  attachChatSocket,
  getChatIo,
  broadcastChatMessage,
  broadcastInboxRefresh,
  broadcastNotificationUpdate,
  broadcastCommunityUpdate,
  onlineStatusForUserIds,
  lastActiveForUserIds,
  closeChatSocket,
};
