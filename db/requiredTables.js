/**
 * Canonical list of CCWEB tables created by db/schema.sql (+ incremental migrations).
 * Used by verifySchema for deployment checks.
 */
const REQUIRED_TABLES = [
  "ccweb_auth_users",
  "ccweb_referral_codes",
  "ccweb_growth_events",
  "ccweb_user_badges",
  "ccweb_login_streaks",
  "growth_listings",
  "growth_orders",
  "growth_leads",
  "growth_campaigns",
  "growth_metrics",
  "community_posts",
  "community_post_comments",
  "community_chats",
  "community_reactions",
  "community_bug_reports",
  "platform_transactions",
  "api_request_logs",
  "learning_sessions",
  "learning_access",
  "learning_participation",
  "learning_revenue_ledger",
  "learning_user_wallet",
  "learning_subscriptions",
  "learning_tutor_events",
  "ccweb_monetization_usage_monthly",
  "ccweb_metering_events",
  "ccweb_profile_slugs",
  "ccweb_beta_invites",
  "ccweb_beta_events",
];

module.exports = { REQUIRED_TABLES };
