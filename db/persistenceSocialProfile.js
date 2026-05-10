/**
 * Social profiles, posts, follows, likes, saves, notifications — PostgreSQL.
 */

const crypto = require("crypto");
const { query } = require("./pool");
const betaPg = require("./persistenceBeta");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(10).toString("hex")}`;
}

function parseJsonb(val, fallback = {}) {
  if (!val) return { ...fallback };
  if (typeof val === "object") return { ...fallback, ...val };
  try {
    const j = JSON.parse(val);
    return typeof j === "object" && j ? { ...fallback, ...j } : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

async function ensureUser(userId) {
  if (!usePostgres() || !userId) return false;
  await query(`INSERT INTO ccweb_users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [userId]);
  await query(`INSERT INTO ccweb_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [userId]);
  return true;
}

async function getDisplayName(userId) {
  const { rows } = await query(`SELECT display_name FROM ccweb_user_profiles WHERE user_id = $1`, [userId]);
  return rows[0]?.display_name ? String(rows[0].display_name).slice(0, 120) : null;
}

async function getProfileRow(userId) {
  const { rows } = await query(`SELECT * FROM ccweb_profiles WHERE user_id = $1`, [userId]);
  return rows[0] || null;
}

async function notify({ userId, kind, title, body, payload }) {
  if (!userId) return;
  await ensureUser(userId);
  const id = newId("ntf");
  await query(
    `INSERT INTO ccweb_notifications (id, user_id, kind, title, body, payload)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
    [id, userId, String(kind).slice(0, 64), String(title || "").slice(0, 200), String(body || "").slice(0, 2000), JSON.stringify(payload || {})]
  );
}

function assetUrlFromStored(stored) {
  if (!stored) return null;
  const s = String(stored).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const apiBase = (process.env.CCWEB_API_PUBLIC_URL || process.env.PUBLIC_APP_URL || "").replace(/\/$/, "");
  if (apiBase && s.startsWith("/")) return `${apiBase}${s}`;
  return s;
}

async function getSocialProfileBundle(userId, viewerId) {
  if (!usePostgres() || !userId) return null;
  await ensureUser(userId);
  const row = await getProfileRow(userId);
  const displayName = (await getDisplayName(userId)) || userId.slice(0, 8);
  let betaSlug = null;
  try {
    betaSlug = await betaPg.getSlugForUser(userId);
  } catch {
    /* ignore */
  }
  const meta = parseJsonb(row?.metadata, {});
  const socialLinks = meta.social_links && typeof meta.social_links === "object" ? meta.social_links : {};

  const { rows: counts } = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM ccweb_follows WHERE following_id = $1) AS followers,
       (SELECT COUNT(*)::int FROM ccweb_follows WHERE follower_id = $1) AS following,
       (SELECT COUNT(*)::int FROM ccweb_posts WHERE author_user_id = $1) AS posts`,
    [userId]
  );
  const c = counts[0] || { followers: 0, following: 0, posts: 0 };

  let viewerFollows = false;
  let targetFollowsViewer = false;
  if (viewerId && viewerId !== userId) {
    const { rows: f1 } = await query(
      `SELECT 1 FROM ccweb_follows WHERE follower_id = $1 AND following_id = $2 LIMIT 1`,
      [viewerId, userId]
    );
    viewerFollows = f1.length > 0;
    const { rows: f2 } = await query(
      `SELECT 1 FROM ccweb_follows WHERE follower_id = $1 AND following_id = $2 LIMIT 1`,
      [userId, viewerId]
    );
    targetFollowsViewer = f2.length > 0;
  }

  return {
    userId,
    displayName,
    betaSlug,
    bio: row?.bio || "",
    headline: row?.headline || "",
    websiteUrl: row?.website_url || "",
    twitterHandle: row?.twitter_handle || "",
    socialLinks,
    avatarUrl: assetUrlFromStored(row?.avatar_url),
    bannerUrl: assetUrlFromStored(row?.banner_url),
    avatarPath: row?.avatar_url || null,
    bannerPath: row?.banner_url || null,
    counts: { followers: c.followers, following: c.following, posts: c.posts },
    viewerFollows,
    targetFollowsViewer,
    isSelf: viewerId === userId,
  };
}

async function updateSocialProfile(userId, patch) {
  if (!usePostgres() || !userId) return null;
  await ensureUser(userId);
  const row = await getProfileRow(userId);
  const meta = parseJsonb(row?.metadata, {});
  if (patch.socialLinks && typeof patch.socialLinks === "object") {
    meta.social_links = { ...(meta.social_links || {}), ...patch.socialLinks };
  }
  const bio = patch.bio !== undefined ? String(patch.bio).slice(0, 4000) : row?.bio ?? "";
  const headline = patch.headline !== undefined ? String(patch.headline).slice(0, 200) : row?.headline ?? "";
  const websiteUrl = patch.websiteUrl !== undefined ? String(patch.websiteUrl).slice(0, 512) : row?.website_url ?? "";
  const twitterHandle = patch.twitterHandle !== undefined ? String(patch.twitterHandle).replace(/^@/, "").slice(0, 64) : row?.twitter_handle ?? "";

  await query(
    `UPDATE ccweb_profiles
     SET bio = $2, headline = $3, website_url = $4, twitter_handle = $5, metadata = $6::jsonb, updated_at = NOW()
     WHERE user_id = $1`,
    [userId, bio, headline, websiteUrl || null, twitterHandle || null, JSON.stringify(meta)]
  );
  return getSocialProfileBundle(userId, userId);
}

async function setImageUrl(userId, field, relativePath) {
  if (!usePostgres() || !userId) return null;
  await ensureUser(userId);
  if (field === "banner") {
    await query(`UPDATE ccweb_profiles SET banner_url = $2, updated_at = NOW() WHERE user_id = $1`, [userId, relativePath]);
  } else {
    await query(`UPDATE ccweb_profiles SET avatar_url = $2, updated_at = NOW() WHERE user_id = $1`, [userId, relativePath]);
  }
  return getSocialProfileBundle(userId, userId);
}

async function follow(viewerId, targetId) {
  if (!usePostgres() || !viewerId || !targetId || viewerId === targetId) return { ok: false, error: "invalid" };
  await ensureUser(viewerId);
  await ensureUser(targetId);
  await query(
    `INSERT INTO ccweb_follows (follower_id, following_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [viewerId, targetId]
  );
  await notify({
    userId: targetId,
    kind: "follow",
    title: "New follower",
    body: `${(await getDisplayName(viewerId)) || "Someone"} followed you.`,
    payload: { followerId: viewerId },
  });
  return { ok: true };
}

