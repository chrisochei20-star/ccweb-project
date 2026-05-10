/**
 * Aggregated CCWEB user dashboard (PostgreSQL).
 */

const { query } = require("./pool");
const coursesPg = require("./persistenceCourses");
const monPg = require("./persistenceMonetization");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

async function getDashboardBundle(userId) {
  if (!usePostgres() || !userId) return null;

  const learningProgress = await coursesPg.listProgress(userId);
  let avgProgress = 0;
  if (learningProgress.length) {
    avgProgress =
      learningProgress.reduce((s, p) => s + (Number(p.progressPct) || 0), 0) / learningProgress.length;
  }

  let completedLessonsWeek = 0;
  try {
    const { rows: cw } = await query(
      `SELECT COUNT(*)::int AS c FROM ccweb_lesson_completion
       WHERE user_id = $1 AND completed_at > NOW() - INTERVAL '7 days'`,
      [userId]
    );
    completedLessonsWeek = cw[0]?.c || 0;
  } catch {
    /* ignore */
  }

  const usageRow = await monPg.getUsageRow(userId);

  let tutorEvents30d = 0;
  let aiAssistantMsgs30d = 0;
  let meteringUsd30d = 0;
  let meteringCount30d = 0;
  try {
    const { rows: te } = await query(
      `SELECT COUNT(*)::int AS c FROM learning_tutor_events
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'`,
      [userId]
    );
    tutorEvents30d = te[0]?.c || 0;
  } catch {
    /* ignore */
  }
  try {
    const { rows: am } = await query(
      `SELECT COUNT(*)::int AS c FROM ccweb_ai_messages m
       JOIN ccweb_ai_conversations c ON c.id = m.conversation_id
       WHERE c.user_id = $1 AND m.role = $2 AND m.created_at > NOW() - INTERVAL '30 days'`,
      [userId, "assistant"]
    );
    aiAssistantMsgs30d = am[0]?.c || 0;
  } catch {
    /* ignore */
  }
  try {
    const { rows: me } = await query(
      `SELECT COUNT(*)::int AS n, COALESCE(SUM(amount_usd), 0)::float AS s
       FROM ccweb_metering_events
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'`,
      [userId]
    );
    meteringCount30d = me[0]?.n || 0;
    meteringUsd30d = Number(me[0]?.s || 0);
  } catch {
    /* ignore */
  }

  let wallets = { total: 0, byChain: [], items: [] };
  try {
    const { rows: wc } = await query(`SELECT COUNT(*)::int AS c FROM ccweb_wallets WHERE user_id = $1`, [userId]);
    wallets.total = wc[0]?.c || 0;
    const { rows: byC } = await query(
      `SELECT chain, COUNT(*)::int AS cnt FROM ccweb_wallets WHERE user_id = $1 GROUP BY chain ORDER BY cnt DESC`,
      [userId]
    );
    wallets.byChain = byC.map((r) => ({ chain: r.chain, count: r.cnt }));
    const { rows: wi } = await query(
      `SELECT id, chain, address, label, is_primary, created_at FROM ccweb_wallets WHERE user_id = $1 ORDER BY is_primary DESC, created_at DESC LIMIT 12`,
      [userId]
    );
    wallets.items = wi;
  } catch {
    /* ignore */
  }

  let earnings = { lifetimeUsd: 0, recent: [] };
  try {
    const { rows: es } = await query(
      `SELECT COALESCE(SUM(amount_usd), 0)::float AS t FROM ccweb_earnings WHERE user_id = $1`,
      [userId]
    );
    earnings.lifetimeUsd = Number(es[0]?.t || 0);
    const { rows: er } = await query(
      `SELECT id, source, amount_usd, currency, reference_type, created_at FROM ccweb_earnings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );
    earnings.recent = er;
  } catch {
    /* ignore */
  }

  let social = { followers: 0, following: 0 };
  try {
    const { rows: f1 } = await query(`SELECT COUNT(*)::int AS c FROM ccweb_follows WHERE following_id = $1`, [userId]);
    const { rows: f2 } = await query(`SELECT COUNT(*)::int AS c FROM ccweb_follows WHERE follower_id = $1`, [userId]);
    social.followers = f1[0]?.c || 0;
    social.following = f2[0]?.c || 0;
  } catch {
    /* ignore */
  }

  let notifications = { unread: 0, items: [] };
  try {
    const { rows: nu } = await query(
      `SELECT COUNT(*)::int AS c FROM ccweb_notifications WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    );
    notifications.unread = nu[0]?.c || 0;
    const { rows: ni } = await query(
      `SELECT id, kind, title, body, read_at, created_at FROM ccweb_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 12`,
      [userId]
    );
    notifications.items = ni;
  } catch {
    /* ignore */
  }

  const activity = [];
  try {
    const { rows: lc } = await query(
      `SELECT lc.completed_at AS at, l.title AS lesson_title, c.title AS course_title, c.slug AS course_slug
       FROM ccweb_lesson_completion lc
       JOIN ccweb_lessons l ON l.id = lc.lesson_id
       JOIN ccweb_courses c ON c.id = l.course_id
       WHERE lc.user_id = $1
       ORDER BY lc.completed_at DESC LIMIT 6`,
      [userId]
    );
    for (const r of lc) {
      activity.push({
        type: "lesson_complete",
        at: r.at,
        title: `${r.lesson_title}`,
        subtitle: r.course_title,
        href: `/courses/${encodeURIComponent(r.course_slug)}`,
      });
    }
  } catch {
    /* ignore */
  }
  try {
    const { rows: ge } = await query(
      `SELECT event_type, metadata, created_at FROM ccweb_growth_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 6`,
      [userId]
    );
    for (const r of ge) {
      activity.push({
        type: "growth",
        at: r.created_at,
        title: r.event_type || "Activity",
        subtitle: "",
        meta: r.metadata,
      });
    }
  } catch {
    /* ignore */
  }

  activity.sort((a, b) => new Date(b.at) - new Date(a.at));
  const activityTop = activity.slice(0, 12);

  const recommended = buildRecommendedActions({
    learningProgress,
    wallets,
    social,
    notifications,
    avgProgress,
  });

  return {
    learning: {
      coursesTracked: learningProgress.length,
      avgProgressPct: Math.round(avgProgress * 10) / 10,
      completedLessonsWeek,
      progressRows: learningProgress.slice(0, 12),
    },
    ai: {
      tutorEvents30d,
      assistantMessages30d: aiAssistantMsgs30d,
      meteringEvents30d: meteringCount30d,
      meteringUsd30d: Math.round(meteringUsd30d * 10000) / 10000,
      monthlyUsage: usageRow
        ? {
            scanCount: Number(usageRow.scan_count || 0),
            intelligenceCalls: Number(usageRow.intelligence_calls || 0),
            aiPlatformRuns: Number(usageRow.ai_platform_runs || 0),
            hubAgentRuns: Number(usageRow.hub_agent_runs || 0),
            hubWorkflowRuns: Number(usageRow.hub_workflow_runs || 0),
            tier: usageRow.tier,
          }
        : null,
    },
    wallets,
    earnings,
    social,
    notifications,
    activity: activityTop,
    recommendedActions: recommended,
  };
}

