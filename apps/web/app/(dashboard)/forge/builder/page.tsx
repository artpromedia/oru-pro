"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Puzzle,
  Code,
  Eye,
  Save,
  Play,
  Cloud,
  Package,
  Plus,
  Layout,
  Terminal,
  Monitor,
  Smartphone,
  Brain,
  Database,
  FileCode,
  Box,
  Grid3x3,
  Layers,
  CheckCircle,
  TrendingUp,
  Zap,
  X,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  User,
  Wand2,
} from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import type { ForgeApp, AppComponent, AppTemplate } from "./types";
import { MarketplaceModal, type MarketplaceInstallSuccess } from "./marketplace-modal";
import { useToast } from "../../../../hooks/use-toast";

const componentLibrary = {
  basic: [
    { type: "text", label: "Text", icon: FileCode },
    { type: "button", label: "Button", icon: Box },
    { type: "input", label: "Input", icon: Terminal },
    { type: "select", label: "Dropdown", icon: Layers },
    { type: "checkbox", label: "Checkbox", icon: CheckCircle },
  ],
  layout: [
    { type: "container", label: "Container", icon: Box },
    { type: "grid", label: "Grid", icon: Grid3x3 },
    { type: "flex", label: "Flex Box", icon: Layers },
    { type: "tabs", label: "Tabs", icon: Layout },
    { type: "modal", label: "Modal", icon: Box },
  ],
  data: [
    { type: "table", label: "Data Table", icon: Database },
    { type: "chart", label: "Chart", icon: TrendingUp },
    { type: "form", label: "Form", icon: FileCode },
    { type: "calendar", label: "Calendar", icon: Layout },
  ],
  business: [
    { type: "inventory", label: "Inventory Widget", icon: Package },
    { type: "order", label: "Order Form", icon: FileCode },
    { type: "invoice", label: "Invoice", icon: FileCode },
    { type: "dashboard", label: "Dashboard", icon: Layout },
    { type: "workflow", label: "Workflow", icon: Layers },
    { type: "approval", label: "Approval", icon: CheckCircle },
  ],
  ai: [
    { type: "chatbot", label: "AI Chat", icon: Brain },
    { type: "prediction", label: "Predictor", icon: TrendingUp },
    { type: "analyzer", label: "Analyzer", icon: Brain },
    { type: "recommender", label: "Recommender", icon: Zap },
  ],
};

const appTemplates: AppTemplate[] = [
  {
    id: "inventory-tracker",
    name: "Inventory Tracker",
    description: "Track and manage inventory with barcode scanning",
    category: "operations",
    components: 12,
    workflows: 3,
    preview: "/templates/inventory.png",
  },
  {
    id: "approval-workflow",
    name: "Approval Workflow",
    description: "Multi-level approval system with notifications",
    category: "operations",
    components: 8,
    workflows: 5,
    preview: "/templates/approval.png",
  },
  {
    id: "customer-portal",
    name: "Customer Portal",
    description: "Self-service portal for customers",
    category: "sales",
    components: 15,
    workflows: 7,
    preview: "/templates/portal.png",
  },
  {
    id: "quality-checklist",
    name: "Quality Checklist",
    description: "Digital quality inspection checklists",
    category: "operations",
    components: 10,
    workflows: 4,
    preview: "/templates/quality.png",
  },
];

type AssistantRole = "user" | "assistant";

interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  timestamp: string;
  insights?: string[];
}

type DataSourceType = "database" | "api" | "device" | "file";
type DataSourceHealth = "connected" | "ready" | "error" | "pending";

interface DataSourceStatus {
  id: string;
  name: string;
  type: DataSourceType;
  status: DataSourceHealth;
  description?: string;
  lastSynced?: string;
}

type AssistantAction =
  | {
      actionType: "addComponent";
      componentType: string;
      label: string;
      properties?: Record<string, unknown>;
      styles?: Record<string, unknown>;
      size?: { width?: number; height?: number };
    }
  | {
      actionType: "connectDataSource";
      sourceId: string;
      name: string;
      targetType: DataSourceType;
      status: DataSourceHealth;
      description?: string;
    };

interface AssistantPlan {
  response: string;
  insights?: string[];
  actions?: AssistantAction[];
}

const assistantQuickPrompts = [
  "Add barcode scanning to this form",
  "Connect to inventory database",
  "Add approval workflow",
  "Generate QA insights",
];

const assistantBlueprints = [
  {
    title: "Inventory Counter",
    description: "Cycle counting grid, slotting telemetry, and QA guardrails",
    prompt: "Build an inventory counting workspace with variance insights and cycle count progress",
  },
  {
    title: "Supplier Review",
    description: "Procurement cockpit with risk scoring and contract cues",
    prompt: "Create a procurement review console with supplier heatmaps and contract reminders",
  },
  {
    title: "Quality Triage",
    description: "NCR pipeline with AI summary and approvals",
    prompt: "Assemble a quality triage board with NCR queue, AI summaries, and approval workflow",
  },
];

const initialDataSources: DataSourceStatus[] = [
  {
    id: "inventory-db",
    name: "Inventory DB",
    type: "database",
    status: "connected",
    description: "Postgres warehouse for materials, batches, and HU telemetry",
    lastSynced: new Date().toISOString(),
  },
  {
    id: "sap-integration",
    name: "SAP Integration",
    type: "api",
    status: "ready",
    description: "RFC connector for MB* + LT* events",
    lastSynced: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "barcode-scanner",
    name: "Barcode Scanner",
    type: "device",
    status: "ready",
    description: "Zebra TC route for GS1 + SSCC captures",
  },
];

