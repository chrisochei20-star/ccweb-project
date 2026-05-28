/**
 * Follow graph counts and relationship checks (PostgreSQL).
 */

const { query } = require("./pool");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

async function getFollowCounts(userId) {
  if (!usePostgres() || !userId) return { followers: 0, following: 0 };
  const { rows: f1 } = await query(`SELECT COUNT(*)::int AS c FROM ccweb_follows WHERE following_id = $1`, [userId]);
  const { rows: f2 } = await query(`SELECT COUNT(*)::int AS c FROM ccweb_follows WHERE follower_id = $1`, [userId]);
  return {
    followers: f1[0]?.c || 0,
    following: f2[0]?.c || 0,
  };
}

async function isFollowing(followerId, followingId) {
  if (!usePostgres() || !followerId || !followingId) return false;
  const { rows } = await query(
    `SELECT 1 FROM ccweb_follows WHERE follower_id = $1 AND following_id = $2 LIMIT 1`,
    [followerId, followingId]
  );
  return rows.length > 0;
}

module.exports = { getFollowCounts, isFollowing, usePostgres };