async function unfollow(viewerId, targetId) {
  if (!usePostgres() || !viewerId || !targetId) return { ok: false };
  await query(`DELETE FROM ccweb_follows WHERE follower_id = $1 AND following_id = $2`, [viewerId, targetId]);
  return { ok: true };
}

async function listFollowers(userId, limit = 50) {
  if (!usePostgres() || !userId) return [];
  const lim = Math.min(100, Math.max(1, limit));
  const { rows } = await query(
    `SELECT f.follower_id AS id, f.created_at
     FROM ccweb_follows f
     WHERE f.following_id = $1
     ORDER BY f.created_at DESC
     LIMIT $2`,
    [userId, lim]
  );
  const out = [];
  for (const r of rows) {
    const dn = (await getDisplayName(r.id)) || r.id.slice(0, 8);
    const prof = await getProfileRow(r.id);
    out.push({
      userId: r.id,
      displayName: dn,
      avatarUrl: assetUrlFromStored(prof?.avatar_url),
      followedAt: r.created_at,
    });
  }
  return out;
}

async function listFollowing(userId, limit = 50) {
  if (!usePostgres() || !userId) return [];
  const lim = Math.min(100, Math.max(1, limit));
  const { rows } = await query(
    `SELECT f.following_id AS id, f.created_at
     FROM ccweb_follows f
     WHERE f.follower_id = $1
     ORDER BY f.created_at DESC
     LIMIT $2`,
    [userId, lim]
  );
  const out = [];
  for (const r of rows) {
    const dn = (await getDisplayName(r.id)) || r.id.slice(0, 8);
    const prof = await getProfileRow(r.id);
    out.push({
      userId: r.id,
      displayName: dn,
      avatarUrl: assetUrlFromStored(prof?.avatar_url),
      followedAt: r.created_at,
    });
  }
  return out;
}

