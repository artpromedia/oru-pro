import { EventEmitter } from "node:events";
import type { Prisma } from "@prisma/client";
import type { Server as SocketIOServer } from "socket.io";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import { logger } from "../logger.js";
import { InventoryAgent, type InventorySignal } from "./agents/inventoryAgent.js";

const ALERT_TTL_SECONDS = 60 * 60; // 1 hour
const REPORT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

type PrismaInventoryRow = Prisma.InventoryGetPayload<{ include: { facility: true } }>;

type InventoryRecord = {
  raw: PrismaInventoryRow;
  id: string;
  sku: string;
  quantity: number;
  reorderPoint: number;
  reorderQty: number;
  unitCost: number;
  facilityId: string;
  scopeId: string;
  qaState: string;
  preferredSupplierId?: string | null;
  expiryDate?: Date | null;
  createdById?: string | null;
};

type LowStockAlert = {
  type: "LOW_STOCK";
  sku: string;
  current: number;
  reorderPoint: number;
  warehouseId: string;
  severity: "warning" | "critical";
};

type ExpiryAlert = {
  type: "EXPIRY_WARNING";
  sku: string;
  daysToExpiry: number;
  quantity: number;
  value: number;
  severity: "warning" | "critical";
};

export type InventoryAlert = LowStockAlert | ExpiryAlert;

type OptionalModelDelegates = {
  notification: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
  decision: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
};

const db = prisma as typeof prisma & Partial<OptionalModelDelegates>;

export type LowStockPayload = {
  inventory: InventoryRecord;
  alert: LowStockAlert;
};

export type ExpiryWarningPayload = {
  inventory: InventoryRecord;
  alert: ExpiryAlert;
};

export type QAHoldPayload = {
  qaHold: {
    id: string;
    inventoryId: string;
    batchNumber?: string | null;
    tests: unknown;
  };
  inventory: InventoryRecord;
};

export class InventoryService extends EventEmitter {
  private readonly inventoryAgent: InventoryAgent;
  private realtimeServer?: SocketIOServer;

  constructor() {
    super();
    this.inventoryAgent = new InventoryAgent();
    this.setupEventListeners();
  }

  setRealtimeServer(server: SocketIOServer): void {
    this.realtimeServer = server;
  }

  private setupEventListeners(): void {
    this.on("lowStock", async (payload: LowStockPayload) => {
      try {
        await this.handleLowStockEvent(payload);
      } catch (error) {
        logger.error("inventoryService lowStock handler failed", error);
      }
    });

    this.on("expiryWarning", async (payload: ExpiryWarningPayload) => {
      try {
        await this.handleExpiryWarning(payload);
      } catch (error) {
        logger.error("inventoryService expiry handler failed", error);
      }
    });

    this.on("qaHoldCreated", async (payload: QAHoldPayload) => {
      try {
        await this.handleQAHold(payload);
      } catch (error) {
        logger.error("inventoryService QA handler failed", error);
      }
    });
  }

