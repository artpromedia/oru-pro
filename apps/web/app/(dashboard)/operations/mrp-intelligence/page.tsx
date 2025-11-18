"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  Calendar,
  ChevronRight,
  Cpu,
  Download,
  Layers,
  Package,
  Play,
  RefreshCw,
  Settings,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

type RunMode = "manual" | "autonomous";

type DemandPoint = {
  date: string;
  forecast: number;
  actual: number;
  upper: number;
  lower: number;
};

type SupplyLane = {
  id: string;
  sku: string;
  stage: "plan" | "production" | "qa" | "ship";
  startDay: number;
  duration: number;
  quantity: number;
  status: "on_track" | "delayed" | "at_risk";
  focus: string;
};

type MaterialRequirement = {
  material: string;
  required: number;
  available: number;
  gap: number;
  action: string;
  criticality: "high" | "medium" | "low";
};

type RiskAlertData = {
  id: string;
  type: "stockout" | "overstock" | "supplier" | "demand" | "capacity";
  message: string;
  confidence: number;
  action: string;
  impact: string;
};

type OptimizationMetricData = {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  insight?: string;
};

type ScenarioComparison = {
  id: string;
  title: string;
  description: string;
  serviceImpact: number;
  inventoryImpact: number;
  costImpact: number;
  automation: string;
};

type Constraint = {
  id: string;
  name: string;
  severity: "high" | "medium" | "low";
  owner: string;
  eta: string;
  slackHours: number;
};

type AutomationAction = {
  id: string;
  title: string;
  eta: string;
  impact: string;
  status: "queued" | "sent" | "executed";
};

type MrpIntelligencePayload = {
  aiConfidence: number;
  serviceLevel: number;
  workingCapital: number;
  workingCapitalDelta: number;
  backlogRisk: number;
  changeovers: number;
  changeoverDelta: number;
  demandForecast: DemandPoint[];
  supplyPlan: SupplyLane[];
  materials: MaterialRequirement[];
  risks: RiskAlertData[];
  optimization: OptimizationMetricData[];
  scenarioComparisons: ScenarioComparison[];
  constraints: Constraint[];
  automationQueue: AutomationAction[];
  aiInsights: string[];
};

const SCENARIO_DEFAULT = "demand_spike";

