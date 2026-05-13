import { apiUrl } from "../config/env";
import { apiFetch } from "../lib/apiClient";

export async function fetchCommunityPosts(feedMode) {
  const path = feedMode === "trending" ? "/api/community/posts/trending" : "/api/community/posts";
  const res = await apiFetch(apiUrl(path), {}, { networkRetries: 2 });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to load posts");
  return data.posts || [];
}

export async function fetchCommunityChats(channel) {
  const q = channel ? `?channel=${encodeURIComponent(channel)}` : "";
  const res = await apiFetch(apiUrl(`/api/community/chats${q}`), {}, { networkRetries: 2 });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to load chat");
  return data.chats || [];
}

export async function fetchPostComments(postId) {
  const res = await apiFetch(apiUrl(`/api/community/posts/${encodeURIComponent(postId)}/comments`), {}, { networkRetries: 2 });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Comments failed");
  return data.comments || [];
}

export async function fetchPostReactions(postId) {
  const q = new URLSearchParams({ targetType: "post", targetId: postId });
  const res = await apiFetch(apiUrl(`/api/community/reactions?${q}`), {}, { networkRetries: 1 });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Reactions failed");
  return data.reactions || [];
}

export async function createCommunityPost(body) {
  const res = await apiFetch(apiUrl("/api/community/posts"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not post");
  return data;
}

export async function createPostComment(postId, body) {
  const res = await apiFetch(apiUrl(`/api/community/posts/${encodeURIComponent(postId)}/comments`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Comment failed");
  return data;
}

export async function createCommunityChat(body) {
  const res = await apiFetch(apiUrl("/api/community/chats"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Send failed");
  return data;
}

export async function createPostReaction({ authorUserId, authorDisplayName, postId, reaction = "like" }) {
  const res = await apiFetch(apiUrl("/api/community/reactions"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      authorUserId,
      authorDisplayName,
      targetType: "post",
      targetId: postId,
      reaction,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Reaction failed");
  return data;
}
