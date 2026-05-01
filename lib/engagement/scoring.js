/**
 * Engagement scoring for streams — weights time, chat, reactions (anti-abuse heuristics).
 * Aligns with streaming attendance maps in server state when integrated.
 */

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

function computeEngagementScore(input) {
  const watchMinutes = clamp(Number(input.watchMinutes) || 0, 0, 600);
  const chatMessages = clamp(Number(input.chatMessageCount) || 0, 0, 500);
  const reactions = clamp(Number(input.reactionCount) || 0, 0, 200);
  const interactionScore = clamp(Number(input.interactionScore) || 0, 0, 500);

  /** Spam / bot dampening */
  const chatDensity = chatMessages / Math.max(1, watchMinutes / 5);
  const spamPenalty = chatDensity > 12 ? 0.65 : chatDensity > 8 ? 0.85 : 1;

  const raw =
    watchMinutes * 1.2 +
    chatMessages * 3 +
    reactions * 2 +
    interactionScore * 0.8;

  const score = Math.round(raw * spamPenalty);

  return {
    score,
    components: {
      watchMinutes,
      chatMessages,
      reactions,
      interactionScore,
    },
    spamPenalty,
    tier: score > 800 ? "high" : score > 400 ? "medium" : "standard",
  };
}

function estimateOrganicShare(poolUsd, score, totalScoresSum) {
  const pool = Math.max(0, Number(poolUsd) || 0);
  const sum = Math.max(1, Number(totalScoresSum) || 1);
  const share = (pool * score) / sum;
  return Math.round(share * 100) / 100;
}

module.exports = {
  computeEngagementScore,
  estimateOrganicShare,
};
