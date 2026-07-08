/**
 * PostgreSQL community persistence (when DATABASE_URL is set).
 */

const crypto = require("crypto");
const { query } = require("./pool");

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(5).toString("hex")}`;
}

async function listPosts(limit = 80, offset = 0) {
  const lim = Math.min(100, Math.max(1, Number(limit) || 80));
  const off = Math.max(0, Number(offset) || 0);
  const { rows } = await query(
    `SELECT p.*, COALESCE(c.cnt, 0)::int AS comment_count, up.avatar_url AS author_avatar_url
     FROM community_posts p
     LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM community_post_comments GROUP BY post_id) c ON c.post_id = p.id
     LEFT JOIN ccweb_user_profiles up ON up.user_id = p.author_user_id
     LEFT JOIN ccweb_users u ON u.id = p.author_user_id
     ORDER BY p.created_at DESC
     LIMIT $1 OFFSET $2`,
    [lim, off]
  );
  return rows.map((r) => mapPost(r, Number(r.comment_count)));
}

async function listTrendingPosts(limit = 30) {
  const lim = Math.min(100, Math.max(5, limit));
  const { rows } = await query(
    `SELECT p.*,
            COALESCE(cc.cnt, 0)::int AS comment_count,
            COALESCE(rr.cnt, 0)::int AS reaction_count,
            up.avatar_url AS author_avatar_url
     FROM community_posts p
     LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM community_post_comments GROUP BY post_id) cc ON cc.post_id = p.id
     LEFT JOIN (
       SELECT target_id, COUNT(*)::int AS cnt FROM community_reactions WHERE target_type = 'post' GROUP BY target_id
     ) rr ON rr.target_id = p.id
     LEFT JOIN ccweb_user_profiles up ON up.user_id = p.author_user_id
     ORDER BY COALESCE(rr.cnt, 0) DESC, COALESCE(cc.cnt, 0) DESC, p.created_at DESC
     LIMIT $1`,
    [lim]
  );
  return rows.map((r) => ({
    ...mapPost(r, Number(r.comment_count)),
    reactionCount: Number(r.reaction_count),
    trendingScore: Number(r.reaction_count) * 3 + Number(r.comment_count),
  }));
}

async function createPost(body) {
  const id = newId("post");
  const tags = Array.isArray(body.tags) ? body.tags.map((t) => t.toString()) : [];
  await query(
    `INSERT INTO community_posts (id, author_user_id, author_display_name, title, content, tags, image_url)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)`,
    [
      id,
      body.authorUserId,
      body.authorDisplayName,
      body.title,
      body.content,
      JSON.stringify(tags),
      body.imageUrl || null,
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
    authorSlug: r.slug || null,
    title: r.title,
    content: r.content,
    tags: tagArr,
    createdAt: new Date(r.created_at).toISOString(),
    commentCount: commentCount != null ? commentCount : r.comment_count != null ? Number(r.comment_count) : 0,
    imageUrl: r.image_url || null,
    videoUrl: r.video_url || null,
    authorAvatarUrl: r.author_avatar_url || null,
  };
}

async function getPostWithComments(postId) {
  const { rows: pr } = await query("SELECT * FROM community_posts WHERE id = $1", [postId]);
  if (!pr[0]) return null;
const { rows: cr } = await query(
  `SELECT c.*,
          up.avatar_url AS author_avatar_url,
          u.slug
   FROM community_post_comments c
   LEFT JOIN ccweb_user_profiles up
     ON up.user_id = c.author_user_id
   LEFT JOIN ccweb_users u
     ON u.id = c.author_user_id
   WHERE c.post_id = $1
   ORDER BY c.created_at ASC`,
  [postId]
);
  const comments = cr.map((c) => ({
    id: c.id,
    postId: c.post_id,
    authorUserId: c.author_user_id,
    authorDisplayName: c.author_display_name, 
    authorSlug: c.slug || null,
    authorAvatarUrl: c.author_avatar_url || null,
    body: c.body,
    createdAt: new Date(c.created_at).toISOString(),
  }));
  return { post: mapPost(pr[0], comments.length), comments };
}

async function listComments(postId) {
const { rows: pr } = await query(
  `SELECT p.*, up.avatar_url AS author_avatar_url, u.slug
   FROM community_posts p
   LEFT JOIN ccweb_user_profiles up ON up.user_id = p.author_user_id
   LEFT JOIN ccweb_users u ON u.id = p.author_user_id
   WHERE p.id = $1`,
  [postId]
);
  return rows.map((c) => ({
    id: c.id,
    postId: c.post_id,
    authorUserId: c.author_user_id,
    authorDisplayName: c.author_display_name,
    body: c.body,
    authorSlug: c.slug || null,
    authorAvatarUrl: c.author_avatar_url || null,
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
  const comment = {
    id: rows[0].id,
    postId: rows[0].post_id,
    authorUserId: rows[0].author_user_id,
    authorDisplayName: rows[0].author_display_name,
    body: rows[0].body,
    createdAt: new Date(rows[0].created_at).toISOString(),
  };
  // Notify post author of new comment/reply
  try {
    const notif = require("./persistenceNotifications");
    const { rows: postRows } = await query("SELECT author_user_id FROM community_posts WHERE id = $1 LIMIT 1", [postId]);
    const postAuthorId = postRows[0]?.author_user_id;
    if (postAuthorId && postAuthorId !== body.authorUserId) {
      await notif.createReplyNotification({
        recipientUserId: postAuthorId,
        actorUserId: body.authorUserId,
        actorDisplayName: body.authorDisplayName,
        postId,
        preview: (body.body || "").slice(0, 120),
      });
    }
    // Also fire mention notifications for any @handles in the comment body
    const mentionedIds = await notif.findMentionedUserIdsFromText(body.body, body.authorUserId);
    await Promise.all(
      mentionedIds
        .filter((uid) => uid !== postAuthorId) // avoid double-notifying post author
        .map((uid) =>
          notif.createMentionNotification({
            recipientUserId: uid,
            actorUserId: body.authorUserId,
            actorDisplayName: body.authorDisplayName,
            postId,
            preview: (body.body || "").slice(0, 120),
          })
        )
    );
  } catch { /* non-fatal */ }
  return comment;
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

function mapReactionRow(r) {
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

async function createReaction(body) {
  const reaction = body.reaction || "like";
  const { rows: existing } = await query(
    `SELECT * FROM community_reactions
     WHERE author_user_id = $1 AND target_type = $2 AND target_id = $3 AND reaction = $4
     LIMIT 1`,
    [body.authorUserId, body.targetType, body.targetId, reaction]
  );
  if (existing[0]) {
    return { created: false, ...mapReactionRow(existing[0]) };
  }
  const id = newId("react");
  await query(
    `INSERT INTO community_reactions (id, author_user_id, author_display_name, target_type, target_id, reaction)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, body.authorUserId, body.authorDisplayName, body.targetType, body.targetId, reaction]
  );
  const { rows } = await query("SELECT * FROM community_reactions WHERE id = $1", [id]);
  // Notify post author of reaction (skip self-reactions)
  if (body.targetType === "post" && body.targetId) {
    try {
      const notif = require("./persistenceNotifications");
      // Look up post author
      const { rows: postRows } = await query("SELECT author_user_id FROM community_posts WHERE id = $1 LIMIT 1", [body.targetId]);
      const postAuthorId = postRows[0]?.author_user_id;
      if (postAuthorId && postAuthorId !== body.authorUserId) {
        await notif.createReactionNotification({
          recipientUserId: postAuthorId,
          actorUserId: body.authorUserId,
          actorDisplayName: body.authorDisplayName,
          postId: body.targetId,
          reaction,
        });
      }
    } catch { /* non-fatal */ }
  }
  return { created: true, ...mapReactionRow(rows[0]) };
}