async function hydratePost(postRow, viewerId) {
  const meta = parseJsonb(postRow.metadata, {});
  const authorId = postRow.author_user_id;
  const authorName = (await getDisplayName(authorId)) || authorId.slice(0, 8);
  const prof = await getProfileRow(authorId);
  const { rows: lc } = await query(
    `SELECT COUNT(*)::int AS c FROM ccweb_likes WHERE target_type = 'post' AND target_id = $1`,
    [postRow.id]
  );
  const { rows: cc } = await query(`SELECT COUNT(*)::int AS c FROM ccweb_comments WHERE post_id = $1`, [postRow.id]);
  let liked = false;
  let saved = false;
  if (viewerId) {
    const { rows: lk } = await query(
      `SELECT 1 FROM ccweb_likes WHERE user_id = $1 AND target_type = 'post' AND target_id = $2 LIMIT 1`,
      [viewerId, postRow.id]
    );
    liked = lk.length > 0;
    const { rows: sv } = await query(
      `SELECT 1 FROM ccweb_saved_posts WHERE user_id = $1 AND post_id = $2 LIMIT 1`,
      [viewerId, postRow.id]
    );
    saved = sv.length > 0;
  }
  return {
    id: postRow.id,
    authorUserId: authorId,
    authorDisplayName: authorName,
    authorAvatarUrl: assetUrlFromStored(prof?.avatar_url),
    title: postRow.title || "",
    body: postRow.body || "",
    visibility: postRow.visibility || "public",
    createdAt: postRow.created_at,
    updatedAt: postRow.updated_at,
    likeCount: lc[0]?.c ?? 0,
    commentCount: cc[0]?.c ?? 0,
    shareCount: Number(meta.shareCount || meta.share_count || 0) || 0,
    liked,
    saved,
    metadata: meta,
  };
}

async function listPosts(authorUserId, viewerId, { limit = 25, before } = {}) {
  if (!usePostgres() || !authorUserId) return [];
  const lim = Math.min(50, Math.max(1, limit));
  let sql = `SELECT * FROM ccweb_posts WHERE author_user_id = $1`;
  const params = [authorUserId];
  if (before) {
    sql += ` AND created_at < $2`;
    params.push(new Date(before));
    sql += ` ORDER BY created_at DESC LIMIT $3`;
    params.push(lim);
  } else {
    sql += ` ORDER BY created_at DESC LIMIT $2`;
    params.push(lim);
  }
  const { rows } = await query(sql, params);
  const out = [];
  for (const r of rows) {
    out.push(await hydratePost(r, viewerId));
  }
  return out;
}

async function createPost(authorUserId, { title, body }) {
  if (!usePostgres() || !authorUserId) return null;
  await ensureUser(authorUserId);
  const id = newId("post");
  const t = String(title || "").slice(0, 300);
  const b = String(body || "").slice(0, 8000);
  await query(
    `INSERT INTO ccweb_posts (id, author_user_id, title, body, visibility, metadata)
     VALUES ($1,$2,$3,$4,'public',$5::jsonb)`,
    [id, authorUserId, t, b, JSON.stringify({})]
  );
  const { rows } = await query(`SELECT * FROM ccweb_posts WHERE id = $1`, [id]);
  return hydratePost(rows[0], authorUserId);
}

async function getPost(postId, viewerId) {
  if (!usePostgres() || !postId) return null;
  const { rows } = await query(`SELECT * FROM ccweb_posts WHERE id = $1`, [postId]);
  if (!rows[0]) return null;
  return hydratePost(rows[0], viewerId);
}

async function listComments(postId, limit = 80) {
  if (!usePostgres() || !postId) return [];
  const lim = Math.min(200, Math.max(1, limit));
  const { rows } = await query(
    `SELECT * FROM ccweb_comments WHERE post_id = $1 ORDER BY created_at ASC LIMIT $2`,
    [postId, lim]
  );
  const out = [];
  for (const r of rows) {
    const dn = (await getDisplayName(r.author_user_id)) || r.author_user_id.slice(0, 8);
    const prof = await getProfileRow(r.author_user_id);
    out.push({
      id: r.id,
      postId: r.post_id,
      authorUserId: r.author_user_id,
      authorDisplayName: dn,
      authorAvatarUrl: assetUrlFromStored(prof?.avatar_url),
      body: r.body,
      createdAt: r.created_at,
    });
  }
  return out;
}

async function createComment(authorUserId, postId, body) {
  if (!usePostgres() || !authorUserId || !postId) return null;
  await ensureUser(authorUserId);
  const post = await getPost(postId, authorUserId);
  if (!post) return null;
  const id = newId("cmt");
  const text = String(body || "").slice(0, 4000);
  await query(
    `INSERT INTO ccweb_comments (id, post_id, author_user_id, body) VALUES ($1,$2,$3,$4)`,
    [id, postId, authorUserId, text]
  );
  const authorName = (await getDisplayName(authorUserId)) || authorUserId.slice(0, 8);
  if (post.authorUserId && post.authorUserId !== authorUserId) {
    await notify({
      userId: post.authorUserId,
      kind: "comment",
      title: "New comment",
      body: `${authorName} commented on your post.`,
      payload: { postId, commentId: id },
    });
  }
  const { rows } = await query(`SELECT * FROM ccweb_comments WHERE id = $1`, [id]);
  const r = rows[0];
  const prof = await getProfileRow(r.author_user_id);
  return {
    id: r.id,
    postId: r.post_id,
    authorUserId: r.author_user_id,
    authorDisplayName: authorName,
    authorAvatarUrl: assetUrlFromStored(prof?.avatar_url),
    body: r.body,
    createdAt: r.created_at,
  };
}

