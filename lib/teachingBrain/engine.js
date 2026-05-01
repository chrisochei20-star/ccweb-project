/**
 * AI Teaching Brain — session-bound tutoring state (MVP in-memory).
 * Production: persist per room + user; plug LLM + vector memory.
 */

const sessions = new Map();

function sessionKey(roomId, userId) {
  return `${roomId}::${userId}`;
}

function getOrCreateSession(roomId, userId, curriculumTracks = []) {
  const key = sessionKey(roomId, userId);
  const now = new Date().toISOString();
  let s = sessions.get(key);
  if (!s) {
    s = {
      roomId,
      userId,
      curriculumTracks,
      proficiency: "intermediate",
      lastTopics: [],
      summaryBullets: [],
      quizzesAsked: 0,
      messagesProcessed: 0,
      createdAt: now,
      updatedAt: now,
    };
    sessions.set(key, s);
  }
  return s;
}

function answerQuestion(roomId, userId, question, curriculumTracks, streamContext = null) {
  const s = getOrCreateSession(roomId, userId, curriculumTracks);
  s.messagesProcessed += 1;
  const q = (question || "").toLowerCase();
  let difficulty = s.proficiency;
  if (/beginner|basic|simple/i.test(q)) difficulty = "beginner";
  if (/advanced|prove|derive/i.test(q)) difficulty = "advanced";
  if (streamContext?.userLevel === "beginner") difficulty = "beginner";
  if (streamContext?.userLevel === "advanced") difficulty = "advanced";

  const answer = synthesizeAnswer(q, difficulty, curriculumTracks, streamContext);
  s.lastTopics.unshift(answer.topic);
  s.lastTopics = [...new Set(s.lastTopics)].slice(0, 8);
  if (s.messagesProcessed % 5 === 0) {
    s.summaryBullets.push(`Checkpoint ${s.messagesProcessed}: reinforced "${answer.topic}" at ${difficulty} depth.`);
    s.summaryBullets = s.summaryBullets.slice(-6);
  }
  if (/quiz|test me|question/i.test(q)) {
    s.quizzesAsked += 1;
    answer.engagement = {
      type: "quiz",
      prompt: "Quick check: what is the main tradeoff between decentralization and throughput?",
      choices: ["Higher fees", "Validator set size", "UI theme", "DNS"],
      correctIndex: 1,
    };
  }
  s.proficiency = difficulty;
  s.updatedAt = new Date().toISOString();
  sessions.set(sessionKey(roomId, userId), s);

  return {
    answer: answer.text,
    topic: answer.topic,
    difficulty,
    session: publicSession(s),
    engagement: answer.engagement || null,
  };
}

function synthesizeAnswer(questionFragment, proficiency, tracks, streamContext = null) {
  const streamTopic = (streamContext && streamContext.topic) || "";
  const topic = tracks[0] || streamTopic || "Digital Business Systems";
  const historyHint =
    streamContext && Array.isArray(streamContext.recentHistory) && streamContext.recentHistory.length
      ? ` Building on our thread: ${streamContext.recentHistory.slice(-2).join(" → ")}.`
      : "";
  const depth =
    proficiency === "beginner"
      ? "Plain-language explanation with a simple analogy (e.g. a restaurant kitchen vs. a food truck for scaling tradeoffs)."
      : proficiency === "advanced"
        ? "Technical detail with caveats, edge cases, and a concrete protocol or system design angle."
        : "Balanced intuition plus one worked example you can try in your own project.";
  const text = `Teaching Brain (${proficiency})${streamTopic ? ` · Live focus: “${streamTopic}”` : ""}: On "${topic}" — ${depth}${historyHint} Relating to your question: connect ideas to measurable outcomes (latency, trust assumptions, user conversion).`;
  return { text, topic };
}

function sessionSummary(roomId, userId) {
  const s = sessions.get(sessionKey(roomId, userId));
  if (!s) {
    return { summary: null };
  }
  return {
    summary: {
      proficiency: s.proficiency,
      topicsCovered: s.lastTopics,
      checkpoints: s.summaryBullets,
      quizzesCompleted: s.quizzesAsked,
      messagesProcessed: s.messagesProcessed,
      updatedAt: s.updatedAt,
    },
  };
}

function publicSession(s) {
  return {
    proficiency: s.proficiency,
    lastTopics: s.lastTopics,
    messagesProcessed: s.messagesProcessed,
    quizzesAsked: s.quizzesAsked,
    updatedAt: s.updatedAt,
  };
}

module.exports = {
  answerQuestion,
  sessionSummary,
  getOrCreateSession,
};
