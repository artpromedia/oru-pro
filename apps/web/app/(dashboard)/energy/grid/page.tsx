"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Battery,
  Flame,
  Sun,
  TrendingUp,
  Zap,
} from "lucide-react";

type GridMetric = {
  totalGeneration: number;
  totalDemand: number;
  renewablePercentage: number;
  gridFrequency: number;
  carbonIntensity: number;
  storageCapacity: number;
  storageLevel: number;
  peakDemandForecast: number;
};

type GenerationSource = {
  source: string;
  capacity: number;
  current: number;
  percentage: number;
};

type Severity = "high" | "medium" | "low";

type CriticalAlert = {
  type: string;
  severity: Severity;
  message: string;
  action: string;
  time: string;
};

type GridProfile = {
  label: string;
  metrics: GridMetric;
  generationSources: GenerationSource[];
  criticalAlerts: CriticalAlert[];
};

const gridProfiles: Record<string, GridProfile> = {
  "main-grid": {
    label: "National Grid",
    metrics: {
      totalGeneration: 1847,
      totalDemand: 1792,
      renewablePercentage: 42,
      gridFrequency: 50.02,
      carbonIntensity: 285,
      storageCapacity: 450,
      storageLevel: 67,
      peakDemandForecast: 2150,
    },
    generationSources: [
      { source: "Solar", capacity: 450, current: 380, percentage: 21 },
      { source: "Wind", capacity: 600, current: 420, percentage: 23 },
      { source: "Natural Gas", capacity: 800, current: 650, percentage: 36 },
      { source: "Hydro", capacity: 300, current: 280, percentage: 16 },
      { source: "Battery Storage", capacity: 200, current: -62, percentage: -3 },
    ],
    criticalAlerts: [
      {
        type: "demand_spike",
        severity: "high",
        message: "Peak demand expected at 18:00",
        action: "Prepare peaking plants",
        time: "2 hours",
      },
      {
        type: "renewable_drop",
        severity: "medium",
        message: "Wind generation dropping",
        action: "Increase gas turbine output",
        time: "30 mins",
      },
      {
        type: "maintenance",
        severity: "low",
        message: "Substation 7 scheduled maintenance",
        action: "Reroute power flow",
        time: "Tomorrow",
      },
    ],
  },
  "microgrid-east": {
    label: "Microgrid East",
    metrics: {
      totalGeneration: 312,
      totalDemand: 295,
      renewablePercentage: 68,
      gridFrequency: 60.01,
      carbonIntensity: 142,
      storageCapacity: 120,
      storageLevel: 54,
      peakDemandForecast: 335,
    },
    generationSources: [
      { source: "Solar", capacity: 160, current: 140, percentage: 45 },
      { source: "Wind", capacity: 120, current: 70, percentage: 22 },
      { source: "Fuel Cell", capacity: 50, current: 40, percentage: 13 },
      { source: "Battery Storage", capacity: 60, current: -12, percentage: -4 },
      { source: "Grid Import", capacity: 40, current: 25, percentage: 8 },
    ],
    criticalAlerts: [
      {
        type: "storage_warning",
        severity: "medium",
        message: "Battery reserve trending low",
        action: "Trigger demand response",
        time: "45 mins",
      },
    ],
  },
};

