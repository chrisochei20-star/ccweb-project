/**
 * CCWEB platform module registry — single manifest for clients and operators.
 */

module.exports.PLATFORM_MANIFEST = {
  name: "CCWEB",
  version: "1.0.0",
  tagline: "Learn, earn, automate, and analyze — one AI-native platform.",
  modules: [
    {
      id: "streaming",
      name: "AI Streaming",
      description: "Live sessions with AI Teaching Brain, chat, attendance, and organic revenue distribution.",
      apiPrefix: "/api/streaming",
      realtime: {
        path: "/socket.io/",
        protocol: "socket.io",
        note: "Full live UI: /live — also optional WebSocket /ws with ws package",
      },
      status: "live",
    },
    {
      id: "teaching-brain",
      name: "AI Teaching Brain",
      description: "Adaptive tutoring, Q&A, session memory, quizzes — co-host inside streams.",
      apiPrefix: "/api/v1/teaching-brain",
      status: "live",
    },
    {
      id: "engagement",
      name: "Engagement & Revenue",
      description: "Time, messages, AI, reactions, quiz → weighted score, normalization, pool share. REST: /api/v1/engagement/score, /payout-preview, /sessions, /examples.",
      apiPrefix: "/api/v1/engagement",
      status: "live",
    },
    {
      id: "crypto-intelligence",
      name: "Crypto Intelligence",
      description:
        "Token safety (contract, LP, ownership, taxes), on-chain behavior proxies, alpha discovery, wallet risk, AI summaries, and in-process alerts. MVP uses synthetic + heuristic data — connect Etherscan/indexers for production.",
      apiPrefix: "/api/v1/crypto",
      status: "live",
    },
    {
      id: "automation",
      name: "Business Automation Hub",
      description: "Agent Operator, workflows, lead gen, billing — replace fragmented SaaS with orchestrated agents.",
      apiPrefix: "/api/automation",
      status: "live",
    },
    {
      id: "community",
      name: "Community",
      description: "Posts, chats, blogs, notifications — creator and learner ecosystem.",
      apiPrefix: "/api/community",
      status: "live",
    },
  ],
  priorities: [
    "Core streaming + chat",
    "AI Teaching Brain integration",
    "Engagement + revenue system",
    "Crypto scanner",
    "Business automation MVP",
  ],
};