  async monitorInventoryLevels(scopeId: string): Promise<InventoryAlert[]> {
    const rows = await prisma.inventory.findMany({
      where: scopeId ? { facilityId: scopeId } : undefined,
      include: { facility: true }
    });

    const inventories = rows.map((row) => this.normalizeInventory(row, scopeId));
    const alerts: InventoryAlert[] = [];

    for (const inventory of inventories) {
      if (inventory.quantity <= inventory.reorderPoint) {
        const alert: LowStockAlert = {
          type: "LOW_STOCK",
          sku: inventory.sku,
          current: inventory.quantity,
          reorderPoint: inventory.reorderPoint,
          warehouseId: inventory.facilityId,
          severity: inventory.quantity < inventory.reorderPoint * 0.5 ? "critical" : "warning"
        };
        alerts.push(alert);
        this.emit("lowStock", { inventory, alert });
      }

      if (inventory.expiryDate) {
        const daysToExpiry = Math.floor((inventory.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysToExpiry <= 30) {
          const alert: ExpiryAlert = {
            type: "EXPIRY_WARNING",
            sku: inventory.sku,
            daysToExpiry,
            quantity: inventory.quantity,
            value: inventory.quantity * inventory.unitCost,
            severity: daysToExpiry < 7 ? "critical" : "warning"
          };
          alerts.push(alert);
          this.emit("expiryWarning", { inventory, alert });
        }
      }
    }

    if (alerts.length && scopeId) {
      await redis.setex(`alerts:inventory:${scopeId}`, ALERT_TTL_SECONDS, JSON.stringify(alerts));
      this.realtimeServer?.to(`org:${scopeId}`).emit("inventory:alerts", alerts);
    }

    return alerts;
  }

  private async handleLowStockEvent({ inventory, alert }: LowStockPayload): Promise<void> {
    const recommendation = await this.inventoryAgent.handleLowStock(this.toAgentSignal(inventory));

    const notificationDelegate = db.notification;
    if (notificationDelegate?.create) {
      await notificationDelegate.create({
        data: {
          userId: inventory.createdById ?? "system",
          type: alert.severity === "critical" ? "alert" : "warning",
          title: `Low Stock Alert: ${inventory.sku}`,
          message: `Current stock (${inventory.quantity}) is below reorder point (${inventory.reorderPoint})`,
          data: {
            inventoryId: inventory.id,
            scopeId: inventory.scopeId,
            recommendation
          }
        }
      });
    }

    if (alert.severity === "critical" && recommendation.confidence > 85) {
      await this.createAutomaticPurchaseOrder(inventory, recommendation);
    }

    logger.info("inventoryService low stock handled", { sku: inventory.sku, severity: alert.severity });
  }

  private async handleExpiryWarning({ inventory, alert }: ExpiryWarningPayload): Promise<void> {
    const action = await this.inventoryAgent.getExpiryAction(this.toAgentSignal(inventory));

    const decisionDelegate = db.decision;
    if (decisionDelegate?.create) {
      await decisionDelegate.create({
        data: {
          title: `Expiry Action Required: ${inventory.sku}`,
          description: `${inventory.quantity} units expiring in ${alert.daysToExpiry} days`,
          type: "inventory_expiry",
          status: "pending",
          priority: alert.severity === "critical" ? "critical" : "high",
          requesterId: "system",
          organizationId: inventory.scopeId,
          context: {
            inventoryId: inventory.id,
            daysToExpiry: alert.daysToExpiry,
            quantity: inventory.quantity,
            value: alert.value
          },
          alternatives: {
            markdown: "Apply discount to move inventory",
            transfer: "Transfer to high-demand location",
            donate: "Donate to charity",
            dispose: "Dispose if expired"
          },
          aiRecommendation: action,
          aiConfidence: action.confidence,
          deadline: new Date(Date.now() + (alert.daysToExpiry - 1) * 24 * 60 * 60 * 1000)
        }
      });
    }

    logger.info("inventoryService expiry warning handled", { sku: inventory.sku, daysToExpiry: alert.daysToExpiry });
  }

  private async handleQAHold({ qaHold, inventory }: QAHoldPayload): Promise<void> {
    const analysis = await this.inventoryAgent.analyzeQATests(qaHold.tests);

    if (analysis.recommendation === "approve" && analysis.confidence > 95) {
      await this.autoApproveQA(qaHold, inventory, analysis);
      return;
    }

    const notificationDelegate = db.notification;
    if (notificationDelegate?.create) {
      await notificationDelegate.create({
        data: {
          userId: inventory.createdById ?? "system",
          type: "info",
          title: "QA Review Required",
          message: `Batch ${qaHold.batchNumber ?? "unknown"} requires QA approval`,
          data: {
            qaHoldId: qaHold.id,
            inventoryId: inventory.id,
            aiAnalysis: analysis
          }
        }
      });
    }

    logger.info("inventoryService QA hold processed", { batchNumber: qaHold.batchNumber });
  }

  private async createAutomaticPurchaseOrder(
    inventory: InventoryRecord,
    recommendation: Awaited<ReturnType<InventoryAgent["handleLowStock"]>>
  ) {
    logger.warn("inventoryService automatic PO not persisted (model unavailable)", {
      sku: inventory.sku,
      suggestedQty: recommendation.data.recommended_order_quantity
    });
    return null;
  }

  private async autoApproveQA(
    qaHold: QAHoldPayload["qaHold"],
    inventory: InventoryRecord,
    analysis: Awaited<ReturnType<InventoryAgent["analyzeQATests"]>>
  ): Promise<void> {
    await prisma.inventory.update({
      where: { id: qaHold.inventoryId },
      data: {
        qaState: "released",
        quantityOnHold: 0,
        quantityOnHand: inventory.raw.quantityOnHand + inventory.raw.quantityOnHold
      }
    });

    const decisionDelegate = db.decision;
    if (decisionDelegate?.create) {
      await decisionDelegate.create({
        data: {
          title: `Auto QA Approval: Batch ${qaHold.batchNumber ?? "unknown"}`,
          description: "Automatically approved based on AI analysis",
          type: "qa_release",
          status: "approved",
          priority: "medium",
          requesterId: "system",
          organizationId: inventory.scopeId,
          choice: "approve",
          reasoning: analysis.reasoning,
          decidedBy: "system",
          decidedAt: new Date(),
          aiConfidence: analysis.confidence
        }
      });
    }

    logger.info("inventoryService QA auto-approved", { batchNumber: qaHold.batchNumber });
  }

  async runScheduledInventoryCheck(scopeId: string): Promise<InventoryAlert[]> {
    const alerts = await this.monitorInventoryLevels(scopeId);

    const now = new Date();
    if (now.getHours() === 8) {
      await this.generateDailyInventoryReport(scopeId, alerts);
    }

    return alerts;
  }

  async evaluateInventoryRecord(inventoryId: string): Promise<InventoryAlert[]> {
    const record = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: { id: true, facilityId: true }
    });

