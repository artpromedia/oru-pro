import { z } from "zod";

export const componentTypeSchema = z.enum([
  "view",
  "widget",
  "form",
  "chart",
  "table",
  "text",
  "button",
  "input",
  "select",
  "checkbox",
  "radio",
  "toggle",
  "container",
  "grid",
  "flex",
  "tabs",
  "accordion",
  "modal",
  "drawer",
  "kanban",
  "calendar",
  "timeline",
  "map",
  "inventory",
  "order",
  "invoice",
  "dashboard",
  "workflow",
  "approval",
  "chatbot",
  "prediction",
  "analyzer",
  "recommender",
  "custom",
]);
export type ComponentType = z.infer<typeof componentTypeSchema>;

export const appCategorySchema = z.enum(["operations", "finance", "hr", "sales", "custom"]);
export type AppCategory = z.infer<typeof appCategorySchema>;

export const appStatusSchema = z.enum(["draft", "testing", "published", "deprecated"]);
export type AppStatus = z.infer<typeof appStatusSchema>;

export const layoutConfigSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  width: z.union([z.number(), z.literal("auto")]).default("auto"),
  height: z.union([z.number(), z.literal("auto")]).default("auto"),
  zIndex: z.number().default(1),
});
export type LayoutConfig = z.infer<typeof layoutConfigSchema>;

export const responsiveConfigSchema = z.object({
  mobile: z.record(z.any()).optional(),
  tablet: z.record(z.any()).optional(),
  desktop: z.record(z.any()).optional(),
});
export type ResponsiveConfig = z.infer<typeof responsiveConfigSchema>;

export const accessibilityConfigSchema = z.object({
  ariaLabel: z.string().optional(),
  tabIndex: z.number().optional(),
  role: z.string().optional(),
});
export type AccessibilityConfig = z.infer<typeof accessibilityConfigSchema>;

export const componentConfigSchema = z.object({
  template: z.string(),
  props: z.record(z.any()),
  styles: z.record(z.any()),
  responsive: responsiveConfigSchema,
  accessibility: accessibilityConfigSchema,
});
export type ComponentConfig = z.infer<typeof componentConfigSchema>;

export const dataBindingSchema = z.object({
  source: z.string(),
  target: z.string(),
  transform: z.string().optional(),
  realtime: z.boolean().default(false),
});
export type DataBinding = z.infer<typeof dataBindingSchema>;

export const eventHandlerSchema = z.object({
  event: z.string(),
  action: z.string(),
  params: z.record(z.any()).optional(),
});
export type EventHandler = z.infer<typeof eventHandlerSchema>;

export const appComponentSchema = z.object({
  id: z.string(),
  type: componentTypeSchema,
  name: z.string(),
  config: componentConfigSchema,
  layout: layoutConfigSchema,
  bindings: z.array(dataBindingSchema),
  events: z.array(eventHandlerSchema),
  permissions: z.array(z.string()),
});
export type AppComponent = z.infer<typeof appComponentSchema>;

export const triggerConfigSchema = z.object({
  type: z.enum(["manual", "scheduled", "event", "webhook"]),
  config: z.record(z.any()),
});
export type TriggerConfig = z.infer<typeof triggerConfigSchema>;

export const workflowNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  config: z.record(z.any()),
  position: z.object({ x: z.number(), y: z.number() }),
});
export type WorkflowNode = z.infer<typeof workflowNodeSchema>;

export const connectionSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  condition: z.string().optional(),
});
export type Connection = z.infer<typeof connectionSchema>;

export const variableSchema = z.object({
  name: z.string(),
  type: z.string(),
  defaultValue: z.any().optional(),
});
export type Variable = z.infer<typeof variableSchema>;

export const errorConfigSchema = z.object({
  retry: z.number().default(0),
  fallback: z.string().optional(),
  notify: z.boolean().default(false),
});
export type ErrorConfig = z.infer<typeof errorConfigSchema>;

export const workflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  trigger: triggerConfigSchema,
  nodes: z.array(workflowNodeSchema),
  connections: z.array(connectionSchema),
  variables: z.array(variableSchema),
  errorHandling: errorConfigSchema,
});
export type Workflow = z.infer<typeof workflowSchema>;

