import type { Server as HTTPServer } from "node:http";
import type { Server } from "socket.io";

import { WebSocketServer } from "../services/websocket/websocketServer.js";

export type RealtimeChannel = "inventory" | "production" | "quality" | "copilot";

let websocketServer: WebSocketServer | null = null;

export const initRealtimeServer = (httpServer: HTTPServer): Server => {
  websocketServer = new WebSocketServer(httpServer);
  return websocketServer.getIO();
};

export const emitRealtimeEvent = (channel: RealtimeChannel, payload: unknown) => {
  websocketServer?.broadcast(channel, payload);
};

export const getRealtimeGateway = () => websocketServer;
