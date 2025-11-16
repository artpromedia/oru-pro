import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "@oru/database";
import { z } from "zod";
import { Redis } from "ioredis";
import { inventoryQueue } from "../jobs/queues.js";
import { env } from "../env.js";
import { aiAgent } from "../lib/ai/index.js";
import { emitRealtimeEvent } from "../websocket/server.js";

type PlantAggregate = {
  plantCode: string;
  plantName: string;
  available: number;
  quality: number;
  blocked: number;
};

type AggregateAccumulator = {
  total: { available: number; quality: number; blocked: number };
  plants: Record<string, PlantAggregate>;
};

const router = Router();
const cache = new Redis(env.REDIS_URL);

const mb52QuerySchema = z.object({
  tenantId: z.string(),
  plantCode: z.string().optional(),
  materialNumber: z.string().optional(),
  includeBatches: z.coerce.boolean().optional().default(true)
});

const migoSchema = z.object({
  tenantId: z.string(),
  movementType: z.enum(["101", "103", "261", "311"] as const),
  materialNumber: z.string(),
  quantity: z.number().positive(),
  uom: z.string().min(1),
  plantCode: z.string(),
  storageLocationCode: z.string().optional(),
  batchNumber: z.string().optional(),
  targetPlantCode: z.string().optional(),
  targetStorageLocationCode: z.string().optional(),
  referenceDocument: z.string().optional(),
  reasonCode: z.string().optional(),
  qualityGate: z.enum(["QA_HOLD", "RELEASE", "BLOCK"]).optional(),
  requestedBy: z.string().min(2)
});

const md04QuerySchema = z.object({
  tenantId: z.string(),
  materialNumber: z.string(),
  plantCode: z.string().optional()
});

type MovementContext = {
  tenantId: string;
  plantId: string;
  storageLocationId?: string | null;
  materialId: string;
  batchId?: string | null;
  uom: string;
};

const toNumber = (value: Prisma.Decimal | number) => Number(value ?? 0);

const ensureMaterialStock = async (ctx: MovementContext, tx: Prisma.TransactionClient) => {
  const existing = await tx.materialStock.findFirst({
    where: {
      tenantId: ctx.tenantId,
      plantId: ctx.plantId,
      storageLocationId: ctx.storageLocationId ?? null,
      materialId: ctx.materialId,
      batchId: ctx.batchId ?? null
    }
  });
  if (existing) return existing;
  return tx.materialStock.create({
    data: {
      tenantId: ctx.tenantId,
      plantId: ctx.plantId,
      materialId: ctx.materialId,
      storageLocationId: ctx.storageLocationId ?? null,
      batchId: ctx.batchId ?? null,
      uom: ctx.uom,
      availableQty: 0,
      qualityQty: 0,
      blockedQty: 0,
      safetyStock: 0,
      reorderPoint: 0,
      status: "released"
    }
  });
};

const redisFlushTenant = async (tenantId: string) => {
  const keys = await cache.keys(`inventory:mb52:${tenantId}:*`);
  if (keys.length) {
    await cache.del(...keys);
  }
};