export default function MRPIntelligenceDashboard() {
  const [runMode, setRunMode] = useState<RunMode>("manual");
  const [selectedHorizon, setSelectedHorizon] = useState(30);
  const [selectedScenario, setSelectedScenario] = useState(SCENARIO_DEFAULT);
  const [manualRunInFlight, setManualRunInFlight] = useState(false);

  const {
    data,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<MrpIntelligencePayload>({
    queryKey: ["mrp-intelligence", runMode, selectedHorizon, selectedScenario],
    queryFn: () => getMockMrpIntelligence(runMode, selectedHorizon, selectedScenario),
    staleTime: 90_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (runMode !== "autonomous") return;
    const timer = setInterval(() => {
      refetch();
    }, 45_000);
    return () => clearInterval(timer);
  }, [runMode, refetch]);

  const handleRun = useCallback(async () => {
    setManualRunInFlight(true);
    try {
      await refetch();
    } finally {
      setManualRunInFlight(false);
    }
  }, [refetch]);

  const stats = useMemo(() => {
    if (!data)
      return [
        { label: "Projected service level", value: "--", delta: "", icon: Target },
        { label: "Working capital", value: "--", delta: "", icon: BarChart3 },
        { label: "Backlog risk", value: "--", delta: "", icon: AlertTriangle },
        { label: "Changeovers", value: "--", delta: "", icon: Activity },
      ];

    return [
      {
        label: "Projected service level",
        value: `${data.serviceLevel.toFixed(1)}%`,
        delta: `+${(data.serviceLevel - 97).toFixed(1)} pts vs baseline`,
        icon: Target,
      },
      {
        label: "Working capital",
        value: currency.format(data.workingCapital),
        delta: `${percent.format(data.workingCapitalDelta)} reduction`,
        icon: BarChart3,
      },
      {
        label: "Backlog risk",
        value: `${data.backlogRisk.toFixed(1)}%`,
        delta: "per SKU risk weighted",
        icon: AlertTriangle,
      },
      {
        label: "Changeovers",
        value: `${data.changeovers}`,
        delta: `${data.changeoverDelta > 0 ? "+" : ""}${data.changeoverDelta} vs last run`,
        icon: Activity,
      },
    ];
  }, [data]);

  const selectedScenarioData = useMemo(() => {
    if (!data) return undefined;
    return (
      data.scenarioComparisons.find((scenario) => scenario.id === selectedScenario) ??
      data.scenarioComparisons[0]
    );
  }, [data, selectedScenario]);

  const isBusy = manualRunInFlight || isFetching || isLoading;

  return (
    <div className="space-y-6 bg-gray-50 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-purple-600 font-semibold">
            Operations // MRP 2.0
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold text-gray-900">
            <Brain className="h-8 w-8 text-purple-600" /> MRP Intelligence Center
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            AI-native planning twin that reasons across demand, capacity, supplier volatility, and capital
            efficiency in real time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <ConfidenceMeter confidence={data?.aiConfidence ?? 0} />
          <RunModeToggle runMode={runMode} onChange={setRunMode} />
          <button
            onClick={handleRun}
            disabled={isBusy}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm",
              isBusy && "opacity-60"
            )}
          >
            {isBusy ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> running MRP…
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Run orchestration
              </>
            )}
          </button>
        </div>
      </header>

      <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <PlanningParameter
            icon={Calendar}
            label="Planning horizon"
            value={`${selectedHorizon} days`}
            color="blue"
            editable
            onEdit={() => {}}
          >
            <input
              type="range"
              min={14}
              max={120}
              value={selectedHorizon}
              onChange={(event) => setSelectedHorizon(Number(event.target.value))}
              className="mt-3 w-full"
            />
          </PlanningParameter>
          <PlanningParameter icon={Target} label="Service level target" value="98.7%" color="green" helper="auto tuned" />
          <PlanningParameter icon={Layers} label="BOM depth" value="Unlimited" color="purple" helper="multi-echelon" />
          <PlanningParameter icon={Zap} label="Optimization" value="Multi-objective" color="orange" helper="cost + service + CO2" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-gray-200 p-4 text-sm">
          <div className="flex items-center gap-3 text-gray-600">
            <Cpu className="h-4 w-4 text-purple-600" />
            <span>Autonomous mode recalculates every 45 seconds with live IoT and order signals.</span>
          </div>
          <div className="flex items-center gap-3 text-gray-500">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Scenario focus:</span>
            <select
              value={selectedScenario}
              onChange={(event) => setSelectedScenario(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1 text-sm"
            >
              {data?.scenarioComparisons.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.title}
                </option>
              )) || (
                <option value={SCENARIO_DEFAULT}>Demand spike</option>
              )}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ translateY: -4 }}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</span>
              <stat.icon className="h-4 w-4 text-purple-500" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.delta}</p>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI demand forecast vs actuals</h2>
              <p className="text-xs uppercase tracking-wide text-gray-400">MAPE 4.1% • bias +0.7%</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">Seasonal shift detected</span>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">Elasticity model v5</span>
            </div>
          </header>
          <div className="h-80">
            <DemandForecastChart data={data?.demandForecast ?? []} />
          </div>
        </div>
        <div className="lg:col-span-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">AI detected risks</h2>
          <div className="space-y-3">
            {(data?.risks ?? getFallbackRisks()).map((risk) => (
              <RiskAlert key={risk.id} alert={risk} />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Optimized supply plan</h2>
            <p className="text-sm text-gray-500">Sequenced across {data?.supplyPlan.length ?? 0} constrained SKUs</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-blue-600">
            <button className="inline-flex items-center gap-1 hover:text-blue-700">
              <Download className="h-4 w-4" /> Export to Excel
            </button>
            <button className="hover:text-blue-700">Share plan</button>
          </div>
        </div>
        <SupplyGantt lanes={data?.supplyPlan ?? []} horizon={selectedHorizon} />
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Material requirements</h2>
            <span className="text-xs text-gray-500">Gaps prioritized by service risk</span>
          </div>
          <MaterialTable materials={data?.materials ?? []} />
        </div>
        <div className="lg:col-span-5 rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Optimization results</h2>
          <div className="space-y-4 flex-1">
            {(data?.optimization ?? getFallbackOptimization()).map((metric) => (
              <OptimizationMetric key={metric.label} metric={metric} />
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            AI summary: multi-objective solver recommends batching SKUs with shared allergens to eliminate two changeovers and free {currency.format(82000)} working capital.
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Scenario twin</h3>
          {selectedScenarioData ? (
            <ScenarioCard scenario={selectedScenarioData} />
          ) : (
            <p className="text-sm text-gray-500">Select a scenario to compare outcomes.</p>
          )}
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Constraint cockpit</h3>
          <div className="space-y-3">
            {(data?.constraints ?? getFallbackConstraints()).map((constraint) => (
              <ConstraintCard key={constraint.id} constraint={constraint} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Autonomous actions</h3>
          <div className="space-y-3">
            {(data?.automationQueue ?? getFallbackAutomation()).map((action) => (
              <AutomationCard key={action.id} action={action} />
            ))}
          </div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-purple-50 via-blue-50 to-cyan-50 border border-purple-200 p-6"
      >
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI planning intelligence</h3>
            <p className="text-sm text-gray-600">Digital twin synthesizes {data?.demandForecast.length ?? 0} signals from market, plant, supplier, and finance telemetry.</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2 text-sm text-gray-700">
              {(data?.aiInsights ?? fallbackInsights).map((insight) => (
                <div key={insight} className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-purple-500 mt-1" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function ConfidenceMeter({ confidence }: { confidence: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-white px-4 py-2 shadow-sm">
      <Cpu className="h-5 w-5 text-purple-600" />
      <div>
        <p className="text-xs uppercase text-gray-500">AI confidence</p>
        <p className="text-lg font-semibold text-purple-700">{confidence.toFixed(1)}%</p>
      </div>
      <div className="ml-2 h-2 w-24 rounded-full bg-purple-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
          style={{ width: `${Math.min(100, confidence)}%` }}
        />
      </div>
    </div>
  );
}

function RunModeToggle({ runMode, onChange }: { runMode: RunMode; onChange: (mode: RunMode) => void }) {
  return (
    <div className="flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm text-sm font-medium">
      {(["manual", "autonomous"] as RunMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-3 py-1.5",
            runMode === mode ? "bg-blue-600 text-white" : "text-gray-500"
          )}
        >
          {mode === "manual" ? <Play className="h-4 w-4" /> : <Zap className="h-4 w-4" />} {mode}
        </button>
      ))}
    </div>
  );
}

const COLOR_STYLES = {
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  green: { bg: "bg-green-100", text: "text-green-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
  orange: { bg: "bg-orange-100", text: "text-orange-600" },
} as const;

type PlanningParameterProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  helper?: string;
  color: keyof typeof COLOR_STYLES;
  editable?: boolean;
  onEdit?: () => void;
  children?: React.ReactNode;
};

function PlanningParameter({ icon: Icon, label, value, helper, color, editable, onEdit, children }: PlanningParameterProps) {
  const palette = COLOR_STYLES[color];
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("rounded-xl p-2", palette.bg)}>
          <Icon className={cn("h-5 w-5", palette.text)} />
        </div>
        {editable && (
          <button onClick={onEdit} className="text-gray-400 hover:text-gray-600">
            <Settings className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
      {helper && <p className="text-xs text-gray-400">{helper}</p>}
      {children}
    </div>
  );
}

function DemandForecastChart({ data }: { data: DemandPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Awaiting first run…
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="forecast" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: number) => Math.round(value).toLocaleString()} />
        <Area type="monotone" dataKey="upper" stroke="#c4b5fd" fill="transparent" />
        <Area type="monotone" dataKey="lower" stroke="#c4b5fd" strokeDasharray="4 4" fill="transparent" />
        <Line type="monotone" dataKey="forecast" stroke="#7c3aed" strokeWidth={3} dot={false} />
        <Line type="monotone" dataKey="actual" stroke="#0ea5e9" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function getRiskIcon(type: RiskAlertData["type"]) {
  switch (type) {
    case "stockout":
      return Package;
    case "overstock":
      return Layers;
    case "supplier":
      return AlertTriangle;
    case "capacity":
      return Activity;
    default:
      return TrendingUp;
  }
}

function RiskAlert({ alert }: { alert: RiskAlertData }) {
  const Icon = getRiskIcon(alert.type);
  const palette = {
    stockout: { bg: "bg-red-100", text: "text-red-700" },
    overstock: { bg: "bg-amber-100", text: "text-amber-700" },
    supplier: { bg: "bg-orange-100", text: "text-orange-700" },
    demand: { bg: "bg-purple-100", text: "text-purple-700" },
    capacity: { bg: "bg-blue-100", text: "text-blue-700" },
  }[alert.type];
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 hover:bg-gray-100">
      <div className="flex items-start gap-3">
        <div className={cn("rounded-lg p-2", palette.bg, palette.text)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{alert.message}</p>
          <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
            <span>Confidence {alert.confidence}% • {alert.impact}</span>
            <button className="text-blue-600 hover:text-blue-700">{alert.action}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MaterialTable({ materials }: { materials: MaterialRequirement[] }) {
  if (!materials.length) {
    return <p className="text-sm text-gray-500">No materials evaluated yet.</p>;
  }
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="py-2">Material</th>
            <th className="py-2 text-right">Required</th>
            <th className="py-2 text-right">Available</th>
            <th className="py-2 text-right">Gap</th>
            <th className="py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((item) => (
            <tr key={item.material} className="border-t border-gray-100">
              <td className="py-3 font-semibold text-gray-900">
                <div className="flex items-center gap-2">
                  <span>{item.material}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] uppercase",
                      item.criticality === "high"
                        ? "bg-red-100 text-red-700"
                        : item.criticality === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    )}
                  >
                    {item.criticality}
                  </span>
                </div>
              </td>
              <td className="py-3 text-right text-gray-600">{item.required.toLocaleString()}</td>
              <td className="py-3 text-right text-gray-600">{item.available.toLocaleString()}</td>
              <td className={cn("py-3 text-right font-semibold", item.gap > 0 ? "text-red-600" : "text-green-600")}>
                {item.gap > 0 ? `-${item.gap.toLocaleString()}` : "OK"}
              </td>
              <td className="py-3 text-right">
                {item.gap > 0 ? (
                  <button className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow">
                    {item.action}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Balanced</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OptimizationMetric({ metric }: { metric: OptimizationMetricData }) {
  return (
    <div className="rounded-xl border border-gray-100 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{metric.label}</p>
          <p className="text-xl font-semibold text-gray-900">{metric.value}</p>
        </div>
        <span className={cn("text-sm font-semibold", metric.positive ? "text-green-600" : "text-red-600")}>{metric.change}</span>
      </div>
      {metric.insight && <p className="text-xs text-gray-500">{metric.insight}</p>}
    </div>
  );
}

function SupplyGantt({ lanes, horizon }: { lanes: SupplyLane[]; horizon: number }) {
  if (!lanes.length) {
    return <p className="text-sm text-gray-500">Run MRP to visualize the plan.</p>;
  }
  return (
    <div className="space-y-4">
      {lanes.map((lane) => {
        const width = Math.max(8, (lane.duration / horizon) * 100);
        const offset = Math.min(100 - width, (lane.startDay / horizon) * 100);
        const statusColors = {
          on_track: "bg-green-500",
          delayed: "bg-orange-500",
          at_risk: "bg-red-500",
        } as const;
        return (
          <div key={lane.id} className="rounded-xl border border-gray-100 p-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                <p className="font-semibold text-gray-900">{lane.sku}</p>
                <p>{lane.focus}</p>
              </div>
              <span className="text-xs text-gray-500">{lane.quantity.toLocaleString()} units</span>
            </div>
            <div className="relative mt-3 h-3 rounded-full bg-gray-100">
              <div
                className={cn("absolute h-3 rounded-full", statusColors[lane.status])}
                style={{ width: `${width}%`, left: `${offset}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>Day {lane.startDay}</span>
              <span>{lane.duration} day span • {lane.stage}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: ScenarioComparison }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">{scenario.title}</p>
        <p className="text-sm text-gray-500">{scenario.description}</p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <ScenarioMetric label="Service" value={`${scenario.serviceImpact > 0 ? "+" : ""}${scenario.serviceImpact.toFixed(1)} pts`} positive={scenario.serviceImpact >= 0} />
        <ScenarioMetric label="Inventory" value={`${scenario.inventoryImpact > 0 ? "+" : ""}${scenario.inventoryImpact.toFixed(1)}%`} positive={scenario.inventoryImpact <= 0} />
        <ScenarioMetric label="Cost" value={currency.format(scenario.costImpact)} positive={scenario.costImpact <= 0} />
      </div>
      <div className="rounded-xl border border-dashed border-purple-200 bg-purple-50 p-4 text-sm text-purple-800">
        Automation: {scenario.automation}
      </div>
    </div>
  );
}

function ScenarioMetric({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className="rounded-xl border border-gray-100 p-3">
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className={cn("text-lg font-semibold", positive ? "text-green-600" : "text-red-600")}>{value}</p>
    </div>
  );
}

function ConstraintCard({ constraint }: { constraint: Constraint }) {
  const palette = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-green-100 text-green-700",
  } as const;
  return (
    <div className="rounded-xl border border-gray-100 p-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-gray-900">{constraint.name}</p>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", palette[constraint.severity])}>{constraint.severity}</span>
      </div>
      <p className="text-sm text-gray-500">Owner: {constraint.owner}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>ETA {constraint.eta}</span>
        <span>{constraint.slackHours}h slack</span>
      </div>
    </div>
  );
}

function AutomationCard({ action }: { action: AutomationAction }) {
  const palette = {
    queued: "bg-blue-100 text-blue-700",
    sent: "bg-purple-100 text-purple-700",
    executed: "bg-green-100 text-green-700",
  } as const;
  return (
    <div className="rounded-xl border border-gray-100 p-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-gray-900">{action.title}</p>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", palette[action.status])}>{action.status}</span>
      </div>
      <p className="text-sm text-gray-500">Impact: {action.impact}</p>
      <p className="text-xs text-gray-400">ETA {action.eta}</p>
    </div>
  );
}

const fallbackInsights = [
  "Detected latent correlation between SKU-142 and promotional calendar; autop-run reduced buffer by 2.2 days.",
  "Supplier Delta lead time trending down 11% enabling staggered release schedule.",
  "Cold-chain risk flagged for lot 18B: recommending forward deployment to coastal DCs.",
  "Finance signal indicates working capital unlock of $180K if plan executes as modeled.",
];

function getFallbackRisks(): RiskAlertData[] {
  return [
    {
      id: "risk-fallback-1",
      type: "demand",
      message: "Demand spike in LATAM for SKU-9001",
      confidence: 82,
      action: "Simulate",
      impact: "+18% load",
    },
  ];
}

function getFallbackOptimization(): OptimizationMetricData[] {
  return [
    { label: "Inventory", value: currency.format(1200000), change: "-12%", positive: true },
    { label: "Service", value: "98.4%", change: "+0.7%", positive: true },
  ];
}

function getFallbackConstraints(): Constraint[] {
  return [
    { id: "constraint-fallback", name: "Mixer line 4", severity: "high", owner: "Ops", eta: "6h", slackHours: 3 },
  ];
}

function getFallbackAutomation(): AutomationAction[] {
  return [
    { id: "auto-fallback", title: "Draft PO", eta: "20m", impact: "Closes gap for RM-001", status: "queued" },
  ];
}

async function getMockMrpIntelligence(runMode: RunMode, horizon: number, scenario: string): Promise<MrpIntelligencePayload> {
  await new Promise((resolve) => setTimeout(resolve, 450));
  const baseService = 97.2 + (runMode === "autonomous" ? 1 : 0) + Math.min(0.8, 120 / horizon) * 0.5;
  const aiConfidence = 91 + (runMode === "autonomous" ? 2.5 : 0) + Math.random() * 3;
  const workingCapital = 1_120_000 - horizon * 1_100;
  const workingCapitalDelta = -0.17 - horizon / 1000;
  const demandForecast = buildDemandForecast(horizon);
  const supplyPlan = buildSupplyPlan(horizon);
  const materials = buildMaterialRequirements();
  const risks = buildRiskAlerts();
  const optimization = buildOptimizations();
  const scenarioComparisons = buildScenarios();
  const scenarioImpact = scenarioComparisons.find((item) => item.id === scenario);
  const constraints = buildConstraints();
  const automationQueue = buildAutomationQueue();
  const aiInsights = buildInsights();

  return {
    aiConfidence,
    serviceLevel: baseService + (scenarioImpact?.serviceImpact ?? 0) * 0.35,
    workingCapital: workingCapital + (scenarioImpact?.inventoryImpact ?? 0) * 1200,
    workingCapitalDelta,
    backlogRisk: 6.4 + (scenarioImpact?.serviceImpact ?? 0) * -0.2,
    changeovers: 11,
    changeoverDelta: -3,
    demandForecast,
    supplyPlan,
    materials,
    risks,
    optimization,
    scenarioComparisons,
    constraints,
    automationQueue,
    aiInsights,
  };
}

function buildDemandForecast(horizon: number): DemandPoint[] {
  const formatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
  return Array.from({ length: horizon }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const seasonal = Math.sin(index / 6) * 120;
    const trend = index * 4;
    const base = 1200 + seasonal + trend;
    const actual = base + (Math.random() - 0.5) * 80;
    return {
      date: formatter.format(date),
      forecast: base,
      actual,
      upper: base * 1.08,
      lower: base * 0.92,
    };
  });
}

function buildSupplyPlan(horizon: number): SupplyLane[] {
  const stages: SupplyLane["stage"][] = ["plan", "production", "qa", "ship"];
  return Array.from({ length: 8 }, (_, index) => {
    const start = Math.floor(Math.random() * (horizon / 2));
    const duration = Math.max(3, Math.floor(Math.random() * 10));
    return {
      id: `lane-${index}`,
      sku: `SKU-${4000 + index}`,
      stage: stages[index % stages.length],
      startDay: start,
      duration,
      quantity: 2500 + index * 180,
      status: index % 3 === 0 ? "at_risk" : index % 2 === 0 ? "delayed" : "on_track",
      focus: index % 2 === 0 ? "Allergen cell" : "Frozen line",
    };
  });
}

function buildMaterialRequirements(): MaterialRequirement[] {
  return [
    { material: "Raw sugar #11", required: 5200, available: 3400, gap: 1800, action: "Expedite PO", criticality: "high" },
    { material: "Flour type A", required: 7600, available: 8100, gap: 0, action: "", criticality: "medium" },
    { material: "Packaging film", required: 2200, available: 600, gap: 1600, action: "Vendor swap", criticality: "high" },
    { material: "Preservative X", required: 140, available: 190, gap: 0, action: "", criticality: "low" },
    { material: "Carton inserts", required: 1800, available: 1200, gap: 600, action: "Auto PO", criticality: "medium" },
  ];
}

function buildRiskAlerts(): RiskAlertData[] {
  return [
    {
      id: "risk-1",
      type: "stockout",
      message: "SKU-1234 projected stockout in 5.2 days",
      confidence: 94,
      action: "Raise emergency PO",
      impact: "Tier-1 service",
    },
    {
      id: "risk-2",
      type: "overstock",
      message: "SKU-5678 inventory exceeds plan by 42%",
      confidence: 87,
      action: "Throttle production",
      impact: "Ties $210K",
    },
    {
      id: "risk-3",
      type: "supplier",
      message: "Supplier Z delays trending at +3.4 days",
      confidence: 91,
      action: "Activate dual source",
      impact: "Affects 4 BOMs",
    },
    {
      id: "risk-4",
      type: "demand",
      message: "AI found demand spike on West coast",
      confidence: 88,
      action: "Simulate buffer",
      impact: "+17% load",
    },
  ];
}

function buildOptimizations(): OptimizationMetricData[] {
  return [
    { label: "Inventory reduction", value: currency.format(234500), change: "-18%", positive: true, insight: "vs SAP MRP baseline" },
    { label: "Service level", value: "99.2%", change: "+1.2%", positive: true, insight: "Tier-1 SKUs" },
    { label: "Changeovers", value: "11", change: "-4", positive: true, insight: "Sequenced allergen families" },
    { label: "Working capital", value: currency.format(1_200_000), change: "-$320K", positive: true, insight: "Released from WIP" },
    { label: "Lead time", value: "3.1 days", change: "-0.9d", positive: true, insight: "Supplier collaboration" },
  ];
}

function buildScenarios(): ScenarioComparison[] {
  return [
    {
      id: "demand_spike",
      title: "Demand spike 12%",
      description: "Auto-hedged by flexing frozen line capacity and incremental shifts",
      serviceImpact: 0.9,
      inventoryImpact: -5.2,
      costImpact: -45_000,
      automation: "Drafting surge plan and notifying sales ops",
    },
    {
      id: "supplier_disruption",
      title: "Supplier disruption",
      description: "Shift 40% volume to regional suppliers with co-manufacturing",
      serviceImpact: -0.4,
      inventoryImpact: 8.4,
      costImpact: 28_000,
      automation: "Dual-source contracts ready for approval",
    },
    {
      id: "price_increase",
      title: "Commodity inflation",
      description: "Pre-buy sweeteners while working capital within guardrails",
      serviceImpact: 0.2,
      inventoryImpact: 3.1,
      costImpact: -62_000,
      automation: "Finance approved hedging envelope",
    },
  ];
}

function buildConstraints(): Constraint[] {
  return [
    { id: "constraint-1", name: "Mixer line 4", severity: "high", owner: "Ops", eta: "4h", slackHours: 2 },
    { id: "constraint-2", name: "Cold storage", severity: "medium", owner: "Logistics", eta: "12h", slackHours: 6 },
    { id: "constraint-3", name: "QA Lab", severity: "low", owner: "QA", eta: "2h", slackHours: 8 },
  ];
}

function buildAutomationQueue(): AutomationAction[] {
  return [
    { id: "auto-1", title: "Generate PO for raw sugar", eta: "17m", impact: "Closes 1.8k gap", status: "queued" },
    { id: "auto-2", title: "Notify supplier Z for expedite", eta: "5m", impact: "Lead time -2d", status: "sent" },
    { id: "auto-3", title: "Re-sequence allergen SKUs", eta: "Completed", impact: "-2 changeovers", status: "executed" },
  ];
}

function buildInsights(): string[] {
  return [
    "Detected seasonal uplift on SKU-123 from loyalty data; AI adjusted safety stock +6% in Western DCs.",
    "Supplier Zeta improving lead time trend; compression unlocks $140K working capital mid-quarter.",
    "Line 4 thermal excursion risk resolved using IoT data, enabling autonomous batch release.",
    "Finance telemetry indicates +$45K savings if AI-generated consolidated PO executed today.",
  ];
}
