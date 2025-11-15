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
  reference: z.string(),
  carrier: z.string(),
  coldChain: z.array(temperatureZone).min(1),
  stops: z.array(shipmentStop).min(1),
  pallets: z.number().positive(),
  createdBy: z.string()
});

const coldChainStatusInput = z.object({
  shipmentId: z.string(),
  probeId: z.string(),
  temperature: z.number(),
  humidity: z.number().min(0).max(100),
  recordedAt: z.string().datetime(),
  alertThreshold: z.number().default(8)
});

const documentRequestInput = z.object({
  shipmentId: z.string(),
  documents: z.array(z.enum(["PACKING_LIST", "BOL", "HEALTH_CERT"])).default(["PACKING_LIST", "BOL"])
});

const trackShipmentInput = z.object({
  shipmentId: z.string(),
  carrier: z.string(),
  reference: z.string().optional()
});

export const logisticsRouter = router({
  createShipment: publicProcedure.input(createShipmentInput).mutation(async ({ input }) => {
    const shipmentId = `SHP-${Date.now()}`;
    logisticsEvents.emit("logistics", { type: "shipment_created", shipmentId, carrier: input.carrier });

    return {
      shipmentId,
      status: "BOOKED" as const,
      coldChain: input.coldChain,
      eta: input.stops[input.stops.length - 1].arrivalWindow,
      createdBy: input.createdBy
    };
  }),

  updateColdChainStatus: publicProcedure.input(coldChainStatusInput).mutation(async ({ input }) => {
    const breach = input.temperature > input.alertThreshold;
    const payload = {
      shipmentId: input.shipmentId,
      probeId: input.probeId,
      temperature: input.temperature,
      humidity: input.humidity,
      recordedAt: input.recordedAt,
      breach
    };
    logisticsEvents.emit("logistics", { type: "cold_chain", ...payload });
    return payload;
  }),

  generateDocuments: publicProcedure.input(documentRequestInput).mutation(async ({ input }) => {
    const documents = input.documents.map((doc) => ({
      type: doc,
      content: Buffer.from(`Doc ${doc} for ${input.shipmentId}`).toString("base64"),
      filename: `${input.shipmentId}-${doc.toLowerCase()}.pdf`
    }));
    logisticsEvents.emit("logistics", { type: "documents", shipmentId: input.shipmentId });
    return documents;
  }),

  track3PLShipment: publicProcedure.input(trackShipmentInput).query(async ({ input }) => {
    const checkpoints = [
      { location: "Cold storage provider", status: "Picked Up", timestamp: new Date().toISOString() },
      { location: "Regional cross-dock", status: "In Transit", timestamp: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString() },
      { location: "Customer DC", status: "ETA", timestamp: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString() }
    ];
    return {
      shipmentId: input.shipmentId,
      carrier: input.carrier,
      reference: input.reference ?? input.shipmentId,
      checkpoints
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
