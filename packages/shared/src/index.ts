export type Phase = "phase-1" | "phase-2" | "phase-3";

export interface InventorySnapshot {
  facilityId: string;
  sku: string;
  quantityOnHand: number;
  quantityOnHold: number;
  unit: string;
  updatedAt: string;
}

export interface AgentStatus {
  name: string;
  queue: string;
  state: "idle" | "processing" | "error";
  lastHeartbeat: string;
  enabled: boolean;
}

export interface SocketEvent<TPayload = Record<string, unknown>> {
  type: string;
  payload: TPayload;
  timestamp: string;
}
