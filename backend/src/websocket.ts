import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";

let wss: WebSocketServer | null = null;

export function initWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: "/ws" });
  wss.on("connection", (socket: WebSocket) => {
    socket.on("close", () => {
      // Le broadcast gère déjà les clients fermés.
    });
  });
}

export function broadcast(type: string, data?: unknown) {
  if (!wss) return;
  const message = JSON.stringify({ type, data });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
