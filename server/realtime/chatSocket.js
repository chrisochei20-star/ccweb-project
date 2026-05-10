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
    return cb(null, allowed.has(origin));
  };
}

/** userId -> Set(socket.id) */
const socketCounts = new Map();

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
    socket.join(`user:${uid}`);
    const wasNew = !socketCounts.has(uid) || socketCounts.get(uid).size === 0;
    addPresence(uid, socket.id);
    if (wasNew) {
      emitPresenceToPartners(io, uid, true).catch(() => {});
    }

    socket.on("join:chat", (chatId, ack) => {
      (async () => {
        try {
          if (!(await chatPg.verifyMember(chatId, uid))) {
            ack?.({ ok: false, error: "forbidden" });
            return;
          }
          socket.join(`chat:${chatId}`);
          ack?.({ ok: true });
        } catch (e) {
          ack?.({ ok: false, error: e.message });
        }
      })();
    });

    socket.on("leave:chat", (chatId) => {
      if (chatId) socket.leave(`chat:${chatId}`);
    });

    socket.on("typing", (payload, ack) => {
      (async () => {
        try {
          const chatId = payload?.chatId;
          if (!chatId) return ack?.({ ok: false });
          if (!(await chatPg.verifyMember(chatId, uid))) return ack?.({ ok: false, error: "forbidden" });
          socket.to(`chat:${chatId}`).emit("typing", {
            chatId,
            userId: uid,
            typing: !!payload?.typing,
          });
          ack?.({ ok: true });
        } catch (e) {
          ack?.({ ok: false, error: e.message });
        }
      })();
    });

    socket.on("disconnect", () => {
      const gone = removePresence(uid, socket.id);
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
  ioInstance.to(`chat:${chatId}`).emit("message:new", messagePayload);
}

function broadcastInboxRefresh(userId, chatId) {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit("inbox:refresh", { chatId });
}

function onlineStatusForUserIds(userIds) {
  const out = {};
  for (const id of userIds) {
    out[id] = isUserOnline(id);
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
  onlineStatusForUserIds,
  closeChatSocket,
};
