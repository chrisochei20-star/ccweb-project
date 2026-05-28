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
/** @type {'disconnected' | 'connecting' | 'connected' | 'reconnecting'} */
let connectionState = "disconnected";
let wired = false;
/** event -> Map<subscriberId, handler> */
const listenerRegistry = new Map();
const reconnectHandlers = new Set();
const stateHandlers = new Set();
/** @type {BroadcastChannel | null} */
let crossTabChannel = null;

function setConnectionState(next) {
  if (connectionState === next) return;
  connectionState = next;
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
      if (type === "realtime:event" && payload?.event) {
        dispatchEvent(payload.event, payload.data);
      }
      if (type === "notifications:sync") {
        dispatchEvent("notifications:cross-tab", payload);
      }
    };
  }
  return crossTabChannel;
}

function wireSocket(socket) {
  if (wired) return;
  wired = true;
  ensureCrossTab();

  socket.io.on("reconnect_attempt", () => {
    setConnectionState("reconnecting");
    realtimeLog("socket_reconnect_attempt");
  });

  socket.on("connect", () => {
    setConnectionState("connected");
    realtimeLog("socket_connect", { socketId: socket.id });
    for (const fn of reconnectHandlers) {
      try {
        fn(socket);
      } catch (e) {
        realtimeLog("reconnect_handler_error", { err: e?.message });
      }
    }
  });

  socket.on("disconnect", (reason) => {
    setConnectionState("disconnected");
    realtimeLog("socket_disconnect", { reason });
  });

  socket.on("connect_error", (err) => {
    realtimeLog("socket_connect_error", { err: err?.message || String(err) });
  });

  for (const event of REALTIME_EVENTS) {
    socket.on(event, (payload) => {
      realtimeLog("socket_event", { event, kind: payload?.kind });
      dispatchEvent(event, payload);
      publishCrossTab(ensureCrossTab(), "realtime:event", { event, data: payload });
    });
  }
}

function createSocketInstance() {
  const base = getApiBaseUrl();
  if (base) return io(base, REALTIME_OPTS);
  if (typeof window !== "undefined") return io(window.location.origin, REALTIME_OPTS);
  return io(REALTIME_OPTS);
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
 * Subscribe to a realtime event with deduplicated handler registration.
 * @param {string} event
 * @param {(payload: unknown) => void} handler
 * @param {string} [subscriberId] stable id prevents duplicate registration on strict-mode remounts when reused
 * @returns {() => void} unsubscribe
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

/** Notify other tabs (notification read, badge sync). */
export function broadcastNotificationsCrossTab(payload) {
  publishCrossTab(ensureCrossTab(), "notifications:sync", payload);
}

/** @deprecated Prefer getSharedRealtimeSocket — kept for tests/tools. */
export function createChatSocket() {
  return createSocketInstance();
}
