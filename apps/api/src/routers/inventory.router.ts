import { EventEmitter } from "node:events";
import { observable } from "@trpc/server/observable";
import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";
import type { Context } from "../context.js";

const stockEvents = new EventEmitter();

const receiveInventoryInput = z.object({
  facilityId: z.string(),
  sku: z.string(),
  quantity: z.number().positive(),
  uom: z.string(),
  lotNumber: z.string().optional(),
  supplierBatch: z.string().optional(),
  receivedAt: z.string().datetime().optional(),
  sourceDocument: z.string().optional(),
  qaHoldReason: z.string().default("F&B mandatory QA hold")
});

const qaApprovalInput = z.object({
  inventoryId: z.string(),
  approvedQuantity: z.number().nonnegative(),
  reasoning: z.string().min(5),
  decidedBy: z.string()
});

const transferInput = z.object({
  sku: z.string(),
  quantity: z.number().positive(),
  fromFacilityId: z.string(),
  toFacilityId: z.string(),
  requestedBy: z.string()
});

const adjustmentInput = z.object({
  inventoryId: z.string(),
  delta: z.number(),
  reasonCode: z.enum(["COUNT_VARIANCE", "QA_RELEASE", "WASTE", "THEFT", "SYSTEM"], {
    errorMap: () => ({ message: "Unsupported reason code" })
  }),
  notes: z.string().optional(),
  adjustedBy: z.string()
});

const lowStockInput = z.object({
  facilityId: z.string().optional(),
  reorderPoint: z.number().positive().default(50)
});

type StockEvent = {
  facilityId: string;
  sku: string;
  quantityOnHand: number;
  quantityOnHold: number;
  qaState: string;
  source: string;
  timestamp: string;
};

const publishStockEvent = (event: StockEvent) => {
  stockEvents.emit("stock", event);
};

type PrismaScope = Context["prisma"];

const ensureInventoryRecord = async (prisma: PrismaScope, facilityId: string, sku: string, uom: string) => {
  const existing = await prisma.inventory.findFirst({ where: { facilityId, sku } });
  if (existing) return existing;
  return prisma.inventory.create({
    data: {
      facilityId,
      sku,
      quantityOnHand: 0,
      quantityOnHold: 0,
      qaState: "pending_qa",
      uom
    }
  });
};

