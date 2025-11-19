import { Router } from "express";
import { z } from "zod";
import { logisticsService, type ShipmentStatus } from "../services/logisticsService.js";

const router = Router();

const shipmentQuerySchema = z.object({
  tenantId: z.string().min(1),
});

const locationSchema = z.object({
  name: z.string(),
  address: z.string(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }),
  type: z.enum(["plant", "warehouse", "customer", "3pl"]),
});

const routeSchema = z.object({
  origin: locationSchema,
  destination: locationSchema,
  stops: z.array(locationSchema).default([]),
  distance: z.number().nonnegative(),
  duration: z.number().nonnegative(),
});

const vehicleSchema = z.object({
  type: z.string(),
  licensePlate: z.string(),
  temperature: z.number().optional(),
  capacity: z.number().nonnegative(),
});

const documentSchema = z.object({
  id: z.string().optional(),
  type: z.string().min(1),
  status: z.string().optional(),
  owner: z.string().optional(),
  updatedAt: z.string().optional(),
  storageUrl: z.string().optional(),
});

const eventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  location: z.string(),
  detail: z.string(),
  type: z.enum(["checkpoint", "delay", "milestone"]),
});

const sensorSchema = z.object({
  id: z.string(),
  type: z.enum(["temperature", "shock", "humidity", "geo"]),
  value: z.number(),
  unit: z.string(),
  status: z.enum(["ok", "warning", "critical"]),
  timestamp: z.string(),
});

const createShipmentSchema = z.object({
  tenantId: z.string().min(1),
  shipmentNumber: z.string().optional(),
  type: z.enum(["inbound", "outbound", "transfer"]).optional(),
  status: z.enum(["planned", "loading", "in-transit", "delivered", "exception"]).optional(),
  carrier: z
    .object({
      name: z.string(),
      id: z.string().optional().default("carrier-autonomous"),
      rating: z.number().optional().default(4.7),
    })
    .optional(),
  deliveries: z.array(z.string()).optional(),
  route: routeSchema.optional(),
  vehicle: vehicleSchema.optional(),
  scheduledDate: z.string().optional(),
  actualDate: z.string().nullable().optional(),
  tracking: z.string().optional(),
  documents: z.array(documentSchema).optional(),
  costs: z
    .object({
      freight: z.number().nonnegative(),
      fuel: z.number().nonnegative(),
      total: z.number().nonnegative(),
    })
    .optional(),
  events: z.array(eventSchema).optional(),
  sensors: z.array(sensorSchema).optional(),
  createdBy: z.string().optional(),
});

const updateStatusSchema = z.object({
  tenantId: z.string().min(1),
  status: z.enum(["planned", "loading", "in-transit", "delivered", "exception"]),
});

const documentsQuerySchema = z.object({
  tenantId: z.string().min(1),
  status: z.string().optional(),
});

router.get("/shipments", async (req, res, next) => {
  try {
    const { tenantId } = shipmentQuerySchema.parse(req.query);
    const shipments = await logisticsService.listShipments(tenantId);
    res.json({ shipments });
  } catch (error) {
    next(error);
  }
});

router.post("/shipments", async (req, res, next) => {
  try {
    const payload = createShipmentSchema.parse(req.body);
    const shipment = await logisticsService.createShipment(payload);
    res.status(201).json({ shipment });
  } catch (error) {
    next(error);
  }
});

router.patch("/shipments/:shipmentNumber/status", async (req, res, next) => {
  try {
    const params = updateStatusSchema.parse(req.body);
    const { shipmentNumber } = z.object({ shipmentNumber: z.string() }).parse(req.params);
    const shipment = await logisticsService.updateShipmentStatus({
      tenantId: params.tenantId,
      shipmentNumber,
      status: params.status as ShipmentStatus,
    });
    res.json({ shipment });
  } catch (error) {
    next(error);
  }
});

router.get("/documents", async (req, res, next) => {
  try {
    const { tenantId, status } = documentsQuerySchema.parse(req.query);
    const documents = await logisticsService.listDocuments(tenantId, status);
    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

export const logisticsRoutes = router;