    if (!record?.facilityId) {
      logger.warn("inventoryService evaluation skipped due to missing facility context", { inventoryId });
      return [];
    }

    return this.runScheduledInventoryCheck(record.facilityId);
  }

  private async generateDailyInventoryReport(scopeId: string, alerts: InventoryAlert[]) {
    const report = {
      date: new Date(),
      organizationId: scopeId,
      summary: {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter((alert) => alert.severity === "critical").length,
        lowStockItems: alerts.filter((alert) => alert.type === "LOW_STOCK").length,
        expiringItems: alerts.filter((alert) => alert.type === "EXPIRY_WARNING").length
      },
      alerts,
      recommendations: await this.inventoryAgent.generateDailyRecommendations(alerts)
    };

    const reportKey = `report:inventory:${scopeId}:${new Date().toISOString().split("T")[0]}`;
    await redis.setex(reportKey, REPORT_TTL_SECONDS, JSON.stringify(report));

    logger.info("inventoryService daily report generated", { scopeId });
    return report;
  }

  private toAgentSignal(inventory: InventoryRecord): InventorySignal {
    return {
      id: inventory.id,
      sku: inventory.sku,
      quantity: inventory.quantity,
      reorderPoint: inventory.reorderPoint,
      reorderQty: inventory.reorderQty,
      unitCost: inventory.unitCost,
      organizationId: inventory.scopeId,
      warehouseId: undefined,
      facilityId: inventory.facilityId,
      preferredSupplierId: inventory.preferredSupplierId,
      expiryDate: inventory.expiryDate
    };
  }

  private normalizeInventory(row: PrismaInventoryRow, scopeHint?: string): InventoryRecord {
    const quantity = row.quantityOnHand;
    const reorderPoint = Math.max(25, Math.round(quantity * 0.5) || 25);
    const reorderQty = Math.max(reorderPoint * 2, 50);
    const scopeId = scopeHint ?? row.facilityId ?? "global";

    return {
      raw: row,
      id: row.id,
      sku: row.sku,
      quantity,
      reorderPoint,
      reorderQty,
      unitCost: 10,
      facilityId: row.facilityId,
      scopeId,
      qaState: row.qaState,
      preferredSupplierId: undefined,
      expiryDate: undefined,
      createdById: undefined
    };
  }
}

export const inventoryService = new InventoryService();
