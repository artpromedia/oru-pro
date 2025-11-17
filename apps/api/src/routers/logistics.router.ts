import { createHash, randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { observable } from "@trpc/server/observable";
import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";

const logisticsEvents = new EventEmitter();

const shipmentStop = z.object({
  facilityId: z.string(),
  address: z.string(),
  arrivalWindow: z.string().datetime()
});

const temperatureZone = z.object({
  label: z.enum(["ambient", "chilled", "frozen"]),
  minCelsius: z.number(),
  maxCelsius: z.number()
});

const createShipmentInput = z.object({
  tenantId: z.string(),
  reference: z.string(),
  carrier: z.string(),
  coldChain: z.array(temperatureZone).min(1),
  stops: z.array(shipmentStop).min(1),
  pallets: z.number().positive(),
  createdBy: z.string()
});

const coldChainStatusInput = z.object({
  tenantId: z.string(),
  shipmentId: z.string(),
  probeId: z.string(),
  temperature: z.number(),
  humidity: z.number().min(0).max(100),
  recordedAt: z.string().datetime(),
  alertThreshold: z.number().default(8)
});

const documentRequestInput = z.object({
  tenantId: z.string(),
  shipmentId: z.string(),
  requestedBy: z.string().default("system"),
  documents: z.array(z.enum(["PACKING_LIST", "BOL", "HEALTH_CERT"])).default(["PACKING_LIST", "BOL"])
});

const trackShipmentInput = z.object({
  tenantId: z.string(),
  shipmentId: z.string(),
  carrier: z.string(),
  reference: z.string().optional()
});

type ShipmentMetadata = {
  carrier?: string;
  coldChain?: z.infer<typeof temperatureZone>[];
  stops?: z.infer<typeof shipmentStop>[];
  pallets?: number;
  createdBy?: string;
  telemetry?: Array<{
    probeId: string;
    temperature: number;
    humidity: number;
    recordedAt: string;
    breach: boolean;
  }>;
};

const withTelemetry = (metadata: unknown): ShipmentMetadata => {
  const meta = (typeof metadata === "object" && metadata ? metadata : {}) as ShipmentMetadata;
  if (!Array.isArray(meta.telemetry)) {
    meta.telemetry = [];
  }
  return meta;
};

export const logisticsRouter = router({
  createShipment: publicProcedure.input(createShipmentInput).mutation(async ({ input, ctx }) => {
    const shipmentId = input.reference || `SHP-${Date.now()}`;
    const handlingUnit = await ctx.prisma.handlingUnit.create({
      data: {
        tenantId: input.tenantId,
        huNumber: shipmentId,
        status: "IN_TRANSIT",
        metadata: {
          carrier: input.carrier,
          coldChain: input.coldChain,
          stops: input.stops,
          pallets: input.pallets,
          createdBy: input.createdBy
        }
      }
    });

    logisticsEvents.emit("logistics", { type: "shipment_created", shipmentId, carrier: input.carrier });

    return {
      shipmentId,
      status: handlingUnit.status,
      coldChain: input.coldChain,
      eta: input.stops[input.stops.length - 1].arrivalWindow,
      createdBy: input.createdBy
    };
  }),

  updateColdChainStatus: publicProcedure.input(coldChainStatusInput).mutation(async ({ input, ctx }) => {
    const handlingUnit = await ctx.prisma.handlingUnit.findFirst({
      where: { tenantId: input.tenantId, huNumber: input.shipmentId }
    });
    if (!handlingUnit) {
      throw new Error("Shipment not found");
    }

    const breach = input.temperature > input.alertThreshold;
    const payload = {
      shipmentId: input.shipmentId,
      probeId: input.probeId,
      temperature: input.temperature,
      humidity: input.humidity,
      recordedAt: input.recordedAt,
      breach
    };

    const metadata = withTelemetry(handlingUnit.metadata);
    metadata.telemetry = [...(metadata.telemetry ?? []), payload];
    await ctx.prisma.handlingUnit.update({
      where: { id: handlingUnit.id },
      data: { metadata }
    });

    if (breach) {
      await ctx.prisma.inventoryAlert.create({
        data: {
          tenantId: input.tenantId,
          alertType: "cold_chain",
          severity: "high",
          message: `Temperature ${input.temperature}°C detected by probe ${input.probeId}`,
          source: "logistics"
        }
      });
    }

    logisticsEvents.emit("logistics", { type: "cold_chain", ...payload });
    return payload;
  }),

  generateDocuments: publicProcedure.input(documentRequestInput).mutation(async ({ input, ctx }) => {
    const docs = await ctx.prisma.$transaction(
      input.documents.map((doc) => {
        const content = Buffer.from(`Doc ${doc} for ${input.shipmentId}`);
        const hash = createHash("sha256").update(content).digest("hex");
        return ctx.prisma.document.create({
          data: {
            id: randomUUID(),
            tenantId: input.tenantId,
            name: `${doc} for ${input.shipmentId}`,
            type: doc,
            size: content.length,
            hash,
            storageUrl: `memory://${input.shipmentId}/${doc.toLowerCase()}`,
            uploadedBy: input.requestedBy,
            status: "generated"
          }
        });
      })
    );

    logisticsEvents.emit("logistics", { type: "documents", shipmentId: input.shipmentId });

    return docs.map((doc) => ({
      id: doc.id,
      type: doc.type,
      storageUrl: doc.storageUrl,
      generatedAt: doc.createdAt
    }));
  }),

  track3PLShipment: publicProcedure.input(trackShipmentInput).query(async ({ input, ctx }) => {
    const handlingUnit = await ctx.prisma.handlingUnit.findFirst({
      where: { tenantId: input.tenantId, huNumber: input.shipmentId }
    });
    if (!handlingUnit) {
      throw new Error("Shipment not found");
    }

    const metadata = withTelemetry(handlingUnit.metadata);
    const stops = metadata.stops ?? [];
    const checkpoints = stops.length
      ? stops.map((stop, idx) => ({
          location: stop.address,
          status: idx === 0 ? "Picked Up" : idx === stops.length - 1 ? "ETA" : "In Transit",
          timestamp: stop.arrivalWindow
        }))
      : [];

    return {
      shipmentId: input.shipmentId,
      carrier: metadata.carrier ?? input.carrier,
      reference: input.reference ?? input.shipmentId,
      checkpoints,
      telemetry: metadata.telemetry ?? []
    };
  }),

  logisticsStream: publicProcedure.subscription(() =>
    observable((emit) => {
      const handler = (payload: unknown) => emit.next(payload);
      logisticsEvents.on("logistics", handler);
      return () => logisticsEvents.off("logistics", handler);
    })
  )
});

export type LogisticsRouter = typeof logisticsRouter;
