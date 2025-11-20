import { randomUUID, createHash } from "node:crypto";
import type { Document, HandlingUnit, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export type ShipmentStatus = "planned" | "loading" | "in-transit" | "delivered" | "exception";
export type ShipmentType = "inbound" | "outbound" | "transfer";

type Location = {
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  type: "plant" | "warehouse" | "customer" | "3pl";
};

type ShipmentRoute = {
  origin: Location;
  destination: Location;
  stops: Location[];
  distance: number;
  duration: number;
};

type ShipmentVehicle = {
  type: string;
  licensePlate: string;
  temperature?: number;
  capacity: number;
};

type ShipmentDocumentInput = {
  id?: string;
  type: string;
  status?: string;
  owner?: string;
  updatedAt?: string;
  storageUrl?: string;
};

type ShipmentDocument = Required<Omit<ShipmentDocumentInput, "storageUrl">> & Pick<ShipmentDocumentInput, "storageUrl">;

type ShipmentEvent = {
  id: string;
  timestamp: string;
  location: string;
  detail: string;
  type: "checkpoint" | "delay" | "milestone";
};

type ShipmentSensor = {
  id: string;
  type: "temperature" | "shock" | "humidity" | "geo";
  value: number;
  unit: string;
  status: "ok" | "warning" | "critical";
  timestamp: string;
};

type ShipmentMetadata = {
  type: ShipmentType;
  status: ShipmentStatus;
  carrier: LogisticsShipment["carrier"];
  deliveries: string[];
  route: ShipmentRoute;
  vehicle: ShipmentVehicle;
  scheduledDate: string;
  actualDate: string | null;
  tracking: string;
  documents: ShipmentDocument[];
  costs: LogisticsShipment["costs"];
  events: ShipmentEvent[];
  sensors: ShipmentSensor[];
  createdBy: string;
} & Record<string, unknown>;

export type LogisticsShipment = {
  id: string;
  tenantId: string;
  shipmentNumber: string;
  status: ShipmentStatus;
  type: ShipmentType;
  carrier: { name: string; id: string; rating: number };
  deliveries: string[];
  route: ShipmentRoute;
  vehicle: ShipmentVehicle;
  scheduledDate: string;
  actualDate?: string | null;
  tracking: string;
  documents: ShipmentDocument[];
  costs: { freight: number; fuel: number; total: number };
  events: ShipmentEvent[];
  sensors: ShipmentSensor[];
  updatedAt: string;
};

export type CreateShipmentInput = {
  tenantId: string;
  shipmentNumber?: string;
  type?: ShipmentType;
  status?: ShipmentStatus;
  carrier?: LogisticsShipment["carrier"];
  deliveries?: string[];
  route?: ShipmentRoute;
  vehicle?: ShipmentVehicle;
  scheduledDate?: string;
  actualDate?: string | null;
  tracking?: string;
  documents?: ShipmentDocumentInput[];
  costs?: LogisticsShipment["costs"];
  events?: ShipmentEvent[];
  sensors?: ShipmentSensor[];
  createdBy?: string;
};

export type UpdateShipmentStatusInput = {
  tenantId: string;
  shipmentNumber: string;
  status: ShipmentStatus;
};

const STATUS_VALUES: ShipmentStatus[] = ["planned", "loading", "in-transit", "delivered", "exception"];
const TYPE_VALUES: ShipmentType[] = ["inbound", "outbound", "transfer"];

const DEFAULT_LOCATIONS: Record<string, Location> = {
  plant: {
    name: "Plant 1000 - Chicago",
    address: "1000 Industrial Way, Chicago, IL",
    coordinates: { lat: 41.881, lng: -87.623 },
    type: "plant",
  },
  customer: {
    name: "Retail DC - Boston",
    address: "44 Harbor Way, Boston, MA",
    coordinates: { lat: 42.35, lng: -71.06 },
    type: "customer",
  },
  crossDock: {
    name: "Cross Dock - Columbus",
    address: "200 Freight Ave, Columbus, OH",
    coordinates: { lat: 39.96, lng: -82.99 },
    type: "3pl",
  },
};

const defaultRoute = (): ShipmentRoute => ({
  origin: DEFAULT_LOCATIONS.plant,
  destination: DEFAULT_LOCATIONS.customer,
  stops: [DEFAULT_LOCATIONS.crossDock],
  distance: 820,
  duration: 17,
});

const defaultVehicle = (): ShipmentVehicle => ({
  type: "53' Reefer",
  licensePlate: "OPS-2040",
  temperature: 4,
  capacity: 22000,
});

const sanitizeStatus = (status?: string | null): ShipmentStatus =>
  STATUS_VALUES.includes(status as ShipmentStatus) ? (status as ShipmentStatus) : "planned";

const sanitizeType = (type?: string | null): ShipmentType =>
  TYPE_VALUES.includes(type as ShipmentType) ? (type as ShipmentType) : "outbound";

const ensureDocuments = (documents?: ShipmentDocumentInput[], shipmentNumber?: string): ShipmentDocument[] => {
  if (documents && documents.length > 0) {
    return documents.map((doc) => ({
      id: doc.id ?? randomUUID(),
      type: doc.type,
      status: doc.status ?? "ready",
      owner: doc.owner ?? "Transport Bot",
      updatedAt: doc.updatedAt ?? new Date().toISOString(),
      storageUrl: doc.storageUrl,
    }));
  }

  const now = new Date().toISOString();
  return [
    { id: randomUUID(), type: "BOL", status: "ready", owner: "Transport Bot", updatedAt: now },
    { id: randomUUID(), type: "POD", status: "pending", owner: "Customer Ops", updatedAt: now },
  ].map((doc) => ({ ...doc, storageUrl: `memory://${shipmentNumber ?? "shipment"}/${doc.type.toLowerCase()}` }));
};

const ensureEvents = (events?: ShipmentEvent[]): ShipmentEvent[] => {
  if (events && events.length) return events;
  const now = new Date().toISOString();
  return [
    {
      id: `evt-${Date.now()}`,
      timestamp: now,
      location: DEFAULT_LOCATIONS.plant.name,
      detail: "Shipment planned",
      type: "milestone",
    },
  ];
};

const ensureSensors = (sensors?: ShipmentSensor[]): ShipmentSensor[] => {
  if (sensors && sensors.length) return sensors;
  const now = new Date().toISOString();
  return [
    {
      id: `temp-${Date.now()}`,
      type: "temperature",
      value: 4.2,
      unit: "°C",
      status: "ok",
      timestamp: now,
    },
  ] satisfies ShipmentSensor[];
};

const buildMetadata = (input: CreateShipmentInput, shipmentNumber: string): ShipmentMetadata => {
  const documents = ensureDocuments(input.documents, shipmentNumber);
  const events = ensureEvents(input.events);
  const sensors = ensureSensors(input.sensors);

  return {
    type: sanitizeType(input.type),
    status: sanitizeStatus(input.status),
    carrier: input.carrier ?? { name: "Autonomous Carrier", id: "carrier-autonomous", rating: 4.7 },
    deliveries: input.deliveries ?? ["DL-1001"],
    route: input.route ?? defaultRoute(),
    vehicle: input.vehicle ?? defaultVehicle(),
    scheduledDate: input.scheduledDate ?? new Date().toISOString().slice(0, 10),
    actualDate: input.actualDate ?? null,
    tracking: input.tracking ?? `GPS-${Math.random().toString().slice(2, 7)}`,
    documents,
    costs: input.costs ?? { freight: 2250, fuel: 430, total: 2680 },
    events,
    sensors,
    createdBy: input.createdBy ?? "transport-bot",
  } satisfies ShipmentMetadata;
};

const toDocumentSummary = (doc: Document): ShipmentDocument => ({
  id: doc.id,
  type: doc.type,
  status: doc.status,
  owner: doc.uploadedBy,
  updatedAt: doc.updatedAt.toISOString(),
  storageUrl: doc.storageUrl,
});

const groupDocumentsByShipment = (documents: Document[]) => {
  const map = new Map<string, ShipmentDocument[]>();
  documents.forEach((doc) => {
    const shipmentTag = doc.tags.find((tag) => tag.startsWith("shipment:"));
    if (!shipmentTag) return;
    const shipmentNumber = shipmentTag.split(":")[1];
    if (!shipmentNumber) return;
    const list = map.get(shipmentNumber) ?? [];
    list.push(toDocumentSummary(doc));
    map.set(shipmentNumber, list);
  });
  return map;
};

const attachDocumentsToMetadata = (metadata: ShipmentMetadata, docs: ShipmentDocument[]): ShipmentMetadata => ({
  ...metadata,
  documents: docs,
});

const transformShipment = (handlingUnit: HandlingUnit, documents: ShipmentDocument[] = []): LogisticsShipment => {
  const baseMetadata = buildMetadata({ tenantId: handlingUnit.tenantId }, handlingUnit.huNumber);
  const rawMetadata = (handlingUnit.metadata as Partial<ShipmentMetadata>) ?? {};
  const hydratedMetadata: ShipmentMetadata = {
    ...baseMetadata,
    ...rawMetadata,
    documents: documents.length ? documents : (rawMetadata.documents as ShipmentDocument[] | undefined) ?? baseMetadata.documents,
  };
  const metadata = attachDocumentsToMetadata(hydratedMetadata, hydratedMetadata.documents);

  const carrier = metadata.carrier ?? { name: "Carrier", id: "carrier", rating: 4.5 };
  const route = metadata.route ?? defaultRoute();
  const vehicle = metadata.vehicle ?? defaultVehicle();
  const deliveries = metadata.deliveries ?? [];
  const costs = metadata.costs ?? { freight: 0, fuel: 0, total: 0 };
  const events = metadata.events ?? [];
  const sensors = metadata.sensors ?? [];
  const docs = metadata.documents ?? [];

  return {
    id: handlingUnit.id,
    tenantId: handlingUnit.tenantId,
    shipmentNumber: handlingUnit.huNumber,
  status: sanitizeStatus(metadata.status ?? handlingUnit.status),
  type: sanitizeType(metadata.type),
    carrier,
    deliveries,
    route,
    vehicle,
  scheduledDate: metadata.scheduledDate ?? new Date().toISOString().slice(0, 10),
  actualDate: metadata.actualDate ?? null,
  tracking: metadata.tracking ?? `GPS-${Math.random().toString().slice(2, 7)}`,
    documents: docs,
    costs,
    events,
    sensors,
    updatedAt: handlingUnit.updatedAt.toISOString(),
  };
};

const syncDocuments = async (tenantId: string, shipmentNumber: string, documents: ShipmentDocument[]) => {
  const summaries: ShipmentDocument[] = [];
  for (const doc of documents) {
    const hash = createHash("sha256").update(`${tenantId}:${shipmentNumber}:${doc.type}`).digest("hex");
    const record = await prisma.document.upsert({
      where: {
        tenantId_hash: {
          tenantId,
          hash,
        },
      },
      update: {
        status: doc.status,
        uploadedBy: doc.owner,
        tags: [
          `shipment:${shipmentNumber}`,
          `type:${doc.type}`,
        ],
      },
      create: {
        id: doc.id ?? randomUUID(),
        tenantId,
        name: `${doc.type} - ${shipmentNumber}`,
        type: doc.type,
        size: 0,
        hash,
        storageUrl: doc.storageUrl ?? `memory://${shipmentNumber}/${doc.type.toLowerCase()}`,
        uploadedBy: doc.owner,
        status: doc.status,
        category: "shipment",
        tags: [
          `shipment:${shipmentNumber}`,
          `type:${doc.type}`,
        ],
      },
    });
    summaries.push(toDocumentSummary(record));
  }
  return summaries;
};

const fetchShipmentDocuments = async (tenantId: string, shipmentNumber: string) => {
  const docs = await prisma.document.findMany({
    where: {
      tenantId,
      tags: {
        has: `shipment:${shipmentNumber}`,
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return docs.map(toDocumentSummary);
};

export const logisticsService = {
  async listShipments(tenantId: string): Promise<LogisticsShipment[]> {
    const [handlingUnits, documents] = await Promise.all([
      prisma.handlingUnit.findMany({ where: { tenantId }, orderBy: { updatedAt: "desc" } }),
      prisma.document.findMany({ where: { tenantId, category: "shipment" }, orderBy: { updatedAt: "desc" } }),
    ]);

    const documentsMap = groupDocumentsByShipment(documents);
    return handlingUnits.map((hu) => transformShipment(hu, documentsMap.get(hu.huNumber)));
  },

  async createShipment(input: CreateShipmentInput): Promise<LogisticsShipment> {
    const shipmentNumber = input.shipmentNumber ?? `SH-${Date.now().toString().slice(-6)}`;
    const metadata = buildMetadata(input, shipmentNumber);
    const handlingUnit = await prisma.handlingUnit.create({
      data: {
        tenantId: input.tenantId,
        huNumber: shipmentNumber,
        status: metadata.status,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });

    const syncedDocuments = await syncDocuments(input.tenantId, shipmentNumber, metadata.documents as ShipmentDocument[]);
    return transformShipment(handlingUnit, syncedDocuments);
  },

  async updateShipmentStatus(input: UpdateShipmentStatusInput): Promise<LogisticsShipment> {
    const handlingUnit = await prisma.handlingUnit.findFirst({
      where: { tenantId: input.tenantId, huNumber: input.shipmentNumber },
    });

    if (!handlingUnit) {
      throw new Error("Shipment not found");
    }

    const metadata = {
      ...(handlingUnit.metadata as ShipmentMetadata | undefined),
      status: sanitizeStatus(input.status),
    } as ShipmentMetadata;
    const events = metadata.events ?? [];
    metadata.events = [
      {
        id: `status-${Date.now()}`,
        timestamp: new Date().toISOString(),
        location: (metadata.route ?? defaultRoute()).destination.name,
        detail: `Status updated to ${input.status}`,
        type: "milestone",
      },
      ...events,
    ];

    const updated = await prisma.handlingUnit.update({
      where: { id: handlingUnit.id },
      data: {
        status: input.status,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });

    const documents = await fetchShipmentDocuments(input.tenantId, input.shipmentNumber);
    return transformShipment(updated, documents);
  },

  async listDocuments(tenantId: string, status?: string) {
    const documents = await prisma.document.findMany({
      where: {
        tenantId,
        category: "shipment",
        ...(status ? { status } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });
    return documents.map(toDocumentSummary);
  },
};
