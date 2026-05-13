/**
 * PostgreSQL community persistence (when DATABASE_URL is set).
 */

const crypto = require("crypto");
const { query } = require("./pool");

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(5).toString("hex")}`;
}

function parseJsonArray(val, fallback = []) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const j = JSON.parse(val || "[]");
      return Array.isArray(j) ? j : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function normalizeMediaUrls(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const u of raw) {
    const s = typeof u === "string" ? u.trim() : "";
    if (!s || out.length >= 10) continue;
    if (/^https?:\/\//i.test(s) || s.startsWith("/")) out.push(s.slice(0, 2048));
  }
  return out;
}

function extractHashtags(text) {
  const t = (text || "").toString();
  const re = /#([\p{L}\p{N}_]{2,40})/gu;
  const tags = new Set();
  let m;
  while ((m = re.exec(t)) !== null) {
    tags.add(m[1].toLowerCase());
  }
  return [...tags];
}

function mergeTags(userTags, title, content) {
  const fromUser = Array.isArray(userTags) ? userTags.map((x) => x.toString().trim().toLowerCase()).filter(Boolean) : [];
  const fromHash = extractHashtags(`${title}\n${content}`);
  const merged = [...new Set([...fromUser, ...fromHash])].slice(0, 40);
  return merged;
}

const POST_SELECT = `
  p.id, p.author_user_id, p.author_display_name, p.title, p.content, p.tags, p.created_at,
  p.media_urls, p.repost_of_id, p.moderation_status,
  COALESCE(c.cnt, 0)::int AS comment_count,
  rp.id AS orig_id,
  rp.title AS orig_title,
  rp.content AS orig_content,
  rp.author_display_name AS orig_author_display_name,
  rp.author_user_id AS orig_author_user_id,
  rp.created_at AS orig_created_at,
  rp.media_urls AS orig_media_urls,
  rp.moderation_status AS orig_moderation_status
`;

const POST_FROM = `
  FROM community_posts p
  LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM community_post_comments GROUP BY post_id) c ON c.post_id = p.id
  LEFT JOIN community_posts rp ON p.repost_of_id = rp.id
