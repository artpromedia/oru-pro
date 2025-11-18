import type { AgentHeartbeat, Prisma } from "@prisma/client";
import type { Queue as BullMQQueue } from "bullmq";
import type { Server as SocketIOServer } from "socket.io";
import Queue from "bull";
import { StatsD } from "node-statsd";
import { inventoryQueue, productionQueue } from "../jobs/queues.js";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import { logger } from "../logger.js";
import { env } from "../env.js";

const METRICS_CACHE_SECONDS = 30;
const ALERT_HISTORY_LIMIT = 100;
const ALERT_ACTIVE_WINDOW_SECONDS = 300;
const HEARTBEAT_LOOKBACK_MS = 60_000;

const toNumber = (value: Prisma.Decimal | number | bigint | null | undefined) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return Number(value);
};

type QueueStats = {
  name: string;
  pending: number;
  active: number;
  completed: number;
  failed: number;
};

type QueueMetrics = {
  pending: number;
  active: number;
  completed: number;
  failed: number;
  perQueue: QueueStats[];
};

type RealTimeMetrics = {
  timestamp: Date;
  system: Awaited<ReturnType<MonitoringService["getSystemStatus"]>>;
  business: Awaited<ReturnType<MonitoringService["getBusinessMetrics"]>>;
  agents: Awaited<ReturnType<MonitoringService["getAgentMetrics"]>>;
  alerts: Awaited<ReturnType<MonitoringService["getActiveAlerts"]>>;
};

type AlertInput = {
  organizationId: string;
  type: string;
  message: string;
  severity?: "info" | "warning" | "critical";
  source?: string;
  context?: Record<string, unknown>;
};

type AgentSnapshot = {
  id: string;
  name: string;
  status: string;
  queueName: string;
  mode: string;
  organizationId?: string;
  recentActivity: number;
  lastHeartbeat: Date;
  performance?: { successRate?: number; avgResponseTime?: number };
};

const bullmqJobQueues: ReadonlyArray<{ name: string; queue: BullMQQueue }> = [
  { name: "inventory", queue: inventoryQueue },
  { name: "production", queue: productionQueue }
];

type LegacyQueueInstance = InstanceType<typeof Queue>;

export class MonitoringService {
  private readonly statsd: StatsD;
  private metricsInterval: NodeJS.Timeout | null = null;
  private realtimeServer?: SocketIOServer;
  private readonly legacyQueues: Array<{ name: string; queue: LegacyQueueInstance }>;

  constructor() {
    this.statsd = new StatsD({
      host: process.env.STATSD_HOST ?? "localhost",
      port: Number(process.env.STATSD_PORT ?? 8125)
    });
    this.legacyQueues = this.createLegacyQueueMonitors();

    if (process.env.DISABLE_MONITORING_WORKER !== "true") {
      this.startMetricsCollection();
    }
  }

  setRealtimeServer(server: SocketIOServer): void {
    this.realtimeServer = server;
  }

