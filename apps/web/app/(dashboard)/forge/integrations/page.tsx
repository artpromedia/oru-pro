"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Cloud,
  Code,
  Database,
  FileJson,
  Globe,
  Key,
  Link,
  Lock,
  Package,
  Play,
  Pause,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  Terminal,
  TrendingUp,
  Unlock,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useToast } from "../../../../hooks/use-toast";

interface Connector {
  id: string;
  name: string;
  type: ConnectorType;
  provider: string;
  status: ConnectorStatus;
  config: ConnectorConfig;
  authentication: AuthConfig;
  mappings: DataMapping[];
  syncStatus: SyncStatus;
  metrics: ConnectorMetrics;
}

interface ConnectorConfig {
  endpoint?: string;
  database?: string;
  schema?: string;
  polling?: number;
  batchSize?: number;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

interface DataMapping {
  source: string;
  target: string;
  transform?: string;
  validation?: string;
  defaultValue?: unknown;
}

interface AuthConfig {
  type: "oauth2" | "apikey" | "basic" | "certificate";
  status: "valid" | "expired" | "invalid";
  rotateAfterDays?: number;
}

interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  maxBackoff: number;
}

interface SyncStatus {
  lastSync: string;
  recordsSynced: number;
  errors: number;
  mode?: "streaming" | "batch";
  durationMs?: number;
}

interface ConnectorMetrics {
  uptime: number;
  latency: number;
  throughput: number;
  errorRate?: number;
}

interface ConnectorCatalogItem {
  id: string;
  name: string;
  type: ConnectorType;
  provider: string;
  icon: LucideIcon;
  latencySla: string;
}

interface SyncEvent {
  id: string;
  connector: string;
  timestamp: string;
  status: "success" | "warning" | "error";
  records: number;
  message: string;
}

interface Alert {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
  connectorId: string;
  timestamp: string;
}

interface IntegrationRecommendation {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  actionLabel: string;
  connectorId?: string;
}

type ConnectorType = "database" | "api" | "erp" | "file" | "iot" | "cloud";
type ConnectorStatus = "connected" | "disconnected" | "error" | "syncing";

type StatPalette = "blue" | "green" | "purple" | "indigo" | "amber" | "pink";

const STATUS_FILTERS: (ConnectorStatus | "all")[] = ["all", "connected", "syncing", "error", "disconnected"];

const connectorCatalog: ConnectorCatalogItem[] = [
  { id: "sap", name: "SAP ECC", type: "erp", provider: "SAP", icon: Server, latencySla: "<200ms" },
  { id: "oracle", name: "Oracle ERP", type: "erp", provider: "Oracle", icon: Database, latencySla: "<250ms" },
  { id: "salesforce", name: "Salesforce", type: "api", provider: "Salesforce", icon: Globe, latencySla: "<150ms" },
  { id: "mssql", name: "Microsoft SQL", type: "database", provider: "Microsoft", icon: Database, latencySla: "<120ms" },
  { id: "postgres", name: "PostgreSQL", type: "database", provider: "PostgreSQL", icon: Database, latencySla: "<120ms" },
  { id: "mongo", name: "MongoDB Atlas", type: "database", provider: "MongoDB", icon: Database, latencySla: "<180ms" },
  { id: "s3", name: "AWS S3", type: "cloud", provider: "Amazon", icon: Cloud, latencySla: "<250ms" },
  { id: "azure", name: "Azure Blob", type: "cloud", provider: "Microsoft", icon: Cloud, latencySla: "<250ms" },
  { id: "mqtt", name: "MQTT Broker", type: "iot", provider: "HiveMQ", icon: Zap, latencySla: "<90ms" },
  { id: "opc", name: "OPC UA", type: "iot", provider: "Siemens", icon: Activity, latencySla: "<95ms" },
  { id: "sftp", name: "Secure FTP", type: "file", provider: "Generic", icon: FileJson, latencySla: "Schedule" },
];

