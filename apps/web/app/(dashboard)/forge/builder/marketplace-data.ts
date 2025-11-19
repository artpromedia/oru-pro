import type {
  APIEndpoint,
  AppComponent,
  DataSource,
  Deployment,
  ForgeApp,
  ForgeMarketplaceItem,
  MarketplaceReview,
  Permission,
  Workflow,
} from "./types";

const baseConfig = {
  template: "default",
  props: {},
  styles: {},
  responsive: {},
  accessibility: {},
};

const baseComponentLayout = {
  x: 0,
  y: 0,
  width: 480,
  height: 320,
  zIndex: 1,
};

const createComponent = (id: string, type: AppComponent["type"], name: string, overrides = {}): AppComponent => ({
  id,
  type,
  name,
  config: { ...baseConfig, ...("config" in overrides ? overrides.config : {}) },
  layout: { ...baseComponentLayout, ...("layout" in overrides ? overrides.layout : {}) },
  bindings: overrides.bindings ?? [],
  events: overrides.events ?? [],
  permissions: overrides.permissions ?? [],
});

const createWorkflow = (id: string, name: string, overrides = {}): Workflow => ({
  id,
  name,
  trigger: {
    type: "event",
    config: { event: "record.updated", ...("trigger" in overrides ? overrides.trigger : {}) },
  },
  nodes: [
    {
      id: `${id}-node-1`,
      type: "trigger",
      name: "Start",
      config: {},
      position: { x: 80, y: 40 },
    },
    {
      id: `${id}-node-2`,
      type: "action",
      name: "Process",
      config: {},
      position: { x: 260, y: 40 },
    },
  ],
  connections: [
    {
      id: `${id}-connection-1`,
      source: `${id}-node-1`,
      target: `${id}-node-2`,
      condition: overrides.condition,
    },
  ],
  variables: overrides.variables ?? [],
  errorHandling: overrides.errorHandling ?? { retry: 1, fallback: "Notify Ops", notify: true },
});

const createPermissions = (resource: string): Permission[] => [
  { resource, action: "read" },
  { resource, action: "write" },
];

const createDataSources = (): DataSource[] => [
  {
    id: "sap-erp",
    name: "SAP ERP",
    type: "api",
    connection: { endpoint: "https://sap.example.com/api" },
    status: "connected",
  },
  {
    id: "postgres-warehouse",
    name: "Warehouse DB",
    type: "database",
    connection: { host: "warehouse-db", database: "inventory" },
    status: "ready",
  },
];

const createApis = (): APIEndpoint[] => [
  {
    id: "get-inventory",
    path: "/inventory",
    method: "GET",
    handler: "InventoryController.list",
    auth: true,
  },
  {
    id: "post-adjustment",
    path: "/inventory/adjustment",
    method: "POST",
    handler: "InventoryController.adjust",
    auth: true,
  },
];

const createDeployments = (appId: string): Deployment[] => [
  {
    id: `${appId}-deploy-prod`,
    version: "1.4.2",
    environment: "production",
    status: "deployed",
    deployedAt: new Date().toISOString(),
    url: `https://forge.apps.oru.cloud/${appId}`,
  },
];

const createForgeApp = (app: Partial<ForgeApp> & Pick<ForgeApp, "id" | "name" | "description" | "category">): ForgeApp => ({
  id: app.id,
  name: app.name,
  description: app.description,
  icon: app.icon ?? `/icons/${app.id}.svg`,
  category: app.category,
  version: app.version ?? "1.0.0",
  status: app.status ?? "published",
  author: app.author ?? { id: "oru", name: "Oru Labs" },
  components:
    app.components ?? [
      createComponent(`${app.id}-table`, "table", "Inventory Table"),
      createComponent(`${app.id}-form`, "form", "Adjustment Form"),
    ],
  workflows: app.workflows ?? [createWorkflow(`${app.id}-workflow`, "Default Workflow")],
  permissions: app.permissions ?? createPermissions(app.id),
  dataSources: app.dataSources ?? createDataSources(),
  apis: app.apis ?? createApis(),
  deployments: app.deployments ?? createDeployments(app.id),
  analytics:
    app.analytics ?? {
      installations: 1200,
      activeUsers: 420,
      rating: 4.7,
      reviews: 186,
    },
  createdAt: app.createdAt ?? new Date().toISOString(),
  updatedAt: app.updatedAt ?? new Date().toISOString(),
});

type ReviewSeed = Omit<MarketplaceReview, "id" | "createdAt" | "votes"> &
  Partial<Pick<MarketplaceReview, "id" | "createdAt" | "votes">>;

const createReview = (review: ReviewSeed): MarketplaceReview => ({
  ...review,
  id: review.id ?? `review-${Math.random().toString(36).slice(2)}`,
  createdAt: review.createdAt ?? new Date().toISOString(),
  votes: review.votes ?? { helpful: 0, notHelpful: 0 },
});

