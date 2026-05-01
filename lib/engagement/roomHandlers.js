const { sendJson, readJsonBody } = require("../ccweb/http");
const { rooms, computeRoomSnapshot, ensureRoom } = require("../liveSession/roomsStore");
const { WEIGHTS, computeEngagementScore, normalizeParticipants, distributePoolUsd } = require("./scoring");

function handleEngagementSessionGet(pathname, res) {
  const match = pathname.match(/^\/api\/v1\/engagement\/sessions\/([^/]+)$/);
  const roomId = match ? decodeURIComponent(match[1]) : null;
  if (!roomId) {
    sendJson(res, 400, { error: "Invalid path." });
    return;
  }
  const room = rooms.get(roomId);
  if (!room) {
    sendJson(res, 404, { error: "Session not found. Join via Socket.io first or use POST to seed." });
    return;
  }
  sendJson(res, 200, { session: computeRoomSnapshot(room) });
}

function handleEngagementSessionsList(res) {
  const list = Array.from(rooms.values()).map((r) => ({
    roomId: r.id,
    topic: r.topic,
    poolUsd: r.poolUsd,
    userCount: r.users.size,
    messageCount: r.messages.length,
    startedAt: r.startedAt,
  }));
  sendJson(res, 200, { count: list.length, sessions: list });
}

function handleEngagementExamples(res) {
  const base = {
    watchMinutes: 45,
    chatMessageCount: 12,
    aiInteractionCount: 3,
    reactionCount: 5,
    quizParticipationCount: 1,
  };
  const a = computeEngagementScore(base, { messagesLastMinute: 2 });
  const b = computeEngagementScore(
    { ...base, chatMessageCount: 120, watchMinutes: 10 },
    { messagesLastMinute: 45 }
  );
  const participants = normalizeParticipants([
    { userId: "u1", displayName: "A", rawScore: a.score },
    { userId: "u2", displayName: "B", rawScore: 400 },
  ]);
  const withMoney = distributePoolUsd(participants, 5000);
  sendJson(res, 200, {
    weights: WEIGHTS,
    exampleHealthyUser: a,
    exampleSpammyUser: b,
    exampleNormalization: {
      poolUsd: 5000,
      participants: withMoney,
    },
  });
}

async function handleEngagementSessionSeed(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const roomId = (body.roomId || `room-${Date.now()}`).toString().trim();
  ensureRoom(rooms, roomId, {
    topic: body.topic,
    poolUsd: body.poolUsd,
    curriculumTracks: body.curriculumTracks,
  });
  const room = rooms.get(roomId);
  sendJson(res, 201, { roomId, session: computeRoomSnapshot(room) });
}

module.exports = {
  handleEngagementSessionGet,
  handleEngagementSessionsList,
  handleEngagementExamples,
  handleEngagementSessionSeed,
};
