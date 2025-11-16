"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, ServerCog } from "lucide-react";

type Wave = {
  id: string;
  name: string;
  systems: string[];
  start: string;
  cutover: string;
  status: "planned" | "in-progress" | "complete";
  readiness: number;
  issues: number;
};

type MigrationRisk = {
  category: string;
  likelihood: number;
  impact: number;
  mitigation: string;
};

type TelemetryPoint = {
  id: string;
  title: string;
  description: string;
  signal: "stable" | "warning" | "critical";
};

const waves: Wave[] = [
  {
    id: "wave-1",
    name: "Finance & Procurement",
    systems: ["SAP ECC", "Coupa", "Blackline"],
    start: "2025-09-02",
    cutover: "2025-10-14",
    status: "complete",
    readiness: 94,
    issues: 1,
  },
  {
    id: "wave-2",
    name: "Manufacturing Ops",
    systems: ["MES", "SCADA", "OSI PI"],
    start: "2025-10-20",
    cutover: "2025-12-05",
    status: "in-progress",
    readiness: 68,
    issues: 4,
  },
  {
    id: "wave-3",
    name: "Commercial & CRM",
    systems: ["Salesforce", "Marketo", "Zendesk"],
    start: "2026-01-06",
    cutover: "2026-02-28",
    status: "planned",
    readiness: 32,
    issues: 0,
  },
];

const riskMatrix: MigrationRisk[] = [
  {
    category: "Data Reconciliation",
    likelihood: 0.6,
    impact: 0.8,
    mitigation: "Parallel validation harness scoped for wave 2",
  },
  {
    category: "Interface Latency",
    likelihood: 0.4,
    impact: 0.6,
    mitigation: "Deploy caching tier + traffic shaping",
  },
  {
    category: "User Adoption",
    likelihood: 0.7,
    impact: 0.7,
    mitigation: "Accelerate hypercare pods + change champions",
  },
  {
    category: "Cutover Automation",
    likelihood: 0.3,
    impact: 0.9,
    mitigation: "Simulate rollback scripts inside sandbox",
  },
];

const telemetry: TelemetryPoint[] = [
  {
    id: "telemetry-1",
    title: "Release Queue",
    description: "7 deployment bundles staged · green path holds < 4hrs",
    signal: "stable",
  },
  {
    id: "telemetry-2",
    title: "Cold Chain Risk",
    description: "Ambient node 14 trending +3°C variance",
    signal: "warning",
  },
  {
    id: "telemetry-3",
    title: "QA Copilot",
    description: "19 deviations auto-remediated in last 24h",
    signal: "stable",
  },
];

const aiInsights = [
  {
    title: "Re-sequence wave 2",
    detail: "Shifting SCADA migration +3 days removes dependency collision with vendor firmware patch.",
  },
  {
    title: "Anomaly at site 4",
    detail: "Sensor feed dropped twice; recommend failover dry run before cutover freeze.",
  },
  {
    title: "Training deficit",
    detail: "Only 63% of commercial team completed sandbox labs; schedule additional live clinics.",
  },
];