const initialConnectors: Connector[] = [
  {
    id: "sap-erp",
    name: "SAP S/4HANA Production",
    type: "erp",
    provider: "SAP",
    status: "connected",
    config: {
      endpoint: "https://sap-prod.oru.corp",
      polling: 60,
      timeout: 45,
      retryPolicy: {
        maxRetries: 5,
        backoffMultiplier: 2,
        maxBackoff: 120,
      },
    },
    authentication: {
      type: "oauth2",
      status: "valid",
      rotateAfterDays: 18,
    },
    mappings: [
      {
        source: "SAP.Materials",
        target: "Forge.Items",
        transform: "mapFields(['MATNR','WERKS'], ['sku','plant'])",
        validation: "required(['MATNR','WERKS'])",
      },
      {
        source: "SAP.ProductionOrder",
        target: "Forge.WorkOrders",
        transform: "rename('AUFNR','orderId')",
      },
    ],
    syncStatus: {
      lastSync: new Date().toISOString(),
      recordsSynced: 15234,
      errors: 0,
      mode: "streaming",
      durationMs: 4200,
    },
    metrics: {
      uptime: 99.9,
      latency: 145,
      throughput: 1200,
      errorRate: 0.01,
    },
  },
  {
    id: "salesforce",
    name: "Salesforce CRM",
    type: "api",
    provider: "Salesforce",
    status: "syncing",
    config: {
      endpoint: "https://api.salesforce.com",
      polling: 15,
      batchSize: 500,
    },
    authentication: {
      type: "oauth2",
      status: "valid",
      rotateAfterDays: 26,
    },
    mappings: [
      {
        source: "SFDC.Opportunity",
        target: "Forge.Pipeline",
        transform: "flatten(['owner','stage'])",
      },
    ],
    syncStatus: {
      lastSync: new Date(Date.now() - 1000 * 60).toISOString(),
      recordsSynced: 8642,
      errors: 2,
      mode: "batch",
      durationMs: 6200,
    },
    metrics: {
      uptime: 99.1,
      latency: 180,
      throughput: 980,
      errorRate: 0.08,
    },
  },
  {
    id: "s3-data-lake",
    name: "AWS S3 Data Lake",
    type: "cloud",
    provider: "AWS",
    status: "connected",
    config: {
      endpoint: "s3://oru-data-lake",
      polling: 5,
      batchSize: 1000,
    },
    authentication: {
      type: "apikey",
      status: "valid",
      rotateAfterDays: 6,
    },
    mappings: [
      {
        source: "Forge.Analytics",
        target: "S3.RawEvents",
        transform: "serialize('parquet')",
      },
    ],
    syncStatus: {
      lastSync: new Date(Date.now() - 1000 * 30).toISOString(),
      recordsSynced: 242001,
      errors: 0,
      mode: "streaming",
    },
    metrics: {
      uptime: 98.7,
      latency: 210,
      throughput: 3100,
      errorRate: 0.03,
    },
  },
];

const seedSyncEvents: SyncEvent[] = [
  {
    id: "evt-1",
    connector: "SAP S/4HANA Production",
    timestamp: new Date().toISOString(),
    status: "success",
    records: 1200,
    message: "Production orders acknowledged",
  },
  {
    id: "evt-2",
    connector: "Salesforce CRM",
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    status: "warning",
    records: 420,
    message: "2 records failed validation",
  },
  {
    id: "evt-3",
    connector: "AWS S3 Data Lake",
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    status: "success",
    records: 5032,
    message: "Telemetry batch archived",
  },
];

