import { EventEmitter } from "node:events";
import type { Prisma } from "@prisma/client";
import type { Server as SocketIOServer } from "socket.io";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import { logger } from "../logger.js";
import { InventoryAgent, type InventorySignal } from "./agents/inventoryAgent.js";

const ALERT_TTL_SECONDS = 60 * 60; // 1 hour
const REPORT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

type InventoryRecord = Prisma.InventoryGetPayload<{ include: { warehouse: true } }> & Partial<{
  unitCost: number | null;
  preferredSupplierId: string | null;
  createdById: string | null;
  facilityId: string | null;
}>;

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
  procurement: {
    create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
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
  qaHold: Prisma.QAHoldGetPayload<{ include: { inventory: true } }>;
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

  async monitorInventoryLevels(organizationId: string): Promise<InventoryAlert[]> {
    const inventories = (await prisma.inventory.findMany({
      where: { organizationId, qaStatus: "approved" },
      include: { warehouse: true }
    })) as InventoryRecord[];

    const alerts: InventoryAlert[] = [];

    for (const inventory of inventories) {
      if (inventory.quantity <= inventory.reorderPoint) {
        const alert: LowStockAlert = {
          type: "LOW_STOCK",
          sku: inventory.sku,
          current: inventory.quantity,
          reorderPoint: inventory.reorderPoint,
          warehouseId: inventory.warehouseId,
          severity: inventory.quantity < inventory.reorderPoint * 0.5 ? "critical" : "warning"
        };
        alerts.push(alert);
        this.emit("lowStock", { inventory, alert });
      }

      if (inventory.expiryDate) {
        const daysToExpiry = Math.floor((inventory.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysToExpiry <= 30) {
          const unitCost = typeof inventory.unitCost === "number" ? inventory.unitCost : 10;
          const alert: ExpiryAlert = {
            type: "EXPIRY_WARNING",
            sku: inventory.sku,
            daysToExpiry,
            quantity: inventory.quantity,
            value: inventory.quantity * unitCost,
            severity: daysToExpiry < 7 ? "critical" : "warning"
          };
          alerts.push(alert);
          this.emit("expiryWarning", { inventory, alert });
        }
      }
    }

    if (alerts.length) {
      await redis.setex(`alerts:inventory:${organizationId}`, ALERT_TTL_SECONDS, JSON.stringify(alerts));
      this.realtimeServer?.to(`org:${organizationId}`).emit("inventory:alerts", alerts);
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
            recommendation
          }
        }
      });
    } else {
      logger.warn("inventoryService notification delegate unavailable; skipping persistence");
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
          organizationId: inventory.organizationId,
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
    } else {
      logger.warn("inventoryService decision delegate unavailable; skipping expiry decision persistence");
    }

    logger.info("inventoryService expiry warning handled", { sku: inventory.sku, daysToExpiry: alert.daysToExpiry });
  }

  private async handleQAHold({ qaHold, inventory }: QAHoldPayload): Promise<void> {
    const analysis = await this.inventoryAgent.analyzeQATests(qaHold.tests);

    await prisma.qAHold.update({
      where: { id: qaHold.id },
      data: {
        aiRecommendation: analysis.recommendation,
        confidence: analysis.confidence
      }
    });

    if (analysis.recommendation === "approve" && analysis.confidence > 95) {
      await this.autoApproveQA(qaHold, analysis);
      return;
    }

    const notificationDelegate = db.notification;
    if (notificationDelegate?.create) {
      await notificationDelegate.create({
        data: {
          userId: inventory.createdById ?? "system",
          type: "info",
          title: "QA Review Required",
          message: `Batch ${qaHold.batchNumber} requires QA approval`,
          data: {
            qaHoldId: qaHold.id,
            inventoryId: inventory.id,
            aiAnalysis: analysis
          }
        }
      });
    } else {
      logger.warn("inventoryService notification delegate unavailable for QA hold alert");
    }

    logger.info("inventoryService QA hold processed", { batchNumber: qaHold.batchNumber });
  }

  private async createAutomaticPurchaseOrder(
    inventory: InventoryRecord,
    recommendation: Awaited<ReturnType<InventoryAgent["handleLowStock"]>>
  ) {
    const procurementDelegate = db.procurement;
    if (!procurementDelegate?.create) {
      logger.warn("inventoryService procurement delegate unavailable; skipping auto PO");
      return null;
    }

    const unitCost = typeof inventory.unitCost === "number" ? inventory.unitCost : 10;
    const quantity = recommendation.data.recommended_order_quantity;

    const po = await procurementDelegate.create({
      data: {
        poNumber: `PO-AUTO-${Date.now()}`,
        supplierId: inventory.preferredSupplierId ?? "default-supplier",
        status: "draft",
        orderDate: new Date(),
        expectedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        items: [
          {
            sku: inventory.sku,
            quantity,
            unitPrice: unitCost
          }
        ],
        totalAmount: quantity * unitCost,
        organizationId: inventory.organizationId,
        currency: "USD"
      }
    });

    logger.info("inventoryService automatic PO created", { poNumber: (po as Record<string, unknown>).poNumber ?? "unknown", sku: inventory.sku });
    return po;
  }

  private async autoApproveQA(
    qaHold: Prisma.QAHoldGetPayload<{ include: { inventory: true } }> ,
    analysis: Awaited<ReturnType<InventoryAgent["analyzeQATests"]>>
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const holdDelegate = (tx as typeof prisma).qAHold;
      if (!holdDelegate?.update) {
        logger.warn("inventoryService transaction missing qAHold delegate; aborting auto approval");
        return;
      }

      await holdDelegate.update({
        where: { id: qaHold.id },
        data: {
          status: "approved",
          decision: "Auto-approved by AI with high confidence",
          decidedBy: "system",
          decidedAt: new Date()
        }
      });

      await tx.inventory.update({
        where: { id: qaHold.inventoryId },
        data: {
          qaStatus: "approved",
          qaHoldReason: null
        }
      });

      const decisionDelegate = (tx as typeof db).decision;
      if (decisionDelegate?.create) {
        await decisionDelegate.create({
          data: {
            title: `Auto QA Approval: Batch ${qaHold.batchNumber}`,
            description: "Automatically approved based on AI analysis",
            type: "qa_release",
            status: "approved",
            priority: "medium",
            requesterId: "system",
            organizationId: qaHold.inventory.organizationId,
            choice: "approve",
            reasoning: analysis.reasoning,
            decidedBy: "system",
            decidedAt: new Date(),
            aiConfidence: analysis.confidence
          }
        });
      } else {
        logger.warn("inventoryService decision delegate unavailable in transaction; skipping audit record");
      }
    });

    logger.info("inventoryService QA auto-approved", { batchNumber: qaHold.batchNumber });
  }

  async runScheduledInventoryCheck(organizationId: string): Promise<InventoryAlert[]> {
    logger.info("inventoryService scheduled inventory check", { organizationId });
    const alerts = await this.monitorInventoryLevels(organizationId);

    const now = new Date();
    if (now.getHours() === 8) {
      await this.generateDailyInventoryReport(organizationId, alerts);
    }

    return alerts;
  }

  async evaluateInventoryRecord(inventoryId: string): Promise<InventoryAlert[]> {
    const record = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: { id: true, organizationId: true }
    });

    if (!record?.organizationId) {
      logger.warn("inventoryService evaluation skipped due to missing organization context", { inventoryId });
      return [];
    }

    return this.runScheduledInventoryCheck(record.organizationId);
  }

  private async generateDailyInventoryReport(organizationId: string, alerts: InventoryAlert[]) {
    const report = {
      date: new Date(),
      organizationId,
      summary: {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter((alert) => alert.severity === "critical").length,
        lowStockItems: alerts.filter((alert) => alert.type === "LOW_STOCK").length,
        expiringItems: alerts.filter((alert) => alert.type === "EXPIRY_WARNING").length
      },
      alerts,
      recommendations: await this.inventoryAgent.generateDailyRecommendations(alerts)
    };

    const reportKey = `report:inventory:${organizationId}:${new Date().toISOString().split("T")[0]}`;
    await redis.setex(reportKey, REPORT_TTL_SECONDS, JSON.stringify(report));

    logger.info("inventoryService daily report generated", { organizationId });
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
      organizationId: inventory.organizationId,
      warehouseId: inventory.warehouseId,
      facilityId: inventory.facilityId,
      preferredSupplierId: inventory.preferredSupplierId,
      expiryDate: inventory.expiryDate
    };
  }
}

export const inventoryService = new InventoryService();