async function listPostsByAuthor(userId, limit = 30, offset = 0) {
  const lim = Math.min(50, Math.max(1, limit));
  const off = Math.max(0, offset);
  const { rows } = await query(
    `SELECT p.*, COALESCE(c.cnt, 0)::int AS comment_count
     FROM community_posts p
     LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM community_post_comments GROUP BY post_id) c ON c.post_id = p.id
     WHERE p.author_user_id = $1
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, lim, off]
  );
  return rows.map((r) => mapPost(r, Number(r.comment_count)));
}

async function listRepliesByAuthor(userId, limit = 30, offset = 0) {
  const lim = Math.min(50, Math.max(1, limit));
  const off = Math.max(0, offset);
  const { rows } = await query(
    `SELECT c.*, p.title AS post_title, p.id AS parent_post_id
     FROM community_post_comments c
     JOIN community_posts p ON p.id = c.post_id
     WHERE c.author_user_id = $1
     ORDER BY c.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, lim, off]
  );
  return rows.map((r) => ({
    id: r.id,
    postId: r.post_id,
    parentPostId: r.parent_post_id,
    postTitle: r.post_title,
    authorUserId: r.author_user_id,
    authorDisplayName: r.author_display_name,
    body: r.body,
    createdAt: new Date(r.created_at).toISOString(),
    kind: "reply",
  }));
}

async function listLikedPostsByUser(userId, limit = 30, offset = 0) {
  const lim = Math.min(50, Math.max(1, limit));
  const off = Math.max(0, offset);
  const { rows } = await query(
    `SELECT p.*, COALESCE(cc.cnt, 0)::int AS comment_count, r.created_at AS liked_at
     FROM community_reactions r
     JOIN community_posts p ON p.id = r.target_id
     LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM community_post_comments GROUP BY post_id) cc ON cc.post_id = p.id
     WHERE r.author_user_id = $1 AND r.target_type = 'post' AND r.reaction = 'like'
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, lim, off]
  );
  return rows.map((r) => ({
    ...mapPost(r, Number(r.comment_count)),
    likedAt: new Date(r.liked_at).toISOString(),
  }));
}

async function listMediaPostsByAuthor(userId, limit = 30, offset = 0) {
  const lim = Math.min(50, Math.max(1, limit));
  const off = Math.max(0, offset);
  const { rows } = await query(
    `SELECT p.*, COALESCE(c.cnt, 0)::int AS comment_count
     FROM community_posts p
     LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM community_post_comments GROUP BY post_id) c ON c.post_id = p.id
     WHERE p.author_user_id = $1
       AND (p.content ~* 'https?://[^\\s]+\\.(jpg|jpeg|png|gif|webp)' OR p.content ~* 'res\\.cloudinary\\.com')
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, lim, off]
  );
  return rows.map((r) => mapPost(r, Number(r.comment_count)));
}

async function countPostsByAuthor(userId) {
  const { rows } = await query(`SELECT COUNT(*)::int AS c FROM community_posts WHERE author_user_id = $1`, [userId]);
  return rows[0]?.c || 0;
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
  listTrendingPosts,
  createPost,
  getPostWithComments,
  listComments,
  createComment,
  getCommentAuthorUserId,
  listPostsByAuthor,
  listRepliesByAuthor,
  listLikedPostsByUser,
  listMediaPostsByAuthor,
  countPostsByAuthor,
  listChats,
  createChat,
  listReactions,
  createReaction,
  listBugs,
  createBug,
};
