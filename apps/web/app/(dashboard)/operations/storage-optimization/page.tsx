"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Box,
  Boxes,
  Cube,
  Gauge,
  Layers3,
  Map,
  RadioTower,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  ThermometerSun,
  Warehouse,
} from "lucide-react";
import { DonutChart } from "@/components/charts/DonutChart";
import { cn } from "@/lib/utils";

const viewModes = [
  { id: "3d", label: "3D stack", description: "digital twin" },
  { id: "heat", label: "Heat map", description: "congestion" },
  { id: "list", label: "Slot list", description: "bin roster" },
] as const;

type ViewMode = (typeof viewModes)[number]["id"];

type StorageZone = {
  id: string;
  type: string;
  utilization: number;
  picksPerHour: number;
  congestion: "low" | "medium" | "high";
  temperature: number;
  agingHours: number;
  aiRecommendation: string;
};

const storageZones: StorageZone[] = [
  {
    id: "A1",
    type: "Ambient pick tower",
    utilization: 86,
    picksPerHour: 420,
    congestion: "high",
    temperature: 24,
    agingHours: 9,
    aiRecommendation: "Re-slot top 6 SKUs to mezzanine to cut pick time by 18%",
  },
  {
    id: "B5",
    type: "Cold-chain high bay",
    utilization: 68,
    picksPerHour: 180,
    congestion: "medium",
    temperature: 4,
    agingHours: 36,
    aiRecommendation: "Inject extra AMR cycle to balance dock 6 demand",
  },
  {
    id: "C2",
    type: "Hazmat cage",
    utilization: 54,
    picksPerHour: 40,
    congestion: "low",
    temperature: 22,
    agingHours: 72,
    aiRecommendation: "Consolidate slow movers and release 4 pallet positions",
  },
  {
    id: "D4",
    type: "Bulk pallet buffer",
    utilization: 91,
    picksPerHour: 105,
    congestion: "medium",
    temperature: 27,
    agingHours: 14,
    aiRecommendation: "Automate replen to case pick aisle when fill level < 35%",
  },
];

const automationQueue = [
  {
    id: "TASK-9821",
    title: "Dynamic wave re-slot",
    owner: "AI Copilot",
    impact: "+14% pick rate",
    status: "Ready",
  },
  {
    id: "TASK-9824",
    title: "Cold dock cross-dock",
    owner: "Decision engine",
    impact: "-22 min dwell",
    status: "Simulating",
  },
  {
    id: "TASK-9829",
    title: "AMR route rebalance",
    owner: "Inventory Copilot",
    impact: "-11% travel",
    status: "Queued",
  },
];

const aiInsights = [
  {
    title: "Slotting pressure",
    detail: "Top 20 SKUs drove 62% of touches in the last 4 hours. AI suggests micro-zones to prevent congestion spikes.",
  },
  {
    title: "Cold-chain compliance",
    detail: "Dock 6 door cycle caused a 4.2°C spike. Triggered automated airflow recalibration and QA alert.",
  },
  {
    title: "Labor shakeout",
    detail: "Robotic tote buffer can absorb 2 more put-walls; shift 3 labor can be redeployed to outbound value-add work.",
  },
];

const utilizationProfile = [
  { id: "ambient", value: 42, color: "#2563eb" },
  { id: "cold", value: 26, color: "#0ea5e9" },
  { id: "hazmat", value: 7, color: "#f97316" },
  { id: "bulk", value: 25, color: "#10b981" },
];

const congestionLegend = {
  low: "bg-emerald-200 text-emerald-900",
  medium: "bg-amber-200 text-amber-900",
  high: "bg-rose-200 text-rose-900",
};

