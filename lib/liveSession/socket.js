/**
 * Socket.io live session — chat, AI Teaching Brain, engagement, earnings (MVP).
 * Requires `socket.io` (npm install socket.io). If missing, live session is disabled.
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

function safeNum(n, d = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : d;
}

function createRoomState(topic, poolUsd, curriculumTracks) {
  return {
    topic: topic || "Live CCWEB session",
    poolUsd: Math.max(100, safeNum(poolUsd, 3200)),
    curriculumTracks: Array.isArray(curriculumTracks) ? curriculumTracks : ["AI Foundations", "Digital Business Systems"],
    messages: [],
    users: new Map(),
    startedAt: Date.now(),
  };
}

function ensureRoom(rooms, roomId, payload = {}) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, createRoomState(payload.topic, payload.poolUsd, payload.curriculumTracks));
  }
  return rooms.get(roomId);
}

function appendMessage(room, msg) {
  room.messages.push(msg);
  if (room.messages.length > 200) room.messages.shift();
}

function recordChatHistoryForBrain(room, text) {
  const tail = room.messages
    .filter((m) => m.kind === "user" || m.kind === "ai")
    .slice(-6)
    .map((m) => `${m.displayName}: ${m.text.slice(0, 80)}`);
  return tail;
}

function computeRoomEarnings(room) {
  let totalScore = 0;
  const list = [];
  room.users.forEach((u, uid) => {
    const scoreResult = computeEngagementScore({
      watchMinutes: safeNum(u.watchMinutes, 0),
      chatMessageCount: safeNum(u.chatCount, 0),
      reactionCount: safeNum(u.reactionCount, 0),
      interactionScore: safeNum(u.interactionScore, 0),
    });
    totalScore += scoreResult.score;
    list.push({ userId: uid, ...u, engagementScore: scoreResult.score, tier: scoreResult.tier });
  });
  list.forEach((row) => {
    const share =
      totalScore > 0 ? Math.round(((row.engagementScore / totalScore) * room.poolUsd + Number.EPSILON) * 100) / 100 : 0;
    row.estimatedEarningsUsd = share;
  });
  return { participants: list, totalScore, poolUsd: room.poolUsd };
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

  const rooms = new Map();
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
        reactionCount: safeNum(payload.reactionCount, 0),
        interactionScore: safeNum(payload.interactionScore, 0),
        lastActivityAt: Date.now(),
        lastMessageAt: Date.now(),
      });

      socket.emit("session:joined", {
        roomId,
        topic: room.topic,
        poolUsd: room.poolUsd,
        curriculumTracks: room.curriculumTracks,
        messages: room.messages.slice(-80),
      });

      socket.to(roomId).emit("presence:update", { userId: uid, displayName, action: "joined" });
      io.to(roomId).emit("earnings:update", computeRoomEarnings(room));

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
        const streamContext = {
          topic: room.topic,
          userLevel: u?.userLevel || "intermediate",
          recentHistory: recordChatHistoryForBrain(room),
        };
        const tracks = room.curriculumTracks;
        const aiResult = answerQuestion(currentRoomId, userId, question, tracks, streamContext);
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

      io.to(currentRoomId).emit("engagement:update", {
        userId,
        snapshot: computeEngagementScore({
          watchMinutes: u?.watchMinutes || 0,
          chatMessageCount: u?.chatCount || 0,
          reactionCount: u?.reactionCount || 0,
          interactionScore: u?.interactionScore || 0,
        }),
      });
      io.to(currentRoomId).emit("earnings:update", computeRoomEarnings(room));
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
      io.to(currentRoomId).emit("earnings:update", computeRoomEarnings(room));
      socket.emit("engagement:update", {
        userId,
        snapshot: computeEngagementScore({
          watchMinutes: u.watchMinutes,
          chatMessageCount: u.chatCount,
          reactionCount: u.reactionCount,
          interactionScore: u.interactionScore,
        }),
      });
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
      io.to(currentRoomId).emit("earnings:update", computeRoomEarnings(room));
    });

    socket.on("disconnect", () => {
      if (idleTimers.has(socket.id)) {
        clearInterval(idleTimers.get(socket.id));
        idleTimers.delete(socket.id);
      }
      if (currentRoomId && userId) {
        socket.to(currentRoomId).emit("presence:update", { userId, action: "left" });
      }
    });
  });

  return io;
}

module.exports = { attachLiveSession };
