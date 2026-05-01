const { sendJson, readJsonBody } = require("../ccweb/http");
const { answerQuestion, sessionSummary } = require("./engine");

async function handleTeachingBrainAnswer(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const roomId = (body.roomId || "").toString().trim();
  const userId = (body.userId || "").toString().trim();
  const question = (body.question || "").toString().trim();
  if (!roomId || !userId || !question) {
    sendJson(res, 400, { error: "roomId, userId, and question are required." });
    return;
  }
  const tracks = Array.isArray(body.curriculumTracks) ? body.curriculumTracks : [];
  const streamContext = body.streamContext && typeof body.streamContext === "object" ? body.streamContext : null;
  const result = answerQuestion(roomId, userId, question, tracks, streamContext);
  sendJson(res, 200, {
    module: "teaching-brain",
    ...result,
  });
}

async function handleTeachingBrainSummary(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const roomId = (body.roomId || "").toString().trim();
  const userId = (body.userId || "").toString().trim();
  if (!roomId || !userId) {
    sendJson(res, 400, { error: "roomId and userId are required." });
    return;
  }
  sendJson(res, 200, {
    module: "teaching-brain",
    ...sessionSummary(roomId, userId),
  });
}

module.exports = {
  handleTeachingBrainAnswer,
  handleTeachingBrainSummary,
};