export const permissionSchema = z.object({
  resource: z.string(),
  action: z.enum(["read", "write", "delete", "admin"]),
  condition: z.string().optional(),
});
export type Permission = z.infer<typeof permissionSchema>;

export const dataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["database", "api", "file", "device"]),
  connection: z.record(z.any()),
  status: z.enum(["connected", "ready", "error", "pending"]),
});
export type DataSource = z.infer<typeof dataSourceSchema>;

export const apiEndpointSchema = z.object({
  id: z.string(),
  path: z.string(),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  handler: z.string(),
  auth: z.boolean().default(false),
});
export type APIEndpoint = z.infer<typeof apiEndpointSchema>;

export const deploymentSchema = z.object({
  id: z.string(),
  version: z.string(),
  environment: z.enum(["development", "staging", "production"]),
  status: z.enum(["pending", "deploying", "deployed", "failed"]),
  deployedAt: z.string().optional(),
  url: z.string().optional(),
});
export type Deployment = z.infer<typeof deploymentSchema>;

export const authorSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().optional(),
});
export type Author = z.infer<typeof authorSchema>;

export const analyticsSchema = z.object({
  installations: z.number().default(0),
  activeUsers: z.number().default(0),
  rating: z.number().min(0).max(5).default(0),
  reviews: z.number().default(0),
});
export type Analytics = z.infer<typeof analyticsSchema>;

export type RatingDistribution = Record<"1" | "2" | "3" | "4" | "5", number>;

export interface RatingSummary {
  average: number;
  total: number;
  distribution: RatingDistribution;
}

export const marketplaceReviewSchema = z.object({
  id: z.string(),
  appId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string(),
  feedback: z.string(),
  persona: z.string(),
  org: z.string(),
  createdAt: z.string(),
  environment: z.enum(["development", "staging", "production"]).default("production"),
  votes: z
    .object({
      helpful: z.number().default(0),
      notHelpful: z.number().default(0),
    })
    .default({ helpful: 0, notHelpful: 0 }),
});
export type MarketplaceReview = z.infer<typeof marketplaceReviewSchema>;

export const forgeAppSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string().optional(),
  category: appCategorySchema,
  version: z.string(),
  status: appStatusSchema,
  author: authorSchema,
  components: z.array(appComponentSchema),
  workflows: z.array(workflowSchema),
  permissions: z.array(permissionSchema),
  dataSources: z.array(dataSourceSchema),
  apis: z.array(apiEndpointSchema),
  deployments: z.array(deploymentSchema),
  analytics: analyticsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ForgeApp = z.infer<typeof forgeAppSchema>;

export const pricingSchema = z.object({
  model: z.enum(["free", "paid", "freemium", "subscription"]),
  price: z.number().optional(),
  currency: z.string().optional(),
  trial: z.number().optional(),
});
export type Pricing = z.infer<typeof pricingSchema>;

export const supportSchema = z.object({
  email: z.string().optional(),
  chat: z.boolean().default(false),
  phone: z.boolean().default(false),
  sla: z.string().optional(),
});
export type Support = z.infer<typeof supportSchema>;

export const forgeMarketplaceItemSchema = z.object({
  id: z.string(),
  app: forgeAppSchema,
  pricing: pricingSchema,
  tags: z.array(z.string()),
  screenshots: z.array(z.string()),
  documentation: z.string(),
  support: supportSchema,
});
export type ForgeMarketplaceItem = z.infer<typeof forgeMarketplaceItemSchema>;

export const appTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: appCategorySchema,
  components: z.number(),
  workflows: z.number(),
  preview: z.string().optional(),
});
export type AppTemplate = z.infer<typeof appTemplateSchema>;

export const componentLibraryItemSchema = z.object({
  type: z.string(),
  label: z.string(),
  category: z.enum(["basic", "layout", "data", "business", "ai"]),
  icon: z.string(),
});
export type ComponentLibraryItem = z.infer<typeof componentLibraryItemSchema>;
