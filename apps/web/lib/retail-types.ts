export interface RetailStatCard {
  id: string;
  label: string;
  value: string;
  delta: string;
  helper: string;
  accent?: string;
}

export interface RetailChannelSlice {
  id: string;
  value: number;
  color?: string;
}

export type FulfillmentStatus = "packing" | "picking" | "exception" | string;

export interface RetailFulfillmentWave {
  label: string;
  orders: number;
  sla: string;
  lanes: string;
  status: FulfillmentStatus;
}

export interface RetailDemandBoardEntry {
  label: string;
  detail: string;
  action: string;
}

export interface RetailStoreHealthRow {
  store: string;
  sellThru: string;
  traffic: string;
  doc: string;
  actions: string;
}

export interface RetailPromoIdea {
  title: string;
  detail: string;
  lift: string;
}

export interface RetailInventoryGuardrail {
  sku: string;
  status: string;
  note: string;
}

export interface RetailAutomationCard {
  label: string;
  detail: string;
  icon: string;
}

export interface RetailOperationsResponse {
  timeframeOptions: string[];
  statCards: RetailStatCard[];
  channelMix: RetailChannelSlice[];
  fulfillmentWaves: RetailFulfillmentWave[];
  demandBoard: RetailDemandBoardEntry[];
  storeHealth: RetailStoreHealthRow[];
  promoIdeas: RetailPromoIdea[];
  inventoryGuardrails: RetailInventoryGuardrail[];
  automationCards: RetailAutomationCard[];
}
