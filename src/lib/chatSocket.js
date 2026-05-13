import { io } from "socket.io-client";
import { getApiBaseUrl } from "../config/env";
import { getSessionToken } from "../session";

function baseSocketOptions() {
  return {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth: { token: getSessionToken() },
    reconnection: true,
    reconnectionAttempts: 25,
    reconnectionDelay: 600,
    reconnectionDelayMax: 15000,
    randomizationFactor: 0.45,
    timeout: 45000,
    autoConnect: false,
  };
}

/**
 * Socket.IO client for DM realtime + notifications (server path: /socket.io).
 */
export function createChatSocket() {
  const base = getApiBaseUrl();
  const opts = baseSocketOptions();
  if (base) return io(base, opts);
  if (typeof window !== "undefined") return io(window.location.origin, opts);
  return io(opts);
}

/**
 * Refresh bearer auth before each reconnect attempt (tokens may rotate on mobile resume).
 * Call once per socket instance after creation.
 */
export function wireSocketResilience(socket, handlers = {}) {
  if (!socket?.io) return;
  const mgr = socket.io;
  mgr.on("reconnect_attempt", () => {
    const t = getSessionToken();
    if (t) socket.auth = { ...socket.auth, token: t };
  });
  socket.on("reconnect", () => {
    handlers.onReconnect?.();
  });
  socket.on("connect_error", (err) => {
    handlers.onConnectError?.(err);
  });
}
