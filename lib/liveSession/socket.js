/**
 * Socket.io live session — multi-room isolation, engagement + leaderboard.
 * Requires `socket.io` (npm install socket.io).
 */

let Server = null;
try {
  Server = require("socket.io").Server;
} catch {
  console.warn("[CCWEB] Optional `socket.io` not installed — live session disabled. Run: npm install socket.io");
}
const crypto = require("crypto");
const { answerQuestion, sessionSummary } = require("../teachingBrain/engine");
const { computeEngagementScore } = require("../engagement/scoring");
const {
  rooms,
  ensureRoom,
  appendMessage,
  computeRoomSnapshot,
  pruneMessageTimestamps,
  safeNum,
} = require("./roomsStore");

function recordChatHistoryForBrain(room) {
  return room.messages
    .filter((m) => m.kind === "user" || m.kind === "ai")
    .slice(-6)
    .map((m) => `${m.displayName}: ${m.text.slice(0, 80)}`);
}

function emitEngagementForUser(io, roomId, room, uid) {
  const u = room.users.get(uid);
  if (!u) return;
  const timestamps = pruneMessageTimestamps(u.messageTimestamps || []);
  u.messageTimestamps = timestamps;
  const engagement = computeEngagementScore(
    {
      watchMinutes: safeNum(u.watchMinutes, 0),
      chatMessageCount: safeNum(u.chatCount, 0),
      aiInteractionCount: safeNum(u.aiInteractionCount, 0),
      reactionCount: safeNum(u.reactionCount, 0),
      quizParticipationCount: safeNum(u.quizParticipationCount, 0),
      interactionScore: safeNum(u.interactionScore, 0),
    },
    { messagesLastMinute: timestamps.length }
  );
  io.to(roomId).emit("engagement:update", {
    userId: uid,
    snapshot: engagement,
  });
}

function broadcastRoomEconomy(io, roomId, room) {
  const snapshot = computeRoomSnapshot(room);
  io.to(roomId).emit("earnings:update", snapshot);
  io.to(roomId).emit("leaderboard:update", {
    roomId,
    poolUsd: snapshot.poolUsd,
    leaderboard: snapshot.leaderboard,
    totalRawScore: snapshot.totalRawScore,
  });
}

