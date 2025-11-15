import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";

const lineItem = z.object({
  sku: z.string(),
  quantity: z.number().positive(),
  uom: z.string(),
  unitCost: z.number().nonnegative()
});

const createPurchaseOrderInput = z.object({
  supplierId: z.string(),
  facilityId: z.string(),
  currency: z.string().default("USD"),
  lines: z.array(lineItem).min(1),
  budgetLimit: z.number().positive(),
  requestedBy: z.string(),
  needByDate: z.string().datetime()
});

const autoReplenishmentInput = z.object({
  facilityId: z.string(),
  horizonDays: z.number().min(1).max(30).default(7)
});

const supplierScorecardInput = z.object({
  supplierId: z.string(),
  lookbackDays: z.number().min(30).max(365).default(90)
});

export const procurementRouter = router({
  createPurchaseOrder: publicProcedure.input(createPurchaseOrderInput).mutation(async ({ input }) => {
    const total = input.lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0);
    if (total > input.budgetLimit) {
      throw new Error(`Budget exceeded: ${total.toFixed(2)} > ${input.budgetLimit.toFixed(2)}`);
    }

    return {
      poNumber: `PO-${Date.now()}`,
      total,
      currency: input.currency,
      status: "APPROVAL_PENDING" as const,
      requestedBy: input.requestedBy,
      needByDate: input.needByDate,
      lines: input.lines
    };
  }),

  autoReplenishment: publicProcedure.input(autoReplenishmentInput).query(async ({ input }) => {
    const recommendations = [
      {
        supplierId: "SUPP-GREENS",
        sku: "LETTUCE-001",
        quantity: 120,
        rationale: "AI forecast indicates salad demand spike for wellness promotion"
      },
      {
        supplierId: "SUPP-DAIRY",
        sku: "MOZZ-002",
        quantity: 80,
        rationale: "Production plan for Neapolitan pizzas exceeds safety stock"
      }
    ];

    return {
      facilityId: input.facilityId,
      horizonDays: input.horizonDays,
      generatedAt: new Date().toISOString(),
      orders: recommendations
    };
  }),

  supplierScorecard: publicProcedure.input(supplierScorecardInput).query(async ({ input }) => {
    return {
      supplierId: input.supplierId,
      lookbackDays: input.lookbackDays,
      metrics: {
        otif: 0.96,
        qualityDefectsPpm: 220,
        averageLeadTimeDays: 4.2,
        sustainabilityScore: 78
      },
      aiInsights: [
        "Recommend dual-source strategy for single-ingredient spices",
        "Increase frozen berries order cadence to weekly to avoid weekend air freight"
      ]
    };
  })
});

export type ProcurementRouter = typeof procurementRouter;
