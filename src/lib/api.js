import axios from "axios";
import { getRefreshToken, getSessionToken, setSession, clearSession, getStoredUser } from "../session";

export const api = axios.create({
  baseURL: "",
  timeout: 60000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getSessionToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

async function doRefresh() {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  const res = await axios.post(
    "/api/auth/refresh",
    { refreshToken: refresh },
    { withCredentials: true, headers: { "Content-Type": "application/json" } }
  );
  const data = res.data;
  const access = data.accessToken || data.token;
  const user = data.user || getStoredUser();
  setSession(access, user, data.refreshToken);
  return access;
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const status = error.response?.status;
    const original = error.config;
    if (status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      if (!newToken) {
        clearSession();
        return Promise.reject(error);
      }
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      clearSession();
      return Promise.reject(error);
    }
  }
);

export function unwrap(promise) {
  return promise.then((r) => r.data).catch((e) => {
    const msg = e.response?.data?.error || e.message || "Request failed";
    throw new Error(msg);
  });
}