export default function StorageOptimizationPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("3d");
  const [focusZone, setFocusZone] = useState<string>(storageZones[0].id);
  const heatMapData = useMemo(() => generateHeatMapData(), []);

  const activeZone = storageZones.find((zone) => zone.id === focusZone) ?? storageZones[0];

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">
            Operations // Warehouse Intelligence
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Warehouse className="h-7 w-7 text-blue-600" /> Storage Optimization Control Tower
          </h1>
          <p className="text-gray-500 mt-2 max-w-3xl">
            AI-driven slotting, 3D congestion telemetry, and cold-chain guardrails that make SAP's static bins look analog.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <RefreshCcw className="h-4 w-4" /> Sync with WMS
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700">
            <Sparkles className="h-4 w-4" /> Launch Decision Wizard
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          icon={<Gauge className="h-5 w-5 text-blue-600" />}
          label="Global utilization"
          value="84%"
          sublabel="4.2M of 5M bin cubic ft"
        />
        <MetricCard
          icon={<ThermometerSun className="h-5 w-5 text-cyan-600" />}
          label="Cold-chain stable"
          value="98.9%"
          sublabel="12 probes monitored"
        />
        <MetricCard
          icon={<Activity className="h-5 w-5 text-emerald-600" />}
          label="AMR throughput"
          value="742 picks/hr"
          sublabel="+18% vs baseline"
        />
        <MetricCard
          icon={<AlertTriangle className="h-5 w-5 text-rose-600" />}
          label="Risk alerts"
          value="3 open"
          sublabel="Cold dock • Hazmat • Buffer"
        />
      </section>

      <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-blue-600" /> Warehouse digital twin
            </h2>
            <p className="text-sm text-gray-500">Switch between 3D stacks, congestion heat map, or bin roster.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={cn(
                  "rounded-2xl border px-4 py-2 text-sm font-medium",
                  viewMode === mode.id ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500"
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
            {viewMode === "3d" && <WarehouseStacks zones={storageZones} focusZone={focusZone} setFocusZone={setFocusZone} />}
            {viewMode === "heat" && <HeatMapPanel data={heatMapData} />}
            {viewMode === "list" && <ZoneTable zones={storageZones} />}
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase text-gray-500">Focus zone insights</h3>
              <span className="text-xs text-gray-400">Live telemetry</span>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-2 text-sm text-blue-900">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-lg">Zone {activeZone.id}</p>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  activeZone.congestion === "high" && "bg-rose-100 text-rose-700",
                  activeZone.congestion === "medium" && "bg-amber-100 text-amber-700",
                  activeZone.congestion === "low" && "bg-emerald-100 text-emerald-700"
                )}>
                  {activeZone.congestion} congestion
                </span>
              </div>
              <p className="text-sm text-blue-800">{activeZone.type}</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <TelemetryTile label="Utilization" value={`${activeZone.utilization}%`} />
                <TelemetryTile label="Picks / hr" value={activeZone.picksPerHour.toString()} />
                <TelemetryTile label="Temp" value={`${activeZone.temperature}°C`} />
                <TelemetryTile label="Aging" value={`${activeZone.agingHours}h`} />
              </div>
              <p className="text-xs text-blue-900/80">{activeZone.aiRecommendation}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" /> AI playbook
              </h4>
              <ul className="space-y-2 text-xs text-gray-600">
                <li>• Predictive congestion watchlist powered by AMR + RFID feeds</li>
                <li>• Auto wave builder rebalances dock-to-aisle travel every 8 minutes</li>
                <li>• Decision wizard ready with 3 scenario sandboxes</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Box className="h-5 w-5 text-blue-600" /> Slotting mix
            </h3>
            <span className="text-xs text-gray-400">Live</span>
          </div>
          <div className="flex items-center justify-between mt-4">
            <DonutChart data={utilizationProfile} centerText="84%" centerSubtext="occupied" />
            <div className="space-y-2 text-sm">
              {utilizationProfile.map((slice) => (
                <div key={slice.id} className="flex items-center gap-2">
                  <span className="h-2 w-6 rounded-full" style={{ backgroundColor: slice.color }} />
                  <span className="text-gray-600 capitalize">{slice.id}</span>
                  <span className="font-semibold text-gray-900">{slice.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">AI suggests unlocking 120 ambient pallet positions by moving C velocity SKUs to bulk buffer.</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <RadioTower className="h-5 w-5 text-emerald-600" /> Automation queue
          </h3>
          <div className="mt-4 space-y-3">
            {automationQueue.map((task) => (
              <div key={task.id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-sm">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{task.id}</span>
                  <span>{task.status}</span>
                </div>
                <p className="mt-1 font-semibold text-gray-900">{task.title}</p>
                <p className="text-xs text-gray-600">{task.owner}</p>
                <p className="text-xs text-emerald-600 mt-1">Impact {task.impact}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-purple-600" /> Risk & compliance
          </h3>
          <div className="mt-4 space-y-3 text-sm">
            <RiskItem
              icon={<ThermometerSun className="h-4 w-4" />}
              title="Cold dock 6"
              detail="4.2°C spike for 6 min"
              badge="Active"
            />
            <RiskItem
              icon={<AlertTriangle className="h-4 w-4" />}
              title="Hazmat storage"
              detail="Utilization 94% - re-slot to Zone C2"
              badge="Action"
            />
            <RiskItem
              icon={<Boxes className="h-4 w-4" />}
              title="Bulk buffer"
              detail="Aging > 48h for 18 pallets"
              badge="Monitor"
            />
          </div>
          <p className="text-xs text-gray-500 mt-4">Decision wizard auto-documents CFR Part 11 sign-offs and audit trails.</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Map className="h-5 w-5 text-indigo-600" /> Zone list
          </h3>
          <ZoneTable zones={storageZones} interactive onFocus={setFocusZone} />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-600" /> Copilot insights
          </h3>
          <div className="space-y-3">
            {aiInsights.map((insight) => (
              <div key={insight.title} className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">{insight.title}</p>
                <p className="text-sm text-gray-600 mt-1">{insight.detail}</p>
              </div>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow">
            <Sparkles className="h-4 w-4" /> Generate new scenario
          </button>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-gray-500">{icon}<span className="uppercase tracking-wide text-[11px]">{label}</span></div>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{sublabel}</p>
    </div>
  );
}

function WarehouseStacks({
  zones,
  focusZone,
  setFocusZone,
}: {
  zones: StorageZone[];
  focusZone: string;
  setFocusZone: (zone: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {zones.map((zone) => (
        <button
          key={zone.id}
          onClick={() => setFocusZone(zone.id)}
          className={cn(
            "rounded-2xl border bg-white p-4 text-left shadow-sm",
            focusZone === zone.id ? "border-blue-300 shadow-blue-100" : "border-gray-100"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Zone {zone.id}</p>
            <Cube className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500">{zone.type}</p>
          <div className="mt-4 h-32 flex items-end gap-1">
            {[...Array(6).keys()].map((level) => {
              const ratio = zone.utilization / 100;
              const height = Math.max(20, ratio * 100) - level * 5;
              return (
                <div
                  key={level}
                  className={cn(
                    "flex-1 rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-500",
                    level > 3 && "opacity-60"
                  )}
                  style={{ height: `${Math.max(10, height)}%` }}
                />
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-900">{zone.utilization}%</span>
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[11px]",
              congestionLegend[zone.congestion]
            )}>
              {zone.congestion}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function HeatMapPanel({ data }: { data: Array<{ x: number; y: number; value: number; zone: string }> }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
        <span>Congestion thermal layer</span>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="h-2 w-6 rounded-full bg-emerald-300" />
          <span>Cool</span>
          <span className="h-2 w-6 rounded-full bg-rose-500" />
          <span>Hot</span>
        </div>
      </div>
      <div className="grid grid-cols-20 gap-1">
        {data.map((cell) => (
          <div
            key={`${cell.x}-${cell.y}`}
            className="aspect-square rounded-sm"
            style={{ backgroundColor: getHeatColor(cell.value) }}
            title={`${cell.zone} :: ${cell.value}% congestion`}
          />
        ))}
      </div>
    </div>
  );
}

function ZoneTable({
  zones,
  interactive = false,
  onFocus,
}: {
  zones: StorageZone[];
  interactive?: boolean;
  onFocus?: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wider text-gray-400">
            <th className="py-2 pr-4">Zone</th>
            <th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">Utilization</th>
            <th className="py-2 pr-4">Picks/hr</th>
            <th className="py-2 pr-4">Temp</th>
            <th className="py-2 pr-4">Aging</th>
            <th className="py-2 pr-4">Congestion</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((zone) => (
            <tr
              key={zone.id}
              className={cn(
                "border-t border-gray-100 text-gray-700 hover:bg-gray-50",
                interactive && "cursor-pointer"
              )}
              onClick={interactive ? () => onFocus?.(zone.id) : undefined}
            >
              <td className="py-2 pr-4 font-semibold text-gray-900">{zone.id}</td>
              <td className="py-2 pr-4">{zone.type}</td>
              <td className="py-2 pr-4">{zone.utilization}%</td>
              <td className="py-2 pr-4">{zone.picksPerHour}</td>
              <td className="py-2 pr-4">{zone.temperature}°C</td>
              <td className="py-2 pr-4">{zone.agingHours}h</td>
              <td className="py-2 pr-4">
                <span className={cn("rounded-full px-2 py-0.5 text-[11px]", congestionLegend[zone.congestion])}>
                  {zone.congestion}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TelemetryTile({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-blue-600">{label}</p>
      <p className="text-lg font-semibold text-blue-900">{value}</p>
    </div>
  );
}

function RiskItem({
  icon,
  title,
  detail,
  badge,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  badge: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/80 p-3">
      <div>
        <p className="flex items-center gap-2 font-semibold text-gray-900">{icon}{title}</p>
        <p className="text-xs text-gray-600">{detail}</p>
      </div>
      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] text-purple-700">{badge}</span>
    </div>
  );
}

function getHeatColor(value: number) {
  const clamp = Math.max(0, Math.min(100, value));
  const hue = 140 - (clamp / 100) * 140; // 140 -> green, 0 -> red
  return `hsl(${hue}, 70%, ${Math.max(30, clamp / 2 + 25)}%)`;
}

function generateHeatMapData() {
  // Generate mock heatmap data for warehouse activity
  const data = [];
  for (let x = 0; x < 20; x++) {
    for (let y = 0; y < 10; y++) {
      data.push({
        x,
        y,
        value: Math.floor(Math.random() * 100),
        zone: `${String.fromCharCode(65 + Math.floor(x / 5))}${y + 1}`,
      });
    }
  }
  return data;
}
