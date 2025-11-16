import { prisma } from "@oru/database";
import { redis } from "./redis.js";

export type HealthComponent = {
  status: "up" | "down";
  latencyMs: number | null;
  error?: string;
};

export type HealthReport = {
  status: "healthy" | "degraded";
  timestamp: string;
  services: {
    database: HealthComponent;
    redis: HealthComponent;
  };
};

const checkDatabase = async (): Promise<HealthComponent> => {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "up", latencyMs: Date.now() - started };
  } catch (error) {
    return { status: "down", latencyMs: null, error: (error as Error).message };
  }
};

const checkRedis = async (): Promise<HealthComponent> => {
  const started = Date.now();
  try {
    await redis.ping();
    return { status: "up", latencyMs: Date.now() - started };
  } catch (error) {
    return { status: "down", latencyMs: null, error: (error as Error).message };
  }
};

export const healthCheck = async (): Promise<HealthReport> => {
  const [database, redisComponent] = await Promise.all([checkDatabase(), checkRedis()]);
  const status = database.status === "up" && redisComponent.status === "up" ? "healthy" : "degraded";
  return {
    status,
    timestamp: new Date().toISOString(),
    services: {
      database,
      redis: redisComponent
    }
  };
};