const seedAlerts: Alert[] = [
  {
    id: "alrt-1",
    severity: "warning",
    message: "Salesforce connector retried 3 times in the last hour",
    connectorId: "salesforce",
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: "alrt-2",
    severity: "info",
    message: "S3 API key rotation scheduled in 6 days",
    connectorId: "s3-data-lake",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
];

const activityLog = [
  {
    id: "act-1",
    actor: "Integration Copilot",
    action: "deployed a schema mapping",
    detail: "SAP.Materials -> Forge.Items",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "act-2",
    actor: "Maya Patel",
    action: "adjusted retry policy",
    detail: "Salesforce connector maxRetries = 5",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "act-3",
    actor: "Automation",
    action: "rotated credential",
    detail: "AWS S3 access key",
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
];

const initialRecommendations: IntegrationRecommendation[] = [
  {
    id: "rec-1",
    title: "Tighten SAP polling window",
    description: "Reduce SAP S/4HANA polling to 30s to match production takt time and avoid queue spikes.",
    impact: "high",
    actionLabel: "Apply change",
    connectorId: "sap-erp",
  },
  {
    id: "rec-2",
    title: "Rotate Salesforce secret",
    description: "Creds expire in 26 days. Stage a new OAuth secret and schedule a maintenance window.",
    impact: "medium",
    actionLabel: "Schedule rotation",
    connectorId: "salesforce",
  },
  {
    id: "rec-3",
    title: "Enable S3 checksum verification",
    description: "Turn on MD5 validation for the S3 data lake export to harden cold-chain traceability.",
    impact: "low",
    actionLabel: "Enable checksum",
    connectorId: "s3-data-lake",
  },
];

function draftConnectorFromCatalog(item: ConnectorCatalogItem): Connector {
  const now = Date.now();
  const baseEndpoint = item.type === "file" ? `sftp://${item.id}.oru.corp` : `https://${item.id}.oru.integrations`;

  return {
    id: `${item.id}-${now}`,
    name: `${item.name} Sandbox`,
    type: item.type,
    provider: item.provider,
    status: "disconnected",
    config: {
      endpoint: baseEndpoint,
      polling: item.type === "iot" ? 5 : 30,
      batchSize: item.type === "file" ? 5000 : 500,
      timeout: 60,
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        maxBackoff: 90,
      },
    },
    authentication: {
      type: "apikey",
      status: "invalid",
      rotateAfterDays: 7,
    },
    mappings: [],
    syncStatus: {
      lastSync: new Date(now).toISOString(),
      recordsSynced: 0,
      errors: 0,
      mode: "batch",
    },
    metrics: {
      uptime: 0,
      latency: 0,
      throughput: 0,
      errorRate: 0,
    },
  };
}

export default function IntegrationHub() {
  const [connectors, setConnectors] = useState<Connector[]>(initialConnectors);
  const [catalogFilter, setCatalogFilter] = useState<ConnectorType | "all">("all");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [selectedConnectorId, setSelectedConnectorId] = useState<string>(initialConnectors[0]?.id ?? "");
  const [events, setEvents] = useState<SyncEvent[]>(seedSyncEvents);
  const [alertFeed, setAlertFeed] = useState<Alert[]>(seedAlerts);
  const [statusFilter, setStatusFilter] = useState<ConnectorStatus | "all">("all");
  const [integrationQuery, setIntegrationQuery] = useState("");
  const [recommendations, setRecommendations] = useState<IntegrationRecommendation[]>(initialRecommendations);
  const { toast } = useToast();

  const filteredCatalog = useMemo(() => {
    let items = catalogFilter === "all" ? connectorCatalog : connectorCatalog.filter((item) => item.type === catalogFilter);
    if (catalogQuery.trim()) {
      const query = catalogQuery.toLowerCase();
      items = items.filter((item) => `${item.name} ${item.provider}`.toLowerCase().includes(query));
    }
    return items;
  }, [catalogFilter, catalogQuery]);

  const selectedConnector = connectors.find((c) => c.id === selectedConnectorId) ?? connectors[0] ?? null;

  const statusCounts = useMemo(() => {
    return connectors.reduce(
      (acc, connector) => {
        acc[connector.status] += 1;
        return acc;
      },
      { connected: 0, disconnected: 0, error: 0, syncing: 0 } as Record<ConnectorStatus, number>,
    );
  }, [connectors]);

  const filteredIntegrations = useMemo(() => {
    const pool = statusFilter === "all" ? connectors : connectors.filter((connector) => connector.status === statusFilter);
    if (!integrationQuery.trim()) return pool;
    const query = integrationQuery.toLowerCase();
    return pool.filter((connector) => `${connector.name} ${connector.provider}`.toLowerCase().includes(query));
  }, [connectors, statusFilter, integrationQuery]);

  const healthCards = useMemo<{ label: string; value: string; trend: string; icon: LucideIcon }[]>(() => {
    const totalErrors = connectors.reduce((sum, c) => sum + c.syncStatus.errors, 0);
    const avgThroughput = Math.round(
      connectors.reduce((sum, c) => sum + c.metrics.throughput, 0) / Math.max(connectors.length, 1),
    );
    const credsExpiring = connectors.filter((c) => c.authentication.status !== "valid").length;
    return [
      { label: "Errors (24h)", value: totalErrors.toString(), trend: "Retry queue monitored", icon: AlertTriangle },
      { label: "Avg Throughput", value: `${avgThroughput}/min`, trend: "Across active connectors", icon: Activity },
      { label: "Credential Alerts", value: credsExpiring.toString(), trend: "Needing rotation", icon: Key },
    ];
  }, [connectors]);

  const handleProvisionConnector = (catalogItem: ConnectorCatalogItem) => {
    const drafted = draftConnectorFromCatalog(catalogItem);
    setConnectors((previous) => [...previous, drafted]);
    setSelectedConnectorId(drafted.id);
    setAlertFeed((previous) => [
      {
        id: `alert-${Date.now()}`,
        severity: "info",
        message: `${catalogItem.name} blueprint deployed. Configure credentials to activate.`,
        connectorId: drafted.id,
        timestamp: new Date().toISOString(),
      },
      ...previous,
    ]);
    toast({
      title: `${catalogItem.name} connector provisioned`,
      description: "Credentials required before syncing.",
    });
  };

  const handleTriggerSync = () => {
    if (!selectedConnector) {
      toast({ title: "Select a connector", description: "Choose a connector to trigger a sync." });
      return;
    }

    const records = Math.round(500 + Math.random() * 2500);
    const errorOccurred = Math.random() < 0.07;
    const duration = 3000 + Math.round(Math.random() * 3500);

    setConnectors((previous) =>
      previous.map((connector) =>
        connector.id === selectedConnector.id
          ? {
              ...connector,
              status: errorOccurred ? "error" : "syncing",
              syncStatus: {
                ...connector.syncStatus,
                lastSync: new Date().toISOString(),
                recordsSynced: connector.syncStatus.recordsSynced + records,
                errors: errorOccurred ? connector.syncStatus.errors + 1 : connector.syncStatus.errors,
                durationMs: duration,
              },
              metrics: {
                ...connector.metrics,
                latency: Math.max(90, connector.metrics.latency - 5),
                throughput: connector.metrics.throughput + Math.round(records / 20),
              },
            }
          : connector,
      ),
    );

    const newEvent: SyncEvent = {
      id: `evt-${Date.now()}`,
      connector: selectedConnector.name,
      timestamp: new Date().toISOString(),
      status: errorOccurred ? "warning" : "success",
      records,
      message: errorOccurred ? "Retry policy engaged due to upstream throttle" : "Manual sync executed",
    };

    setEvents((previous) => [newEvent, ...previous].slice(0, 8));

    if (errorOccurred) {
      setAlertFeed((previous) => [
        {
          id: `alert-${Date.now()}`,
          severity: "warning",
          message: `${selectedConnector.name} reported throttling. Monitoring retry window.`,
          connectorId: selectedConnector.id,
          timestamp: newEvent.timestamp,
        },
        ...previous,
      ]);
    }

    toast({
      title: `Manual sync queued`,
      description: `${records.toLocaleString()} records scheduled for ${selectedConnector.name}.`,
    });
  };

  const handleDeployBlueprint = () => {
    toast({
      title: "Blueprint dispatched",
      description: "Integration Copilot is packaging transform + auth steps.",
    });
  };

  const handleControlAction = (action: "pause" | "resume" | "test" | "flush") => {
    if (!selectedConnector) {
      toast({ title: "Select a connector", description: "Choose a connector to manage controls." });
      return;
    }

    if (action === "pause") {
      setConnectors((prev) =>
        prev.map((connector) =>
          connector.id === selectedConnector.id ? { ...connector, status: "disconnected" } : connector,
        ),
      );
      toast({ title: `Paused ${selectedConnector.name}`, description: "Sync workers drained." });
    } else if (action === "resume") {
      setConnectors((prev) =>
        prev.map((connector) =>
          connector.id === selectedConnector.id ? { ...connector, status: "connected" } : connector,
        ),
      );
      toast({ title: `Resumed ${selectedConnector.name}`, description: "Pipelines warming up." });
    } else if (action === "test") {
      toast({ title: "Testing connectivity", description: `${selectedConnector.name} handshake in flight.` });
    } else {
      toast({ title: "Queues flushed", description: `${selectedConnector.name} replay buffer cleared.` });
    }
  };

  const handleRecommendationApply = (recommendation: IntegrationRecommendation) => {
    setRecommendations((prev) => prev.filter((rec) => rec.id !== recommendation.id));
    toast({
      title: recommendation.title,
      description: "Forwarded to Integration Copilot for execution.",
    });
  };

  const handleRecommendationDismiss = (id: string) => {
    setRecommendations((prev) => prev.filter((rec) => rec.id !== id));
  };

  const stats = useMemo(() => {
    const totalRecords = connectors.reduce((sum, c) => sum + c.syncStatus.recordsSynced, 0);
    const avgLatency = Math.round(
      connectors.reduce((sum, c) => sum + c.metrics.latency, 0) / Math.max(connectors.length, 1),
    );
    const securityScore = 98;

    return [
      { icon: Database, label: "Active Connectors", value: connectors.length.toString(), trend: "+2 this week", color: "blue" as StatPalette },
      { icon: Activity, label: "Data Synced Today", value: formatNumber(totalRecords), trend: "Records", color: "green" as StatPalette },
      { icon: Shield, label: "Security Score", value: `${securityScore}/100`, trend: "Policy coverage", color: "indigo" as StatPalette },
  { icon: TrendingUp, label: "Avg Latency", value: `${avgLatency}ms`, trend: "Target < 200ms", color: "purple" as StatPalette },
    ];
  }, [connectors]);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
              Connect Everything
            </p>
            <h1 className="mt-3 flex items-center gap-3 text-3xl font-bold text-slate-900">
              <Link className="h-8 w-8 text-indigo-600" />
              Forge Integration Hub
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Provision enterprise connectors, map schemas, enforce credentials, and monitor bi-directional sync pipelines powering Oru Forge apps.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleTriggerSync}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              <Play className="h-4 w-4" />
              Trigger Sync
            </button>
            <button
              type="button"
              onClick={handleDeployBlueprint}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Code className="h-4 w-4" />
              Deploy Connector Blueprint
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {healthCards.map((card) => (
            <HealthCard key={card.label} {...card} />
          ))}
        </section>

        <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          <section className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Connector Catalog</h2>
                  <p className="text-sm text-slate-500">Pre-built accelerators curated by the Integration Copilot.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {["all", "erp", "api", "database", "cloud", "iot", "file"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setCatalogFilter(type as ConnectorType | "all")}
                      className={`rounded-full border px-3 py-1 capitalize transition ${
                        catalogFilter === type
                          ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      placeholder="Search catalog"
                      value={catalogQuery}
                      onChange={(event) => setCatalogQuery(event.target.value)}
                      className="w-44 rounded-full border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-600 outline-none ring-indigo-200 placeholder:text-slate-400 focus:ring"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredCatalog.map((connector) => (
                  <ConnectorCard
                    key={connector.id}
                    connector={connector}
                    onConnect={() => handleProvisionConnector(connector)}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Active Integrations</h2>
                  <p className="text-sm text-slate-500">Live connectors powering production Forge apps.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {STATUS_FILTERS.map((option) => {
                    const count = option === "all" ? connectors.length : statusCounts[option as ConnectorStatus];
                    return (
                      <button
                        type="button"
                        key={option}
                        onClick={() => setStatusFilter(option as ConnectorStatus | "all")}
                        className={`rounded-full border px-3 py-1 capitalize transition ${
                          statusFilter === option
                            ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {option}
                        <span className="ml-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] text-slate-500">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      placeholder="Filter integrations"
                      value={integrationQuery}
                      onChange={(event) => setIntegrationQuery(event.target.value)}
                      className="w-48 rounded-full border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-600 outline-none ring-indigo-200 placeholder:text-slate-400 focus:ring"
                    />
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-600">
                    <Settings className="h-4 w-4" />
                    Policies
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {filteredIntegrations.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                    No connectors match the current filter.
                  </div>
                )}
                {filteredIntegrations.map((connector) => (
                  <IntegrationRow
                    key={connector.id}
                    connector={connector}
                    onInspect={() => setSelectedConnectorId(connector.id)}
                    isActive={selectedConnector?.id === connector.id}
                  />
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <motion.div
              layout
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Selected Connector</p>
                  <h3 className="text-lg font-semibold text-slate-900">{selectedConnector?.name}</h3>
                </div>
                <span className="text-xs font-semibold text-slate-500">{selectedConnector?.type}</span>
              </div>

              {selectedConnector && (
                <div className="space-y-4 text-sm text-slate-600">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Endpoint</p>
                    <p className="font-mono text-slate-900">{selectedConnector.config.endpoint ?? "—"}</p>
                  </div>
                  <div className="grid gap-3">
                    <CredentialCard authentication={selectedConnector.authentication} />
                    <RetryPolicyCard retryPolicy={selectedConnector.config.retryPolicy} />
                    <ConnectorControlPanel
                      status={selectedConnector.status}
                      onPause={() => handleControlAction("pause")}
                      onResume={() => handleControlAction("resume")}
                      onTest={() => handleControlAction("test")}
                      onFlush={() => handleControlAction("flush")}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Schema Mappings</p>
                    <MappingTable mappings={selectedConnector.mappings} />
                  </div>
                </div>
              )}
            </motion.div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Operational Alerts</h3>
              <div className="mt-4 space-y-3">
                {alertFeed.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </div>

            <ConnectorPostureCard connectors={connectors} />

            {selectedConnector && (
              <CodePreviewCard
                title="Connector Blueprint"
                code={JSON.stringify(
                  {
                    endpoint: selectedConnector.config.endpoint,
                    retryPolicy: selectedConnector.config.retryPolicy,
                    authentication: selectedConnector.authentication,
                    mappings: selectedConnector.mappings,
                  },
                  null,
                  2,
                )}
              />
            )}
          </aside>
        </div>

        <section className="grid gap-8 lg:grid-cols-3">
          <motion.div layout className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Sync Pipeline Timeline</h3>
                <p className="text-sm text-slate-500">Real-time telemetry emitted by decision agents.</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                <Activity className="h-3 w-3" />
                Live
              </span>
            </div>
            <div className="space-y-4">
              {events.map((event) => (
                <SyncEventRow key={event.id} event={event} />
              ))}
            </div>
          </motion.div>

          <motion.div layout className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Activity & Change Log</h3>
                <p className="text-sm text-slate-500">Every credential rotation, schema tweak, and deployment is traceable.</p>
              </div>
              <button className="text-xs font-semibold text-indigo-600">View All</button>
            </div>
            <div className="space-y-4">
              {activityLog.map((item) => (
                <div key={item.id} className="flex items-start gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                  <div className="rounded-full bg-indigo-50 p-2 text-indigo-600">
                    <FileJson className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.actor}</p>
                    <p className="text-sm text-slate-600">{item.action}</p>
                    <p className="text-xs text-slate-500">{item.detail}</p>
                    <p className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div layout className="rounded-2xl bg-white p-6 shadow-sm">
            <CopilotPanel
              recommendations={recommendations}
              onApply={handleRecommendationApply}
              onDismiss={handleRecommendationDismiss}
            />
          </motion.div>
        </section>
      </div>
    </div>
  );
}

function HealthCard({ label, value, trend, icon: Icon }: { label: string; value: string; trend: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{trend}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
      </div>
    </div>
  );
}

function ConnectorControlPanel({
  status,
  onPause,
  onResume,
  onTest,
  onFlush,
}: {
  status: ConnectorStatus;
  onPause: () => void;
  onResume: () => void;
  onTest: () => void;
  onFlush: () => void;
}) {
  const isPaused = status === "disconnected";
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-sm font-semibold text-slate-900">Controls</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={isPaused ? onResume : onPause}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200"
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          {isPaused ? "Resume" : "Pause"}
        </button>
        <button
          type="button"
          onClick={onTest}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200"
        >
          <Terminal className="h-4 w-4" />
          Test
        </button>
        <button
          type="button"
          onClick={onFlush}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-rose-200"
        >
          <RefreshCw className="h-4 w-4" />
          Flush Queue
        </button>
      </div>
    </div>
  );
}

function CopilotPanel({
  recommendations,
  onApply,
  onDismiss,
}: {
  recommendations: IntegrationRecommendation[];
  onApply: (recommendation: IntegrationRecommendation) => void;
  onDismiss: (id: string) => void;
}) {
  if (recommendations.length === 0) {
    return (
      <div className="flex h-full flex-col justify-center text-center text-sm text-slate-500">
        No open recommendations.
      </div>
    );
  }

  const impactStyles: Record<IntegrationRecommendation["impact"], string> = {
    high: "bg-rose-50 text-rose-700",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Copilot Recommendations</p>
        <p className="text-sm text-slate-600">Automation agents monitoring connector posture.</p>
      </div>
      {recommendations.map((rec) => (
        <div key={rec.id} className="rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">{rec.title}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${impactStyles[rec.impact]}`}>
              {rec.impact}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">{rec.description}</p>
          {rec.connectorId && (
            <p className="mt-1 text-[10px] text-slate-400">Connector: {rec.connectorId}</p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => onApply(rec)}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
            >
              {rec.actionLabel}
            </button>
            <button
              type="button"
              onClick={() => onDismiss(rec.id)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, color }: { icon: LucideIcon; label: string; value: string; trend: string; color: StatPalette }) {
  const palette: Record<StatPalette, { bg: string; icon: string }> = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600" },
    green: { bg: "bg-emerald-50", icon: "text-emerald-600" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600" },
    indigo: { bg: "bg-indigo-50", icon: "text-indigo-600" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600" },
    pink: { bg: "bg-pink-50", icon: "text-pink-600" },
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className={`inline-flex rounded-xl p-2 ${palette[color].bg}`}>
        <Icon className={`h-5 w-5 ${palette[color].icon}`} />
      </div>
      <div className="mt-4 text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-xs text-slate-500">{trend}</div>
    </div>
  );
}

function ConnectorCard({ connector, onConnect }: { connector: ConnectorCatalogItem; onConnect: () => void }) {
  const { icon: Icon } = connector;
  return (
    <button
      type="button"
      onClick={onConnect}
      className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 p-4 text-left transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-slate-100 p-3">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{connector.name}</p>
          <p className="text-xs text-slate-500">{connector.provider}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span className="capitalize">{connector.type}</span>
        <span>SLA {connector.latencySla}</span>
      </div>
    </button>
  );
}

function IntegrationRow({
  connector,
  onInspect,
  isActive,
}: {
  connector: Connector;
  onInspect: () => void;
  isActive: boolean;
}) {
  return (
    <div className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
      isActive ? "border-indigo-200 bg-indigo-50/30" : "border-slate-200"
    }`}>
      <div className="flex flex-1 items-center gap-4">
        <div className={`rounded-xl p-3 ${isActive ? "bg-indigo-100" : "bg-slate-100"}`}>
          <Package className={`h-5 w-5 ${isActive ? "text-indigo-600" : "text-slate-500"}`} />
        </div>
        <div>
          <p className="font-semibold text-slate-900">{connector.name}</p>
          <p className="text-xs text-slate-500">{connector.provider}</p>
          <p className="text-xs text-slate-400">
            Last sync {new Date(connector.syncStatus.lastSync).toLocaleTimeString()} · {connector.syncStatus.mode}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
        <MetricPill label="Records" value={formatNumber(connector.syncStatus.recordsSynced)} />
        <MetricPill label="Latency" value={`${connector.metrics.latency}ms`} />
        <MetricPill label="Throughput" value={`${connector.metrics.throughput}/min`} />
        <StatusIndicator status={connector.status} />
        <button onClick={onInspect} className="text-xs font-semibold text-indigo-600">
          Inspect
        </button>
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-slate-200 px-3 py-1 text-xs">
      <span className="font-semibold text-slate-900">{value}</span>
      <span className="ml-1 text-slate-500">{label}</span>
    </div>
  );
}

function StatusIndicator({ status }: { status: ConnectorStatus }) {
  const configs: Record<ConnectorStatus, { icon: LucideIcon; color: string }> = {
    connected: { icon: CheckCircle, color: "text-emerald-600" },
    disconnected: { icon: Lock, color: "text-slate-400" },
    error: { icon: AlertTriangle, color: "text-rose-500" },
    syncing: { icon: RefreshCw, color: "text-blue-500 animate-spin" },
  };

  const Icon = configs[status].icon;

  return (
    <div className={`rounded-full bg-slate-100 p-1 ${status === "syncing" ? "animate-pulse" : ""}`}>
      <Icon className={`h-4 w-4 ${configs[status].color}`} />
    </div>
  );
}

function CredentialCard({ authentication }: { authentication: AuthConfig }) {
  const Icon = authentication.type === "oauth2" ? Unlock : authentication.type === "apikey" ? Key : Shield;
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <p className="text-sm font-semibold text-slate-900">{authentication.type.toUpperCase()}</p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            authentication.status === "valid"
              ? "bg-emerald-50 text-emerald-600"
              : authentication.status === "expired"
                ? "bg-amber-50 text-amber-600"
                : "bg-rose-50 text-rose-600"
          }`}
        >
          {authentication.status}
        </span>
      </div>
      {authentication.rotateAfterDays !== undefined && (
        <p className="mt-2 text-xs text-slate-500">Rotation in {authentication.rotateAfterDays} days</p>
      )}
    </div>
  );
}

function RetryPolicyCard({ retryPolicy }: { retryPolicy?: RetryPolicy }) {
  if (!retryPolicy) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
        No retry policy configured
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-200 p-3 text-xs text-slate-500">
      <p className="text-sm font-semibold text-slate-900">Resiliency Policy</p>
      <div className="mt-2 flex flex-wrap gap-3">
        <MetricPill label="Max Retries" value={retryPolicy.maxRetries.toString()} />
        <MetricPill label="Backoff" value={`x${retryPolicy.backoffMultiplier}`} />
        <MetricPill label="Max Backoff" value={`${retryPolicy.maxBackoff}s`} />
      </div>
    </div>
  );
}

function MappingTable({ mappings }: { mappings: DataMapping[] }) {
  if (!mappings.length) {
    return <p className="text-xs text-slate-500">No mappings defined yet.</p>;
  }
  return (
    <div className="space-y-3">
      {mappings.map((mapping) => (
        <div key={`${mapping.source}-${mapping.target}`} className="rounded-xl border border-slate-200 p-3">
          <p className="text-sm font-semibold text-slate-900">{mapping.source}</p>
          <p className="text-xs text-slate-500">→ {mapping.target}</p>
          {mapping.transform && <p className="text-xs text-emerald-600">{mapping.transform}</p>}
          {mapping.validation && <p className="text-[10px] text-slate-400">{mapping.validation}</p>}
        </div>
      ))}
    </div>
  );
}

function SyncEventRow({ event }: { event: SyncEvent }) {
  const colors = {
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    error: "bg-rose-50 text-rose-700",
  };
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4">
      <div className="text-xs font-mono text-slate-500">
        {new Date(event.timestamp).toLocaleTimeString()}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900">{event.connector}</p>
        <p className="text-xs text-slate-500">{event.message}</p>
      </div>
      <div className="text-xs text-slate-500">{formatNumber(event.records)} rec</div>
      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${colors[event.status]}`}>
        {event.status}
      </span>
    </div>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const colorMap = {
    info: "bg-slate-50 text-slate-600",
    warning: "bg-amber-50 text-amber-700",
    critical: "bg-rose-50 text-rose-700",
  };
  return (
    <div className={`rounded-xl border border-slate-200 p-3 text-xs ${colorMap[alert.severity]}`}>
      <div className="flex items-center justify-between">
        <span className="font-semibold">{alert.severity.toUpperCase()}</span>
        <span className="text-[10px]">{new Date(alert.timestamp).toLocaleTimeString()}</span>
      </div>
      <p className="mt-2 text-slate-700">{alert.message}</p>
    </div>
  );
}

function ConnectorPostureCard({ connectors }: { connectors: Connector[] }) {
  const authAlerts = connectors.filter((connector) => connector.authentication.status !== "valid").length;
  const latencyAlerts = connectors.filter((connector) => connector.metrics.latency > 200).length;
  const erroring = connectors.filter((connector) => connector.status === "error").length;
  const streaming = connectors.filter((connector) => connector.syncStatus.mode === "streaming").length;

  const tiles = [
    { label: "Credentials", value: `${authAlerts} expiring`, icon: Key, tone: authAlerts ? "text-amber-600" : "text-emerald-600" },
    { label: "Latency", value: latencyAlerts ? `${latencyAlerts} over SLA` : "Within SLA", icon: Activity, tone: latencyAlerts ? "text-rose-600" : "text-emerald-600" },
    { label: "Errors", value: erroring ? `${erroring} connectors` : "Healthy", icon: AlertTriangle, tone: erroring ? "text-rose-600" : "text-emerald-600" },
    { label: "Modes", value: `${streaming} streaming / ${Math.max(connectors.length - streaming, 0)} batch`, icon: RefreshCw, tone: "text-indigo-600" },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Connector Posture</h3>
        <span className="text-[11px] text-slate-400">Live telemetry</span>
      </div>
      <div className="grid gap-3">
        {tiles.map((tile) => {
          const IconComponent = tile.icon;
          return (
            <div key={tile.label} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-xs">
              <div className="flex items-center gap-2">
                <IconComponent className={`h-4 w-4 ${tile.tone}`} />
                <span className="text-slate-500">{tile.label}</span>
              </div>
              <span className="font-semibold text-slate-900">{tile.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CodePreviewCard({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-2xl bg-slate-900/95 p-4 text-xs text-slate-100 shadow-lg">
      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-400">
        <span>{title}</span>
        <span>JSON</span>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-emerald-100/90">
        {code}
      </pre>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}
