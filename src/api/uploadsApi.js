import { apiUrl } from "../config/env";
import { getApiBearerToken } from "../lib/apiClient";
import { formatUserFacingError } from "../lib/userFacingError";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function shouldRetryHttpStatus(status) {
  return status === 0 || status === 502 || status === 503 || status === 504 || status === 429;
}

/**
 * Map server / network errors to user-facing messages (production-safe, no stack traces).
 * @param {Error & { status?: number; code?: string }} err
 */
export function formatUploadError(err) {
  const status = err?.status;
  const msg = String(err?.message || err || "");
  if (status === 401 || /401|unauthoriz/i.test(msg)) {
    return "Session expired. Sign in again, then retry the upload.";
  }
  if (status === 413 || /too large|entity too large/i.test(msg)) {
    return "Image is too large. Try a smaller file or a lower-resolution photo.";
  }
  return formatUserFacingError(err, "Upload failed. Please try again.");
}

/**
 * POST multipart/form-data with Bearer auth, upload progress, timeout, and bounded retries.
 * Uses XMLHttpRequest so `upload.onprogress` works on Android Chrome (fetch upload progress is limited).
 *
 * @param {string} url
 * @param {FormData} formData
 * @param {{ timeoutMs?: number; onProgress?: (pct: number) => void; signal?: AbortSignal; retries?: number; extraHeaders?: Record<string, string> }} [options]
 * @returns {Promise<Record<string, unknown>>}
 */
export function xhrUploadMultipart(url, formData, options = {}) {
  const timeoutMs = options.timeoutMs ?? 120000;
  const maxAttempts = 1 + Math.max(0, Number.isFinite(options.retries) ? options.retries : 2);
  const onProgress = options.onProgress;
  const signal = options.signal;
  const extraHeaders =
    options.extraHeaders && typeof options.extraHeaders === "object" && !Array.isArray(options.extraHeaders)
      ? options.extraHeaders
      : {};

  return (async () => {
    let lastErr;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) await sleep(320 * attempt);
      try {
        const data = await new Promise((resolve, reject) => {
          const run = async () => {
            const token = await getApiBearerToken();
            if (!token) {
              const err = new Error("Sign in to upload.");
              err.code = "NO_AUTH";
              reject(err);
              return;
            }

            const xhr = new XMLHttpRequest();
            xhr.open("POST", url);
            xhr.withCredentials = true;
            xhr.responseType = "text";
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            for (const [k, v] of Object.entries(extraHeaders)) {
              if (v != null && String(v).length > 0) {
                xhr.setRequestHeader(k, String(v));
              }
            }
            xhr.timeout = timeoutMs;

            if (onProgress) {
              xhr.upload.onprogress = (ev) => {
                if (ev.lengthComputable && ev.total > 0) {
                  onProgress(Math.min(100, Math.round((100 * ev.loaded) / ev.total)));
                } else {
                  onProgress(-1);
                }
              };
            }

            const onAbort = () => {
              try {
                xhr.abort();
              } catch {
                /* ignore */
              }
            };
            if (signal) {
              if (signal.aborted) {
                reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
                return;
              }
              signal.addEventListener("abort", onAbort, { once: true });
            }

            xhr.onload = () => {
              if (signal) signal.removeEventListener("abort", onAbort);
              let data = {};
              try {
                data = xhr.responseText ? JSON.parse(xhr.responseText) : {};
              } catch {
                data = {};
              }
              const status = xhr.status;
              if (status >= 200 && status < 300) {
                resolve(data);
                return;
              }
              const err = new Error(data.error || data.message || `Upload failed (${status}).`);
              err.status = status;
              if (data.code) err.code = data.code;
              reject(err);
            };

            xhr.onerror = () => {
              if (signal) signal.removeEventListener("abort", onAbort);
              const err = new Error("Network error during upload.");
              err.status = 0;
              reject(err);
            };

            xhr.ontimeout = () => {
              if (signal) signal.removeEventListener("abort", onAbort);
              const err = new Error("Upload timed out. Try a smaller image or check your connection.");
              err.status = 0;
              reject(err);
            };

            xhr.send(formData);
          };
          void run();
        });
        if (onProgress) onProgress(100);
        return data;
      } catch (e) {
        lastErr = e;
        const st = e && typeof e.status === "number" ? e.status : 0;
        const retryable = shouldRetryHttpStatus(st) || /network|timed out|timeout/i.test(String(e?.message || ""));
        const isLast = attempt >= maxAttempts - 1;
        if (!retryable || isLast) throw e;
      }
    }
    throw lastErr;
  })();
}

export async function uploadProfileAvatar(file, options = {}) {
  const fd = new FormData();
  fd.append("file", file);
  return xhrUploadMultipart(apiUrl("/api/v1/uploads/profile/avatar"), fd, {
    timeoutMs: 120000,
    retries: 2,
    ...options,
  });
}

export async function uploadProfileBanner(file, options = {}) {
  const fd = new FormData();
  fd.append("file", file);
  return xhrUploadMultipart(apiUrl("/api/v1/uploads/profile/banner"), fd, {
    timeoutMs: 120000,
    retries: 2,
    ...options,
  });
}

export async function uploadCourseThumbnail(courseId, file, adminKey, options = {}) {
  const fd = new FormData();
  fd.append("file", file);
  const url = apiUrl(`/api/v1/courses/admin/courses/${encodeURIComponent(courseId)}/thumbnail`);
  return xhrUploadMultipart(url, fd, {
    ...options,
    timeoutMs: options.timeoutMs ?? 120000,
    retries: options.retries ?? 2,
    extraHeaders: {
      ...(options.extraHeaders || {}),
      ...(adminKey ? { "X-CCWEB-Admin": String(adminKey) } : {}),
    },
  });
}

/**
 * DM / group chat image upload (multipart). Response shape: `{ message, url, storage }`.
 * @param {string} chatId
 * @param {File|Blob} file
 * @param {{ onProgress?: (pct: number) => void; signal?: AbortSignal; retries?: number; timeoutMs?: number }} [options]
 */
export async function uploadChatImage(chatId, file, options = {}) {
  const fd = new FormData();
  fd.append("file", file);
  const url = apiUrl(`/api/v1/chat/${encodeURIComponent(chatId)}/upload`);
  const { timeoutMs, retries, onProgress, signal, extraHeaders } = options;
  return xhrUploadMultipart(url, fd, {
    timeoutMs: timeoutMs ?? 180000,
    retries: retries ?? 2,
    onProgress,
    signal,
    extraHeaders,
  });
}
