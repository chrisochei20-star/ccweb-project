/**
 * PostgreSQL community persistence (when DATABASE_URL is set).
 */

const crypto = require("crypto");
const { query } = require("./pool");

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(5).toString("hex")}`;
}

async function listPosts() {
  const { rows } = await query(
    `SELECT p.*, COALESCE(c.cnt, 0)::int AS comment_count
     FROM community_posts p
     LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM community_post_comments GROUP BY post_id) c ON c.post_id = p.id
     ORDER BY p.created_at DESC`,
    []
  );
  return rows.map((r) => mapPost(r, Number(r.comment_count)));
}

async function createPost(body) {
  const id = newId("post");
  const tags = Array.isArray(body.tags) ? body.tags.map((t) => t.toString()) : [];
  await query(
    `INSERT INTO community_posts (id, author_user_id, author_display_name, title, content, tags)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
    [
      id,
      body.authorUserId,
      body.authorDisplayName,
      body.title,
      body.content,
      JSON.stringify(tags),
    ]
  );
  const { rows } = await query("SELECT * FROM community_posts WHERE id = $1", [id]);
  return mapPost(rows[0], 0);
}

function mapPost(r, commentCount) {
  const tags = r.tags;
  const tagArr = Array.isArray(tags) ? tags : typeof tags === "string" ? JSON.parse(tags || "[]") : [];
  return {
    id: r.id,
    authorUserId: r.author_user_id,
    authorDisplayName: r.author_display_name,
    title: r.title,
    content: r.content,
    tags: tagArr,
    createdAt: new Date(r.created_at).toISOString(),
    commentCount: commentCount != null ? commentCount : r.comment_count != null ? Number(r.comment_count) : 0,
  };
}

async function getPostWithComments(postId) {
  const { rows: pr } = await query("SELECT * FROM community_posts WHERE id = $1", [postId]);
  if (!pr[0]) return null;
  const { rows: cr } = await query(
    "SELECT * FROM community_post_comments WHERE post_id = $1 ORDER BY created_at ASC",
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
  return { post: mapPost(pr[0], comments.length), comments };
}

async function listComments(postId) {
  const { rows } = await query(
    "SELECT * FROM community_post_comments WHERE post_id = $1 ORDER BY created_at ASC",
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
  createPost,
  getPostWithComments,
  listComments,
  createComment,
  listChats,
  createChat,
  listReactions,
  createReaction,
  listBugs,
  createBug,
};