function findComponentMeta(type: string) {
  for (const components of Object.values(componentLibrary)) {
    const match = components.find((component) => component.type === type);
    if (match) {
      return match;
    }
  }
  return null;
}

function buildAssistantPlan(prompt: string): AssistantPlan {
  const normalized = prompt.toLowerCase();
  const actions: AssistantAction[] = [];
  const insights: string[] = [];
  const narrative: string[] = [];

  if (normalized.includes("inventory")) {
    actions.push(
      {
        actionType: "addComponent",
        componentType: "table",
        label: "Inventory Exceptions",
        properties: {
          columns: ["Material", "Plant", "Variance"],
          rows: [
            { Material: "F-100", Plant: "DAL1", Variance: "-384" },
            { Material: "F-220", Plant: "PHX2", Variance: "+142" },
          ],
        },
      },
      {
        actionType: "addComponent",
        componentType: "chart",
        label: "Cycle Count Accuracy",
        properties: { title: "Accuracy", series: [88, 94, 97] },
      },
      {
        actionType: "connectDataSource",
        sourceId: "inventory-db",
        name: "Inventory DB",
        targetType: "database",
        status: "connected",
        description: "Linked material ledger for live cycle counting",
      }
    );
    insights.push("Cycle count blueprint queued with accuracy telemetry and variance table.");
    narrative.push("Dropped inventory exceptions table + accuracy chart and re-synced the warehouse DB.");
  }

  if (normalized.includes("barcode")) {
    actions.push({
      actionType: "addComponent",
      componentType: "input",
      label: "Barcode Capture",
      properties: { placeholder: "Scan SSCC or GS1" },
      styles: { backgroundColor: "#f4f4ff" },
    });
    actions.push({
      actionType: "addComponent",
      componentType: "button",
      label: "Validate Scan",
      properties: { label: "Validate Scan", action: "api" },
    });
    actions.push({
      actionType: "connectDataSource",
      sourceId: "barcode-scanner",
      name: "Barcode Scanner",
      targetType: "device",
      status: "connected",
      description: "Enabled Zebra TC stream for instant validation",
    });
    insights.push("Scanner events mapped to validation workflow with API action stub.");
    narrative.push("Enabled the barcode capture lane with validation button and paired the scanner feed.");
  }

  if (normalized.includes("quality") || normalized.includes("qa")) {
    actions.push({
      actionType: "addComponent",
      componentType: "dashboard",
      label: "Quality Pulse",
      properties: { title: "QA Pulse" },
    });
    insights.push("Surface NCR queue with AI summaries and next-best action cues.");
    narrative.push("Added a QA pulse dashboard placeholder so you can wire NCR telemetry fast.");
  }

  if (normalized.includes("approval") || normalized.includes("workflow")) {
    actions.push({
      actionType: "addComponent",
      componentType: "workflow",
      label: "Approval Flow",
      properties: { steps: ["Draft", "QA", "Release"] },
    });
    insights.push("Connect this workflow to Decision Wizard or procurement approvals to stay compliant.");
    narrative.push("Sketched the approval workflow canvas with default draft → QA → release steps.");
  }

  if (normalized.includes("supplier") || normalized.includes("procurement")) {
    actions.push({
      actionType: "addComponent",
      componentType: "chart",
      label: "Supplier Risk",
      properties: { title: "Supplier Risk", series: [65, 35, 55] },
    });
    actions.push({
      actionType: "connectDataSource",
      sourceId: "sap-integration",
      name: "SAP Integration",
      targetType: "api",
      status: "connected",
      description: "Pulling vendor scorecards from SAP automatically",
    });
    insights.push("Mirror procurement KPIs and vendor risk scoring across orgs.");
    narrative.push("Stacked a supplier risk chart and tied in the SAP vendor feed.");
  }

  const componentCount = actions.filter((action) => action.actionType === "addComponent").length;

  if (!narrative.length) {
    narrative.push(
      componentCount
        ? "Components staged—wire them to your preferred data sources or ask for another workflow."
        : "I can scaffold UI, workflows, and data hookups. Mention a module, metric, or workflow and I'll draft it."
    );
  }

  if (componentCount && insights.length === 0) {
    insights.push("Wire these drops to SAP or your warehouse DB, then publish to preview.");
  }

  return {
    response: narrative.join(" "),
    insights,
    actions,
  };
}

function forgeComponentToCanvas(component: AppComponent, positionIndex: number): CanvasComponent {
  const meta = findComponentMeta(component.type);
  const column = positionIndex % 2;
  const row = Math.floor(positionIndex / 2);

  return {
    id: `${component.id}-canvas-${Date.now()}-${positionIndex}`,
    type: component.type,
    label: component.name,
    icon: meta?.icon ?? FileCode,
    x: 80 + column * 320,
    y: 80 + row * 180,
    width: typeof component.layout.width === "number" ? component.layout.width : 320,
    height: typeof component.layout.height === "number" ? component.layout.height : 160,
    properties: component.config.props ?? {},
    styles: component.config.styles ?? {},
  };
}

