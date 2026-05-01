const { sendJson, readJsonBody } = require("../ccweb/http");
const { computeEngagementScore, estimateOrganicShare } = require("./scoring");

const SIGNAL_KEYS = [
  "watchMinutes",
  "chatMessageCount",
  "aiInteractionCount",
  "reactionCount",
  "quizParticipationCount",
  "interactionScore",
];

function pickSignals(body) {
  const o = {};
  for (const k of SIGNAL_KEYS) {
    if (k in body && body[k] != null) o[k] = body[k];
  }
  return o;
}

async function handleEngagementScore(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const meta = body.meta && typeof body.meta === "object" ? body.meta : {};
  const result = computeEngagementScore(pickSignals(body), meta);
  sendJson(res, 200, {
    module: "engagement",
    ...result,
  });
}

async function handleEngagementPayoutPreview(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const poolUsd = body.poolUsd ?? body.creatorPoolUsd ?? 1000;
  const meta = body.meta && typeof body.meta === "object" ? body.meta : {};
  const score = computeEngagementScore(pickSignals(body), meta).score;
  const totalScoresSum = body.totalScoresSum ?? score * 12;
  const estimatedShareUsd = estimateOrganicShare(poolUsd, score, totalScoresSum);
  sendJson(res, 200, {
    module: "engagement",
    poolUsd,
    userScore: score,
    totalScoresSum,
    estimatedShareUsd,
    fairnessNote:
      "Organic pool splits use participation-weighted formula; combine with platform anti-abuse policies in production.",
  });
}

module.exports = {
  handleEngagementScore,
  handleEngagementPayoutPreview,
  pickSignals,
};
