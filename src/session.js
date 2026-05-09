import { getApiBaseUrl } from "./config/env";

const TOKEN_KEY = "ccweb_session_token";
const USER_KEY = "ccweb_user";
const REFRESH_KEY = "ccweb_refresh_token";

export function getSessionToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_KEY);
}

export function setSession(accessToken, user, refreshToken) {
  if (accessToken) sessionStorage.setItem(TOKEN_KEY, accessToken);
  else sessionStorage.removeItem(TOKEN_KEY);
  if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  else sessionStorage.removeItem(USER_KEY);
  if (refreshToken) sessionStorage.setItem(REFRESH_KEY, refreshToken);
  else sessionStorage.removeItem(REFRESH_KEY);
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
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const apiOrigin = getApiBaseUrl();
    const r = await fetch(`${apiOrigin}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refreshToken: refresh }),
    });
    const data = await r.json();
    if (!r.ok) return null;
    const access = data.accessToken || data.token;
    if (!access) return null;
    setSession(access, data.user, data.refreshToken || refresh);
    return data.user || null;
  } catch {
    return null;
  }
}

/**
 * Hydrate current user from API. Preserves refresh token when /me returns only { user }.
 * On 401, attempts refresh once (cookie or body refresh) before clearing session.
 */
export async function fetchMe() {
  let token = getSessionToken();
  const existingRefresh = getRefreshToken();

  async function callMe(access) {
    const apiOrigin = getApiBaseUrl();
    return fetch(`${apiOrigin}/api/auth/me`, {
      headers: { Authorization: `Bearer ${access}` },
      credentials: "include",
    });
  }

  if (!token) {
    const u = await tryRefreshSession();
    if (u) return u;
    return null;
  }

  let res = await callMe(token);
  if (res.status === 401 && existingRefresh) {
    const u = await tryRefreshSession();
    if (u) {
      token = getSessionToken();
      if (token) res = await callMe(token);
    }
  }

  if (!res.ok) {
    clearSession();
    return null;
  }
  const data = await res.json();
  const nextAccess = data.accessToken || data.token;
  const nextRefresh = data.refreshToken;
  setSession(
    nextAccess || token,
    data.user,
    nextRefresh !== undefined ? nextRefresh : existingRefresh
  );
  return data.user;
}

export async function logoutApi() {
  const token = getSessionToken();
  const refresh = getRefreshToken();
  if (token) {
    try {
      const apiOrigin = getApiBaseUrl();
      await fetch(`${apiOrigin}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ refreshToken: refresh || undefined }),
      });
    } catch {
      /* ignore */
    }
  }
  clearSession();
}
