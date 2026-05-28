/**
 * One Socket.IO connection per browser tab — re-exports from realtimeSocket manager.
 * @deprecated Import from ./realtimeSocket.js directly in new code.
 */
export {
  getSharedRealtimeSocket,
  createChatSocket,
  subscribeRealtime,
  onSocketReconnect,
  onConnectionStateChange,
  getRealtimeConnectionState,
  broadcastNotificationsCrossTab,
} from "./realtimeSocket";
