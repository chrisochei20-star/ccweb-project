import { io } from "socket.io-client";
import { getApiBaseUrl } from "../config/env";
import { getApiBearerToken } from "./apiClient";
import { createCrossTabChannel, publishCrossTab } from "./crossTabSync";
import { realtimeLog } from "./realtimeLog";

const REALTIME_EVENTS = [
  "message:new",
  "inbox:refresh",
  "presence:update",
  "typing",
  "notifications:update",
  "community:update",
];

const REALTIME_OPTS = {
  path: "/socket.io",
  transports: ["websocket", "polling"],
  auth: (cb) => {
    getApiBearerToken()
      .then((token) => cb({ token: token || undefined }))
      .catch(() => cb({ token: undefined }));
  },
  reconnection: true,
  reconnectionDelay: 800,
  reconnectionDelayMax: 15000,
  randomizationFactor: 0.45,
  reconnectionAttempts: 25,
  timeout: 22000,
};

/** @type {import("socket.io-client").Socket | null} */
let sharedSocket = null;
/** @type {'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed'} */
let connectionState = "disconnected";
let wired = false;
let hadConnectedOnce = false;
/** event -> Map<subscriberId, handler> */
const listenerRegistry = new Map();
const reconnectHandlers = new Set();
const stateHandlers = new Set();
/** @type {BroadcastChannel | null} */
let crossTabChannel = null;
/** @type {ReturnType<typeof setInterval> | null} */
let heartbeatTimer = null;
/** @type {ReturnType<typeof setTimeout> | null} */
let staleRecoveryTimer = null;
let lifecycleCleanup = null;

function setConnectionState(next) {
  if (connectionState === next) return;
  connectionState = next;
  realtimeLog("realtime_state", { state: next });
  for (const fn of stateHandlers) {
    try {
      fn(next);
    } catch {
      /* ignore */
    }
  }
}

function dispatchEvent(event, payload) {
  const subs = listenerRegistry.get(event);
  if (!subs?.size) return;
  for (const fn of subs.values()) {
    try {
      fn(payload);
    } catch (e) {
      realtimeLog("listener_error", { event, err: e?.message || String(e) });
    }
  }
}

function ensureCrossTab() {
  if (crossTabChannel || typeof window === "undefined") return crossTabChannel;
  crossTabChannel = createCrossTabChannel();
  if (crossTabChannel) {
    crossTabChannel.onmessage = (ev) => {
      const { type, payload } = ev.data || {};
      if (type === "notifications:sync") {
        dispatchEvent("notifications:cross-tab", payload);
      }
    };
  }
  return crossTabChannel;
}

function clearHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function scheduleStaleRecovery() {
  if (staleRecoveryTimer) clearTimeout(staleRecoveryTimer);
  staleRecoveryTimer = setTimeout(() => {
    staleRecoveryTimer = null;
    if (connectionState !== "disconnected" && connectionState !== "failed") return;
    if (!sharedSocket || sharedSocket.connected) return;
    realtimeLog("socket_stale_recovery");
    try {
      sharedSocket.removeAllListeners();
      sharedSocket.disconnect();
    } catch {
      /* ignore */
    }
    sharedSocket = null;
    wired = false;
    getSharedRealtimeSocket();
  }, 45000);
}

function wireSocket(socket) {
  if (wired) return;
  wired = true;
  ensureCrossTab();

  socket.io.on("reconnect_attempt", (attempt) => {
    setConnectionState("reconnecting");
    realtimeLog("socket_reconnect_attempt", { attempt });
  });

  socket.io.on("reconnect_failed", () => {
    setConnectionState("failed");
    realtimeLog("socket_reconnect_failed");
    scheduleStaleRecovery();
  });

  socket.io.on("reconnect", (attempt) => {
    realtimeLog("socket_reconnected", { attempt });
  });

  socket.on("connect", () => {
    setConnectionState("connected");
    if (staleRecoveryTimer) {
      clearTimeout(staleRecoveryTimer);
      staleRecoveryTimer = null;
    }
    realtimeLog("socket_connect", { socketId: socket.id, recovered: !!socket.recovered });

    const isReconnect = hadConnectedOnce;
    hadConnectedOnce = true;

    clearHeartbeat();
    heartbeatTimer = setInterval(() => {
      realtimeLog("realtime_heartbeat", {
        connected: socket.connected,
        state: connectionState,
        subscribers: getSubscriberCounts(),
      });
    }, 60000);
    if (heartbeatTimer.unref) heartbeatTimer.unref();

    if (isReconnect) {
      for (const fn of reconnectHandlers) {
        try {
          fn(socket);
        } catch (e) {
          realtimeLog("reconnect_handler_error", { err: e?.message });
        }
      }
    }
  });

  socket.on("disconnect", (reason) => {
    clearHeartbeat();
    if (reason === "io server disconnect" || reason === "io client disconnect") {
      setConnectionState("disconnected");
    } else {
      setConnectionState("reconnecting");
    }
    realtimeLog("socket_disconnect", { reason });
    scheduleStaleRecovery();
  });

  socket.on("connect_error", (err) => {
    realtimeLog("socket_connect_error", { err: err?.message || String(err) });
  });

  for (const event of REALTIME_EVENTS) {
    socket.on(event, (payload) => {
      realtimeLog("socket_event", { event, kind: payload?.kind });
      dispatchEvent(event, payload);
    });
  }
}

