import { io } from "socket.io-client";
import { getApiBaseUrl } from "../config/env";
import { getApiBearerToken } from "./apiClient";

const REALTIME_OPTS = {
  path: "/socket.io",
  transports: ["websocket", "polling"],
  auth: (cb) => {
    getApiBearerToken()
      .then((token) => cb({ token: token || undefined }))
      .catch(() => cb({ token: undefined }));
  },
  reconnection: true,
  reconnectionDelay: 600,
  reconnectionDelayMax: 12000,
  randomizationFactor: 0.5,
  reconnectionAttempts: 20,
  timeout: 20000,
};

/**
 * New Socket.IO client (prefer getSharedRealtimeSocket in UI to avoid duplicate connections).
 */
export function createChatSocket() {
  const base = getApiBaseUrl();
  if (base) return io(base, REALTIME_OPTS);
  if (typeof window !== "undefined") return io(window.location.origin, REALTIME_OPTS);
  return io(REALTIME_OPTS);
}

let sharedSocket = null;

/**
 * One Socket.IO connection per browser tab for DMs, notification ticks, and community feed signals.
 * Callers must only register/deregister their own listeners; never disconnect the shared instance from a page.
 */
export function getSharedRealtimeSocket() {
  if (typeof window === "undefined") return null;
  if (!sharedSocket) {
    sharedSocket = createChatSocket();
  }
  if (!sharedSocket.connected) {
    sharedSocket.connect();
  }
  return sharedSocket;
}
