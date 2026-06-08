import { SESSION_TOKEN_KEY } from "./authStorageKeys";
import { CCWEB_AUTH_HYDRATION_TIMEOUT_MS } from "./constants/loadTimeout";
import { getApiBaseUrl } from "./config/env";
import { authStorageGetItem, authStorageRemoveItem, authStorageSetItem } from "./lib/authStorage";
import { apiFetch } from "./lib/apiClient";
import { revokeNativeDeviceToken } from "./lib/nativePush";
import { isCapacitorNative } from "./lib/platformDetect";

/** Max wait for /me + refresh during shell hydration (avoids infinite spinner). */
const SESSION_HYDRATION_TIMEOUT_MS = CCWEB_AUTH_HYDRATION_TIMEOUT_MS;

const TOKEN_KEY = SESSION_TOKEN_KEY;
const USER_KEY = "ccweb_user";
const REFRESH_KEY = "ccweb_refresh_token";

export function getSessionToken() {
  return authStorageGetItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return authStorageGetItem(REFRESH_KEY);
}

export function setSession(accessToken, user, refreshToken) {
  if (accessToken !== undefined) {
    if (accessToken) authStorageSetItem(TOKEN_KEY, accessToken);
    else authStorageRemoveItem(TOKEN_KEY);
  }
  if (user !== undefined) {
    if (user) authStorageSetItem(USER_KEY, JSON.stringify(user));
    else authStorageRemoveItem(USER_KEY);
  }
  if (refreshToken !== undefined) {
    if (refreshToken) authStorageSetItem(REFRESH_KEY, refreshToken);
    else authStorageRemoveItem(REFRESH_KEY);
  }
}

export function getStoredUser() {
  try {
    const raw = authStorageGetItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  authStorageRemoveItem(TOKEN_KEY);
  authStorageRemoveItem(USER_KEY);
  authStorageRemoveItem(REFRESH_KEY);
}

async function tryRefreshSession() {
  const storedRefresh = getRefreshToken();
  try {
    const apiOrigin = getApiBaseUrl();
    const base = (apiOrigin || "").replace(/\/$/, "");
    const url = base ? `${base}/api/auth/refresh` : "/api/auth/refresh";
    const r = await apiFetch(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(storedRefresh ? { refreshToken: storedRefresh } : {}),
      },
      { networkRetries: 2, timeoutMs: 15000 }
    );
    const data = await r.json();
    if (!r.ok) return null;
    const access = data.accessToken || data.token;
    if (!access) return null;
    setSession(
      access,
      data.user != null ? data.user : getStoredUser(),
      data.refreshToken !== undefined ? data.refreshToken : undefined
    );
    return data.user || getStoredUser();
  } catch {
    return null;
  }
}

/**
 * Hydrate current user from API (like validating a remote session).
 * Uses local token + `/api/auth/me` with Bearer; on 401, refresh once then retry.
 * Prefer cached user on slow networks: entire flow is bounded by {@link SESSION_HYDRATION_TIMEOUT_MS}.
 */
async function fetchMeFromNetwork() {
  const trace = import.meta.env.VITE_CCWEB_AUTH_TRACE === "1";
  let token = getSessionToken();
  if (trace) {
    // eslint-disable-next-line no-console -- gated auth diagnostics
    console.info("[ccweb-auth-trace] fetchMe_start", { hasAccessToken: Boolean(token) });
  }

  async function callMe(access) {
    const apiOrigin = getApiBaseUrl();
    const base = (apiOrigin || "").replace(/\/$/, "");
    const url = base ? `${base}/api/auth/me` : "/api/auth/me";
    return apiFetch(
      url,
      {
        headers: { Authorization: `Bearer ${access}` },
        credentials: "include",
      },
      { networkRetries: 2, timeoutMs: 15000 }
    );
  }

  if (!token) {
    const u = await tryRefreshSession();
    if (trace) {
      // eslint-disable-next-line no-console -- gated auth diagnostics
      console.info("[ccweb-auth-trace] fetchMe_hydrate_no_token_refresh", { ok: Boolean(u) });
    }
    return u;
  }

  let res = await callMe(token);
  if (trace) {
    // eslint-disable-next-line no-console -- gated auth diagnostics
    console.info("[ccweb-auth-trace] fetchMe_me_first", { status: res.status });
  }
  if (res.status === 401) {
    await tryRefreshSession();
    token = getSessionToken();
    if (trace) {
      // eslint-disable-next-line no-console -- gated auth diagnostics
      console.info("[ccweb-auth-trace] fetchMe_after_refresh_retry", { hasAccessToken: Boolean(token) });
    }
    if (token) res = await callMe(token);
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      if (trace) {
        // eslint-disable-next-line no-console -- gated auth diagnostics
        console.info("[ccweb-auth-trace] fetchMe_clear_session", { status: res.status });
      }
      clearSession();
      return null;
    }
    if (trace) {
      // eslint-disable-next-line no-console -- gated auth diagnostics
      console.info("[ccweb-auth-trace] fetchMe_fallback_stored_user", { status: res.status });
    }
    return getStoredUser();
  }
  const data = await res.json();
  const nextAccess = data.accessToken || data.token;
  const nextRefresh = data.refreshToken;
  setSession(nextAccess || token, data.user, nextRefresh !== undefined ? nextRefresh : undefined);
  if (trace) {
    // eslint-disable-next-line no-console -- gated auth diagnostics
    console.info("[ccweb-auth-trace] fetchMe_ok", { hasUser: Boolean(data.user) });
  }
  return data.user;
}

/**
 * Local session snapshot (token + cached user) without waiting on the network — analogous to reading a stored session first.
 */
export function getLocalSessionUser() {
  const token = getSessionToken();
  if (!token) return null;
  return getStoredUser();
}

export async function fetchMe() {
  let timeoutId;
  try {
    return await Promise.race([
      fetchMeFromNetwork(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(Object.assign(new Error("session_hydration_timeout"), { code: "SESSION_HYDRATION_TIMEOUT" })),
          SESSION_HYDRATION_TIMEOUT_MS
        );
      }),
    ]);
  } catch (e) {
    if (e && e.code === "SESSION_HYDRATION_TIMEOUT") {
      const token = getSessionToken();
      const cached = getStoredUser();
      if (token && cached) return cached;
      return null;
    }
    throw e;
  } finally {
    if (timeoutId != null) clearTimeout(timeoutId);
  }
}

export async function logoutApi() {
  const token = getSessionToken();
  const refresh = getRefreshToken();
  if (isCapacitorNative()) {
    try {
      await revokeNativeDeviceToken();
    } catch {
      /* ignore */
    }
  }
  if (token) {
    try {
      const apiOrigin = getApiBaseUrl();
      const base = (apiOrigin || "").replace(/\/$/, "");
      const url = base ? `${base}/api/auth/logout` : "/api/auth/logout";
      await apiFetch(
        url,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ refreshToken: refresh || undefined }),
        },
        { networkRetries: 1 }
      );
    } catch {
      /* ignore */
    }
  }
  clearSession();
}
