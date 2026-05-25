import { apiFetch } from "../lib/apiClient";
import { apiUrl } from "../config/env";

export async function fetchCourseCategories() {
  const res = await apiFetch(apiUrl("/api/v1/courses/catalog/categories"));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Categories failed");
  return data.categories || [];
}

export async function fetchCourseCatalog({ category, q } = {}) {
  const qs = new URLSearchParams();
  if (category) qs.set("category", category);
  if (q) qs.set("q", q);
  const path = apiUrl("/api/v1/courses/catalog/courses") + (qs.toString() ? `?${qs}` : "");
  const res = await apiFetch(path);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Catalog failed");
  return data.courses || [];
}

export async function fetchRecommendedCourses(params = {}) {
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.exclude) qs.set("exclude", params.exclude);
  const path = apiUrl("/api/v1/courses/catalog/recommended") + (qs.toString() ? `?${qs}` : "");
  const res = await apiFetch(path);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Recommended failed");
  return data.courses || [];
}

export async function fetchCourseDetail(slug) {
  const res = await apiFetch(apiUrl(`/api/v1/courses/catalog/${encodeURIComponent(slug)}`));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Course failed");
  return data;
}

export async function fetchLessonQuiz(lessonId) {
  const res = await apiFetch(apiUrl(`/api/v1/courses/catalog/lessons/${encodeURIComponent(lessonId)}/quiz`));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Quiz not available");
  return data.quiz;
}

export async function postLessonComplete(lessonId) {
  const res = await apiFetch(apiUrl(`/api/v1/courses/me/lessons/${encodeURIComponent(lessonId)}/complete`), {
    method: "POST",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not save progress");
  return data;
}

export async function postQuizSubmit(quizId, answers) {
  const res = await apiFetch(apiUrl(`/api/v1/courses/me/quiz/${encodeURIComponent(quizId)}/submit`), {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Submit failed");
  return data;
}

export async function postBookmark(courseId) {
  const res = await apiFetch(apiUrl(`/api/v1/courses/me/bookmarks/${encodeURIComponent(courseId)}`), {
    method: "POST",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Bookmark failed");
  }
}

export async function deleteBookmark(courseId) {
  const res = await apiFetch(apiUrl(`/api/v1/courses/me/bookmarks/${encodeURIComponent(courseId)}`), {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Remove bookmark failed");
  }
}

export async function fetchMyBookmarks() {
  const res = await apiFetch(apiUrl("/api/v1/courses/me/bookmarks"));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Bookmarks failed");
  return data.bookmarks || [];
}

export async function streamTutor({
  message,
  courseSlug,
  lessonId,
  mode = "lesson",
  conversationId,
  onDelta,
}) {
  const res = await apiFetch(apiUrl("/api/v1/courses/tutor/stream"), {
    method: "POST",
    body: JSON.stringify({
      message,
      courseSlug,
      lessonId,
      mode,
      conversationId,
    }),
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Stream failed");
  }
  const cid = res.headers.get("X-CCWEB-Conversation-Id");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = dec.decode(value, { stream: true });
    full += chunk;
    onDelta?.(chunk, full);
  }
  return { text: full, conversationId: cid };
}

export async function ensureTutorConversation({ mode = "general", courseSlug, lessonId, forceNew = false }) {
  const res = await apiFetch(apiUrl("/api/v1/courses/tutor/conversations"), {
    method: "POST",
    body: JSON.stringify({ mode, courseSlug, lessonId, forceNew }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Conversation failed");
  return data.conversation;
}

export async function fetchTutorConversations() {
  const res = await apiFetch(apiUrl("/api/v1/courses/tutor/conversations"));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "List failed");
  return data.conversations || [];
}

export async function fetchTutorMessages(conversationId, limit = 80) {
  const q = limit ? `?limit=${encodeURIComponent(limit)}` : "";
  const res = await apiFetch(
    apiUrl(`/api/v1/courses/tutor/conversations/${encodeURIComponent(conversationId)}/messages${q}`)
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Messages failed");
  return data;
}

export async function deleteTutorConversation(conversationId) {
  const res = await apiFetch(apiUrl(`/api/v1/courses/tutor/conversations/${encodeURIComponent(conversationId)}`), {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Delete failed");
  }
}

export async function fetchTutorMemory() {
  const res = await apiFetch(apiUrl("/api/v1/courses/tutor/memory"));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Memory failed");
  return data.memory;
}

export async function putTutorMemory(body) {
  const res = await apiFetch(apiUrl("/api/v1/courses/tutor/memory"), {
    method: "PUT",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Save memory failed");
  return data.memory;
}
