import axios from "axios";
import { clearSession, getRefreshToken, getSessionToken, setSession } from "../session";

export const http = axios.create({
  baseURL: "",
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

http.interceptors.request.use((config) => {
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
      const refresh = getRefreshToken();
      if (refresh) {
        try {
          const { data } = await axios.post(
            "/api/auth/refresh",
            { refreshToken: refresh },
            { headers: { "Content-Type": "application/json" }, withCredentials: true }
          );
          const access = data.accessToken || data.token;
          if (access) {
            setSession(access, data.user, data.refreshToken);
            original.headers.Authorization = `Bearer ${access}`;
            return http(original);
          }
        } catch {
          clearSession();
        }
      }
    }
    return Promise.reject(error);
  }
);