function buildRecommendedActions({ learningProgress, wallets, social, notifications, avgProgress }) {
  const actions = [];
  if (!learningProgress.length) {
    actions.push({
      id: "start-course",
      title: "Browse the course catalog",
      description: "Structured lessons, quizzes, and AI tutor threads.",
      href: "/courses",
      accent: "cyan",
    });
  } else if (avgProgress < 95 && learningProgress.some((p) => p.progressPct < 100)) {
    const next = learningProgress.find((p) => p.progressPct < 100) || learningProgress[0];
    actions.push({
      id: "continue-course",
      title: `Continue ${next.title || "your course"}`,
      description: `${Math.round(next.progressPct || 0)}% complete`,
      href: next.slug ? `/courses/${encodeURIComponent(next.slug)}` : "/learn",
      accent: "violet",
    });
  }

  if (!wallets.total) {
    actions.push({
      id: "connect-wallet",
      title: "Connect a wallet",
      description: "Track addresses and sign in with Web3 from your profile.",
      href: "/profile",
      accent: "green",
    });
  }

  if (social.followers + social.following === 0) {
    actions.push({
      id: "community",
      title: "Explore the community",
      description: "Posts, discussions, and referral loops.",
      href: "/community",
      accent: "violet",
    });
  }

  if (notifications.unread > 0) {
    actions.unshift({
      id: "notifications",
      title: `${notifications.unread} unread notifications`,
      description: "Catch up on alerts and mentions.",
      href: "/profile",
      accent: "cyan",
    });
  }

  actions.push({
    id: "ai-tutor",
    title: "Open AI tutor",
    description: "Startup, Web3, and proposal modes with memory.",
    href: "/ai-tutor",
    accent: "cyan",
  });

  return actions.slice(0, 6);
}

module.exports = { getDashboardBundle, usePostgres };
