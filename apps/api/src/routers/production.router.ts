import { EventEmitter } from "node:events";
import { observable } from "@trpc/server/observable";
import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";
import type { Context } from "../context.js";

const productionEvents = new EventEmitter();

const bomComponent = z.object({
  sku: z.string(),
  quantity: z.number().positive(),
  uom: z.string()
});

const createOrderInput = z.object({
  bomCode: z.string(),
  plannedDate: z.string().datetime(),
  quantity: z.number().positive(),
  facilityId: z.string(),
  components: z.array(bomComponent).min(1)
});

const scanConsumptionInput = z.object({
  orderId: z.string(),
  facilityId: z.string(),
  ingredientSku: z.string(),
  quantity: z.number().positive(),
  uom: z.string(),
  operator: z.string()
});

const completeProductionInput = z.object({
  orderId: z.string(),
  facilityId: z.string(),
  goodUnits: z.number().nonnegative(),
  qaHoldReason: z.string().default("Post-production QA hold"),
  completedBy: z.string()
});

const scheduleInput = z.object({
  horizonDays: z.number().min(1).max(30).default(7)
});

const emitProductionEvent = (payload: unknown) => {
  productionEvents.emit("production", payload);
};

const ensureInventoryRecord = async (ctx: Context, facilityId: string, sku: string, uom: string) => {
  const existing = await ctx.prisma.inventory.findFirst({ where: { facilityId, sku } });
  if (existing) return existing;
  return ctx.prisma.inventory.create({
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

export const productionRouter = router({
  createProductionOrder: publicProcedure.input(createOrderInput).mutation(async ({ ctx, input }) => {
    const missingComponents = input.components.filter((component) => component.quantity <= 0);
    if (missingComponents.length > 0) {
      throw new Error("Bill of Materials contains invalid quantities");
    }

    const order = await ctx.prisma.productionOrder.create({
      data: {
        bomCode: input.bomCode,
        plannedDate: new Date(input.plannedDate),
        status: "planned"
      }
    });

    const validation = {
      state: "pass" as const,
      componentCount: input.components.length,
      criticalSkus: input.components.filter((component) => component.quantity > input.quantity * 0.5).map((component) => component.sku)
    };

    emitProductionEvent({ type: "orderCreated", orderId: order.id, facilityId: input.facilityId });

    return { order, validation };
  }),

  scanConsumption: publicProcedure.input(scanConsumptionInput).mutation(async ({ ctx, input }) => {
    const inventory = await ensureInventoryRecord(ctx, input.facilityId, input.ingredientSku, input.uom);
    if (inventory.quantityOnHand < input.quantity) {
      throw new Error("Insufficient inventory for consumption");
    }

    const updated = await ctx.prisma.inventory.update({
      where: { id: inventory.id },
      data: {
        quantityOnHand: inventory.quantityOnHand - input.quantity
      }
    });

    emitProductionEvent({
      type: "consumption",
      orderId: input.orderId,
      sku: input.ingredientSku,
      quantity: input.quantity,
      operator: input.operator,
      remaining: updated.quantityOnHand
    });

    return {
      status: "deducted" as const,
      remaining: updated.quantityOnHand
    };
  }),

  completeProduction: publicProcedure.input(completeProductionInput).mutation(async ({ ctx, input }) => {
    const order = await ctx.prisma.productionOrder.update({
      where: { id: input.orderId },
      data: {
        status: "completed",
        actualDate: new Date()
      }
    });

    const qaInventory = await ensureInventoryRecord(ctx, input.facilityId, `${order.bomCode}-FG`, "EA");
    const updatedInventory = await ctx.prisma.inventory.update({
      where: { id: qaInventory.id },
      data: {
        quantityOnHold: qaInventory.quantityOnHold + input.goodUnits,
        qaState: "pending_qa"
      }
    });

    emitProductionEvent({
      type: "orderCompleted",
      orderId: input.orderId,
      facilityId: input.facilityId,
      qaHold: input.qaHoldReason,
      goodUnits: input.goodUnits
    });

    return {
      order,
      qaInventory: updatedInventory,
      qaHoldReason: input.qaHoldReason,
      completedBy: input.completedBy
    };
  }),

  getProductionSchedule: publicProcedure.input(scheduleInput).query(async ({ ctx, input }) => {
    const horizonEnd = new Date();
    horizonEnd.setDate(horizonEnd.getDate() + input.horizonDays);
    const orders = await ctx.prisma.productionOrder.findMany({
      where: {
        plannedDate: {
          lte: horizonEnd
        }
      },
      orderBy: { plannedDate: "asc" }
    });
    type OrderEntry = (typeof orders)[number];

    const schedule = orders.map((order: OrderEntry) => ({
      orderId: order.id,
      bomCode: order.bomCode,
      status: order.status,
      plannedDate: order.plannedDate,
      capacityBucket: order.status === "completed" ? "actual" : order.plannedDate.getHours() < 12 ? "AM" : "PM"
    }));

    return schedule;
  }),

  productionStream: publicProcedure.subscription(() =>
    observable((emit) => {
      const handler = (payload: unknown) => emit.next(payload);
      productionEvents.on("production", handler);
      return () => productionEvents.off("production", handler);
    })
  )
});

export type ProductionRouter = typeof productionRouter;
