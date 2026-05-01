/**
 * WebSocket hub — real-time session + presence (MVP).
 * Path: /ws?roomId=...&userId=... (query optional for demo)
 */

let WebSocketServer = null;
try {
  WebSocketServer = require("ws").WebSocketServer;
} catch {
  console.warn("[CCWEB] Optional dependency `ws` not installed — WebSocket hub disabled. Run: npm install");
}

const { PLATFORM_MANIFEST } = require("../platform/manifest");

function attachWebSocketHub(httpServer) {
  if (!WebSocketServer) {
    return null;
  }
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (socket, req) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const roomId = url.searchParams.get("roomId") || "lobby";
    const userId = url.searchParams.get("userId") || "anonymous";

    socket.send(
      JSON.stringify({
        type: "welcome",
        platform: PLATFORM_MANIFEST.name,
        roomId,
        userId,
        message: "Connected to CCWEB realtime hub. Subscribe to room topics via JSON messages.",
      })
    );

    socket.on("message", (raw) => {
      let data;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        data = { type: "text", body: raw.toString() };
      }
      if (data.type === "ping") {
        socket.send(JSON.stringify({ type: "pong", ts: Date.now() }));
        return;
      }
      /** Echo + broadcast pattern stub — production uses Redis pub/sub per room */
      const out = {
        type: "relay",
        roomId,
        from: userId,
        payload: data,
        ts: Date.now(),
      };
      socket.send(JSON.stringify(out));
    });

    socket.on("close", () => {});
  });

  return wss;
}

module.exports = { attachWebSocketHub };