router.get("/mb52", async (req, res) => {
  const query = mb52QuerySchema.parse(req.query);
  const cacheKey = `inventory:mb52:${query.tenantId}:${query.plantCode ?? "all"}:${query.materialNumber ?? "all"}:${query.includeBatches}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const plant = query.plantCode
    ? await prisma.plant.findFirst({ where: { tenantId: query.tenantId, code: query.plantCode } })
    : null;
  if (query.plantCode && !plant) {
    return res.status(404).json({ message: "Plant not found" });
  }

  const material = query.materialNumber
    ? await prisma.material.findFirst({ where: { tenantId: query.tenantId, materialNumber: query.materialNumber } })
    : null;
  if (query.materialNumber && !material) {
    return res.status(404).json({ message: "Material not found" });
  }

  const stocks = await prisma.materialStock.findMany({
    where: {
      tenantId: query.tenantId,
      ...(plant ? { plantId: plant.id } : {}),
      ...(material ? { materialId: material.id } : {})
    },
    include: {
      material: true,
      plant: true,
      storageLocation: true,
      batch: query.includeBatches
    },
    orderBy: { updatedAt: "desc" }
  });

    const alerts = material
    ? await prisma.inventoryAlert.findMany({
        where: { tenantId: query.tenantId, materialId: material.id, acknowledged: false },
        take: 5,
        orderBy: { createdAt: "desc" }
      })
    : [];

  const payloadData = stocks.map((stock) => ({
    tenantId: stock.tenantId,
    materialNumber: stock.material.materialNumber,
    description: stock.material.description,
    plantCode: stock.plant.code,
    plantName: stock.plant.name,
    storageLocation: stock.storageLocation?.code ?? null,
    batchNumber: stock.batch?.batchNumber ?? null,
    availableQty: toNumber(stock.availableQty),
    qualityQty: toNumber(stock.qualityQty),
    blockedQty: toNumber(stock.blockedQty),
    reorderPoint: toNumber(stock.reorderPoint),
    safetyStock: toNumber(stock.safetyStock),
    status: stock.status,
    agingBucket: stock.agingBucket,
    uom: stock.uom,
    updatedAt: stock.updatedAt
  }));

  const aggregates = payloadData.reduce<AggregateAccumulator>(
    (acc, entry) => {
      acc.total.available += entry.availableQty;
      acc.total.quality += entry.qualityQty;
      acc.total.blocked += entry.blockedQty;
      const plantTotals = acc.plants[entry.plantCode] ?? {
        plantCode: entry.plantCode,
        plantName: entry.plantName,
        available: 0,
        quality: 0,
        blocked: 0
      };
      plantTotals.available += entry.availableQty;
      plantTotals.quality += entry.qualityQty;
      plantTotals.blocked += entry.blockedQty;
      acc.plants[entry.plantCode] = plantTotals;
      return acc;
    },
    {
      total: { available: 0, quality: 0, blocked: 0 },
      plants: {}
    }
  );

  const spotlight = payloadData[0];
  const ai = spotlight
    ? await aiAgent.generateInsight({
        tenantId: query.tenantId,
        materialNumber: spotlight.materialNumber,
        plantCode: spotlight.plantCode,
        metrics: {
          available: spotlight.availableQty,
          quality: spotlight.qualityQty,
          blocked: spotlight.blockedQty,
          safetyStock: spotlight.safetyStock,
          reorderPoint: spotlight.reorderPoint
        },
        alerts: alerts.map((alert) => alert.message)
      })
    : undefined;

  const responsePayload = {
    data: payloadData,
    aggregates: {
      total: aggregates.total,
      plants: Object.values(aggregates.plants)
    },
    ai,
    alerts
  };

  await cache.set(cacheKey, JSON.stringify(responsePayload), "EX", 30);

  await prisma.auditLog.create({
    data: {
      tenantId: query.tenantId,
      userId: (req.user?.id as string | undefined) ?? "system",
      action: "MB52_VIEW",
      entity: "MaterialStock",
      entityId: material?.id ?? "*",
      details: {
        plantCode: query.plantCode,
        resultSize: payloadData.length
      }
    }
  });

  await inventoryQueue.add(
    "mb52-run",
    {
      tenantId: query.tenantId,
      plantCode: query.plantCode,
      materialNumber: query.materialNumber,
      executedAt: new Date().toISOString()
    },
    { removeOnComplete: true, removeOnFail: true }
  );

  return res.json(responsePayload);
});

router.post("/migo", async (req, res) => {
  const body = migoSchema.parse(req.body);

  const tenant = await prisma.tenant.findUnique({ where: { id: body.tenantId } });
  if (!tenant) {
    return res.status(404).json({ message: "Tenant not found" });
  }

  const material = await prisma.material.findFirst({ where: { tenantId: body.tenantId, materialNumber: body.materialNumber } });
  if (!material) {
    return res.status(404).json({ message: "Material not found" });
  }

  const sourcePlant = await prisma.plant.findFirst({ where: { tenantId: body.tenantId, code: body.plantCode } });
  if (!sourcePlant) {
    return res.status(404).json({ message: "Plant not found" });
  }

  const storageLocation = body.storageLocationCode
    ? await prisma.storageLocation.findFirst({ where: { plantId: sourcePlant.id, code: body.storageLocationCode } })
    : null;

  if (body.storageLocationCode && !storageLocation) {
    return res.status(404).json({ message: "Storage location not found" });
  }

  const destinationPlant = body.targetPlantCode
    ? await prisma.plant.findFirst({ where: { tenantId: body.tenantId, code: body.targetPlantCode } })
    : null;

  const destinationStorage = body.targetStorageLocationCode && destinationPlant
    ? await prisma.storageLocation.findFirst({ where: { plantId: destinationPlant.id, code: body.targetStorageLocationCode } })
    : null;

  const movementResult = await prisma.$transaction(async (tx) => {
    const batch = body.batchNumber
      ? await tx.materialBatch.upsert({
          where: {
            materialId_batchNumber: {
              materialId: material.id,
              batchNumber: body.batchNumber
            }
          },
          create: {
            materialId: material.id,
            plantId: sourcePlant.id,
            batchNumber: body.batchNumber
          },
          update: {}
        })
      : null;

    const sourceStock = await ensureMaterialStock(
      {
        tenantId: body.tenantId,
        plantId: sourcePlant.id,
        storageLocationId: storageLocation?.id ?? null,
        materialId: material.id,
        batchId: batch?.id ?? null,
        uom: body.uom
      },
      tx
    );

    const quantity = new Prisma.Decimal(body.quantity);
    const now = new Date();

    const applyDelta = async (stockId: string, delta: Prisma.Decimal, field: "availableQty" | "qualityQty") => {
      const stock = await tx.materialStock.update({
        where: { id: stockId },
        data: {
          [field]: {
            increment: delta
          },
          lastMovementAt: now
        }
      });
      if (field === "availableQty" && stock.availableQty.lessThan(0)) {
        throw new Error("Negative available quantity not allowed");
      }
      return stock;
    };

    const decrementAvailable = async (stock: typeof sourceStock) => {
      if (stock.availableQty.lessThan(quantity)) {
        throw new Error("Insufficient available stock for movement");
      }
      return tx.materialStock.update({
        where: { id: stock.id },
        data: {
          availableQty: {
            decrement: quantity
          },
          lastMovementAt: now
        }
      });
    };

    let updatedSource = sourceStock;
    let updatedDestination = null;

    switch (body.movementType) {
      case "101":
        updatedSource = await applyDelta(sourceStock.id, quantity, "availableQty");
        break;
      case "103":
        updatedSource = await applyDelta(sourceStock.id, quantity, "qualityQty");
        break;
      case "261":
        updatedSource = await decrementAvailable(sourceStock);
        break;
      case "311":
        if (!destinationPlant) {
          throw new Error("Target plant required for 311 movement");
        }
        const destinationStock = await ensureMaterialStock(
          {
            tenantId: body.tenantId,
            plantId: destinationPlant.id,
            storageLocationId: destinationStorage?.id ?? null,
            materialId: material.id,
            batchId: batch?.id ?? null,
            uom: body.uom
          },
          tx
        );
        updatedSource = await decrementAvailable(sourceStock);
        updatedDestination = await applyDelta(destinationStock.id, quantity, "availableQty");
        break;
      default:
        throw new Error("Unsupported movement type");
    }

    if (body.qualityGate === "QA_HOLD") {
      await tx.qualityLot.create({
        data: {
          tenantId: body.tenantId,
          plantId: sourcePlant.id,
          materialId: material.id,
          batchId: batch?.id,
          status: "PENDING",
          holdReason: body.reasonCode,
          inspectionType: "RECEIPT"
        }
      });
    }

    const documentNumber = `M${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const document = await tx.materialDocument.create({
      data: {
        tenantId: body.tenantId,
        documentNumber,
        movementType: body.movementType,
        materialId: material.id,
        batchId: batch?.id,
        plantId: sourcePlant.id,
        storageLocationId: storageLocation?.id,
        quantity,
        uom: body.uom,
        reference: body.referenceDocument,
        reasonCode: body.reasonCode,
        source: "migo",
        postedBy: body.requestedBy
      }
    });

    return { document, updatedSource, updatedDestination };
  });

  await redisFlushTenant(body.tenantId);

  await prisma.auditLog.create({
    data: {
      tenantId: body.tenantId,
      userId: body.requestedBy,
      action: "MIGO_MOVEMENT",
      entity: "MaterialDocument",
      entityId: movementResult.document.id,
      details: {
        movementType: body.movementType,
        quantity: body.quantity,
        plantCode: body.plantCode,
        referenceDocument: body.referenceDocument
      }
    }
  });

  await inventoryQueue.add(
    "goods-movement",
    {
      tenantId: body.tenantId,
      movementType: body.movementType,
      materialNumber: body.materialNumber,
      quantity: body.quantity,
      requestedBy: body.requestedBy
    },
    { removeOnComplete: true, removeOnFail: true }
  );

  emitRealtimeEvent("inventory", {
    type: "goodsMovement",
    tenantId: body.tenantId,
    movementType: body.movementType,
    materialNumber: body.materialNumber,
    quantity: body.quantity,
    plantCode: body.plantCode,
    timestamp: new Date().toISOString()
  });

  await aiAgent.recordMemories([
    {
      id: movementResult.document.id,
      tenantId: body.tenantId,
      materialNumber: body.materialNumber,
      plantCode: body.plantCode,
      content: `Movement ${body.movementType} qty ${body.quantity} ${body.uom} ${body.materialNumber} reference ${
        body.referenceDocument ?? "n/a"
      }`
    }
  ]);

  return res.status(201).json({
    document: movementResult.document,
    source: movementResult.updatedSource,
    destination: movementResult.updatedDestination
  });
});