function createSocketInstance() {
  const base = getApiBaseUrl();
  if (base) return io(base, REALTIME_OPTS);
  if (typeof window !== "undefined") return io(window.location.origin, REALTIME_OPTS);
  return io(REALTIME_OPTS);
}

function getSubscriberCounts() {
  const out = {};
  for (const [event, subs] of listenerRegistry.entries()) {
    out[event] = subs.size;
  }
  return out;
}

/**
 * One Socket.IO client per browser tab. Never disconnect from page components.
 */
export function getSharedRealtimeSocket() {
  if (typeof window === "undefined") return null;
  if (!sharedSocket) {
    setConnectionState("connecting");
    sharedSocket = createSocketInstance();
    wireSocket(sharedSocket);
  }
  if (!sharedSocket.connected && !sharedSocket.active) {
    sharedSocket.connect();
  }
  return sharedSocket;
}

/**
 * Disconnect and reset the shared socket (logout / session expiry).
 */
export function disconnectSharedRealtimeSocket() {
  clearHeartbeat();
  if (staleRecoveryTimer) {
    clearTimeout(staleRecoveryTimer);
    staleRecoveryTimer = null;
  }
  if (sharedSocket) {
    try {
      sharedSocket.removeAllListeners();
      sharedSocket.disconnect();
    } catch {
      /* ignore */
    }
    sharedSocket = null;
  }
  wired = false;
  hadConnectedOnce = false;
  setConnectionState("disconnected");
  realtimeLog("socket_disconnected_logout");
}

/**
 * Reconnect when app returns to foreground or network is back online.
 */
export function initRealtimeLifecycle() {
  if (typeof document === "undefined") return () => {};
  if (lifecycleCleanup) return lifecycleCleanup;

  const recover = () => {
    if (document.visibilityState && document.visibilityState !== "visible") return;
    const socket = getSharedRealtimeSocket();
    if (socket && !socket.connected) {
      realtimeLog("socket_foreground_reconnect");
      socket.connect();
    }
  };

  document.addEventListener("visibilitychange", recover);
  window.addEventListener("online", recover);
  window.addEventListener("focus", recover);
  document.addEventListener("ccweb:app-resume", recover);

  lifecycleCleanup = () => {
    document.removeEventListener("visibilitychange", recover);
    window.removeEventListener("online", recover);
    window.removeEventListener("focus", recover);
    document.removeEventListener("ccweb:app-resume", recover);
    lifecycleCleanup = null;
  };
  return lifecycleCleanup;
}

/**
 * Subscribe to a realtime event with deduplicated handler registration.
 */
export function subscribeRealtime(event, handler, subscriberId) {
  const subId = subscriberId || `sub_${event}_${Math.random().toString(36).slice(2, 10)}`;
  if (!listenerRegistry.has(event)) listenerRegistry.set(event, new Map());
  const subs = listenerRegistry.get(event);
  subs.set(subId, handler);
  getSharedRealtimeSocket();
  return () => {
    subs.delete(subId);
    if (subs.size === 0) listenerRegistry.delete(event);
  };
}

/** Run after socket reconnects — rejoin rooms, reload stale state. */
export function onSocketReconnect(handler) {
  reconnectHandlers.add(handler);
  return () => reconnectHandlers.delete(handler);
}

export function onConnectionStateChange(handler) {
  stateHandlers.add(handler);
  try {
    handler(connectionState);
  } catch {
    /* ignore */
  }
  return () => stateHandlers.delete(handler);
}

export function getRealtimeConnectionState() {
  return connectionState;
}

export function getRealtimeDiagnostics() {
  return {
    state: connectionState,
    connected: !!sharedSocket?.connected,
    socketId: sharedSocket?.id || null,
    hadConnectedOnce,
    subscribers: getSubscriberCounts(),
  };
}

/** Notify other tabs (notification read, badge sync). */
export function broadcastNotificationsCrossTab(payload) {
  publishCrossTab(ensureCrossTab(), "notifications:sync", payload);
}

/** @deprecated Prefer getSharedRealtimeSocket — kept for tests/tools. */
export function createChatSocket() {
  return createSocketInstance();
}