function attachLiveSession(httpServer) {
  if (!Server) {
    return null;
  }
  const io = new Server(httpServer, {
    path: "/socket.io/",
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
  });

  const idleTimers = new Map();

  io.on("connection", (socket) => {
    let currentRoomId = null;
    let userId = null;

    socket.on("session:join", (payload = {}) => {
      const roomId = (payload.roomId || "live-demo").toString().trim();
      const uid = (payload.userId || socket.id).toString().trim();
      const displayName = (payload.displayName || "Learner").toString().trim();
      currentRoomId = roomId;
      userId = uid;

      socket.join(roomId);
      const room = ensureRoom(rooms, roomId, payload);
      room.users.set(uid, {
        displayName,
        userLevel: payload.userLevel || "intermediate",
        watchMinutes: safeNum(payload.watchMinutes, 0),
        chatCount: 0,
        aiInteractionCount: 0,
        reactionCount: safeNum(payload.reactionCount, 0),
        quizParticipationCount: 0,
        interactionScore: safeNum(payload.interactionScore, 0),
        messageTimestamps: [],
        lastActivityAt: Date.now(),
        lastMessageAt: Date.now(),
      });

      socket.emit("session:joined", {
        roomId,
        topic: room.topic,
        poolUsd: room.poolUsd,
        curriculumTracks: room.curriculumTracks,
        messages: room.messages.slice(-80),
        engagementSnapshot: computeRoomSnapshot(room),
      });

      socket.to(roomId).emit("presence:update", { userId: uid, displayName, action: "joined" });
      broadcastRoomEconomy(io, roomId, room);

      if (idleTimers.has(socket.id)) clearInterval(idleTimers.get(socket.id));
      idleTimers.set(
        socket.id,
        setInterval(() => {
          const r = rooms.get(roomId);
          if (!r || !userId) return;
          const u = r.users.get(userId);
          if (!u) return;
          const idleMs = Date.now() - (u.lastMessageAt || u.lastActivityAt);
          if (idleMs > 55000 && idleMs < 120000) {
            const prompt = `Still with us? Quick reaction: in one sentence, how does "${r.topic}" relate to your work this week?`;
            socket.emit("ai:nudge", {
              id: `nudge-${Date.now()}`,
              kind: "engagement_prompt",
              text: prompt,
              ts: new Date().toISOString(),
            });
          }
        }, 60000)
      );
    });

    socket.on("chat:message", (payload = {}) => {
      if (!currentRoomId || !userId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const text = (payload.text || "").toString().trim();
      if (!text) return;

      const u = room.users.get(userId);
      if (u) {
        u.chatCount += 1;
        u.lastMessageAt = Date.now();
        u.lastActivityAt = Date.now();
        u.interactionScore = safeNum(u.interactionScore, 0) + 2;
        u.messageTimestamps = pruneMessageTimestamps(u.messageTimestamps || []);
        u.messageTimestamps.push(Date.now());
      }

      const msg = {
        id: `msg-${crypto.randomUUID().slice(0, 10)}`,
        kind: "user",
        userId,
        displayName: u?.displayName || "Learner",
        text,
        ts: new Date().toISOString(),
      };
      appendMessage(room, msg);
      io.to(currentRoomId).emit("chat:message", msg);

      const askAi = payload.askAi === true || /^\/ai\s/i.test(text) || /^@brain\b/i.test(text);
      let question = text;
      if (/^\/ai\s/i.test(text)) question = text.replace(/^\/ai\s+/i, "").trim();
      if (/^@brain\b/i.test(text)) question = text.replace(/^@brain\s*/i, "").trim();

      if (askAi && question) {
        if (u) u.aiInteractionCount = safeNum(u.aiInteractionCount, 0) + 1;
        const streamContext = {
          topic: room.topic,
          userLevel: u?.userLevel || "intermediate",
          recentHistory: recordChatHistoryForBrain(room),
        };
        const aiResult = answerQuestion(currentRoomId, userId, question, room.curriculumTracks, streamContext);
        const aiMsg = {
          id: `ai-${crypto.randomUUID().slice(0, 10)}`,
          kind: "ai",
          userId: "teaching-brain",
          displayName: "AI Teaching Brain",
          text: aiResult.answer,
          topic: aiResult.topic,
          difficulty: aiResult.difficulty,
          engagement: aiResult.engagement,
          ts: new Date().toISOString(),
        };
        appendMessage(room, aiMsg);
        io.to(currentRoomId).emit("chat:message", aiMsg);

        const sum = sessionSummary(currentRoomId, userId).summary;
        io.to(currentRoomId).emit("summary:update", {
          bullets: sum?.checkpoints?.slice(-5) || [],
          topics: sum?.topicsCovered?.slice(0, 6) || [],
          proficiency: sum?.proficiency,
          updatedAt: new Date().toISOString(),
        });
      }

      emitEngagementForUser(io, currentRoomId, room, userId);
      broadcastRoomEconomy(io, currentRoomId, room);
    });

    socket.on("engagement:sync", (payload = {}) => {
      if (!currentRoomId || !userId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const u = room.users.get(userId);
      if (!u) return;
      u.watchMinutes = Math.max(u.watchMinutes || 0, safeNum(payload.watchMinutes, 0));
      u.reactionCount = safeNum(payload.reactionCount, u.reactionCount);
      u.interactionScore = safeNum(payload.interactionScore, u.interactionScore);
      u.lastActivityAt = Date.now();
      emitEngagementForUser(io, currentRoomId, room, userId);
      broadcastRoomEconomy(io, currentRoomId, room);
    });

    socket.on("reaction:increment", () => {
      if (!currentRoomId || !userId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const u = room.users.get(userId);
      if (!u) return;
      u.reactionCount = safeNum(u.reactionCount, 0) + 1;
      u.interactionScore = safeNum(u.interactionScore, 0) + 3;
      u.lastActivityAt = Date.now();
      emitEngagementForUser(io, currentRoomId, room, userId);
      broadcastRoomEconomy(io, currentRoomId, room);
    });

    socket.on("quiz:participation", (payload = {}) => {
      if (!currentRoomId || !userId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const u = room.users.get(userId);
      if (!u) return;
      if (payload.correct === true) {
        u.quizParticipationCount = safeNum(u.quizParticipationCount, 0) + 1;
      } else {
        u.quizParticipationCount = safeNum(u.quizParticipationCount, 0) + 0.35;
      }
      u.lastActivityAt = Date.now();
      emitEngagementForUser(io, currentRoomId, room, userId);
      broadcastRoomEconomy(io, currentRoomId, room);
    });

    socket.on("disconnect", () => {
      if (idleTimers.has(socket.id)) {
        clearInterval(idleTimers.get(socket.id));
        idleTimers.delete(socket.id);
      }
      if (currentRoomId && userId) {
        const room = rooms.get(currentRoomId);
        if (room) room.users.delete(userId);
        socket.to(currentRoomId).emit("presence:update", { userId, action: "left" });
        if (room) broadcastRoomEconomy(io, currentRoomId, room);
      }
    });
  });

  return io;
}

module.exports = { attachLiveSession, rooms };