export const marketplaceItems: ForgeMarketplaceItem[] = [
  {
    id: "inventory-control-suite",
    app: createForgeApp({
      id: "inventory-control-suite",
      name: "Inventory Control Suite",
      description: "AI-assisted cycle counting, slotting intelligence, and compliance-ready audit trails.",
      category: "operations",
      analytics: { installations: 1840, activeUsers: 830, rating: 4.8, reviews: 264 },
    }),
    pricing: { model: "subscription", price: 899, currency: "USD", trial: 14 },
    tags: ["inventory", "ai", "warehouse", "compliance"],
    screenshots: [
      "/marketplace/inventory-control-suite/dashboard.png",
      "/marketplace/inventory-control-suite/slots.png",
    ],
    documentation: "https://docs.oru.cloud/apps/inventory-control-suite",
    support: { email: "inventory@oru.cloud", chat: true, phone: true, sla: "4h" },
  },
  {
    id: "quality-insights-pro",
    app: createForgeApp({
      id: "quality-insights-pro",
      name: "Quality Insights Pro",
      description: "Close the loop on NCRs with guided investigations, supplier collaboration, and AI recommendations.",
      category: "operations",
      components: [
        createComponent("quality-dashboard", "dashboard", "Quality Dashboard"),
        createComponent("quality-chat", "chatbot", "QA Copilot", {
          config: {
            ...baseConfig,
            props: { persona: "QA Analyst" },
            styles: { backgroundColor: "#eef2ff" },
          },
        }),
      ],
      analytics: { installations: 940, activeUsers: 310, rating: 4.6, reviews: 118 },
    }),
    pricing: { model: "freemium", price: 0, currency: "USD", trial: 30 },
    tags: ["quality", "ai", "ncr", "supplier"],
    screenshots: [
      "/marketplace/quality-insights/overview.png",
      "/marketplace/quality-insights/collab.png",
    ],
    documentation: "https://docs.oru.cloud/apps/quality-insights-pro",
    support: { email: "quality@oru.cloud", chat: true, phone: false, sla: "8h" },
  },
  {
    id: "procurement-cockpit",
    app: createForgeApp({
      id: "procurement-cockpit",
      name: "Procurement Cockpit",
      description: "Supplier health KPIs, contract automation, and AI-guided sourcing negotiations in one workspace.",
      category: "custom",
      analytics: { installations: 640, activeUsers: 280, rating: 4.5, reviews: 92 },
    }),
    pricing: { model: "paid", price: 1299, currency: "USD" },
    tags: ["procurement", "sourcing", "contracts"],
    screenshots: [
      "/marketplace/procurement-cockpit/suppliers.png",
      "/marketplace/procurement-cockpit/contracts.png",
    ],
    documentation: "https://docs.oru.cloud/apps/procurement-cockpit",
    support: { email: "procurement@oru.cloud", chat: false, phone: true, sla: "12h" },
  },
];

export const marketplaceIndex = new Map(marketplaceItems.map((item) => [item.app.id, item]));

export const marketplaceReviewSeeds: Record<string, MarketplaceReview[]> = {
  "inventory-control-suite": [
    createReview({
      appId: "inventory-control-suite",
      rating: 5,
      title: "Essential for regulated warehouses",
      feedback:
        "The AI slotting suggestions alone saved us hundreds of hours each quarter. Cycle count variance dropped 18% within the first month.",
      persona: "Director of Operations",
      org: "NexFoods",
      environment: "production",
    }),
    createReview({
      appId: "inventory-control-suite",
      rating: 4,
      title: "Audit prep is painless now",
      feedback:
        "We pipe QA holds from SAP into the dashboard and the compliance export nails every FDA ask. Would love deeper RFID integrations next.",
      persona: "QA Lead",
      org: "PureBite Labs",
      environment: "staging",
    }),
  ],
  "quality-insights-pro": [
    createReview({
      appId: "quality-insights-pro",
      rating: 5,
      title: "Supplier collaboration in one place",
      feedback:
        "Shared NCR workspace with vendors plus the copilot summaries cut containment time by 40%.",
      persona: "Supplier Quality Manager",
      org: "FormaTech",
      environment: "production",
    }),
    createReview({
      appId: "quality-insights-pro",
      rating: 4,
      title: "Great start for AI QA",
      feedback: "Love the guided investigations. Would appreciate more templates for pharma LOT releases.",
      persona: "QA Systems Owner",
      org: "BioVerse",
      environment: "production",
    }),
  ],
  "procurement-cockpit": [
    createReview({
      appId: "procurement-cockpit",
      rating: 5,
      title: "Single source of supplier truth",
      feedback:
        "Our sourcing councils finally see risk scores, contracts, and AI negotiation briefs in one canvas. Massive uplift for quarterly planning.",
      persona: "VP Procurement",
      org: "Harvest & Co",
      environment: "production",
    }),
  ],
};