async function toggleLike(userId, postId) {
  if (!usePostgres() || !userId || !postId) return null;
  await ensureUser(userId);
  const post = await getPost(postId, userId);
  if (!post) return null;
  const { rows } = await query(
    `SELECT id FROM ccweb_likes WHERE user_id = $1 AND target_type = 'post' AND target_id = $2`,
    [userId, postId]
  );
  if (rows.length) {
    await query(`DELETE FROM ccweb_likes WHERE user_id = $1 AND target_type = 'post' AND target_id = $2`, [userId, postId]);
  } else {
    const lid = newId("lik");
    await query(
      `INSERT INTO ccweb_likes (id, user_id, target_type, target_id) VALUES ($1,$2,'post',$3)`,
      [lid, userId, postId]
    );
    if (post.authorUserId !== userId) {
      const liker = (await getDisplayName(userId)) || userId.slice(0, 8);
      await notify({
        userId: post.authorUserId,
        kind: "like",
        title: "New like",
        body: `${liker} liked your post.`,
        payload: { postId },
      });
    }
  }
  return getPost(postId, userId);
}

async function savePost(userId, postId) {
  if (!usePostgres() || !userId || !postId) return false;
  await ensureUser(userId);
  const p = await getPost(postId, userId);
  if (!p) return false;
  await query(
    `INSERT INTO ccweb_saved_posts (user_id, post_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [userId, postId]
  );
  return true;
}

async function unsavePost(userId, postId) {
  if (!usePostgres() || !userId || !postId) return false;
  await query(`DELETE FROM ccweb_saved_posts WHERE user_id = $1 AND post_id = $2`, [userId, postId]);
  return true;
}

async function listSavedPosts(userId, viewerId, { limit = 25 } = {}) {
  if (!usePostgres() || !userId) return [];
  const lim = Math.min(50, Math.max(1, limit));
  const { rows } = await query(
    `SELECT p.* FROM ccweb_saved_posts s
     JOIN ccweb_posts p ON p.id = s.post_id
     WHERE s.user_id = $1
     ORDER BY s.created_at DESC
     LIMIT $2`,
    [userId, lim]
  );
  const out = [];
  for (const r of rows) {
    out.push(await hydratePost(r, viewerId || userId));
  }
  return out;
}

async function sharePost(sharerUserId, postId) {
  if (!usePostgres() || !sharerUserId || !postId) return null;
  await ensureUser(sharerUserId);
  const { rows } = await query(`SELECT * FROM ccweb_posts WHERE id = $1`, [postId]);
  const row = rows[0];
  if (!row) return null;
  const meta = parseJsonb(row.metadata, {});
  meta.shareCount = (Number(meta.shareCount || 0) || 0) + 1;
  await query(`UPDATE ccweb_posts SET metadata = $2::jsonb, updated_at = NOW() WHERE id = $1`, [postId, JSON.stringify(meta)]);
  const sharerName = (await getDisplayName(sharerUserId)) || sharerUserId.slice(0, 8);
  if (row.author_user_id && row.author_user_id !== sharerUserId) {
    await notify({
      userId: row.author_user_id,
      kind: "share",
      title: "Post shared",
      body: `${sharerName} shared your post.`,
      payload: { postId },
    });
  }
  return getPost(postId, sharerUserId);
}

async function listNotifications(userId, { limit = 40 } = {}) {
  if (!usePostgres() || !userId) return [];
  const lim = Math.min(100, Math.max(1, limit));
  const { rows } = await query(
    `SELECT id, kind, title, body, payload, read_at, created_at
     FROM ccweb_notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, lim]
  );
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    body: r.body,
    payload: parseJsonb(r.payload, {}),
    readAt: r.read_at,
    createdAt: r.created_at,
  }));
}

async function markAllNotificationsRead(userId) {
  if (!usePostgres() || !userId) return 0;
  const { rowCount } = await query(
    `UPDATE ccweb_notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
  return rowCount || 0;
}

module.exports = {
  usePostgres,
  ensureUser,
  getSocialProfileBundle,
  updateSocialProfile,
  setImageUrl,
  assetUrlFromStored,
  follow,
  unfollow,
  listFollowers,
  listFollowing,
  listPosts,
  createPost,
  getPost,
  listComments,
  createComment,
  toggleLike,
  savePost,
  unsavePost,
  listSavedPosts,
  sharePost,
  listNotifications,
  markAllNotificationsRead,
};
