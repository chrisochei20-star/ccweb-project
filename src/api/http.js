import axios from "axios";
import { clearSession, getRefreshToken, getSessionToken, getStoredUser, setSession } from "../session";
import { getApiBaseUrl } from "../config/env";

export const http = axios.create({
  baseURL: "",
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  const base = getApiBaseUrl();
  if (base) config.baseURL = base;
  const token = getSessionToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status;
    const original = error.config;
    if (status === 401 && original && !original._retry) {
      original._retry = true;
      const storedRefresh = getRefreshToken();
      try {
        const apiOrigin = getApiBaseUrl();
        const base = (apiOrigin || "").replace(/\/$/, "");
        const url = base ? `${base}/api/auth/refresh` : "/api/auth/refresh";
        const { data } = await axios.post(
          url,
          storedRefresh ? { refreshToken: storedRefresh } : {},
          { headers: { "Content-Type": "application/json" }, withCredentials: true }
        );
        const access = data.accessToken || data.token;
        if (access) {
          setSession(
            access,
            data.user != null ? data.user : getStoredUser(),
            data.refreshToken !== undefined ? data.refreshToken : undefined
          );
          original.headers.Authorization = `Bearer ${access}`;
          return http(original);
        }
      } catch {
        clearSession();
      }
    }
    return Promise.reject(error);
  }
);
