import { apiFetch } from "../lib/apiClient";
import { apiUrl } from "../config/env";
import { getSessionToken } from "../session";

function authHeaders() {
  const t = getSessionToken();
  const h = { "Content-Type": "application/json" };
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

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
  const res = await apiFetch(path, { headers: authHeaders(), credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Recommended failed");
  return data.courses || [];
}

export async function fetchCourseDetail(slug) {
  const res = await apiFetch(apiUrl(`/api/v1/courses/catalog/${encodeURIComponent(slug)}`), {
    headers: authHeaders(),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Course failed");
  return data;
}

export async function fetchLessonQuiz(lessonId) {
  const res = await apiFetch(apiUrl(`/api/v1/courses/catalog/lessons/${encodeURIComponent(lessonId)}/quiz`), {
    headers: authHeaders(),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Quiz not available");
  return data.quiz;
}

export async function postLessonComplete(lessonId) {
  const res = await apiFetch(apiUrl(`/api/v1/courses/me/lessons/${encodeURIComponent(lessonId)}/complete`), {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not save progress");
  return data;
}

export async function postQuizSubmit(quizId, answers) {
  const res = await apiFetch(apiUrl(`/api/v1/courses/me/quiz/${encodeURIComponent(quizId)}/submit`), {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: JSON.stringify({ answers }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Submit failed");
  return data;
}

export async function postBookmark(courseId) {
  const res = await apiFetch(apiUrl(`/api/v1/courses/me/bookmarks/${encodeURIComponent(courseId)}`), {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Bookmark failed");
  }
}

export async function deleteBookmark(courseId) {
  const res = await apiFetch(apiUrl(`/api/v1/courses/me/bookmarks/${encodeURIComponent(courseId)}`), {
    method: "DELETE",
    headers: authHeaders(),
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Remove bookmark failed");
  }
}

export async function fetchMyBookmarks() {
  const res = await apiFetch(apiUrl("/api/v1/courses/me/bookmarks"), {
    headers: authHeaders(),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Bookmarks failed");
  return data.bookmarks || [];
}

export async function streamTutor({ message, courseSlug, lessonId, onDelta }) {
  const res = await fetch(apiUrl("/api/v1/courses/tutor/stream"), {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: JSON.stringify({ message, courseSlug, lessonId }),
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Stream failed");
  }
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
  return full;
}
