"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  GitBranch,
  MapPin,
  Package,
  Search,
  Share2,
  Shield,
  Sparkles,
  Zap,
  ZapOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { fetcher } from "@/lib/fetcher";
import type { TraceabilityNode, TraceabilityEdge } from "@/components/traceability/ForceGraph";

const ForceGraph = dynamic(() => import("@/components/traceability/ForceGraph"), { ssr: false });
const Timeline = dynamic(() => import("@/components/traceability/Timeline"), { ssr: false });
const MatrixView = dynamic(() => import("@/components/traceability/MatrixView"), { ssr: false });
const HeatMap = dynamic(() => import("@/components/traceability/HeatMap"), { ssr: false });

interface TraceabilityResponse {
  batchId: string;
  material: string;
  status: "released" | "qa_hold" | "blocked" | "consumed";
  quantity: {
    produced: number;
    available: number;
    shipped: number;
  };
  genealogy: {
    nodes: GenealogyNode[];
    edges: GenealogyEdge[];
  };
  recalls: Array<{
    id: string;
    severity: "critical" | "major" | "minor";
    initiatedBy: string;
    status: "open" | "closed";
    affectedLots: number;
  }>;
  compliance: {
    fda: boolean;
    gmp: boolean;
    haccp: boolean;
    serialization: boolean;
    oneForward: boolean;
    oneBackward: boolean;
    realtimeTelemetry: boolean;
  };
  quality: {
    score: number;
    testsRun: number;
    deviationsCritical: number;
    deviationsMinor: number;
  };
  custodyChain: Array<{
    id: string;
    type: "supplier" | "plant" | "warehouse" | "customer";
    name: string;
    location: string;
    timestamp: string;
    quantity: number;
    status: string;
  }>;
}

interface GenealogyNode {
  id: string;
  batch: string;
  material: string;
  type: "raw" | "intermediate" | "finished" | "distribution";
  status: "released" | "qa_hold" | "blocked" | "consumed";
  qty: number;
  uom: string;
  date: string;
  location?: string;
  qualityScore?: number;
  temperatureExcursions?: number;
  alerts?: number;
}

interface GenealogyEdge {
  id: string;
  source: string;
  target: string;
  relationship: "consumes" | "produces" | "ships";
  qty: number;
  uom: string;
  date: string;
  traceConfidence: number;
}

const viewOptions = [
  { id: "tree", label: "Graph", description: "lineage map" },
  { id: "timeline", label: "Timeline", description: "chronology" },
  { id: "matrix", label: "Matrix", description: "lot split" },
  { id: "heat", label: "Heat map", description: "risk density" },
] as const;

type ViewMode = (typeof viewOptions)[number]["id"];

type TraceDirection = "forward" | "backward" | "both";

type RiskLayer = "quality" | "recall" | "cold_chain" | "yield";

type CoverageMode = "global" | "plant" | "customer";

const riskLayers: Record<RiskLayer, { label: string; description: string }> = {
  quality: { label: "Quality deviations", description: "Tests, holds, excursions" },
  recall: { label: "Recall readiness", description: "Mock recall scoring" },
  cold_chain: { label: "Cold chain", description: "Temperature deviations" },
  yield: { label: "Yield variance", description: "Batch performance" },
};

const coverageModes: Record<CoverageMode, string> = {
  global: "Full network",
  plant: "Plant focus",
  customer: "Customer tail",
};

const initialBatch = "FG-2025-11847";

