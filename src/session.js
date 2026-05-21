import { SESSION_TOKEN_KEY } from "./authStorageKeys";
import { getApiBaseUrl } from "./config/env";
import { apiFetch } from "./lib/apiClient";

const TOKEN_KEY = SESSION_TOKEN_KEY;
const USER_KEY = "ccweb_user";
const REFRESH_KEY = "ccweb_refresh_token";

export function getSessionToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_KEY);
}

export function setSession(accessToken, user, refreshToken) {
  if (accessToken !== undefined) {
    if (accessToken) sessionStorage.setItem(TOKEN_KEY, accessToken);
    else sessionStorage.removeItem(TOKEN_KEY);
  }
  if (user !== undefined) {
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(USER_KEY);
  }
  if (refreshToken !== undefined) {
    if (refreshToken) sessionStorage.setItem(REFRESH_KEY, refreshToken);
    else sessionStorage.removeItem(REFRESH_KEY);
  }
}

export function getStoredUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
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
      { networkRetries: 1 }
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
 * Hydrate current user from API. Preserves refresh token when /me returns only { user }.
 * On 401, attempts refresh once (cookie or body refresh) before clearing session.
 */
export async function fetchMe() {
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
      { networkRetries: 1 }
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

export async function logoutApi() {
  const token = getSessionToken();
  const refresh = getRefreshToken();
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