export const inventoryRouter = router({
  receiveInventory: publicProcedure.input(receiveInventoryInput).mutation(async ({ ctx, input }) => {
    const record = await ensureInventoryRecord(ctx.prisma, input.facilityId, input.sku, input.uom);

    const updated = await ctx.prisma.inventory.update({
      where: { id: record.id },
      data: {
        quantityOnHold: record.quantityOnHold + input.quantity,
        qaState: "pending_qa"
      }
    });

    publishStockEvent({
      facilityId: updated.facilityId,
      sku: updated.sku,
      quantityOnHand: updated.quantityOnHand,
      quantityOnHold: updated.quantityOnHold,
      qaState: updated.qaState,
      source: "receiveInventory",
      timestamp: new Date().toISOString()
    });

    return {
      ...updated,
      qaHoldReason: input.qaHoldReason,
      sourceDocument: input.sourceDocument
    };
  }),

  approveQA: publicProcedure.input(qaApprovalInput).mutation(async ({ ctx, input }) => {
    const record = await ctx.prisma.inventory.findUnique({ where: { id: input.inventoryId } });
    if (!record) {
      throw new Error("Inventory record not found");
    }
    if (input.approvedQuantity > record.quantityOnHold) {
      throw new Error("Approved quantity exceeds QA hold");
    }

    const updated = await ctx.prisma.inventory.update({
      where: { id: record.id },
      data: {
        quantityOnHold: record.quantityOnHold - input.approvedQuantity,
        quantityOnHand: record.quantityOnHand + input.approvedQuantity,
        qaState: record.quantityOnHold - input.approvedQuantity === 0 ? "released" : "pending_qa"
      }
    });

    publishStockEvent({
      facilityId: updated.facilityId,
      sku: updated.sku,
      quantityOnHand: updated.quantityOnHand,
      quantityOnHold: updated.quantityOnHold,
      qaState: updated.qaState,
      source: "approveQA",
      timestamp: new Date().toISOString()
    });

    return {
      record: updated,
      reasoningCaptured: input.reasoning,
      approvedBy: input.decidedBy
    };
  }),

  transferInventory: publicProcedure.input(transferInput).mutation(async ({ ctx, input }) => {
    if (input.fromFacilityId === input.toFacilityId) {
      throw new Error("Source and destination facilities must differ");
    }

    return ctx.prisma.$transaction(async (tx: PrismaScope) => {
      const source = await tx.inventory.findFirst({
        where: { facilityId: input.fromFacilityId, sku: input.sku }
      });
      if (!source || source.quantityOnHand < input.quantity) {
        throw new Error("Insufficient inventory at source facility");
      }

  const destination = await ensureInventoryRecord(tx, input.toFacilityId, input.sku, source.uom);

      const [updatedSource, updatedDestination] = await Promise.all([
        tx.inventory.update({
          where: { id: source.id },
          data: { quantityOnHand: source.quantityOnHand - input.quantity }
        }),
        tx.inventory.update({
          where: { id: destination.id },
          data: { quantityOnHand: destination.quantityOnHand + input.quantity }
        })
      ]);

      const timestamp = new Date().toISOString();
      publishStockEvent({
        facilityId: updatedSource.facilityId,
        sku: updatedSource.sku,
        quantityOnHand: updatedSource.quantityOnHand,
        quantityOnHold: updatedSource.quantityOnHold,
        qaState: updatedSource.qaState,
        source: "transferInventory",
        timestamp
      });
      publishStockEvent({
        facilityId: updatedDestination.facilityId,
        sku: updatedDestination.sku,
        quantityOnHand: updatedDestination.quantityOnHand,
        quantityOnHold: updatedDestination.quantityOnHold,
        qaState: updatedDestination.qaState,
        source: "transferInventory",
        timestamp
      });

      return {
        transferId: `${input.fromFacilityId}-${input.toFacilityId}-${timestamp}`,
        updatedSource,
        updatedDestination
      };
    });
  }),

  adjustInventory: publicProcedure.input(adjustmentInput).mutation(async ({ ctx, input }) => {
    const record = await ctx.prisma.inventory.findUnique({ where: { id: input.inventoryId } });
    if (!record) throw new Error("Inventory record not found");

    const updated = await ctx.prisma.inventory.update({
      where: { id: record.id },
      data: {
        quantityOnHand: record.quantityOnHand + input.delta,
        qaState: input.reasonCode === "QA_RELEASE" ? "released" : record.qaState
      }
    });

    publishStockEvent({
      facilityId: updated.facilityId,
      sku: updated.sku,
      quantityOnHand: updated.quantityOnHand,
      quantityOnHold: updated.quantityOnHold,
      qaState: updated.qaState,
      source: "adjustInventory",
      timestamp: new Date().toISOString()
    });

    return {
      record: updated,
      reasonCode: input.reasonCode,
      notes: input.notes,
      adjustedBy: input.adjustedBy
    };
  }),

  getExpiringProducts: publicProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + 30);

    const lots = await ctx.prisma.inventory.findMany({
      take: 200,
      orderBy: { updatedAt: "desc" }
    });
    type InventoryRecord = (typeof lots)[number];

    type ExpiringProduct = {
      inventoryId: string;
      facilityId: string;
      sku: string;
      projectedExpiry: string;
      quantity: number;
      atRisk: boolean;
    };

    const projected: ExpiringProduct[] = lots.map((lot: InventoryRecord): ExpiringProduct => ({
      inventoryId: lot.id,
      facilityId: lot.facilityId,
      sku: lot.sku,
      projectedExpiry: new Date(lot.updatedAt.getTime() + 1000 * 60 * 60 * 24 * 21).toISOString(),
      quantity: lot.quantityOnHand + lot.quantityOnHold,
      atRisk: lot.quantityOnHold > 0 || lot.qaState !== "released"
    }));

    return projected.filter((item) => new Date(item.projectedExpiry) <= horizon);
  }),

  getLowStockAlerts: publicProcedure.input(lowStockInput).query(async ({ ctx, input }) => {
    const where = input.facilityId ? { facilityId: input.facilityId } : undefined;
  const records = await ctx.prisma.inventory.findMany({ where, take: 200 });
  type RecordEntry = (typeof records)[number];

    type LowStockAlert = {
      facilityId: string;
      sku: string;
      quantityOnHand: number;
      reorderPoint: number;
      recommendedReplenishment: number;
    };

    const alerts: LowStockAlert[] = records
      .filter((record: RecordEntry) => record.quantityOnHand <= input.reorderPoint)
      .map((record: RecordEntry) => ({
        facilityId: record.facilityId,
        sku: record.sku,
        quantityOnHand: record.quantityOnHand,
        reorderPoint: input.reorderPoint,
        recommendedReplenishment: Math.max(input.reorderPoint * 1.5 - record.quantityOnHand, 0)
      }));

    return alerts;
  }),

  realTimeStockStatus: publicProcedure.subscription(() => {
    return observable<StockEvent>((emit) => {
      const listener = (event: StockEvent) => emit.next(event);
      stockEvents.on("stock", listener);
      return () => {
        stockEvents.off("stock", listener);
      };
    });
  })
});

export type InventoryRouter = typeof inventoryRouter;
export const inventoryStockEmitter = stockEvents;
