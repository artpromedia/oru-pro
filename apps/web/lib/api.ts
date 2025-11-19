import { DecisionRegistryResponse, ExecutionProjectsResponse } from "./execution-types";
import type { GeneralLedgerResponse } from "./finance-types";
import type { ManufacturingShopfloorResponse } from "./manufacturing-types";
import type { PharmaValidationResponse } from "./pharma-types";
import type { RetailOperationsResponse } from "./retail-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

const resolveUrl = (path: string) => {
  if (path.startsWith("http")) {
    return path;
  }

  if (API_BASE_URL && API_BASE_URL.length > 0) {
    try {
      return new URL(path, API_BASE_URL).toString();
    } catch {
      return path;
    }
  }

  return path;
};

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const response = await fetch(resolveUrl(path), {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request to ${path} failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export type LoginPayload = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type LoginResponse = {
  success: boolean;
  token?: string;
  user?: {
    name: string;
    email: string;
    roles: string[];
  };
  message?: string;
  requiresMfa?: boolean;
  sessionId?: string;
  expiresAt?: string;
};

export const login = (payload: LoginPayload) =>
  apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: payload,
  });

export type VerifyMfaPayload = {
  sessionId: string;
  token: string;
};

export const verifyMfa = (payload: VerifyMfaPayload) =>
  apiFetch<LoginResponse>("/api/auth/mfa", {
    method: "POST",
    body: payload,
  });

export const fetchExecutionProjects = () =>
  apiFetch<ExecutionProjectsResponse>("/api/execution/projects");

export const fetchDecisionRegistry = () =>
  apiFetch<DecisionRegistryResponse>("/api/execution/decisions");

export const fetchPharmaValidation = () =>
  apiFetch<PharmaValidationResponse>("/api/pharma/validation");

export const fetchManufacturingShopfloor = () =>
  apiFetch<ManufacturingShopfloorResponse>("/api/manufacturing/shopfloor");

export const fetchRetailOperations = () =>
  apiFetch<RetailOperationsResponse>("/api/retail/operations");

export const fetchGeneralLedgerSnapshot = (companyCode?: string) =>
  apiFetch<GeneralLedgerResponse>(
    `/api/finance/general-ledger${companyCode ? `?companyCode=${encodeURIComponent(companyCode)}` : ""}`,
  );

export type DocumentRecord = {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  size: number;
  hash: string;
  storageUrl: string;
  uploadedBy: string;
  status: string;
  category?: string | null;
  tags?: string[] | null;
  aiExtracted?: {
    entities?: string[];
    summary?: string;
    sentiment?: string;
    keyPhrases?: string[];
  } | null;
  compliance?: {
    standards?: string[];
    violations?: string[];
    signature?: string;
    [key: string]: unknown;
  } | null;
  version: number;
  locked?: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentFilters = {
  category?: string;
  status?: string;
  search?: string;
};

export const fetchDocuments = (filters: DocumentFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.category) {
    params.set("category", filters.category);
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.search) {
    params.set("search", filters.search);
  }

  const query = params.toString();
  const endpoint = query ? `/api/v1/documents?${query}` : "/api/v1/documents";

  return apiFetch<DocumentRecord[]>(endpoint);
};

export type DocumentUploadResponse = {
  document: DocumentRecord;
  aiAnalysis: Record<string, unknown>;
  compliance: Record<string, unknown>;
};

export const uploadDocument = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(resolveUrl("/api/v1/documents"), {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Upload failed with status ${response.status}`);
  }

  return response.json() as Promise<DocumentUploadResponse>;
};

export type ShipmentLocation = {
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  type: "plant" | "warehouse" | "customer" | "3pl";
};

export type ShipmentRoute = {
  origin: ShipmentLocation;
  destination: ShipmentLocation;
  stops: ShipmentLocation[];
  distance: number;
  duration: number;
};

export type ShipmentVehicle = {
  type: string;
  licensePlate: string;
  temperature?: number;
  capacity: number;
};

export type ShipmentDocument = {
  id: string;
  type: string;
  status: string;
  owner: string;
  updatedAt: string;
  storageUrl?: string;
};

export type ShipmentEvent = {
  id: string;
  timestamp: string;
  location: string;
  detail: string;
  type: "checkpoint" | "delay" | "milestone";
};

export type ShipmentSensor = {
  id: string;
  type: "temperature" | "shock" | "humidity" | "geo";
  value: number;
  unit: string;
  status: "ok" | "warning" | "critical";
  timestamp: string;
};

export type LogisticsShipment = {
  id: string;
  tenantId: string;
  shipmentNumber: string;
  type: "inbound" | "outbound" | "transfer";
  status: "planned" | "loading" | "in-transit" | "delivered" | "exception";
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

export type CreateShipmentPayload = {
  tenantId: string;
  shipmentNumber?: string;
  type?: LogisticsShipment["type"];
  status?: LogisticsShipment["status"];
  carrier?: LogisticsShipment["carrier"];
  deliveries?: string[];
  route?: ShipmentRoute;
  vehicle?: ShipmentVehicle;
  scheduledDate?: string;
  actualDate?: string | null;
  tracking?: string;
  documents?: ShipmentDocument[];
  costs?: LogisticsShipment["costs"];
  events?: ShipmentEvent[];
  sensors?: ShipmentSensor[];
  createdBy?: string;
};

export type UpdateShipmentStatusPayload = {
  tenantId: string;
  status: LogisticsShipment["status"];
};

type ShipmentsResponse = { shipments: LogisticsShipment[] };
type ShipmentResponse = { shipment: LogisticsShipment };

export const fetchLogisticsShipments = (tenantId: string) =>
  apiFetch<ShipmentsResponse>(`/api/logistics/shipments?tenantId=${encodeURIComponent(tenantId)}`).then((res) => res.shipments);

export const createLogisticsShipment = (payload: CreateShipmentPayload) =>
  apiFetch<ShipmentResponse>("/api/logistics/shipments", {
    method: "POST",
    body: payload,
  }).then((res) => res.shipment);

export const updateLogisticsShipmentStatus = (shipmentNumber: string, payload: UpdateShipmentStatusPayload) =>
  apiFetch<ShipmentResponse>(`/api/logistics/shipments/${encodeURIComponent(shipmentNumber)}/status`, {
    method: "PATCH",
    body: payload,
  }).then((res) => res.shipment);
