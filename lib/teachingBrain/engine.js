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

function answerQuestion(roomId, userId, question, curriculumTracks) {
  const s = getOrCreateSession(roomId, userId, curriculumTracks);
  s.messagesProcessed += 1;
  const q = (question || "").toLowerCase();
  let difficulty = s.proficiency;
  if (/beginner|basic|simple/i.test(q)) difficulty = "beginner";
  if (/advanced|prove|derive/i.test(q)) difficulty = "advanced";

  const answer = synthesizeAnswer(q, difficulty, curriculumTracks);
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

function synthesizeAnswer(questionFragment, proficiency, tracks) {
  const topic = tracks[0] || "Digital Business Systems";
  const depth =
    proficiency === "beginner"
      ? "Plain-language explanation with an analogy."
      : proficiency === "advanced"
        ? "Technical detail with caveats and edge cases."
        : "Balanced intuition plus one concrete example.";
  const text = `Teaching Brain (${proficiency}): On "${topic}" — ${depth} Relating to your question: tie concepts to measurable outcomes (latency, security budget, user trust).`;
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
