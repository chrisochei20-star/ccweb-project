const CHANNEL_ID = "ccweb-realtime-v1";

/**
 * Cross-tab sync for notification counts and read state (one Socket.IO connection per tab).
 */
export function createCrossTabChannel() {
  if (typeof BroadcastChannel === "undefined") return null;
  try {
    return new BroadcastChannel(CHANNEL_ID);
  } catch {
    return null;
  }
}

export function publishCrossTab(channel, type, payload = {}) {
  if (!channel) return;
  try {
    channel.postMessage({ type, payload, ts: Date.now() });
  } catch {
    /* ignore */
  }
}