router.get("/md04", async (req, res) => {
  const query = md04QuerySchema.parse(req.query);
  const plant = query.plantCode
    ? await prisma.plant.findFirst({ where: { tenantId: query.tenantId, code: query.plantCode } })
    : null;
  if (query.plantCode && !plant) {
    return res.status(404).json({ message: "Plant not found" });
  }

  const material = await prisma.material.findFirst({ where: { tenantId: query.tenantId, materialNumber: query.materialNumber } });
  if (!material) {
    return res.status(404).json({ message: "Material not found" });
  }

  const currentStock = await prisma.materialStock.findMany({
    where: {
      tenantId: query.tenantId,
      materialId: material.id,
      ...(plant ? { plantId: plant.id } : {})
    }
  });

  const purchaseItems = await prisma.purchaseOrderItem.findMany({
    where: {
      materialId: material.id,
      status: { in: ["OPEN", "PARTIAL"] }
    },
    include: {
      purchaseOrder: true
    },
    orderBy: { deliveryDate: "asc" }
  });

  const qualityLots = await prisma.qualityLot.findMany({
    where: {
      materialId: material.id,
      status: { in: ["PENDING", "HOLD"] }
    },
    orderBy: { createdAt: "desc" }
  });

  const onHand = currentStock.reduce(
    (acc, entry) => {
      acc.available += toNumber(entry.availableQty);
      acc.quality += toNumber(entry.qualityQty);
      acc.blocked += toNumber(entry.blockedQty);
      return acc;
    },
    { available: 0, quality: 0, blocked: 0 }
  );

  const supply = purchaseItems.map((item) => ({
    documentNumber: item.purchaseOrder.documentNumber,
    line: item.lineNumber,
    supplier: item.purchaseOrder.supplierId,
    quantity: toNumber(item.orderedQty) - toNumber(item.receivedQty),
    uom: item.uom,
    expectedDate: item.deliveryDate,
    status: item.status
  }));

  const demandSignals = qualityLots.map((lot) => ({
    reference: lot.id,
    type: "QA_HOLD",
    quantity: toNumber(lot.releasedQty) + toNumber(lot.rejectedQty),
    createdAt: lot.createdAt,
    status: lot.status
  }));

  const history = currentStock
    .sort((a, b) => (a.updatedAt > b.updatedAt ? 1 : -1))
    .slice(-8)
    .map((entry) => toNumber(entry.availableQty));

  const ai = await aiAgent.generateInsight({
    tenantId: query.tenantId,
    materialNumber: material.materialNumber,
    plantCode: plant?.code,
    metrics: {
      available: onHand.available,
      quality: onHand.quality,
      blocked: onHand.blocked,
      safetyStock: Number(currentStock[0]?.safetyStock ?? 0),
      reorderPoint: Number(currentStock[0]?.reorderPoint ?? 0)
    },
    alerts: demandSignals.map((signal) => `${signal.type} ${signal.quantity}`),
    history
  });

  const responsePayload = {
    header: {
      materialNumber: material.materialNumber,
      description: material.description,
      plantCode: plant?.code ?? "all",
      baseUnit: material.baseUnit
    },
    snapshot: onHand,
    supply,
    demand: demandSignals,
    ai
  };

  await prisma.auditLog.create({
    data: {
      tenantId: query.tenantId,
      userId: (req.user?.id as string | undefined) ?? "system",
      action: "MD04_VIEW",
      entity: "Material",
      entityId: material.id,
      details: {
        plantCode: query.plantCode,
        supplyLines: supply.length,
        demandLines: demandSignals.length
      }
    }
  });

  return res.json(responsePayload);
});

export const inventoryRoutes = router;
