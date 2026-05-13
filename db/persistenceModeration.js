/**
 * Moderation actions on community + DMs.
 */

const crypto = require("crypto");
const { query } = require("./pool");
const auditPg = require("./persistenceAudit");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

function newId() {
  return `mod_${crypto.randomBytes(8).toString("hex")}`;
}

async function recordAction({ actorLabel, action, targetType, targetId, reason, metadata = {}, ip = null }) {
  if (!usePostgres()) return null;
  const id = newId();
  await query(
    `INSERT INTO ccweb_moderation_actions (id, actor_label, action, target_type, target_id, reason, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
    [id, String(actorLabel || "admin").slice(0, 120), String(action).slice(0, 64), targetType, targetId, String(reason || "").slice(0, 500), JSON.stringify(metadata || {})]
  );
  await auditPg.insertAuditLog({
    actorKind: "admin",
    actorLabel,
    action: `moderation:${action}`,
    targetType,
    targetId,
    ip,
    metadata: { moderationActionId: id },
  });
  return id;
}

async function hideCommunityPost(postId, ctx) {
  const { rowCount } = await query(`UPDATE community_posts SET moderation_status = 'hidden' WHERE id = $1`, [postId]);
  if (rowCount) await recordAction({ ...ctx, action: "hide_post", targetType: "post", targetId: postId });
  return rowCount > 0;
}

async function hideCommunityComment(commentId, ctx) {
  const { rowCount } = await query(`UPDATE community_post_comments SET moderation_status = 'hidden' WHERE id = $1`, [commentId]);
  if (rowCount) await recordAction({ ...ctx, action: "hide_comment", targetType: "comment", targetId: commentId });
  return rowCount > 0;
}

async function hideChatMessage(messageId, ctx) {
  const { rowCount } = await query(`UPDATE ccweb_chat_messages SET moderation_status = 'hidden' WHERE id = $1`, [messageId]);
  if (rowCount) await recordAction({ ...ctx, action: "hide_message", targetType: "message", targetId: messageId });
  return rowCount > 0;
}

async function listModerationActions(limit = 80) {
  if (!usePostgres()) return [];
  const lim = Math.min(300, Math.max(1, limit));
  const { rows } = await query(
    `SELECT id, actor_label, action, target_type, target_id, reason, metadata, created_at
     FROM ccweb_moderation_actions ORDER BY created_at DESC LIMIT $1`,
    [lim]
  );
  return rows.map((r) => ({
    id: r.id,
    actorLabel: r.actor_label,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    reason: r.reason,
    metadata: typeof r.metadata === "object" ? r.metadata : {},
    createdAt: r.created_at,
  }));
}

module.exports = {
  hideCommunityPost,
  hideCommunityComment,
  hideChatMessage,
  listModerationActions,
};