function mapDataSourceToStatus(source: ForgeApp["dataSources"][number]): DataSourceStatus {
  const normalizedType: DataSourceType =
    source.type === "database"
      ? "database"
      : source.type === "device"
        ? "device"
        : source.type === "file"
          ? "file"
          : "api";

  const normalizedStatus: DataSourceHealth =
    source.status === "connected" || source.status === "ready" || source.status === "error"
      ? source.status
      : "pending";

  const connectionDetails = (source.connection ?? {}) as Record<string, unknown>;
  const description =
    typeof connectionDetails.endpoint === "string"
      ? connectionDetails.endpoint
      : typeof connectionDetails.database === "string"
        ? connectionDetails.database
        : typeof connectionDetails.path === "string"
          ? connectionDetails.path
          : undefined;

  const lastSynced =
    typeof connectionDetails.lastSynced === "string"
      ? connectionDetails.lastSynced
      : typeof connectionDetails.lastSync === "string"
        ? connectionDetails.lastSync
        : undefined;

  return {
    id: source.id,
    name: source.name,
    type: normalizedType,
    status: normalizedStatus,
    description,
    lastSynced: lastSynced ?? new Date().toISOString(),
  };
}

export default function OruForgeBuilder() {
  const [activeMode, setActiveMode] = useState<"visual" | "code" | "preview">("visual");
  const [selectedApp] = useState<ForgeApp | null>(null);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<AppComponent | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const [showAIAssistant] = useState(true);
  const [canvasComponents, setCanvasComponents] = useState<CanvasComponent[]>([]);
  const { toast } = useToast();
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>(() => [
    {
      id: "assistant-welcome",
      role: "assistant",
      content:
        "Describe the workflow or dashboard you need. I can drop UI, wire data sources, and outline approvals for you.",
      timestamp: new Date().toISOString(),
      insights: ["Need barcode scanning, QA triage, or procurement workflows? Ask and I'll scaffold it."],
    },
  ]);
  const [assistantInput, setAssistantInput] = useState("");
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const [dataSources, setDataSources] = useState<DataSourceStatus[]>(() => [...initialDataSources]);

  const applyAssistantActions = (actions?: AssistantAction[]) => {
    if (!actions || actions.length === 0) {
      return;
    }

    const componentActions = actions.filter(
      (action): action is Extract<AssistantAction, { actionType: "addComponent" }> =>
        action.actionType === "addComponent"
    );

    if (componentActions.length > 0) {
      setCanvasComponents((current) => {
        let working = [...current];
        componentActions.forEach((action) => {
          const defaults = getDefaultComponentConfig(action.componentType);
          const meta = findComponentMeta(action.componentType);
          const index = working.length;
          const column = index % 2;
          const row = Math.floor(index / 2);
          const newComponent: CanvasComponent = {
            id: `${action.componentType}-${Date.now()}-${index}`,
            type: action.componentType,
            label: action.label,
            icon: meta?.icon ?? FileCode,
            x: 80 + column * 320,
            y: 80 + row * 180,
            width: action.size?.width ?? 320,
            height: action.size?.height ?? 140,
            properties: {
              ...(defaults.props ?? {}),
              ...(action.properties ?? {}),
            },
            styles: {
              ...(defaults.styles ?? {}),
              ...(action.styles ?? {}),
            },
          };
          working = [...working, newComponent];
        });
        return working;
      });
    }

    const dataSourceActions = actions.filter(
      (action): action is Extract<AssistantAction, { actionType: "connectDataSource" }> =>
        action.actionType === "connectDataSource"
    );

    if (dataSourceActions.length > 0) {
      setDataSources((current) => {
        const next = [...current];
        dataSourceActions.forEach((action) => {
          const index = next.findIndex((entry) => entry.id === action.sourceId);
          const entry: DataSourceStatus = {
            id: action.sourceId,
            name: action.name,
            type: action.targetType,
            status: action.status,
            description: action.description,
            lastSynced: new Date().toISOString(),
          };
          if (index >= 0) {
            next[index] = { ...next[index], ...entry };
          } else {
            next.push(entry);
          }
        });
        return next;
      });
    }
  };

  const handleAssistantPrompt = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setAssistantMessages((current) => [...current, userMessage]);
    setAssistantInput("");
    setIsAssistantThinking(true);

    setTimeout(() => {
      const plan = buildAssistantPlan(trimmed);
      applyAssistantActions(plan.actions);
      setAssistantMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: plan.response,
          insights: plan.insights,
          timestamp: new Date().toISOString(),
        },
      ]);
      setIsAssistantThinking(false);
    }, 450);
  };

  const handleMarketplaceInstall = (payload: MarketplaceInstallSuccess) => {
    const installedApp = payload.app.app;

    setCanvasComponents((current) => {
      const baseIndex = current.length;
      const drops = installedApp.components.slice(0, 4).map((component, index) =>
        forgeComponentToCanvas(component, baseIndex + index)
      );
      return drops.length > 0 ? [...current, ...drops] : current;
    });

    if (installedApp.dataSources.length > 0) {
      setDataSources((current) => {
        const map = new Map(current.map((entry) => [entry.id, entry]));
        installedApp.dataSources.forEach((source) => {
          map.set(source.id, mapDataSourceToStatus(source));
        });
        return Array.from(map.values());
      });
    }

    setAssistantMessages((current) => [
      ...current,
      {
        id: `assistant-install-${Date.now()}`,
        role: "assistant",
        content: `Installed ${installedApp.name} for ${payload.installation.workspaceId}. Key widgets are on the canvas—wire bindings and publish when ready.`,
        insights: [
          `Environment: ${payload.installation.environment}`,
          payload.installation.deploymentUrl ? `Preview: ${payload.installation.deploymentUrl}` : undefined,
        ].filter(Boolean) as string[],
        timestamp: new Date().toISOString(),
      },
    ]);

    toast({
      title: `${payload.installation.appName} deployed`,
      description: `${payload.installation.workspaceId} (${payload.installation.environment}) is ready`,
      variant: "success",
    });

    setShowMarketplace(false);
  };

  useEffect(() => {
    if (!selectedComponentId) {
      setSelectedComponent(null);
      return;
    }

    const target = canvasComponents.find((component) => component.id === selectedComponentId);
    if (target) {
      setSelectedComponent(convertCanvasComponentToAppComponent(target));
    } else {
      setSelectedComponent(null);
      setSelectedComponentId(null);
    }
  }, [canvasComponents, selectedComponentId]);

  const handleCanvasComponentSelect = (component: CanvasComponent) => {
    setSelectedComponentId(component.id);
    setSelectedComponent(convertCanvasComponentToAppComponent(component));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex min-h-screen bg-slate-50">
        {/* Left Sidebar - Component Library */}
        <div className="w-64 border-r bg-white">
          <div className="border-b p-4">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <Puzzle className="h-5 w-5 text-indigo-600" />
              Oru Forge
            </h2>
            <p className="mt-1 text-xs text-slate-500">Build custom apps without code</p>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 p-4">
            <button
              onClick={() => setShowTemplates(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              New App
            </button>
            <button
              onClick={() => setShowMarketplace(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50"
            >
              <Package className="h-4 w-4" />
              Marketplace
            </button>
          </div>

          {/* Component Library */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              {Object.entries(componentLibrary).map(([category, components]) => (
                <div key={category}>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    {category}
                  </h3>
                  <div className="space-y-1">
                    {components.map((component) => (
                      <ComponentDraggable
                        key={component.type}
                        component={component}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Builder Area */}
        <div className="flex flex-1 flex-col">
          {/* Top Toolbar */}
          <div className="border-b bg-white px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mode Switcher */}
                <div className="flex rounded-lg bg-slate-100 p-1">
                  <button
                    onClick={() => setActiveMode("visual")}
                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors ${
                      activeMode === "visual"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Layout className="h-4 w-4" />
                    Visual
                  </button>
                  <button
                    onClick={() => setActiveMode("code")}
                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors ${
                      activeMode === "code"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Code className="h-4 w-4" />
                    Code
                  </button>
                  <button
                    onClick={() => setActiveMode("preview")}
                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors ${
                      activeMode === "preview"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                </div>

                {/* App Info */}
                {selectedApp && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Editing:</span>
                    <span className="font-medium">{selectedApp.name}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      v{selectedApp.version}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Debug Mode */}
                <button
                  onClick={() => setIsDebugging(!isDebugging)}
                  className={`rounded-lg p-2 transition-colors ${
                    isDebugging
                      ? "bg-orange-100 text-orange-600"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Toggle Debug Console"
                >
                  <Terminal className="h-4 w-4" />
                </button>

                {/* Device Preview */}
                <div className="flex rounded-lg bg-slate-100 p-1">
                  <button className="rounded p-1.5 transition-colors hover:bg-white" title="Desktop">
                    <Monitor className="h-4 w-4 text-slate-600" />
                  </button>
                  <button className="rounded p-1.5 transition-colors hover:bg-white" title="Tablet">
                    <Tablet className="h-4 w-4 text-slate-600" />
                  </button>
                  <button className="rounded p-1.5 transition-colors hover:bg-white" title="Mobile">
                    <Smartphone className="h-4 w-4 text-slate-600" />
                  </button>
                </div>

                {/* Actions */}
                <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50">
                  <Save className="h-4 w-4" />
                  Save
                </button>
                <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700">
                  <Play className="h-4 w-4" />
                  Test
                </button>
                <button className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-white hover:bg-green-700">
                  <Cloud className="h-4 w-4" />
                  Deploy
                </button>
              </div>
            </div>
          </div>

          {/* Builder Content */}
          <div className="flex flex-1">
            <div className="relative flex-1">
              {activeMode === "visual" && (
                <VisualBuilderCanvas
                  onComponentSelect={handleCanvasComponentSelect}
                  components={canvasComponents}
                  onComponentsChange={setCanvasComponents}
                />
              )}

              {activeMode === "code" && (
                <CodeEditorPlaceholder
                  app={selectedApp}
                  component={selectedComponent}
                />
              )}

              {activeMode === "preview" && (
                <PreviewPane components={canvasComponents} />
              )}
            </div>

            {/* Right Sidebar - Properties & AI Assistant */}
            <div className="w-80 border-l bg-white">
              {/* Properties Panel */}
              {selectedComponent && (
                <div className="border-b">
                  <div className="p-4">
                    <h3 className="mb-3 font-semibold text-slate-900">
                      Component Properties
                    </h3>
                    <PropertyEditor
                      component={selectedComponent}
                      onChange={(updated) => {
                        setSelectedComponent(updated);
                        setCanvasComponents((current) =>
                          current.map((component) =>
                            component.id === updated.id
                              ? {
                                  ...component,
                                  label: updated.name,
                                  x: updated.layout.x,
                                  y: updated.layout.y,
                                  width:
                                    typeof updated.layout.width === "number"
                                      ? updated.layout.width
                                      : component.width,
                                  height:
                                    typeof updated.layout.height === "number"
                                      ? updated.layout.height
                                      : component.height,
                                  properties: updated.config.props,
                                  styles: updated.config.styles,
                                }
                              : component
                          )
                        );
                      }}
                    />
                  </div>
                </div>
              )}

              {/* AI Assistant */}
              {showAIAssistant && (
                <div className="flex h-full flex-col gap-4 p-4">
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                          Forge Copilot
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900">Forge AI Assistant</h3>
                        <p className="text-sm text-slate-600">
                          Describe the workflow, metric, or automation you need. I'll scaffold the rest.
                        </p>
                      </div>
                      <div className="rounded-xl bg-white p-2 shadow">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {assistantQuickPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => handleAssistantPrompt(prompt)}
                          className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-purple-700 shadow-sm transition hover:bg-white"
                        >
                          <Sparkles className="h-3 w-3" />
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex h-64 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                      {assistantMessages.map((message) => (
                        <AssistantMessageBubble key={message.id} message={message} />
                      ))}
                      {isAssistantThinking && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Drafting a plan...
                        </div>
                      )}
                    </div>
                    <form
                      className="border-t border-slate-100 bg-slate-50 px-3 py-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleAssistantPrompt(assistantInput);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          value={assistantInput}
                          onChange={(event) => setAssistantInput(event.target.value)}
                          placeholder="e.g. Build inventory counting with barcode validation"
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!assistantInput.trim() || isAssistantThinking}
                          className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <Send className="h-4 w-4" />
                          Ask
                        </button>
                      </div>
                    </form>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blueprints</p>
                    <div className="mt-2 space-y-2">
                      {assistantBlueprints.map((blueprint) => (
                        <button
                          key={blueprint.title}
                          type="button"
                          onClick={() => handleAssistantPrompt(blueprint.prompt)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-indigo-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{blueprint.title}</p>
                              <p className="text-xs text-slate-500">{blueprint.description}</p>
                            </div>
                            <Wand2 className="h-4 w-4 text-indigo-600" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 font-medium text-slate-900">Data Sources</h4>
                    <div className="space-y-2">
                      {dataSources.map((source) => (
                        <DataSourceCard key={source.id} {...source} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Debug Console */}
          {isDebugging && (
            <div className="h-48 overflow-y-auto border-t bg-slate-900 p-4 font-mono text-xs text-white">
              <div className="text-slate-400">[12:34:56] Component mounted: DataTable</div>
              <div className="text-green-400">[12:34:57] API call successful: /api/inventory</div>
              <div className="text-yellow-400">
                [12:34:58] Warning: Large dataset detected (5000+ rows)
              </div>
              <div className="text-slate-400">[12:34:59] Render complete in 45ms</div>
            </div>
          )}
        </div>

        {/* Template Gallery Modal */}
        <AnimatePresence>
          {showTemplates && (
            <TemplateGalleryModal
              templates={appTemplates}
              onSelect={() => {
                // TODO: Load template
                setShowTemplates(false);
              }}
              onClose={() => setShowTemplates(false)}
            />
          )}
        </AnimatePresence>

        {/* Marketplace Modal */}
        <AnimatePresence>
          {showMarketplace && (
            <MarketplaceModal
              onInstall={handleMarketplaceInstall}
              onClose={() => setShowMarketplace(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </DndProvider>
  );
}

function ComponentDraggable({
  component,
}: {
  component: { type: string; label: string; icon: React.ComponentType<{ className?: string }> };
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "component",
    item: component,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const Icon = component.icon;

  return (
    <div
      ref={drag}
      className={`flex cursor-move items-center gap-2 rounded-lg px-3 py-2 transition-all ${
        isDragging ? "opacity-50" : "hover:bg-slate-100"
      }`}
    >
      <Icon className="h-4 w-4 text-slate-500" />
      <span className="text-sm text-slate-700">{component.label}</span>
    </div>
  );
}

interface DroppedComponent {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CanvasComponent {
  id: string;
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, unknown>;
  styles: Record<string, unknown>;
}

function getDefaultComponentConfig(type: string) {
  switch (type) {
    case "text":
      return {
        props: { content: "Rich text block" },
        styles: { fontSize: 16, color: "#0f172a" },
      };
    case "button":
      return {
        props: { label: "Action", action: "submit" },
        styles: { backgroundColor: "#4f46e5", color: "#ffffff", padding: 12 },
      };
    case "input":
      return {
        props: { placeholder: "Enter value", inputType: "text" },
        styles: { backgroundColor: "#ffffff", color: "#0f172a", padding: 12 },
      };
    case "table":
      return {
        props: {
          columns: ["Item", "Quantity", "Status"],
          rows: [
            { Item: "Sample", Quantity: "12", Status: "Ready" },
            { Item: "Demo", Quantity: "4", Status: "Pending" },
          ],
        },
        styles: { backgroundColor: "#ffffff" },
      };
    case "chart":
      return {
        props: {
          title: "Performance",
          series: [40, 60],
        },
        styles: { backgroundColor: "#ffffff", padding: 16 },
      };
    default:
      return {
        props: {},
        styles: { backgroundColor: "#ffffff", color: "#0f172a", padding: 16 },
      };
  }
}

function convertCanvasComponentToAppComponent(component: CanvasComponent): AppComponent {
  return {
    id: component.id,
    name: component.label,
    type: component.type as AppComponent["type"],
    config: {
      template: "default",
      props: component.properties,
      styles: component.styles,
      responsive: {},
      accessibility: {},
    },
    layout: {
      x: component.x,
      y: component.y,
      width: component.width,
      height: component.height,
      zIndex: 1,
    },
    bindings: [],
    events: [],
    permissions: [],
  };
}

function CanvasComponentPreview({
  component,
  onSelect,
  onDelete,
}: {
  component: CanvasComponent;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "canvas-component",
    item: component,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const Icon = component.icon;

  return (
    <div
      ref={drag}
      onClick={onSelect}
      className={`group absolute cursor-move rounded-lg border-2 border-indigo-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-500 hover:shadow-md ${
        isDragging ? "opacity-50" : ""
      }`}
      style={{
        left: component.x,
        top: component.y,
        width: component.width,
        minHeight: component.height,
        backgroundColor: (component.styles.backgroundColor as string) || "#ffffff",
        color: (component.styles.color as string) || "#0f172a",
        padding: (component.styles.padding as number | string | undefined) ?? 16,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-medium text-slate-700">{component.label}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        >
          <X className="h-4 w-4 text-slate-400 hover:text-rose-600" />
        </button>
      </div>
      <div className="mt-2 text-xs text-slate-500">
        {component.type.charAt(0).toUpperCase() + component.type.slice(1)} Component
      </div>
    </div>
  );
}

function VisualBuilderCanvas({
  onComponentSelect,
  components,
  onComponentsChange,
}: {
  onComponentSelect: (component: CanvasComponent) => void;
  components: CanvasComponent[];
  onComponentsChange: (components: CanvasComponent[]) => void;
}) {
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "component",
      drop: (item: DroppedComponent, monitor) => {
        const clientOffset = monitor.getClientOffset();
        const bounds = canvasRef.current?.getBoundingClientRect();
        if (clientOffset && bounds) {
          const defaults = getDefaultComponentConfig(item.type);
          const newComponent: CanvasComponent = {
            id: `${item.type}-${Date.now()}`,
            type: item.type,
            label: item.label,
            icon: item.icon,
            x: clientOffset.x - bounds.left,
            y: clientOffset.y - bounds.top,
            width: 260,
            height: 120,
            properties: defaults.props,
            styles: defaults.styles,
          };
          onComponentsChange([...components, newComponent]);
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }),
    [components, onComponentsChange]
  );

  return (
    <div
      ref={(node) => {
        canvasRef.current = node;
        if (node) {
          drop(node);
        }
      }}
      className={`flex-1 p-8 transition-colors ${isOver ? "bg-indigo-50" : "bg-slate-50"}`}
    >
      <div className="mx-auto max-w-6xl">
        {/* Canvas Grid */}
        <div
          className="relative min-h-[600px] rounded-xl bg-white shadow-sm"
          style={{
            backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          {components.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Puzzle className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                <p className="text-slate-500">Drag components here to start building</p>
                <p className="mt-1 text-sm text-slate-400">
                  or select a template to get started
                </p>
              </div>
            </div>
          )}

          {components.map((component) => (
            <CanvasComponentPreview
              key={component.id}
              component={component}
              onSelect={() => onComponentSelect(component)}
              onDelete={() => {
                onComponentsChange(components.filter((c) => c.id !== component.id));
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CodeEditorPlaceholder({ component }: { app: ForgeApp | null; component: AppComponent | null }) {
  const [MonacoEditor, setMonacoEditor] = useState<React.ComponentType<{
    height: string;
    defaultLanguage: string;
    defaultValue: string;
    theme: string;
    onChange?: (value: string | undefined) => void;
    options?: Record<string, unknown>;
  }> | null>(null);

  const [code, setCode] = useState(
    component
      ? `// Component: ${component.name}
// Type: ${component.type}

export default function ${component.name.replace(/\s+/g, "")}() {
  return (
    <div className="p-4">
      <h2>${component.name}</h2>
      {/* Add your component logic here */}
    </div>
  );
}`
      : `// Select a component to edit its code
// or create a new component from the palette

export default function MyComponent() {
  return <div>Hello from Oru Forge!</div>;
}`
  );

  // Dynamically import Monaco Editor
  useEffect(() => {
    let mounted = true;
    import("@monaco-editor/react").then((monaco) => {
      if (mounted) {
        setMonacoEditor(() => monaco.default);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!MonacoEditor) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-900 text-white">
        <Code className="mb-4 h-12 w-12 animate-pulse text-slate-600" />
        <p className="text-lg font-medium text-slate-300">Loading Code Editor...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-300">
            {component?.name || "Untitled Component"}.tsx
          </span>
        </div>
        <div className="flex gap-2">
          <button className="rounded px-3 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white">
            Format
          </button>
          <button className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700">
            Save
          </button>
        </div>
      </div>
      <MonacoEditor
        height="100%"
        defaultLanguage="typescript"
        defaultValue={code}
        theme="vs-dark"
        onChange={(value) => setCode(value || "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}

function PreviewPane({ components }: { components: CanvasComponent[] }) {
  const previewHtml = useMemo(() => generatePreviewHtml(components), [components]);

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Live Preview</p>
          <p className="text-xs text-slate-500">
            {components.length} component{components.length === 1 ? "" : "s"} rendered
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
          Sandboxed
        </span>
      </div>
      <iframe
        title="Oru Forge Preview"
        className="flex-1 bg-white"
        sandbox="allow-scripts allow-same-origin"
        srcDoc={previewHtml}
      />
    </div>
  );
}

function PropertyEditor({
  component,
  onChange,
}: {
  component: AppComponent;
  onChange: (updated: AppComponent) => void;
}) {
  const updateProperty = (key: string, value: unknown) => {
    onChange({
      ...component,
      config: {
        ...component.config,
        props: {
          ...component.config.props,
          [key]: value,
        },
      },
    });
  };

  const updateStyle = (key: string, value: unknown) => {
    onChange({
      ...component,
      config: {
        ...component.config,
        styles: {
          ...component.config.styles,
          [key]: value,
        },
      },
    });
  };

  const updateLayout = (key: keyof typeof component.layout, value: number | string) => {
    onChange({
      ...component,
      layout: {
        ...component.layout,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Component ID</label>
        <input
          type="text"
          value={component.id}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm"
          disabled
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Name</label>
        <input
          type="text"
          value={component.name}
          onChange={(e) => onChange({ ...component, name: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Type</label>
        <input
          type="text"
          value={component.type}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm"
          disabled
        />
      </div>

      {/* Layout Properties */}
      <div className="border-t border-slate-200 pt-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-700">
          Layout
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">X Position</label>
            <input
              type="number"
              value={component.layout.x}
              onChange={(e) => updateLayout("x", parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Y Position</label>
            <input
              type="number"
              value={component.layout.y}
              onChange={(e) => updateLayout("y", parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Width</label>
            <input
              type="number"
              value={typeof component.layout.width === "number" ? component.layout.width : ""}
              onChange={(e) => updateLayout("width", parseInt(e.target.value) || "auto")}
              placeholder="auto"
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Height</label>
            <input
              type="number"
              value={typeof component.layout.height === "number" ? component.layout.height : ""}
              onChange={(e) => updateLayout("height", parseInt(e.target.value) || "auto")}
              placeholder="auto"
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Style Properties */}
      <div className="border-t border-slate-200 pt-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-700">
          Styling
        </h4>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Background Color
            </label>
            <input
              type="color"
              value={(component.config.styles.backgroundColor as string) || "#ffffff"}
              onChange={(e) => updateStyle("backgroundColor", e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Text Color</label>
            <input
              type="color"
              value={(component.config.styles.color as string) || "#000000"}
              onChange={(e) => updateStyle("color", e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Padding</label>
            <input
              type="number"
              value={(component.config.styles.padding as number) || 0}
              onChange={(e) => updateStyle("padding", parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Component-Specific Properties */}
      {component.type === "button" && (
        <div className="border-t border-slate-200 pt-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-700">
            Button Properties
          </h4>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Button Text</label>
              <input
                type="text"
                value={(component.config.props.label as string) || ""}
                onChange={(e) => updateProperty("label", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Click Me"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Action</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                value={(component.config.props.action as string) || "submit"}
                onChange={(e) => updateProperty("action", e.target.value)}
              >
                <option value="submit">Submit Form</option>
                <option value="navigate">Navigate</option>
                <option value="api">API Call</option>
                <option value="custom">Custom Function</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {component.type === "input" && (
        <div className="border-t border-slate-200 pt-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-700">
            Input Properties
          </h4>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Placeholder</label>
              <input
                type="text"
                value={(component.config.props.placeholder as string) || ""}
                onChange={(e) => updateProperty("placeholder", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Enter text..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Input Type</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                value={(component.config.props.inputType as string) || "text"}
                onChange={(e) => updateProperty("inputType", e.target.value)}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="password">Password</option>
                <option value="tel">Phone</option>
                <option value="url">URL</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generatePreviewHtml(components: CanvasComponent[]) {
  const content =
    components.length > 0
      ? components
          .slice()
          .sort((a, b) => a.y - b.y || a.x - b.x)
          .map((component) => renderPreviewComponent(component))
          .join("\n")
      : '<div class="empty-state">Drop components onto the canvas to see the preview.</div>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; padding: 24px; background: #f8fafc; color: #0f172a; }
    .app-root { max-width: 960px; margin: 0 auto; }
    .component { border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 16px; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05); }
    .component.button { border: none; cursor: pointer; font-weight: 600; text-align: center; }
    .component.input { display: flex; flex-direction: column; gap: 8px; }
    .component.table table { width: 100%; border-collapse: collapse; }
    .component.table th { text-align: left; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .component.table th, .component.table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .component.chart { height: 200px; display: flex; align-items: flex-end; gap: 8px; }
    .component.chart .bar { flex: 1; border-radius: 8px 8px 0 0; background: linear-gradient(135deg, #6366f1, #a855f7); }
    .empty-state { padding: 48px; text-align: center; border-radius: 16px; background: #fff; border: 1px dashed #cbd5f5; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="app-root">
    ${content}
  </div>
</body>
</html>`;
}

function renderPreviewComponent(component: CanvasComponent) {
  const baseStyles = {
    backgroundColor: (component.styles.backgroundColor as string) ?? "#ffffff",
    color: (component.styles.color as string) ?? "#0f172a",
    padding: (component.styles.padding as number | string | undefined) ?? 16,
  };
  const styleAttr = styleObjectToString(baseStyles);
  const props = component.properties;

  switch (component.type) {
    case "text":
      return `<div class="component" style="${styleAttr}">${escapeHtml(
        (props.content as string | undefined) ?? component.label
      )}</div>`;
    case "button":
      return `<button class="component button" style="${styleAttr}">${escapeHtml(
        (props.label as string | undefined) ?? component.label
      )}</button>`;
    case "input":
      return `<label class="component input" style="${styleAttr}">
        <span>${escapeHtml(component.label)}</span>
        <input
          style="padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px;"
          type="${escapeHtml((props.inputType as string | undefined) ?? "text")}"
          placeholder="${escapeHtml((props.placeholder as string | undefined) ?? "Enter value")}" />
      </label>`;
    case "table":
      const columns = props.columns as string[] | undefined;
      const rows = props.rows as Record<string, string>[] | undefined;
      return `<div class="component table" style="${styleAttr}">
        <table>
          <thead>
            <tr>
              ${(columns ?? [])
                .map((column) => `<th>${escapeHtml(column)}</th>`)
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${(rows ?? [])
              .map(
                (row) =>
                  `<tr>${(columns ?? [])
                    .map((column) => `<td>${escapeHtml(row[column] ?? "")}</td>`)
                    .join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`;
    case "chart":
      const series = (props.series as number[] | undefined) ?? [30, 60, 45];
      const maxValue = Math.max(...series, 100);
      return `<div class="component chart" style="${styleAttr}">
        ${series
          .map((value) => `<div class="bar" style="height:${(value / maxValue) * 100}%"></div>`)
          .join("")}
      </div>`;
    default:
      return `<div class="component" style="${styleAttr}">
        <strong>${escapeHtml(component.label)}</strong>
        <p style="margin-top: 8px; color: #64748b; font-size: 13px;">
          ${escapeHtml(component.type)} component preview
        </p>
      </div>`;
  }
}

function styleObjectToString(styles: Record<string, unknown>) {
  return Object.entries(styles)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
      const cssValue = typeof value === "number" ? `${value}px` : String(value);
      return `${cssKey}:${cssValue}`;
    })
    .join(";");
}

function escapeHtml(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function DataSourceCard({ name, type, status, description, lastSynced }: DataSourceStatus) {
  const icons: Record<DataSourceType, React.ComponentType<{ className?: string }>> = {
    database: Database,
    api: Zap,
    device: Smartphone,
    file: FileCode,
  };
  const Icon = icons[type] ?? Database;

  const statusColors: Record<DataSourceHealth, string> = {
    connected: "text-green-600 bg-green-100",
    ready: "text-blue-600 bg-blue-100",
    error: "text-rose-600 bg-rose-100",
    pending: "text-amber-600 bg-amber-100",
  };

  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-slate-500" />
        <div>
          <div className="text-sm font-medium text-slate-900">{name}</div>
          <div className="text-xs capitalize text-slate-500">{type}</div>
          {description && <div className="text-xs text-slate-400">{description}</div>}
          {lastSynced && (
            <div className="text-[10px] text-slate-400">
              Updated {new Date(lastSynced).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
      <span className={`rounded-full px-2 py-1 text-xs capitalize ${statusColors[status]}`}>
        {statusLabel}
      </span>
    </div>
  );
}

function TemplateGalleryModal({
  templates,
  onSelect,
  onClose,
}: {
  templates: AppTemplate[];
  onSelect: (template: AppTemplate) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-h-[90vh] w-4/5 max-w-6xl overflow-hidden rounded-xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Choose a Template</h2>
              <p className="mt-1 text-sm text-slate-500">
                Start building faster with pre-built templates
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => onSelect(template)}
                className="cursor-pointer overflow-hidden rounded-xl border border-slate-200 transition-shadow hover:shadow-lg"
              >
                <div className="aspect-video bg-slate-100" />
                <div className="p-4">
                  <h3 className="font-medium text-slate-900">{template.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{template.description}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span>{template.components} components</span>
                    <span>{template.workflows} workflows</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AssistantMessageBubble({ message }: { message: AssistantMessage }) {
  const isAssistant = message.role === "assistant";
  const Icon = isAssistant ? Brain : User;
  return (
    <div className={`flex gap-2 ${isAssistant ? "" : "flex-row-reverse"}`}>
      <div
        className={`rounded-full border p-2 ${
          isAssistant ? "border-purple-100 bg-white text-purple-600" : "border-slate-200 bg-white text-slate-500"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div
        className={`max-w-[240px] rounded-2xl p-3 text-sm shadow-sm ${
          isAssistant ? "border border-slate-200 bg-white text-slate-700" : "bg-indigo-600 text-white"
        }`}
      >
        <p>{message.content}</p>
        {message.insights && message.insights.length > 0 && (
          <ul className={`mt-2 space-y-1 text-xs ${isAssistant ? "text-slate-500" : "text-indigo-100"}`}>
            {message.insights.map((insight) => (
              <li key={insight} className="flex items-start gap-1">
                <Sparkles className="mt-0.5 h-3 w-3" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        )}
        <p className={`mt-2 text-[10px] ${isAssistant ? "text-slate-400" : "text-indigo-200"}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

function Tablet({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" strokeWidth={2} />
      <line x1="12" y1="18" x2="12" y2="18" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}
