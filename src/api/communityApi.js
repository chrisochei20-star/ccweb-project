import { apiUrl } from "../config/env";
import { apiFetch } from "../lib/apiClient";
import { getSessionToken } from "../session";

function communityAuthHeaders(extra = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...extra,
  };
  const token = getSessionToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function fetchCommunityPosts(feedMode) {
  const path = feedMode === "trending" ? "/api/community/posts/trending" : "/api/community/posts";
  const res = await apiFetch(apiUrl(path), { credentials: "include" }, { networkRetries: 2 });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to load posts");
  return data.posts || [];
}

export async function fetchCommunityChats(channel) {
  const q = channel ? `?channel=${encodeURIComponent(channel)}` : "";
  const res = await apiFetch(apiUrl(`/api/community/chats${q}`), { credentials: "include" }, { networkRetries: 2 });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to load chat");
  return data.chats || [];
}

export async function fetchPostComments(postId) {
  const res = await apiFetch(
    apiUrl(`/api/community/posts/${encodeURIComponent(postId)}/comments`),
    { credentials: "include" },
    { networkRetries: 2 }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Comments failed");
  return data.comments || [];
}

export async function fetchPostReactions(postId) {
  const q = new URLSearchParams({ targetType: "post", targetId: postId });
  const res = await apiFetch(apiUrl(`/api/community/reactions?${q}`), { credentials: "include" }, { networkRetries: 1 });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Reactions failed");
  return data.reactions || [];
}

export async function createCommunityPost(body) {
  const res = await apiFetch(
    apiUrl("/api/community/posts"),
    {
      method: "POST",
      headers: communityAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({
        title: body.title,
        content: body.content,
        tags: body.tags,
      }),
    },
    { networkRetries: 2 }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not post");
  return data;
}

export async function createPostComment(postId, body) {
  const res = await apiFetch(
    apiUrl(`/api/community/posts/${encodeURIComponent(postId)}/comments`),
    {
      method: "POST",
      headers: communityAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ body: body.body, content: body.content }),
    },
    { networkRetries: 2 }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Comment failed");
  return data;
}

export async function createCommunityChat(body) {
  const res = await apiFetch(
    apiUrl("/api/community/chats"),
    {
      method: "POST",
      headers: communityAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({
        message: body.message,
        channel: body.channel,
      }),
    },
    { networkRetries: 2 }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Send failed");
  return data;
}

export async function createPostReaction({ postId, reaction = "like" }) {
  const res = await apiFetch(
    apiUrl("/api/community/reactions"),
    {
      method: "POST",
      headers: communityAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({
        targetType: "post",
        targetId: postId,
        reaction,
      }),
    },
    { networkRetries: 2 }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Reaction failed");
  return data;
}
