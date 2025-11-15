import type { RetailOperationsResponse } from "./retail-types";

export const mockRetailOperations: RetailOperationsResponse = {
  timeframeOptions: ["24h", "7d", "30d"],
  statCards: [
    {
      id: "gmv",
      label: "GMV",
      value: "$4.8M",
      delta: "+12.4%",
      helper: "rolling 7d",
      accent: "text-indigo-600",
    },
    {
      id: "fulfillment",
      label: "Fulfillment SLA",
      value: "96.2%",
      delta: "+1.8%",
      helper: "< 4h shipping",
      accent: "text-emerald-600",
    },
    {
      id: "loyalty",
      label: "Loyalty Conversions",
      value: "38k",
      delta: "+4.2%",
      helper: "DecisionWizard nudges",
      accent: "text-amber-600",
    },
    {
      id: "margin",
      label: "Gross Margin",
      value: "42.7%",
      delta: "+0.7%",
      helper: "ex promos",
      accent: "text-rose-600",
    },
  ],
  channelMix: [
    { id: "DTC", value: 46, color: "#2563EB" },
    { id: "Marketplaces", value: 28, color: "#14B8A6" },
    { id: "Retail Stores", value: 18, color: "#F97316" },
    { id: "Wholesale", value: 8, color: "#A855F7" },
  ],
  fulfillmentWaves: [
    { label: "Wave Alpha", orders: 820, sla: "98% on-time", lanes: "Midwest", status: "packing" },
    { label: "Wave Bravo", orders: 640, sla: "93%", lanes: "Coastal", status: "picking" },
    { label: "Wave Charlie", orders: 410, sla: "88%", lanes: "International", status: "exception" },
  ],
  demandBoard: [
    {
      label: "AI anomaly",
      detail: "Marketplace returns spiking 22% on footwear SKU-442.",
      action: "Trigger inspection",
    },
    {
      label: "Heat index",
      detail: "Southeast DTC traffic +38% from influencer drop.",
      action: "Reallocate inventory",
    },
    {
      label: "Wholesale push",
      detail: "Key partner wants 1.2k units of hydration kit in 10d.",
      action: "Lock supply",
    },
  ],
  storeHealth: [
    {
      store: "NYC Flagship",
      sellThru: "82%",
      traffic: "+11%",
      doc: "digital hub",
      actions: "Add dark store slots",
    },
    {
      store: "Austin Micro",
      sellThru: "67%",
      traffic: "+4%",
      doc: "same-day hero",
      actions: "Replenish fast-movers",
    },
    {
      store: "LA Outlet",
      sellThru: "58%",
      traffic: "-6%",
      doc: "clearance focus",
      actions: "Trigger promo bundle",
    },
  ],
  promoIdeas: [
    {
      title: "Route-based flash sale",
      detail: "Bundle hydration + energy SKUs for West Coast warm spell.",
      lift: "+18% DTC",
    },
    {
      title: "Marketplace loyalty boost",
      detail: "Offer double points for marketplace checkouts pushed to DTC replenishment.",
      lift: "+9% retention",
    },
    {
      title: "Store-to-door pilot",
      detail: "NYC + Austin micro-fleet to cover 2h delivery radius with AI routing.",
      lift: "-22% courier cost",
    },
  ],
  inventoryGuardrails: [
    { sku: "SKU-1024 Hydration kit", status: "healthy", note: "Above safety stock by 18%" },
    { sku: "SKU-5521 Energy chew", status: "risk", note: "2.1 days of supply · expedite PO" },
    { sku: "SKU-9004 Recovery bundle", status: "watch", note: "Forecast bias +8% · adjust model" },
  ],
  automationCards: [
    { label: "Micro-fulfillment bots", detail: "Queued 312 orders", icon: "boxes" },
    { label: "Returns triage", detail: "AI cleared 87 claims", icon: "package" },
    { label: "Payment risk", detail: "2 chargebacks escalated", icon: "credit" },
    { label: "Carbon routing", detail: "-12% emissions this week", icon: "truck" },
  ],
};