export default function EnergyGridDashboard() {
  const [selectedGrid, setSelectedGrid] = useState<keyof typeof gridProfiles>("main-grid");
  const profile = gridProfiles[selectedGrid];

  const gridHealth = useMemo(() => {
    const reserve = profile.metrics.totalGeneration - profile.metrics.totalDemand;
    const stability = reserve > 0 ? "Stable" : "Constrained";
    return {
      reserve,
      stability,
    };
  }, [profile.metrics.totalDemand, profile.metrics.totalGeneration]);

  return (
    <div className="space-y-6 bg-gray-900 p-6 text-white">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
            Prompt 7 · Energy & Utilities
          </p>
          <h1 className="text-3xl font-bold">Energy Grid Management</h1>
          <p className="mt-1 text-sm text-gray-400">
            {profile.label} · Real-time grid monitoring and optimization insights.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedGrid}
            onChange={(event) => setSelectedGrid(event.target.value as keyof typeof gridProfiles)}
            className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm"
          >
            {Object.entries(gridProfiles).map(([id, grid]) => (
              <option key={id} value={id}>
                {grid.label}
              </option>
            ))}
          </select>
          <div
            className={`rounded-lg px-3 py-1 text-sm ${gridHealth.reserve > 0 ? "bg-emerald-900 text-emerald-300" : "bg-amber-900 text-amber-200"}`}
          >
            Grid {gridHealth.stability}
          </div>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500">
            Dispatch Report
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GridMetricCard
          icon={Zap}
          label="Total Generation"
          value={`${profile.metrics.totalGeneration} MW`}
          subvalue="Capacity: 2,500 MW"
        />
        <GridMetricCard
          icon={Activity}
          label="Current Demand"
          value={`${profile.metrics.totalDemand} MW`}
          subvalue={`Reserve: ${gridHealth.reserve} MW`}
        />
        <GridMetricCard
          icon={Sun}
          label="Renewable Mix"
          value={`${profile.metrics.renewablePercentage}%`}
          subvalue="Target: 50%"
          positive={profile.metrics.renewablePercentage >= 45}
        />
        <GridMetricCard
          icon={Battery}
          label="Storage Level"
          value={`${profile.metrics.storageLevel}%`}
          subvalue={`${profile.metrics.storageCapacity} MWh available`}
        />
        <GridMetricCard
          icon={Activity}
          label="Frequency"
          value={`${profile.metrics.gridFrequency.toFixed(2)} Hz`}
          subvalue="Target: 50 Hz"
        />
        <GridMetricCard
          icon={Flame}
          label="CO₂ Intensity"
          value={`${profile.metrics.carbonIntensity} gCO₂/kWh`}
          subvalue="Goal: < 250"
          alert={profile.metrics.carbonIntensity > 300}
        />
        <GridMetricCard
          icon={TrendingUp}
          label="Peak Forecast"
          value={`${profile.metrics.peakDemandForecast} MW`}
          subvalue="At 18:00"
        />
        <GridMetricCard
          icon={AlertTriangle}
          label="Active Alerts"
          value={`${profile.criticalAlerts.length}`}
          subvalue={`${profile.criticalAlerts.filter((alert) => alert.severity === "high").length} critical`}
          alert={profile.criticalAlerts.length > 0}
        />
      </section>

      <section className="rounded-xl bg-gray-800 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Generation Mix</h2>
          <p className="text-sm text-gray-400">
            Storage output reflects charge (-) or discharge (+)
          </p>
        </div>
        <div className="mt-4 space-y-3">
          {profile.generationSources.map((source) => (
            <GenerationSourceBar key={source.source} source={source} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl bg-gray-800 p-6">
          <h2 className="text-lg font-semibold">Grid Topology</h2>
          <p className="text-sm text-gray-400">Interactive map placeholder for substation telemetry</p>
          <div className="mt-4 flex h-96 items-center justify-center rounded-lg bg-gray-900 text-gray-500">
            Interactive Grid Map
          </div>
        </div>
        <div className="rounded-xl bg-gray-800 p-6">
          <h2 className="text-lg font-semibold">Critical Alerts</h2>
          <div className="mt-4 space-y-3">
            {profile.criticalAlerts.map((alert, index) => (
              <AlertCard key={`${alert.type}-${index}`} alert={alert} />
            ))}
            {profile.criticalAlerts.length === 0 && (
              <p className="rounded-lg bg-gray-900 p-4 text-sm text-gray-400">
                No active alerts for this grid segment.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

type GridMetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  subvalue: string;
  positive?: boolean;
  alert?: boolean;
};

function GridMetricCard({ icon: Icon, label, value, subvalue, positive, alert }: GridMetricCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 text-sm shadow-sm transition ${
        positive
          ? "border-emerald-500/40 bg-emerald-500/5"
          : alert
            ? "border-amber-400/40 bg-amber-500/10"
            : "border-gray-800 bg-gray-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-gray-400">{label}</p>
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="text-xs text-gray-500">{subvalue}</p>
    </div>
  );
}

type GenerationSourceBarProps = {
  source: GenerationSource;
};

function GenerationSourceBar({ source }: GenerationSourceBarProps) {
  const utilization = Math.min(Math.abs(source.current) / source.capacity, 1);
  const discharge = source.current < 0;

  return (
    <div className="rounded-lg bg-gray-900 p-4">
      <div className="flex items-center justify-between text-sm">
        <p className="font-medium">{source.source}</p>
        <p className="text-gray-400">{source.current} / {source.capacity} MW</p>
      </div>
      <div className="mt-2 h-2 rounded-full bg-gray-800">
        <div
          className={`${discharge ? "bg-amber-400" : "bg-emerald-400"} h-full rounded-full`}
          style={{ width: `${utilization * 100}%` }}
        />
      </div>
      <p className={`mt-2 text-xs ${discharge ? "text-amber-300" : "text-emerald-300"}`}>
        {discharge ? "Discharging" : "Generating"} · {source.percentage}% of mix
      </p>
    </div>
  );
}

type AlertCardProps = {
  alert: CriticalAlert;
};

const severityStyles: Record<Severity, string> = {
  high: "border-rose-400/60 bg-rose-500/10 text-rose-100",
  medium: "border-amber-400/60 bg-amber-500/10 text-amber-100",
  low: "border-blue-400/60 bg-blue-500/10 text-blue-100",
};

function AlertCard({ alert }: AlertCardProps) {
  return (
    <div className={`rounded-lg border p-4 text-sm ${severityStyles[alert.severity]}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-gray-300">{alert.type.replace("_", " ")}</p>
        <span className="text-xs font-semibold text-white">{alert.time}</span>
      </div>
      <p className="mt-2 text-base font-semibold text-white">{alert.message}</p>
      <p className="text-xs text-gray-200">{alert.action}</p>
    </div>
  );
}