export default function MigrationToolkit() {
  const [selectedWave, setSelectedWave] = useState<string>(waves[1].id);

  const activeWave = useMemo(() => waves.find((wave) => wave.id === selectedWave) ?? waves[0], [selectedWave]);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Prompt 4 · Migration Toolkit
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Platform Modernization Command</h1>
          <p className="text-sm text-gray-500">Wave orchestration, cold-chain telemetry, and QA copilots in one cockpit.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedWave}
            onChange={(event) => setSelectedWave(event.target.value)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
          >
            {waves.map((wave) => (
              <option key={wave.id} value={wave.id}>
                {wave.name}
              </option>
            ))}
          </select>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
            Launch Cutover Wizard
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Automation Coverage" value="81%" trend="+6" trendLabel="vs last wave" />
        <Metric label="Data Quality" value="98.7%" trend="+1.2" trendLabel="validation pass" />
        <Metric label="Cold Chain Risk" value="4 nodes" variant="warning" trend="+1" trendLabel="needs triage" />
        <Metric label="QA Tickets" value="32 open" variant="neutral" trend="-11" trendLabel="past 7d" />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {waves.map((wave) => (
            <WaveCard key={wave.id} wave={wave} isActive={wave.id === selectedWave} onSelect={setSelectedWave} />
          ))}
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Cutover Readiness</h2>
          <CutoverReadiness wave={activeWave} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Risk Segmentation</h2>
          <RiskBoard risks={riskMatrix} />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Release Queue Telemetry</h2>
          <TelemetryBoard telemetry={telemetry} />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Decision Copilot</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {aiInsights.map((insight) => (
            <div key={insight.title} className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="text-sm font-semibold text-indigo-700">{insight.title}</p>
              <p className="text-sm text-indigo-900/80">{insight.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

type MetricProps = {
  label: string;
  value: string;
  trend?: string;
  trendLabel?: string;
  variant?: "default" | "warning" | "neutral";
};

function Metric({ label, value, trend, trendLabel, variant = "default" }: MetricProps) {
  const palette: Record<Required<MetricProps>["variant"], string> = {
    default: "text-emerald-600",
    warning: "text-amber-600",
    neutral: "text-gray-600",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-2xl font-semibold ${palette[variant]}`}>{value}</p>
      {trend && trendLabel && (
        <p className="text-xs text-gray-500">
          {trend} <span className="text-gray-400">{trendLabel}</span>
        </p>
      )}
    </div>
  );
}

type WaveCardProps = {
  wave: Wave;
  isActive: boolean;
  onSelect: (id: string) => void;
};

function WaveCard({ wave, isActive, onSelect }: WaveCardProps) {
  const statusColors: Record<Wave["status"], string> = {
    complete: "text-emerald-600",
    "in-progress": "text-amber-600",
    planned: "text-gray-600",
  };

  return (
    <button
      onClick={() => onSelect(wave.id)}
      className={`w-full rounded-2xl border p-5 text-left transition hover:border-indigo-200 ${
        isActive ? "border-indigo-300 bg-indigo-50/70" : "border-gray-100 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{wave.name}</p>
          <p className={`text-xs ${statusColors[wave.status]}`}>{wave.status.replace("-", " ")}</p>
        </div>
        <p className="text-sm text-gray-500">
          {wave.start} → {wave.cutover}
        </p>
      </div>
      <p className="mt-2 text-xs text-gray-500">Systems: {wave.systems.join(", ")}</p>
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Readiness</span>
          <span>{wave.readiness}%</span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-gray-200">
          <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${wave.readiness}%` }} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          {wave.issues} issues
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-indigo-500" />
          Cutover {wave.cutover}
        </span>
      </div>
    </button>
  );
}

type CutoverReadinessProps = {
  wave: Wave;
};

function CutoverReadiness({ wave }: CutoverReadinessProps) {
  const checklist = [
    {
      label: "Automation scripts validated",
      status: wave.status !== "planned",
    },
    {
      label: "Rollback plan rehearsed",
      status: wave.status === "complete",
    },
    {
      label: "Hypercare pods staffed",
      status: wave.readiness > 60,
    },
    {
      label: "Data reconciliation sign-off",
      status: wave.status === "complete" || wave.readiness > 80,
    },
  ];

  return (
    <div className="space-y-3">
      {checklist.map((item) => (
        <div key={item.label} className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3">
          {item.status ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <Clock className="h-5 w-5 text-gray-300" />
          )}
          <p className="text-sm text-gray-700">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

type RiskBoardProps = {
  risks: MigrationRisk[];
};

function RiskBoard({ risks }: RiskBoardProps) {
  return (
    <div className="space-y-4">
      {risks.map((risk) => (
        <div key={risk.category} className="rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">{risk.category}</p>
            <span className="text-xs text-gray-500">
              L {Math.round(risk.likelihood * 100)}% · I {Math.round(risk.impact * 100)}%
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span className="h-2 flex-1 rounded-full bg-rose-100">
              <span
                className="block h-2 rounded-full bg-rose-500"
                style={{ width: `${risk.likelihood * 100}%` }}
              />
            </span>
            Likelihood
          </div>
          <p className="mt-2 text-sm text-gray-600">{risk.mitigation}</p>
        </div>
      ))}
    </div>
  );
}

type TelemetryBoardProps = {
  telemetry: TelemetryPoint[];
};

function TelemetryBoard({ telemetry }: TelemetryBoardProps) {
  const palette: Record<TelemetryPoint["signal"], string> = {
    stable: "text-emerald-600",
    warning: "text-amber-600",
    critical: "text-rose-600",
  };

  return (
    <div className="space-y-4">
      {telemetry.map((item) => (
        <div key={item.id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-4">
          <ServerCog className={`h-5 w-5 ${palette[item.signal]}`} />
          <div>
            <p className="text-sm font-semibold text-gray-900">{item.title}</p>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
          <span className={`ml-auto text-xs font-semibold uppercase ${palette[item.signal]}`}>{item.signal}</span>
        </div>
      ))}
    </div>
  );
}
