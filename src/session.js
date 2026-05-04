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

export async function fetchMe() {
  const token = getSessionToken();
  if (!token) return null;
  const res = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  if (!res.ok) {
    clearSession();
    return null;
  }
  const data = await res.json();
  setSession(data.accessToken || data.token, data.user, data.refreshToken);
  return data.user;
}

export async function logoutApi() {
  const token = getSessionToken();
  const refresh = getRefreshToken();
  if (token) {
    try {
      await fetch("/api/auth/logout", {
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
