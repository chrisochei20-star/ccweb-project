/**
 * CCWEB engagement scoring — weighted signals, normalization, earnings share, anti-abuse.
 * Extend with Redis-backed rate limits in production.
 */

/** Tunable weights (points per unit before penalties) */
const WEIGHTS = {
  watchMinute: 1.2,
  message: 3,
  aiInteraction: 12,
  reaction: 2,
  quizParticipation: 25,
};

const CAPS = {
  watchMinutes: 480,
  messages: 400,
  aiInteractions: 80,
  reactions: 150,
  quizParticipations: 50,
};

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

/**
 * Anti-abuse: spam density, burst messaging, abnormal AI/chat ratio.
 */
function computePenalties(input, meta = {}) {
  const watchMinutes = Math.max(0.5, Number(input.watchMinutes) || 0);
  const chatMessages = clamp(Number(input.chatMessageCount) || 0, 0, CAPS.messages);
  const aiCount = clamp(Number(input.aiInteractionCount) || 0, 0, CAPS.aiInteractions);

  const chatDensity = chatMessages / Math.max(1, watchMinutes / 5);
  let spamPenalty = 1;
  if (chatDensity > 14) spamPenalty = 0.55;
  else if (chatDensity > 10) spamPenalty = 0.72;
  else if (chatDensity > 8) spamPenalty = 0.88;

  const msgsPerMin = meta.messagesLastMinute != null ? Number(meta.messagesLastMinute) : null;
  let burstPenalty = 1;
  if (msgsPerMin != null && msgsPerMin > 18) burstPenalty = 0.5;
  else if (msgsPerMin != null && msgsPerMin > 12) burstPenalty = 0.75;

  const aiRatio = aiCount / Math.max(1, chatMessages);
  let abnormalPenalty = 1;
  if (chatMessages > 30 && aiRatio > 0.85) abnormalPenalty = 0.7;

  const combined = spamPenalty * burstPenalty * abnormalPenalty;

  return {
    spamPenalty,
    burstPenalty,
    abnormalPenalty,
    combined,
    flags: [
      ...(chatDensity > 10 ? [{ code: "high_chat_density", severity: chatDensity > 14 ? "high" : "medium" }] : []),
      ...(msgsPerMin != null && msgsPerMin > 12 ? [{ code: "message_burst", severity: msgsPerMin > 18 ? "high" : "medium" }] : []),
      ...(abnormalPenalty < 1 ? [{ code: "suspicious_ai_chat_ratio", severity: "medium" }] : []),
    ],
  };
}

function computeRawComponents(input) {
  const wm = clamp(Number(input.watchMinutes) || 0, 0, CAPS.watchMinutes);
  const msg = clamp(Number(input.chatMessageCount) || 0, 0, CAPS.messages);
  const ai = clamp(Number(input.aiInteractionCount) || 0, 0, CAPS.aiInteractions);
  const react = clamp(Number(input.reactionCount) || 0, 0, CAPS.reactions);
  const quiz = clamp(Number(input.quizParticipationCount) || 0, 0, CAPS.quizParticipations);
  const legacyInteraction = clamp(Number(input.interactionScore) || 0, 0, 500);

  const contribution = {
    time: wm * WEIGHTS.watchMinute,
    messages: msg * WEIGHTS.message,
    aiInteractions: ai * WEIGHTS.aiInteraction,
    reactions: react * WEIGHTS.reaction,
    quiz: quiz * WEIGHTS.quizParticipation,
    legacyInteraction: legacyInteraction * 0.8,
  };

  const rawSubtotal =
    contribution.time +
    contribution.messages +
    contribution.aiInteractions +
    contribution.reactions +
    contribution.quiz +
    contribution.legacyInteraction;

  return { contribution, rawSubtotal, cappedInputs: { wm, msg, ai, react, quiz } };
}

function computeEngagementScore(input, meta = {}) {
  const { contribution, rawSubtotal, cappedInputs } = computeRawComponents(input);
  const penalties = computePenalties(input, meta);
  const score = Math.round(rawSubtotal * penalties.combined);

  return {
    score,
    maxPossibleApprox: 50000,
    contribution,
    cappedInputs,
    penalties,
    tier: score > 1200 ? "high" : score > 500 ? "medium" : "standard",
    weights: WEIGHTS,
  };
}

/**
 * Normalize scores across participants (share of 1.0 + rank).
 */
function normalizeParticipants(participantsWithScores) {
  const rows = participantsWithScores.map((p) => ({
    ...p,
    rawScore: Math.max(0, Number(p.rawScore) || 0),
  }));
  const sumRaw = rows.reduce((s, r) => s + r.rawScore, 0);
  const maxRaw = Math.max(...rows.map((r) => r.rawScore), 1);

  return rows
    .map((r) => ({
      ...r,
      shareOfPool: sumRaw > 0 ? r.rawScore / sumRaw : 0,
      normalizedPercent: maxRaw > 0 ? Math.round((r.rawScore / maxRaw) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.rawScore - a.rawScore)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

function distributePoolUsd(normalizedRows, poolUsd) {
  const pool = Math.max(0, Number(poolUsd) || 0);
  return normalizedRows.map((r) => ({
    ...r,
    estimatedEarningsUsd: Math.round(pool * r.shareOfPool * 100) / 100,
  }));
}

function estimateOrganicShare(poolUsd, userRawScore, sumRawScores) {
  const pool = Math.max(0, Number(poolUsd) || 0);
  const sum = Math.max(1e-9, Number(sumRawScores) || 0);
  return Math.round(((pool * userRawScore) / sum) * 100) / 100;
}

module.exports = {
  WEIGHTS,
  CAPS,
  computeEngagementScore,
  computePenalties,
  normalizeParticipants,
  distributePoolUsd,
  estimateOrganicShare,
};
