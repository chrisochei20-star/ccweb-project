import { apiFetch } from "../lib/apiClient";
import { apiUrl } from "../config/env";
import { formatAiError, logAiClient } from "../lib/aiDiagnostics";
import { isCapacitorNative } from "../lib/platformDetect";

/** @type {AbortController | null} */
let activeTutorStream = null;

export function abortActiveTutorStream() {
  if (activeTutorStream) {
    activeTutorStream.abort();
    activeTutorStream = null;
  }
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

const TUTOR_STREAM_TIMEOUT_MS = 120_000;

async function postTutorChat({ message, courseSlug, lessonId, mode, conversationId }) {
  const res = await apiFetch(
    apiUrl("/api/v1/courses/tutor/chat"),
    {
      method: "POST",
      body: JSON.stringify({ message, courseSlug, lessonId, mode, conversationId }),
    },
    { timeoutMs: TUTOR_STREAM_TIMEOUT_MS, networkRetries: 0 }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Chat failed");
    err.code = data.code || (res.status === 503 ? "AI_NOT_CONFIGURED" : undefined);
    err.status = res.status;
    throw err;
  }
  return {
    text: data.reply || "",
    conversationId: data.conversationId,
    provider: data.provider || "unknown",
    mock: Boolean(data.mock),
    degradedReason: data.degradedReason || null,
  };
}

/**
 * Stream tutor reply. Cancels any in-flight tutor stream before starting a new one.
 * @param {{ signal?: AbortSignal }} opts
 */
export async function streamTutor({
  message,
  courseSlug,
  lessonId,
  mode = "lesson",
  conversationId,
  onDelta,
  signal,
  timeoutMs = TUTOR_STREAM_TIMEOUT_MS,
}) {
  abortActiveTutorStream();
  const localCtrl = new AbortController();
  activeTutorStream = localCtrl;

  const parentSignal = signal;
  if (parentSignal) {
    if (parentSignal.aborted) {
      activeTutorStream = null;
      throw Object.assign(new Error("Request cancelled."), { name: "AbortError" });
    }
    parentSignal.addEventListener("abort", () => localCtrl.abort(), { once: true });
  }

  const started = Date.now();
  logAiClient("tutor_stream_start", { mode, hasConversation: Boolean(conversationId) });

  try {
    // Capacitor WebView often lacks reliable fetch streaming bodies — use buffered chat.
    if (isCapacitorNative()) {
      const out = await postTutorChat({ message, courseSlug, lessonId, mode, conversationId });
      if (out.text) onDelta?.(out.text, out.text);
      logAiClient("tutor_stream_ok", {
        mode,
        provider: out.provider,
        mock: out.mock,
        chars: out.text.length,
        durationMs: Date.now() - started,
        buffered: true,
      });
      return out;
    }

    const res = await apiFetch(
      apiUrl("/api/v1/courses/tutor/stream"),
      {
        method: "POST",
        body: JSON.stringify({
          message,
          courseSlug,
          lessonId,
          mode,
          conversationId,
        }),
        signal: localCtrl.signal,
      },
      { timeoutMs, networkRetries: 0 }
    );

    if (!res.ok) {
      let errBody = {};
      try {
        errBody = await res.json();
      } catch {
        /* plain-text error body */
      }
      const err = new Error(errBody.error || "Stream failed");
      err.code = errBody.code || (res.status === 503 ? "AI_NOT_CONFIGURED" : undefined);
      err.status = res.status;
      throw err;
    }

    if (!res.body || typeof res.body.getReader !== "function") {
      const out = await postTutorChat({ message, courseSlug, lessonId, mode, conversationId });
      if (out.text) onDelta?.(out.text, out.text);
      logAiClient("tutor_stream_ok", {
        mode,
        provider: out.provider,
        mock: out.mock,
        chars: out.text.length,
        durationMs: Date.now() - started,
        buffered: true,
      });
      return out;
    }

    const cid = res.headers.get("X-CCWEB-Conversation-Id");
    const provider = res.headers.get("X-CCWEB-AI-Provider") || "unknown";
    const degraded = res.headers.get("X-CCWEB-AI-Degraded") || "";

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let full = "";
    try {
      for (;;) {
        if (localCtrl.signal.aborted) {
          await reader.cancel().catch(() => {});
          throw Object.assign(new Error("Request cancelled."), { name: "AbortError" });
        }
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        full += chunk;
        onDelta?.(chunk, full);
      }
    } finally {
      try {
        reader.releaseLock();
      } catch {
        /* ignore */
      }
    }

    const isMock =
      res.headers.get("X-CCWEB-AI-Mock") === "1" ||
      degraded === "openai_quota" ||
      /Live AI is temporarily unavailable because the OpenAI account/i.test(full);

    logAiClient("tutor_stream_ok", {
      mode,
      provider,
      mock: isMock,
      chars: full.length,
      durationMs: Date.now() - started,
    });

    return {
      text: full,
      conversationId: cid,
      provider: isMock ? "mock" : provider,
      mock: isMock,
      degradedReason: degraded === "openai_quota" ? "openai_quota" : isMock ? "mock" : null,
    };
  } catch (e) {
    const formatted = formatAiError(e);
    logAiClient("tutor_stream_error", {
      mode,
      message: formatted.message,
      durationMs: Date.now() - started,
    });
    const out = new Error(formatted.message);
    out.code = e?.code;
    out.unavailable = formatted.unavailable;
    out.retryable = formatted.retryable;
    if (e?.name === "AbortError") out.name = "AbortError";
    throw out;
  } finally {
    if (activeTutorStream === localCtrl) activeTutorStream = null;
  }
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
