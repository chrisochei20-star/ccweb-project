/**
 * Shared in-memory session registry — isolate rooms for multi-session scaling.
 * Swap for Redis + Redis adapter for Socket.io at scale.
 */

const {
  computeEngagementScore,
  normalizeParticipants,
  distributePoolUsd,
} = require("../engagement/scoring");

function safeNum(n, d = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : d;
}

function createRoomState(topic, poolUsd, curriculumTracks) {
  return {
    id: null,
    topic: topic || "Live CCWEB session",
    poolUsd: Math.max(100, safeNum(poolUsd, 3200)),
    curriculumTracks: Array.isArray(curriculumTracks)
      ? curriculumTracks
      : ["AI Foundations", "Digital Business Systems"],
    messages: [],
    users: new Map(),
    startedAt: Date.now(),
  };
}

function ensureRoom(rooms, roomId, payload = {}) {
  if (!rooms.has(roomId)) {
    const room = createRoomState(payload.topic, payload.poolUsd, payload.curriculumTracks);
    room.id = roomId;
    rooms.set(roomId, room);
  }
  return rooms.get(roomId);
}

function appendMessage(room, msg) {
  room.messages.push(msg);
  if (room.messages.length > 400) room.messages.shift();
}

function pruneMessageTimestamps(timestamps, windowMs = 60000) {
  const now = Date.now();
  return timestamps.filter((t) => now - t < windowMs);
}

function buildEngagementInput(user) {
  return {
    watchMinutes: safeNum(user.watchMinutes, 0),
    chatMessageCount: safeNum(user.chatCount, 0),
    aiInteractionCount: safeNum(user.aiInteractionCount, 0),
    reactionCount: safeNum(user.reactionCount, 0),
    quizParticipationCount: safeNum(user.quizParticipationCount, 0),
    interactionScore: safeNum(user.interactionScore, 0),
  };
}

function computeRoomSnapshot(room) {
  let sumRaw = 0;
  const participants = [];

  room.users.forEach((u, uid) => {
    const timestamps = pruneMessageTimestamps(u.messageTimestamps || []);
    u.messageTimestamps = timestamps;
    const messagesLastMinute = timestamps.length;

    const engagement = computeEngagementScore(buildEngagementInput(u), {
      messagesLastMinute,
    });

    sumRaw += engagement.score;
    participants.push({
      userId: uid,
      displayName: u.displayName,
      rawScore: engagement.score,
      tier: engagement.tier,
      penalties: engagement.penalties,
      contribution: engagement.contribution,
      watchMinutes: u.watchMinutes,
      chatCount: u.chatCount,
      aiInteractionCount: u.aiInteractionCount,
      reactionCount: u.reactionCount,
      quizParticipationCount: u.quizParticipationCount,
    });
  });

  const normalized = normalizeParticipants(participants);
  const withEarnings = distributePoolUsd(normalized, room.poolUsd);

  return {
    roomId: room.id,
    poolUsd: room.poolUsd,
    totalRawScore: sumRaw,
    participantCount: withEarnings.length,
    leaderboard: withEarnings,
  };
}

module.exports = {
  rooms: new Map(),
  ensureRoom,
  appendMessage,
  computeRoomSnapshot,
  pruneMessageTimestamps,
  safeNum,
};
