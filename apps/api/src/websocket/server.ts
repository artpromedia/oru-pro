import type { Server as HTTPServer } from "node:http";
import { Server } from "socket.io";
import { logger } from "../logger.js";
import { env } from "../env.js";

type RealtimeChannel = "inventory" | "production" | "quality" | "copilot";

class RealtimeGateway {
  constructor(private readonly io: Server) {
    this.io.on("connection", (socket) => {
      logger.info("realtime: client connected", { socket: socket.id });
      socket.on("realtime:subscribe", (channels: RealtimeChannel[] = []) => {
        channels.forEach((channel) => socket.join(channel));
      });
      socket.on("disconnect", () => logger.info("realtime: client disconnected", { socket: socket.id }));
    });
  }

  broadcast(channel: RealtimeChannel, payload: unknown) {
    this.io.to(channel).emit(channel, payload);
  }
}

let gateway: RealtimeGateway | null = null;

const parseOrigins = () => {
  const configured = env.REALTIME_ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean);
  if (configured?.length) return configured;
  if (env.NEXT_PUBLIC_SOCKET_URL) return [env.NEXT_PUBLIC_SOCKET_URL];
  return ["*"];
};

export const initRealtimeServer = (httpServer: HTTPServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: parseOrigins()
    }
  });
  gateway = new RealtimeGateway(io);
  return io;
};

export const emitRealtimeEvent = (channel: RealtimeChannel, payload: unknown) => {
  gateway?.broadcast(channel, payload);
};

export const getRealtimeGateway = () => gateway;
