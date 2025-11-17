import { Prisma } from "@prisma/client";
import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";

const lineItem = z.object({
  sku: z.string(),
  quantity: z.number().positive(),
  uom: z.string(),
  unitCost: z.number().nonnegative()
});

const createPurchaseOrderInput = z.object({
  tenantId: z.string(),
  supplierId: z.string(),
  plantId: z.string().optional(),
  facilityId: z.string().optional(),
  currency: z.string().default("USD"),
  lines: z.array(lineItem).min(1),
  budgetLimit: z.number().positive(),
  requestedBy: z.string(),
  needByDate: z.string().datetime()
});

const autoReplenishmentInput = z.object({
  tenantId: z.string(),
  plantId: z.string().optional(),
  facilityId: z.string().optional(),
  horizonDays: z.number().min(1).max(30).default(7)
});

const supplierScorecardInput = z.object({
  tenantId: z.string(),
  supplierId: z.string(),
  lookbackDays: z.number().min(30).max(365).default(90)
});

const toNumber = (value: Prisma.Decimal | number) => Number(value ?? 0);

export const procurementRouter = router({
  createPurchaseOrder: publicProcedure.input(createPurchaseOrderInput).mutation(async ({ input, ctx }) => {
    const total = input.lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0);
    if (total > input.budgetLimit) {
      throw new Error(`Budget exceeded: ${total.toFixed(2)} > ${input.budgetLimit.toFixed(2)}`);
    }

    const plantId = input.plantId ?? input.facilityId;
    if (!plantId) {
      throw new Error("Plant or facility identifier required");
    }

    const [tenant, supplier, plant] = await Promise.all([
      ctx.prisma.tenant.findUnique({ where: { id: input.tenantId } }),
      ctx.prisma.supplier.findUnique({ where: { id: input.supplierId } }),
      ctx.prisma.plant.findUnique({ where: { id: plantId } })
    ]);

    if (!tenant) {
      throw new Error("Tenant not found");
    }
    if (!supplier || (supplier.tenantId && supplier.tenantId !== tenant.id)) {
      throw new Error("Supplier not found for tenant");
    }
    if (!plant || plant.tenantId !== tenant.id) {
      throw new Error("Plant not found for tenant");
    }

    const materialNumbers = Array.from(new Set(input.lines.map((line) => line.sku)));
    const materials = await ctx.prisma.material.findMany({
      where: {
        tenantId: tenant.id,
        materialNumber: { in: materialNumbers }
      }
    });

    const materialMap = new Map(materials.map((material) => [material.materialNumber, material]));
    const missing = materialNumbers.filter((sku) => !materialMap.has(sku));
    if (missing.length) {
      throw new Error(`Missing material master for SKUs: ${missing.join(", ")}`);
    }

    const documentNumber = `PO-${Date.now()}`;
    const skuByMaterialId = new Map(materials.map((material) => [material.id, material.materialNumber]));
    const purchaseOrder = await ctx.prisma.purchaseOrder.create({
      data: {
        tenantId: tenant.id,
        supplierId: supplier.id,
        plantId,
        documentNumber,
        currency: input.currency,
        expectedDate: new Date(input.needByDate),
        status: "OPEN",
        items: {
          create: input.lines.map((line, idx) => {
            const material = materialMap.get(line.sku)!;
            return {
              lineNumber: idx + 1,
              materialId: material.id,
              orderedQty: new Prisma.Decimal(line.quantity),
              receivedQty: new Prisma.Decimal(0),
              uom: line.uom,
              netPrice: new Prisma.Decimal(line.unitCost),
              currency: input.currency,
              status: "OPEN"
            };
          })
        }
      },
      include: {
        items: true
      }
    });

    await ctx.prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: input.requestedBy,
        action: "PO_CREATED",
        entity: "PurchaseOrder",
        entityId: purchaseOrder.id,
        details: {
          documentNumber,
          lineCount: purchaseOrder.items.length,
          currency: input.currency,
          total
        }
      }
    });

    return {
      id: purchaseOrder.id,
      documentNumber,
      total,
      currency: input.currency,
      status: purchaseOrder.status,
      requestedBy: input.requestedBy,
      needByDate: input.needByDate,
      lines: purchaseOrder.items.map((item) => ({
        lineNumber: item.lineNumber,
        sku: skuByMaterialId.get(item.materialId) ?? "",
        orderedQty: toNumber(item.orderedQty),
        receivedQty: toNumber(item.receivedQty),
        uom: item.uom,
        netPrice: toNumber(item.netPrice ?? 0)
      }))
    };
  }),

  autoReplenishment: publicProcedure.input(autoReplenishmentInput).query(async ({ input, ctx }) => {
    const tenantId = input.tenantId;
    const plantId = input.plantId ?? input.facilityId;
    const stocks = await ctx.prisma.materialStock.findMany({
      where: {
        tenantId,
        ...(plantId ? { plantId } : {})
      },
      include: {
        material: true,
        plant: true
      }
    });

    const shortages = stocks
      .filter((stock) => stock.reorderPoint.greaterThan(stock.availableQty))
      .map((stock) => ({
        tenantId,
        plantCode: stock.plant.code,
        sku: stock.material.materialNumber,
        description: stock.material.description,
        availableQty: toNumber(stock.availableQty),
        reorderPoint: toNumber(stock.reorderPoint),
        recommendedQty: Math.max(toNumber(stock.reorderPoint) * 1.5 - toNumber(stock.availableQty), 0)
      }));

    return {
      plantId,
      horizonDays: input.horizonDays,
      generatedAt: new Date().toISOString(),
      orders: shortages
    };
  }),

  supplierScorecard: publicProcedure.input(supplierScorecardInput).query(async ({ input, ctx }) => {
    const lookbackStart = new Date();
    lookbackStart.setDate(lookbackStart.getDate() - input.lookbackDays);

    const purchaseOrders = await ctx.prisma.purchaseOrder.findMany({
      where: {
        tenantId: input.tenantId,
        supplierId: input.supplierId,
        createdAt: {
          gte: lookbackStart
        }
      },
      include: {
        items: true
      }
    });

    const items = purchaseOrders.flatMap((order) => order.items);
    const totalOrdered = items.reduce((sum, item) => sum + toNumber(item.orderedQty), 0);
    const totalReceived = items.reduce((sum, item) => sum + toNumber(item.receivedQty), 0);
    const otif = totalOrdered === 0 ? 1 : Math.min(totalReceived / totalOrdered, 1);

    const leadTimes = purchaseOrders
      .filter((order) => order.expectedDate)
      .map((order) => (order.expectedDate!.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const averageLeadTimeDays = leadTimes.length ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length : null;

    const alerts = await ctx.prisma.inventoryAlert.count({
      where: {
        tenantId: input.tenantId,
        source: "supplier",
        createdAt: {
          gte: lookbackStart
        }
      }
    });

    return {
      supplierId: input.supplierId,
      lookbackDays: input.lookbackDays,
      metrics: {
        otif,
        qualityDefectsPpm: alerts * 100,
        averageLeadTimeDays,
        sustainabilityScore: Math.max(60, 90 - alerts * 2)
      },
      aiInsights: [
        otif < 0.9 ? "Consider safety stock adjustments to buffer supplier variability" : "Supplier reliability within threshold",
        alerts > 0 ? "Quality alerts detected — schedule supplier review" : "No quality alerts triggered in lookback window"
      ]
    };
  })
});

export type ProcurementRouter = typeof procurementRouter;