  private startMetricsCollection(): void {
    if (this.metricsInterval) return;

    const intervalMs = Number(process.env.MONITORING_INTERVAL_MS ?? 10_000);
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics().catch((error) => logger.error("monitoringService: system metrics tick failed", error));
      this.collectBusinessMetrics().catch((error) => logger.error("monitoringService: business metrics tick failed", error));
      this.collectAgentMetrics().catch((error) => logger.error("monitoringService: agent metrics tick failed", error));
    }, Math.max(intervalMs, 1_000));
  }

  async collectSystemMetrics(): Promise<void> {
    try {
      const dbConnections = (await prisma.$queryRaw<Array<{ connections: bigint | number }>>`
        SELECT count(*) as connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `) ?? [{ connections: 0 }];
      this.statsd.gauge("database.connections", toNumber(dbConnections[0]?.connections));

      const redisInfo = await redis.info();
      const usedMemory = parseInt(redisInfo.match(/used_memory:(\d+)/)?.[1] ?? "0", 10);
      this.statsd.gauge("redis.memory_used", usedMemory);

      const apiHealthy = await this.checkAPIHealth();
      this.statsd.gauge("api.health", apiHealthy ? 1 : 0);

      const queueMetrics = await this.getQueueMetrics();
      this.statsd.gauge("queue.pending", queueMetrics.pending);
      this.statsd.gauge("queue.active", queueMetrics.active);
      this.statsd.gauge("queue.completed", queueMetrics.completed);
      this.statsd.gauge("queue.failed", queueMetrics.failed);
    } catch (error) {
      logger.error("monitoringService: failed to collect system metrics", error);
    }
  }

  async collectBusinessMetrics(): Promise<void> {
    try {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const inventoryMetrics = await prisma.materialStock.aggregate({
        _sum: { availableQty: true, qualityQty: true, blockedQty: true },
        _count: { id: true }
      });
      this.statsd.gauge("inventory.total_items", inventoryMetrics._count?.id ?? 0);
      this.statsd.gauge("inventory.available_qty", toNumber(inventoryMetrics._sum?.availableQty));
      this.statsd.gauge("inventory.quality_qty", toNumber(inventoryMetrics._sum?.qualityQty));
      this.statsd.gauge("inventory.blocked_qty", toNumber(inventoryMetrics._sum?.blockedQty));

      const lowStockCount = await prisma.$queryRaw<Array<{ count: bigint | number }>>`
        SELECT COUNT(*) as count
        FROM "MaterialStock"
        WHERE "availableQty" <= "reorderPoint" AND "status" = 'released'
      `;
      this.statsd.gauge("inventory.low_stock", toNumber(lowStockCount?.[0]?.count));

      const qaHolds = await prisma.qualityLot.count({ where: { status: "PENDING" } });
      this.statsd.gauge("qa.pending_holds", qaHolds);

      const activeProduction = await prisma.productionOrder.count({ where: { status: "in_progress" } });
      this.statsd.gauge("production.active_orders", activeProduction);

      const todaysOrders = await prisma.productionOrder.count({ where: { plannedDate: { gte: startOfDay } } });
      const todaysProduction = await prisma.materialDocument.aggregate({
        _sum: { quantity: true },
        where: {
          postedAt: { gte: startOfDay },
          movementType: { in: ["101", "103", "261", "311"] }
        }
      });
      this.statsd.gauge("production.todays_orders", todaysOrders);
      this.statsd.gauge("production.todays_output", toNumber(todaysProduction._sum?.quantity));

      const openAlerts = await prisma.inventoryAlert.count({ where: { acknowledged: false } });
      this.statsd.gauge("decisions.pending", openAlerts);

      const todaysAlerts = await prisma.inventoryAlert.count({ where: { createdAt: { gte: startOfDay } } });
      this.statsd.gauge("decisions.made_today", todaysAlerts);

      const purchaseOrdersToday = await prisma.purchaseOrder.count({ where: { createdAt: { gte: startOfDay } } });
      const purchaseValue = await prisma.purchaseOrderItem.aggregate({
        _sum: { netPrice: true },
        where: {
          purchaseOrder: {
            createdAt: { gte: startOfDay }
          }
        }
      });
      this.statsd.gauge("procurement.todays_orders", purchaseOrdersToday);
      this.statsd.gauge("procurement.todays_value", toNumber(purchaseValue._sum?.netPrice));
    } catch (error) {
      logger.error("monitoringService: failed to collect business metrics", error);
    }
  }

  async collectAgentMetrics(): Promise<void> {
    try {
      const heartbeats = await prisma.agentHeartbeat.findMany({
        where: { createdAt: { gte: new Date(Date.now() - HEARTBEAT_LOOKBACK_MS) } },
        orderBy: { createdAt: "desc" }
      });

      const snapshots = await this.buildAgentSnapshots(heartbeats);

      for (const snapshot of snapshots) {
        this.statsd.gauge(`agent.${snapshot.id}.status`, snapshot.status === "active" ? 1 : 0);
        this.statsd.gauge(`agent.${snapshot.id}.activity_rate`, snapshot.recentActivity);
        if (snapshot.performance) {
          this.statsd.gauge(`agent.${snapshot.id}.success_rate`, snapshot.performance.successRate ?? 0);
          this.statsd.gauge(`agent.${snapshot.id}.response_time`, snapshot.performance.avgResponseTime ?? 0);
        }
      }

      const activeAgents = snapshots.filter((agent) => agent.status === "active").length;
      this.statsd.gauge("agents.active", activeAgents);
      this.statsd.gauge("agents.total", snapshots.length);
    } catch (error) {
      logger.error("monitoringService: failed to collect agent metrics", error);
    }
  }

  async getCachedRealTimeMetrics(organizationId: string): Promise<RealTimeMetrics> {
    const cacheKey = this.metricsCacheKey(organizationId);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as RealTimeMetrics;
    }
    return this.getRealTimeMetrics(organizationId);
  }

  async getRealTimeMetrics(organizationId: string): Promise<RealTimeMetrics> {
    const metrics: RealTimeMetrics = {
      timestamp: new Date(),
      system: await this.getSystemStatus(),
      business: await this.getBusinessMetrics(organizationId),
      agents: await this.getAgentMetrics(organizationId),
      alerts: await this.getActiveAlerts(organizationId)
    };

    await redis.setex(this.metricsCacheKey(organizationId), METRICS_CACHE_SECONDS, JSON.stringify(metrics));
    this.realtimeServer?.to(`org:${organizationId}`).emit("monitoring:metrics", metrics);
    return metrics;
  }

  async getRecentAlerts(organizationId: string, limit = 25) {
    const alerts = await redis.lrange(this.alertFeedKey(organizationId), 0, limit - 1);
    return alerts.map((alert) => JSON.parse(alert));
  }

  async getSystemSnapshot() {
    return this.getSystemStatus();
  }

  async getActiveAlertsSnapshot(organizationId: string) {
    return this.getActiveAlerts(organizationId);
  }

  private async getSystemStatus() {
    return {
      database: await this.checkDatabaseHealth(),
      redis: await this.checkRedisHealth(),
      api: await this.checkAPIHealth(),
      queues: await this.getQueueMetrics()
    };
  }

  private async getBusinessMetrics(organizationId: string) {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const [inventory, production, alerts, procurementCount, procurementValue] = await Promise.all([
      prisma.materialStock.aggregate({
        _count: { id: true },
        _sum: { availableQty: true, qualityQty: true, blockedQty: true },
        where: organizationId ? { tenantId: organizationId } : undefined
      }),
      prisma.productionOrder.groupBy({
        by: ["status"],
        _count: { _all: true }
      }),
      prisma.inventoryAlert.groupBy({
        by: ["severity"],
        _count: { _all: true },
        where: organizationId ? { tenantId: organizationId } : undefined
      }),
      prisma.purchaseOrder.count({
        where: {
          ...(organizationId ? { tenantId: organizationId } : {}),
          createdAt: { gte: startOfDay }
        }
      }),
      prisma.purchaseOrderItem.aggregate({
        _sum: { netPrice: true },
        where: {
          purchaseOrder: {
            ...(organizationId ? { tenantId: organizationId } : {}),
            createdAt: { gte: startOfDay }
          }
        }
      })
    ]);

    return {
      inventory: {
        totalItems: inventory._count?.id ?? 0,
        totalQuantity: toNumber(inventory._sum?.availableQty) + toNumber(inventory._sum?.qualityQty) + toNumber(inventory._sum?.blockedQty)
      },
      production: production.reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = row._count._all;
        return acc;
      }, {}),
      decisions: alerts.reduce<Record<string, number>>((acc, row) => {
        acc[row.severity] = row._count._all;
        return acc;
      }, {}),
      procurement: {
        todaysOrders: procurementCount,
        todaysValue: toNumber(procurementValue._sum?.netPrice)
      }
    };
  }

  private async getAgentMetrics(organizationId: string) {
    const heartbeats = await prisma.agentHeartbeat.findMany({
      where: { createdAt: { gte: new Date(Date.now() - HEARTBEAT_LOOKBACK_MS) } },
      orderBy: { createdAt: "desc" }
    });

    const snapshots = await this.buildAgentSnapshots(heartbeats, organizationId);
    return snapshots;
  }

  private async buildAgentSnapshots(heartbeats: AgentHeartbeat[], organizationId?: string): Promise<AgentSnapshot[]> {
    const map = new Map<string, AgentSnapshot>();

    for (const heartbeat of heartbeats) {
      const payload = this.parseHeartbeatPayload(heartbeat.payload);
      const orgId = typeof payload.organizationId === "string" ? payload.organizationId : undefined;
      if (organizationId && orgId && orgId !== organizationId) continue;
      if (organizationId && !orgId) continue;

      const existing = map.get(heartbeat.agentName) ?? {
        id: heartbeat.agentName,
        name: heartbeat.agentName,
        status: heartbeat.status,
        queueName: heartbeat.queueName,
        mode: typeof payload.mode === "string" ? payload.mode : "autonomous",
        organizationId: orgId,
        recentActivity: 0,
        lastHeartbeat: heartbeat.createdAt
      };

      existing.status = heartbeat.status;
      existing.queueName = heartbeat.queueName;
      existing.mode = typeof payload.mode === "string" ? payload.mode : existing.mode;
      existing.organizationId = orgId ?? existing.organizationId;
      existing.recentActivity += 1;
      existing.lastHeartbeat = heartbeat.createdAt;

      map.set(heartbeat.agentName, existing);
    }

    await Promise.all(
      Array.from(map.values()).map(async (snapshot) => {
        snapshot.performance = await this.fetchAgentPerformance(snapshot.id);
      })
    );

    return Array.from(map.values());
  }

  private parseHeartbeatPayload(payload: AgentHeartbeat["payload"]): Record<string, unknown> {
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      return payload as Record<string, unknown>;
    }
    return {};
  }

  private async fetchAgentPerformance(agentId: string) {
    const perfData = await redis.get(`agent:performance:${agentId}`);
    if (!perfData) return undefined;
    try {
      return JSON.parse(perfData) as { successRate?: number; avgResponseTime?: number };
    } catch {
      return undefined;
    }
  }

  private async getActiveAlerts(organizationId: string) {
    const serialized = await redis.get(this.activeAlertsKey(organizationId));
    if (!serialized) return [];
    try {
      return JSON.parse(serialized) as unknown[];
    } catch {
      return [];
    }
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedisHealth(): Promise<boolean> {
    try {
      await redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  private async checkAPIHealth(): Promise<boolean> {
    return true;
  }

  private async getQueueMetrics(): Promise<QueueMetrics> {
    const [bullmqStats, legacyStats] = await Promise.all([
      Promise.all(bullmqJobQueues.map(({ name, queue }) => this.collectBullMQQueueStats(name, queue))),
      Promise.all(this.legacyQueues.map(({ name, queue }) => this.collectLegacyQueueStats(name, queue)))
    ]);

    const perQueue = [...bullmqStats, ...legacyStats].filter((stat): stat is QueueStats => Boolean(stat));

    const totals = perQueue.reduce(
      (acc, stat) => {
        acc.pending += stat.pending;
        acc.active += stat.active;
        acc.completed += stat.completed;
        acc.failed += stat.failed;
        return acc;
      },
      { pending: 0, active: 0, completed: 0, failed: 0 }
    );

    return {
      ...totals,
      perQueue
    };
  }

  private createLegacyQueueMonitors(): Array<{ name: string; queue: LegacyQueueInstance }> {
    if (process.env.DISABLE_MIGRATION_QUEUE_METRICS === "true") {
      return [];
    }

    const queueName = process.env.MIGRATION_QUEUE_NAME ?? "migration";
    try {
      return [
        {
          name: queueName,
          queue: new Queue(queueName, {
            redis: this.resolveLegacyRedisConfig()
          })
        }
      ];
    } catch (error) {
      logger.warn("monitoringService: failed to initialize legacy queue monitor", { queue: queueName, error });
      return [];
    }
  }

  private resolveLegacyRedisConfig() {
    if (process.env.REDIS_HOST || process.env.REDIS_PORT || process.env.REDIS_PASSWORD) {
      return {
        host: process.env.REDIS_HOST ?? "127.0.0.1",
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD
      };
    }

    try {
      const redisUrl = new URL(process.env.REDIS_URL ?? env.REDIS_URL ?? "redis://127.0.0.1:6379");
      return {
        host: redisUrl.hostname,
        port: Number(redisUrl.port || 6379),
        password: redisUrl.password || undefined
      };
    } catch {
      return {
        host: "127.0.0.1",
        port: 6379
      };
    }
  }

  private async collectBullMQQueueStats(name: string, queue: BullMQQueue): Promise<QueueStats | null> {
    try {
      const counts = await queue.getJobCounts("waiting", "waiting-children", "delayed", "paused", "active", "completed", "failed");
      const pending = (counts.waiting ?? 0) + (counts["waiting-children"] ?? 0) + (counts.delayed ?? 0) + (counts.paused ?? 0);
      return {
        name,
        pending,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0
      };
    } catch (error) {
      logger.warn("monitoringService: bullmq queue metrics failed", { queue: name, error });
      return null;
    }
  }

  private async collectLegacyQueueStats(name: string, queue: LegacyQueueInstance): Promise<QueueStats | null> {
    try {
      const counts = await queue.getJobCounts();
  const recordCounts = counts as unknown as Record<string, number>;
      const waiting = (recordCounts.waiting ?? recordCounts.wait ?? 0);
      const delayed = recordCounts.delayed ?? 0;
      const paused = typeof queue.getPausedCount === "function" ? await queue.getPausedCount() : recordCounts.paused ?? 0;
      const pending = waiting + delayed + paused;
      return {
        name,
        pending,
        active: recordCounts.active ?? 0,
        completed: recordCounts.completed ?? 0,
        failed: recordCounts.failed ?? 0
      };
    } catch (error) {
      logger.warn("monitoringService: bull queue metrics failed", { queue: name, error });
      return null;
    }
  }

  async createAlert(alert: AlertInput) {
    const payload = {
      ...alert,
      severity: alert.severity ?? "info",
      context: alert.context ?? {},
      timestamp: new Date().toISOString()
    };

    await redis.lpush(this.alertFeedKey(alert.organizationId), JSON.stringify(payload));
    await redis.ltrim(this.alertFeedKey(alert.organizationId), 0, ALERT_HISTORY_LIMIT - 1);

    const activeAlerts = await this.getActiveAlerts(alert.organizationId);
    const nextActive = [payload, ...activeAlerts].slice(0, ALERT_HISTORY_LIMIT);
    await redis.setex(this.activeAlertsKey(alert.organizationId), ALERT_ACTIVE_WINDOW_SECONDS, JSON.stringify(nextActive));

    this.realtimeServer?.to(`org:${alert.organizationId}`).emit("monitoring:alert", payload);
    this.statsd.increment(`alerts.${alert.type}`);
    logger.info("monitoringService: alert created", payload);
    return payload;
  }

  private metricsCacheKey(organizationId: string) {
    return `metrics:realtime:${organizationId}`;
  }

  private alertFeedKey(organizationId: string) {
    return `alerts:feed:${organizationId}`;
  }

  private activeAlertsKey(organizationId: string) {
    return `alerts:active:${organizationId}`;
  }

  async destroy(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    await Promise.all(
      this.legacyQueues.map(({ name, queue }) =>
        queue
          .close()
          .catch((error: unknown) => logger.warn("monitoringService: failed to close legacy queue", { queue: name, error }))
      )
    );
    this.statsd.close();
  }
}

export const monitoringService = new MonitoringService();