export default function BatchGenealogyPage() {
  const [batchQuery, setBatchQuery] = useState(initialBatch);
  const [traceDirection, setTraceDirection] = useState<TraceDirection>("both");
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [riskLayer, setRiskLayer] = useState<RiskLayer>("quality");
  const [coverageMode, setCoverageMode] = useState<CoverageMode>("global");
  const [selectedNode, setSelectedNode] = useState<GenealogyNode | null>(null);
  const [hoverEdge, setHoverEdge] = useState<GenealogyEdge | null>(null);

  const debouncedBatch = useDebounce(batchQuery, 400);

  const { data, isLoading, refetch, isFetching } = useQuery<TraceabilityResponse>({
    queryKey: ["batch-genealogy", debouncedBatch, traceDirection],
    queryFn: () =>
      fetcher(`/api/traceability/genealogy?batch=${debouncedBatch}&direction=${traceDirection}`),
    enabled: Boolean(debouncedBatch),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setSelectedNode(null);
  }, [viewMode, debouncedBatch]);

  const handleNodeClick = useCallback((node: TraceabilityNode) => {
    setSelectedNode((prev) => ({
      id: node.id,
      batch: node.batch ?? prev?.batch ?? "Unknown batch",
      material: node.material ?? prev?.material ?? "Unknown material",
      type: (node.type as GenealogyNode["type"]) ?? prev?.type ?? "raw",
      status: (node.status as GenealogyNode["status"]) ?? prev?.status ?? "released",
      qty: node.qty ?? prev?.qty ?? 0,
      uom: node.uom ?? prev?.uom ?? "EA",
      date: node.date ?? prev?.date ?? new Date().toISOString(),
      location: node.location ?? prev?.location,
  qualityScore: node.qualityScore ?? prev?.qualityScore,
  temperatureExcursions: prev?.temperatureExcursions,
      alerts: node.alerts ?? prev?.alerts,
    }));
  }, []);

  const handleEdgeHover = useCallback((edge: TraceabilityEdge | null) => {
    if (!edge) {
      setHoverEdge(null);
      return;
    }
    setHoverEdge((prev) => ({
      id: edge.id ?? prev?.id ?? `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      relationship: prev?.relationship ?? "consumes",
      qty: edge.qty ?? prev?.qty ?? 0,
      uom: edge.uom ?? prev?.uom ?? "EA",
      date: edge.date ?? prev?.date ?? new Date().toISOString(),
      traceConfidence: edge.traceConfidence ?? prev?.traceConfidence ?? 90,
    }));
  }, []);

  const analytics = useMemo(() => {
    if (!data) return null;

    const totalNodes = data.genealogy.nodes.length;
    const upstream = data.genealogy.nodes.filter((n) => n.type === "raw" || n.type === "intermediate").length;
    const downstream = data.genealogy.nodes.filter((n) => n.type === "distribution" || n.type === "finished").length;
    const riskHotspots = data.genealogy.nodes.filter((n) => (n.temperatureExcursions || 0) > 0).length;
    const traceConfidence =
      data.genealogy.edges.reduce((acc, curr) => acc + curr.traceConfidence, 0) /
      Math.max(1, data.genealogy.edges.length);

    return {
      totalNodes,
      upstream,
      downstream,
      riskHotspots,
      traceConfidence,
    };
  }, [data]);

  const handleTrace = () => {
    if (!batchQuery) return;
    refetch();
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-blue-600 font-semibold">
            Operations // Batch Intelligence
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 flex items-center gap-3">
            <GitBranch className="h-7 w-7 text-blue-600" /> Batch Genealogy & Traceability
          </h1>
          <p className="text-gray-500 mt-2">
            Hyper-graph lineage, custody, and regulatory readiness that surpasses SAP's one-step trace
            controls with AI guardrails.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <FileText className="h-4 w-4" /> Compliance dossier
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Eye className="h-4 w-4" /> Mock recall drill
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700">
            <Download className="h-4 w-4" /> Export FDA XML
          </button>
        </div>
      </header>

      <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
              Batch / Lot / Serialized asset
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={batchQuery}
                onChange={(e) => setBatchQuery(e.target.value)}
                placeholder="FG-2025-11847, SAP batch, GS1, NDC, UID, SGTIN..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-10 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500">
              <span className="rounded-full bg-gray-100 px-2 py-1">SAP Batch</span>
              <span className="rounded-full bg-gray-100 px-2 py-1">FDA NDC</span>
              <span className="rounded-full bg-gray-100 px-2 py-1">GS1 Serial</span>
              <span className="rounded-full bg-gray-100 px-2 py-1">UID 2D</span>
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
              Trace direction
            </label>
            <select
              value={traceDirection}
              onChange={(e) => setTraceDirection(e.target.value as TraceDirection)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
            >
              <option value="both">Forward + backward</option>
              <option value="forward">Forward only</option>
              <option value="backward">Backward only</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
              Network coverage
            </label>
            <select
              value={coverageMode}
              onChange={(e) => setCoverageMode(e.target.value as CoverageMode)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
            >
              {Object.entries(coverageModes).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3 flex items-end">
            <button
              onClick={handleTrace}
              disabled={!batchQuery || isFetching}
              className={cn(
                "w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-2",
                (isFetching || !batchQuery) && "opacity-60 cursor-not-allowed"
              )}
            >
              {isFetching ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Tracing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" /> Trace batch
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4 text-sm text-blue-600">
          <button className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" /> Recent traces
          </button>
          <button className="inline-flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" /> Active recalls
          </button>
          <button className="inline-flex items-center gap-1">
            <Shield className="h-4 w-4" /> Mock recall drill
          </button>
          <button className="inline-flex items-center gap-1">
            <Activity className="h-4 w-4" /> Custody change log
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Lineage coverage"
          value={analytics ? `${analytics.totalNodes} nodes` : "--"}
          sublabel={`${analytics?.upstream ?? 0} upstream • ${analytics?.downstream ?? 0} downstream`}
        />
        <MetricCard
          label="Trace confidence"
          value={analytics ? `${analytics.traceConfidence.toFixed(1)}%` : "--"}
          sublabel="Based on IoT & lot splits"
        />
        <MetricCard
          label="Risk hotspots"
          value={analytics ? analytics.riskHotspots.toString() : "--"}
          sublabel="Cold chain & QA signals"
        />
        <MetricCard
          label="Quality score"
          value={data ? `${data.quality.score}%` : "--"}
          sublabel={`${data?.quality.testsRun ?? 0} tests • ${data?.quality.deviationsCritical ?? 0} critical`}
        />
      </section>

      <AnimatePresence mode="wait">
        <motion.section
          key={viewMode}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-blue-600" /> Hyper-graph genealogy
              </h2>
              <p className="text-sm text-gray-500">
                Layered custody graph spanning raw → WIP → FG → customer with IoT, QA, and compliance overlays.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {viewOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setViewMode(option.id)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium",
                    viewMode === option.id
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-500"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(riskLayers).map(([layer, meta]) => (
                <button
                  key={layer}
                  onClick={() => setRiskLayer(layer as RiskLayer)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium border",
                    riskLayer === layer
                      ? "border-purple-200 bg-purple-50 text-purple-700"
                      : "border-gray-200 text-gray-500"
                  )}
                >
                  {meta.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Filter className="h-4 w-4" /> Layer: {riskLayers[riskLayer].description}
            </div>
          </div>

          <div className="h-[600px]">
            {!data && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <ZapOff className="h-10 w-10 mb-4" />
                Enter a batch to trace
              </div>
            )}
            {isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
                Loading lineage...
              </div>
            )}
            {data && !isLoading && (
              <>
                {viewMode === "tree" && (
                  <ForceGraph
                    nodes={data.genealogy.nodes}
                    edges={data.genealogy.edges}
                    riskLayer={riskLayer}
                    coverage={coverageMode}
                    onNodeClick={handleNodeClick}
                    onEdgeHover={handleEdgeHover}
                  />
                )}
                {viewMode === "timeline" && (
                  <Timeline
                    nodes={data.genealogy.nodes}
                    edges={data.genealogy.edges}
                    traceDirection={traceDirection}
                  />
                )}
                {viewMode === "matrix" && (
                  <MatrixView nodes={data.genealogy.nodes} edges={data.genealogy.edges} />
                )}
                {viewMode === "heat" && (
                  <HeatMap nodes={data.genealogy.nodes} edges={data.genealogy.edges} riskLayer={riskLayer} />
                )}
              </>
            )}
          </div>

          {hoverEdge && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {hoverEdge.source} → {hoverEdge.target}
                </p>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs">
                  Confidence {hoverEdge.traceConfidence}%
                </span>
              </div>
              <p className="text-xs mt-1">{hoverEdge.qty} {hoverEdge.uom} on {hoverEdge.date}</p>
            </motion.div>
          )}
        </motion.section>
      </AnimatePresence>

      {data && (
        <section className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" /> Compliance & serialization
            </h3>
            <div className="space-y-4">
              {Object.entries(data.compliance).map(([key, value]) => (
                <CompliancePill key={key} label={formatComplianceLabel(key)} status={value} />
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-dashed border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <p className="font-semibold">Regulatory guardrails</p>
              <p>24/7 serialization audit trail • CFR part 11 signatures • GS1 EPCIS feeds</p>
            </div>
          </div>

          <div className="lg:col-span-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" /> Custody chain
            </h3>
            <div className="space-y-3">
              {data.custodyChain.slice(0, 5).map((node) => (
                <CustodyCard key={node.id} node={node} />
              ))}
            </div>
            <button className="mt-4 text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
              <Eye className="h-4 w-4" /> View full custody ledger
            </button>
          </div>

          <div className="lg:col-span-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Share2 className="h-5 w-5 text-purple-600" /> Distribution & recall posture
            </h3>
            <div className="space-y-3">
              {data.recalls.length === 0 && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  No active recalls.
                </div>
              )}
              {data.recalls.map((recall) => (
                <div
                  key={recall.id}
                  className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-red-900">{recall.id}</p>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      {recall.severity}
                    </span>
                  </div>
                  <p className="text-xs text-red-600 mt-2">
                    {recall.affectedLots} lots • {recall.status} • initiated by {recall.initiatedBy}
                  </p>
                </div>
              ))}
              <div className="rounded-xl border border-purple-100 bg-purple-50 p-4 text-sm text-purple-800">
                Mock recall coverage <span className="font-semibold">&lt; 35 seconds</span> to surface every customer lot.
              </div>
            </div>
          </div>
        </section>
      )}

      {selectedNode && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-blue-200 bg-blue-50/60 p-6 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase text-blue-600 font-semibold">Focused node</p>
              <h3 className="text-2xl font-semibold text-blue-900">{selectedNode.batch}</h3>
              <p className="text-sm text-blue-700">{selectedNode.material}</p>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-xs text-blue-600">
              Clear
            </button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-blue-900">
            <div>
              <p className="text-xs uppercase text-blue-600">Status</p>
              <p className="font-semibold capitalize">{selectedNode.status.replace("_", " ")}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-blue-600">Quantity</p>
              <p className="font-semibold">
                {selectedNode.qty} {selectedNode.uom}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-blue-600">Location</p>
              <p className="font-semibold">{selectedNode.location ?? "N/A"}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-white/70 px-3 py-1 text-blue-600">Quality {selectedNode.qualityScore ?? 0}%</span>
            <span className="rounded-full bg-white/70 px-3 py-1 text-blue-600">Temperature excursions {selectedNode.temperatureExcursions ?? 0}</span>
            <span className="rounded-full bg-white/70 px-3 py-1 text-blue-600">Alerts {selectedNode.alerts ?? 0}</span>
          </div>
        </motion.section>
      )}

      {data && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-indigo-600/10 border border-purple-200 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-white p-3 shadow">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-purple-700">AI Guidance</p>
              <h3 className="text-xl font-semibold text-gray-900 mt-1">Traceability Intelligence</h3>
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <p>✓ {data.genealogy.nodes.length} nodes validated with IoT telemetry across custody chain</p>
                <p>✓ {data.quality.testsRun} QA tests surfaced; {data.quality.deviationsCritical} critical deviations</p>
                <p>✓ Serialized coverage includes {data.custodyChain.length} custody hops with EPCIS signatures</p>
                <p>⚠️ Edge confidence variance {analytics?.traceConfidence.toFixed(1)}% — review {riskLayer} hotspots</p>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}

function MetricCard({ label, value, sublabel }: { label: string; value: string; sublabel: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{sublabel}</p>
    </div>
  );
}

function CompliancePill({ label, status }: { label: string; status: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm shadow-sm">
      <div className="flex items-center gap-2">
        {status ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        )}
        <span className="text-gray-700">{label}</span>
      </div>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-semibold",
          status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}
      >
        {status ? "verified" : "gap"}
      </span>
    </div>
  );
}

function formatComplianceLabel(key: string) {
  switch (key) {
    case "fda":
      return "FDA 21 CFR";
    case "gmp":
      return "cGMP";
    case "haccp":
      return "HACCP";
    case "serialization":
      return "Serialization";
    case "oneForward":
      return "One step forward";
    case "oneBackward":
      return "One step back";
    case "realtimeTelemetry":
      return "Realtime telemetry";
    default:
      return key;
  }
}

function CustodyCard({
  node,
}: {
  node: {
    id: string;
    type: "supplier" | "plant" | "warehouse" | "customer";
    name: string;
    location: string;
    timestamp: string;
    quantity: number;
    status: string;
  };
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">{node.name}</p>
          <p className="text-xs text-gray-500">{node.type}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" /> {node.location}
        </span>
        <span>{node.quantity} units</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{node.timestamp}</p>
      <span className="mt-2 inline-flex rounded-full bg-white px-2 py-0.5 text-[11px] text-gray-600 border border-gray-200">
        Status: {node.status}
      </span>
    </div>
  );
}