`;

const POST_PUBLIC_FILTER = `COALESCE(p.moderation_status, 'visible') = 'visible'
  AND (rp.id IS NULL OR COALESCE(rp.moderation_status, 'visible') = 'visible')`;

function shapePost(r, extra = {}) {
  const tagArr = parseJsonArray(r.tags, []);
  const mediaUrls = normalizeMediaUrls(parseJsonArray(r.media_urls, []));
  const repostOfId = r.repost_of_id || null;
  let originalPost = null;
  if (r.orig_id) {
    originalPost = {
      id: r.orig_id,
      title: r.orig_title,
      content: r.orig_content,
      authorDisplayName: r.orig_author_display_name,
      authorUserId: r.orig_author_user_id,
      createdAt: new Date(r.orig_created_at).toISOString(),
      mediaUrls: normalizeMediaUrls(parseJsonArray(r.orig_media_urls, [])),
    };
  }
  return {
    id: r.id,
    authorUserId: r.author_user_id,
    authorDisplayName: r.author_display_name,
    title: r.title,
    content: r.content,
    tags: tagArr,
    hashtags: extractHashtags(`${r.title}\n${r.content}`),
    mediaUrls,
    repostOfId,
    originalPost,
    createdAt: new Date(r.created_at).toISOString(),
    commentCount: Number(r.comment_count) || 0,
    ...extra,
  };
}

async function listPosts() {
  const { rows } = await query(
    `SELECT ${POST_SELECT} ${POST_FROM} WHERE ${POST_PUBLIC_FILTER} ORDER BY p.created_at DESC`,
    []
  );
  return rows.map((r) => shapePost(r));
}

async function listPostsByAuthor(authorUserId, limit = 40) {
  const lim = Math.min(100, Math.max(1, limit));
  const { rows } = await query(
    `SELECT ${POST_SELECT} ${POST_FROM} WHERE p.author_user_id = $1 AND ${POST_PUBLIC_FILTER} ORDER BY p.created_at DESC LIMIT $2`,
    [authorUserId, lim]
  );
  return rows.map((r) => shapePost(r));
}

async function listTrendingPosts(limit = 30) {
  const lim = Math.min(100, Math.max(5, limit));
  const { rows } = await query(
    `SELECT ${POST_SELECT},
            COALESCE(rr.cnt, 0)::int AS reaction_count
     ${POST_FROM}
     LEFT JOIN (
       SELECT target_id, COUNT(*)::int AS cnt FROM community_reactions WHERE target_type = 'post' GROUP BY target_id
     ) rr ON rr.target_id = p.id
     WHERE ${POST_PUBLIC_FILTER}
     ORDER BY COALESCE(rr.cnt, 0) DESC, COALESCE(c.cnt, 0) DESC, p.created_at DESC
     LIMIT $1`,
    [lim]
  );
  return rows.map((r) => ({
    ...shapePost(r),
    reactionCount: Number(r.reaction_count),
    trendingScore: Number(r.reaction_count) * 3 + Number(r.comment_count),
  }));
}

async function searchPosts(q, limit = 20) {
  const needle = String(q || "").trim().slice(0, 120);
  if (!needle) return [];
  const lim = Math.min(50, Math.max(1, limit));
  const safe = needle.replace(/[%_\\]/g, " ").trim();
  if (!safe) return [];
  const like = `%${safe}%`;
  const { rows } = await query(
    `SELECT ${POST_SELECT} ${POST_FROM}
     WHERE (p.title ILIKE $1 OR p.content ILIKE $1) AND ${POST_PUBLIC_FILTER}
     ORDER BY p.created_at DESC
     LIMIT $2`,
    [like, lim]
  );
  return rows.map((r) => shapePost(r));
}

async function getPostRow(postId, { includeHidden = false } = {}) {
  const extra = includeHidden ? "" : ` AND (${POST_PUBLIC_FILTER})`;
  const { rows } = await query(`SELECT ${POST_SELECT} ${POST_FROM} WHERE p.id = $1${extra}`, [postId]);
  return rows[0] || null;
}

async function createPost(body) {
  const id = newId("post");
  const tags = mergeTags(body.tags, body.title, body.content);
  const mediaUrls = normalizeMediaUrls(body.mediaUrls);
  const repostOfId = (body.repostOfId || "").toString().trim() || null;
  if (repostOfId) {
    const { rows } = await query("SELECT id FROM community_posts WHERE id = $1 LIMIT 1", [repostOfId]);
    if (!rows[0]) {
      const err = new Error("repost_of_id not found");
      err.code = "REPOST_PARENT_MISSING";
      throw err;
    }
  }
  await query(
    `INSERT INTO community_posts (id, author_user_id, author_display_name, title, content, tags, media_urls, repost_of_id)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8)`,
    [
      id,
      body.authorUserId,
      body.authorDisplayName,
      body.title,
      body.content,
      JSON.stringify(tags),
      JSON.stringify(mediaUrls),
      repostOfId,
    ]
  );
  const row = await getPostRow(id, { includeHidden: true });
  return shapePost(row);
}

async function getPostWithComments(postId) {
  const row = await getPostRow(postId);
  if (!row) return null;
  const { rows: cr } = await query(
    "SELECT * FROM community_post_comments WHERE post_id = $1 AND COALESCE(moderation_status, 'visible') = 'visible' ORDER BY created_at ASC",
    [postId]
  );
  const comments = cr.map((c) => ({
    id: c.id,
    postId: c.post_id,
    authorUserId: c.author_user_id,
    authorDisplayName: c.author_display_name,
    body: c.body,
    createdAt: new Date(c.created_at).toISOString(),
  }));
  return { post: shapePost(row), comments };
}

async function listComments(postId) {
  const { rows } = await query(
    "SELECT * FROM community_post_comments WHERE post_id = $1 AND COALESCE(moderation_status, 'visible') = 'visible' ORDER BY created_at ASC",
    [postId]
  );
  return rows.map((c) => ({
    id: c.id,
    postId: c.post_id,
    authorUserId: c.author_user_id,
    authorDisplayName: c.author_display_name,
    body: c.body,
    createdAt: new Date(c.created_at).toISOString(),
  }));
}

async function createComment(postId, body) {
  const id = newId("cmt");
  await query(
    `INSERT INTO community_post_comments (id, post_id, author_user_id, author_display_name, body)
     VALUES ($1,$2,$3,$4,$5)`,
    [id, postId, body.authorUserId, body.authorDisplayName, body.body]
  );
  const { rows } = await query("SELECT * FROM community_post_comments WHERE id = $1", [id]);
  return {
    id: rows[0].id,
    postId: rows[0].post_id,
    authorUserId: rows[0].author_user_id,
    authorDisplayName: rows[0].author_display_name,
    body: rows[0].body,
    createdAt: new Date(rows[0].created_at).toISOString(),
  };
}

async function getCommentAuthorUserId(commentId) {
  const { rows } = await query("SELECT author_user_id FROM community_post_comments WHERE id = $1 LIMIT 1", [commentId]);
  return rows[0]?.author_user_id || null;
}

async function listChats(channel) {
  const { rows } = await query(
    "SELECT * FROM community_chats WHERE ($1::text = '' OR channel = $1) ORDER BY created_at DESC",
    [channel || ""]
  );
  return rows.map((c) => ({
    id: c.id,
    channel: c.channel,
    authorUserId: c.author_user_id,
    authorDisplayName: c.author_display_name,
    message: c.message,
    createdAt: new Date(c.created_at).toISOString(),
  }));
}

async function createChat(body) {
  const id = newId("chat");
  await query(
    `INSERT INTO community_chats (id, channel, author_user_id, author_display_name, message)
     VALUES ($1,$2,$3,$4,$5)`,
    [id, body.channel || "general", body.authorUserId, body.authorDisplayName, body.message]
  );
  const { rows } = await query("SELECT * FROM community_chats WHERE id = $1", [id]);
  const c = rows[0];
  return {
    id: c.id,
    channel: c.channel,
    authorUserId: c.author_user_id,
    authorDisplayName: c.author_display_name,
    message: c.message,
    createdAt: new Date(c.created_at).toISOString(),
  };
}

async function listReactions(targetType, targetId) {
  let sql = "SELECT * FROM community_reactions WHERE 1=1";
  const p = [];
  if (targetType) {
    p.push(targetType);
    sql += ` AND target_type = $${p.length}`;
  }
  if (targetId) {
    p.push(targetId);
    sql += ` AND target_id = $${p.length}`;
  }
  sql += " ORDER BY created_at DESC";
  const { rows } = await query(sql, p);
  return rows.map((r) => ({
    id: r.id,
    authorUserId: r.author_user_id,
    authorDisplayName: r.author_display_name,
    targetType: r.target_type,
    targetId: r.target_id,
    reaction: r.reaction,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

async function createReaction(body) {
  const id = newId("react");
  await query(
    `INSERT INTO community_reactions (id, author_user_id, author_display_name, target_type, target_id, reaction)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, body.authorUserId, body.authorDisplayName, body.targetType, body.targetId, body.reaction || "like"]
  );
  const { rows } = await query("SELECT * FROM community_reactions WHERE id = $1", [id]);
  const r = rows[0];
  return {
    id: r.id,
    authorUserId: r.author_user_id,
    authorDisplayName: r.author_display_name,
    targetType: r.target_type,
    targetId: r.target_id,
    reaction: r.reaction,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

async function addBookmark(userId, postId) {
  await query(
    `INSERT INTO community_post_bookmarks (user_id, post_id) VALUES ($1, $2)
     ON CONFLICT (user_id, post_id) DO NOTHING`,
    [userId, postId]
  );
  return true;
}

async function removeBookmark(userId, postId) {
  await query(`DELETE FROM community_post_bookmarks WHERE user_id = $1 AND post_id = $2`, [userId, postId]);
  return true;
}

async function isBookmarked(userId, postId) {
  const { rows } = await query(
    `SELECT 1 FROM community_post_bookmarks WHERE user_id = $1 AND post_id = $2 LIMIT 1`,
    [userId, postId]
  );
  return rows.length > 0;
}

async function listBookmarks(userId, limit = 50) {
  const lim = Math.min(100, Math.max(1, limit));
  const { rows } = await query(
    `SELECT ${POST_SELECT}, b.created_at AS bookmarked_at
     FROM community_post_bookmarks b
     JOIN community_posts p ON p.id = b.post_id
     LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM community_post_comments GROUP BY post_id) c ON c.post_id = p.id
     LEFT JOIN community_posts rp ON p.repost_of_id = rp.id
     WHERE b.user_id = $1 AND ${POST_PUBLIC_FILTER}
     ORDER BY b.created_at DESC
     LIMIT $2`,
    [userId, lim]
  );
  return rows.map((r) => ({
    ...shapePost(r),
    bookmarkedAt: new Date(r.bookmarked_at).toISOString(),
  }));
}

async function listBugs() {
  const { rows } = await query("SELECT * FROM community_bug_reports ORDER BY created_at DESC", []);
  return rows.map((r) => ({
    id: r.id,
    reporterUserId: r.reporter_user_id,
    reporterDisplayName: r.reporter_display_name,
    title: r.title,
    description: r.description,
    path: r.path,
    severity: r.severity,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

async function createBug(body) {
  const id = newId("bug");
  await query(
    `INSERT INTO community_bug_reports (id, reporter_user_id, reporter_display_name, title, description, path, severity)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      id,
      body.reporterUserId || null,
      body.reporterDisplayName || null,
      body.title,
      body.description,
      body.path || null,
      body.severity || "normal",
    ]
  );
  const { rows } = await query("SELECT * FROM community_bug_reports WHERE id = $1", [id]);
  const r = rows[0];
  return {
    id: r.id,
    reporterUserId: r.reporter_user_id,
    reporterDisplayName: r.reporter_display_name,
    title: r.title,
    description: r.description,
    path: r.path,
    severity: r.severity,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

module.exports = {
  listPosts,
  listPostsByAuthor,
  listTrendingPosts,
  searchPosts,
  createPost,
  getPostWithComments,
  getPostRow,
  listComments,
  createComment,
  getCommentAuthorUserId,
  listChats,
  createChat,
  listReactions,
  createReaction,
  addBookmark,
  removeBookmark,
  isBookmarked,
  listBookmarks,
  listBugs,
  createBug,
  mapPostLegacy,
  normalizeMediaUrls,
  mergeTags,
};
