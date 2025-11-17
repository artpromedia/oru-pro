import type { Server } from "socket.io";
import { logger } from "../logger.js";
import { prisma } from "../lib/prisma.js";

export type AgentHeartbeatPayload = {
  id: string;
  agentName: string;
  queueName: string;
  status: string;
  payload: Record<string, unknown>;
  createdAt: Date;
};

export type AgentOrchestratorHandle = {
  stop: () => void;
  refreshHeartbeats: () => Promise<void>;
};

const HEARTBEAT_LIMIT = 50;
const REFRESH_INTERVAL_MS = 30_000;

const fetchHeartbeats = async (): Promise<AgentHeartbeatPayload[]> => {
  const records = await prisma.agentHeartbeat.findMany({
    take: HEARTBEAT_LIMIT,
    orderBy: { createdAt: "desc" }
  });
  return records.map((record) => ({
    id: record.id,
    agentName: record.agentName,
    queueName: record.queueName,
    status: record.status,
    payload: typeof record.payload === "object" && record.payload ? (record.payload as Record<string, unknown>) : {},
    createdAt: record.createdAt
  }));
};

export const initializeAgentOrchestrator = async (io: Server): Promise<AgentOrchestratorHandle> => {
  logger.info("agent orchestrator: initializing realtime bridge");

  const emitHeartbeats = async () => {
    try {
      const data = await fetchHeartbeats();
      io.emit("agents:heartbeats", data);
    } catch (error) {
      logger.error("agent orchestrator: failed to broadcast heartbeats", error);
    }
  };

  io.on("connection", (socket) => {
    logger.info("agent orchestrator: socket joined", { socket: socket.id });
    socket.on("agents:request-heartbeats", () => {
      emitHeartbeats().catch((error) => logger.error("agent orchestrator: request failed", error));
    });
  });

  await emitHeartbeats();
  const interval = setInterval(() => {
    emitHeartbeats().catch((error) => logger.error("agent orchestrator: scheduled refresh failed", error));
  }, REFRESH_INTERVAL_MS);

  return {
    stop: () => clearInterval(interval),
    refreshHeartbeats: emitHeartbeats
  };
};
