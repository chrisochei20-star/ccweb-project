import { io } from "socket.io-client";
import { getApiBaseUrl } from "../config/env";
import { getApiBearerToken } from "./apiClient";

/**
 * Socket.IO client for DM realtime (same path as server: /socket.io).
 */
export function createChatSocket() {
  const base = getApiBaseUrl();
  const opts = {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth: (cb) => {
      getApiBearerToken()
        .then((token) => cb({ token: token || undefined }))
        .catch(() => cb({ token: undefined }));
    },
    reconnection: true,
    reconnectionDelay: 800,
    reconnectionAttempts: 12,
  };
  if (base) return io(base, opts);
  if (typeof window !== "undefined") return io(window.location.origin, opts);
  return io(opts);
}
