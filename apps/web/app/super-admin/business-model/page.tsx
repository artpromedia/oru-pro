"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Banknote,
  BarChart3,
  Clock3,
  DollarSign,
  FileSpreadsheet,
  Layers3,
  LineChart,
  LucideIcon,
  RefreshCw,
  Target,
  Users2,
  Workflow,
} from "lucide-react";

const revenueStreams = [
  { label: "Seat Licenses", value: 420_000, change: 12 },
  { label: "Usage-Based", value: 185_000, change: 5 },
  { label: "AI Copilots", value: 96_000, change: 18 },
  { label: "Marketplace", value: 42_000, change: -3 },
];

const costDrivers = [
  { label: "AI Inference", value: 68_000 },
  { label: "Support & Success", value: 52_000 },
  { label: "Integration Ops", value: 36_000 },
  { label: "Cloud Infrastructure", value: 44_000 },
];

const cohortData = [
  { cohort: "Q1 2023", payback: 7, grossMargin: 78, retention: 96 },
  { cohort: "Q2 2023", payback: 6, grossMargin: 79, retention: 94 },
  { cohort: "Q3 2023", payback: 8, grossMargin: 77, retention: 95 },
  { cohort: "Q4 2023", payback: 5, grossMargin: 81, retention: 97 },
];

const adminTabs = [
  { id: "overview", label: "Overview", icon: LineChart },
  { id: "pricing", label: "Pricing Experiments", icon: Workflow },
  { id: "roi", label: "ROI Models", icon: Target },
  { id: "cohorts", label: "Customer Cohorts", icon: Users2 },
  { id: "revex", label: "RevEx Forecast", icon: BarChart3 },
];

type TabId = (typeof adminTabs)[number]["id"];

export default function BusinessModelAdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [forecastRange, setForecastRange] = useState<"qtr" | "year">("qtr");

  const forecast = useMemo(() => {
    const multiplier = forecastRange === "qtr" ? 1 : 4;
    return {
      arr: 650_000 * multiplier,
      grossMargin: 0.78,
      payback: 6,
      churn: 0.03,
    };
  }, [forecastRange]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/95 px-10 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Business Model Agent</p>
            <h1 className="text-3xl font-semibold text-white">Monetization Command Center</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-300 hover:border-slate-600">
              Export Board
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-purple-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500">
              <RefreshCw className="h-4 w-4" /> Sync Pricing Model
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-10 py-10">
  <TabList tabs={adminTabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <MetricCard title="Net ARR" value={`$${forecast.arr.toLocaleString()}`} change="↑ 14% QoQ" icon={DollarSign} />
          <MetricCard title="Gross Margin" value={`${Math.round(forecast.grossMargin * 100)}%`} change="Target 80%" icon={Banknote} />
          <MetricCard title="Payback" value={`${forecast.payback} months`} change="Goal: < 6" icon={Clock3} />
          <MetricCard title="Logo Retention" value={`${Math.round((1 - forecast.churn) * 100)}%`} change="-1.2% this quarter" icon={Activity} />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card title="Revenue Composition" icon={Layers3}>
            <div className="space-y-4">
              {revenueStreams.map((stream) => (
                <div key={stream.label} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-100">{stream.label}</p>
                    <p className="text-sm text-slate-500">{stream.change > 0 ? `Up ${stream.change}%` : `Down ${Math.abs(stream.change)}%`} vs last QTR</p>
                  </div>
                  <p className="text-xl font-bold text-white">${stream.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Cost Drivers" icon={AlertTriangle}>
            <div className="space-y-4">
              {costDrivers.map((driver) => (
                <div key={driver.label} className="flex items-center justify-between">
                  <p className="font-semibold text-slate-100">{driver.label}</p>
                  <p className="text-xl font-bold text-rose-300">-${driver.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <Card title="Pricing Experiments" icon={Workflow}>
            <ul className="space-y-4 text-sm">
              <li className="rounded-lg border border-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-50">Seat-based + Usage</span>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">Live</span>
                </div>
                <p className="mt-2 text-slate-400">+18% NDR uplift with AI dispatch usage blocks</p>
              </li>
              <li className="rounded-lg border border-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-50">Copilot Bundles</span>
                  <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-300">Testing</span>
                </div>
                <p className="mt-2 text-slate-400">Attach rate 42% in industrial accounts</p>
              </li>
            </ul>
          </Card>

          <Card title="AI Monetization" icon={Target}>
            <div className="space-y-3 text-sm text-slate-300">
              <p>Inventory Copilot: $29/user add-on</p>
              <p>Production Copilot: $49/user add-on</p>
              <p>Decision Intelligence Engine: $0.05/decision</p>
              <p>Warehouse Mobile Companion: $9/device</p>
            </div>
          </Card>

          <Card title="RevEx Forecast" icon={BarChart3}>
            <div className="flex items-center justify-between text-sm text-slate-400">
              <button onClick={() => setForecastRange("qtr")} className={`rounded-md px-3 py-1 ${forecastRange === "qtr" ? "bg-slate-800 text-white" : ""}`}>
                Quarterly
              </button>
              <button onClick={() => setForecastRange("year")} className={`rounded-md px-3 py-1 ${forecastRange === "year" ? "bg-slate-800 text-white" : ""}`}>
                Annualized
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-slate-800 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Forward Projection</p>
              <p className="mt-3 text-3xl font-semibold">
                ${forecast.arr.toLocaleString()} <span className="text-base text-emerald-300">ARR</span>
              </p>
              <p className="mt-2 text-sm text-slate-400">Gross Margin {Math.round(forecast.grossMargin * 100)}% • Payback {forecast.payback} mos</p>
            </div>
          </Card>
        </div>

        <Card title="Cohort Metrics" icon={FileSpreadsheet} className="mt-10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-3">Cohort</th>
                  <th className="py-3">Payback</th>
                  <th className="py-3">Gross Margin</th>
                  <th className="py-3">Retention</th>
                </tr>
              </thead>
              <tbody>
                {cohortData.map((row) => (
                  <tr key={row.cohort} className="border-t border-slate-900 text-slate-200">
                    <td className="py-3 font-semibold">{row.cohort}</td>
                    <td className="py-3">{row.payback} months</td>
                    <td className="py-3">{row.grossMargin}%</td>
                    <td className="py-3">{row.retention}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}

function TabList({ tabs, activeTab, onChange }: { tabs: typeof adminTabs; activeTab: TabId; onChange: (tab: TabId) => void }) {
  return (
    <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id as TabId)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition ${
            activeTab === tab.id ? "bg-purple-500/20 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

type MetricCardProps = {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
};

function MetricCard({ title, value, change, icon: Icon }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl shadow-slate-950/40">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
          <p className="mt-2 text-sm text-slate-400">{change}</p>
        </div>
        <div className="rounded-full bg-purple-500/10 p-3 text-purple-300">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, className = "", children }: { title: string; icon: LucideIcon; className?: string; children: React.ReactNode }) {
  return (
    <section className={`rounded-2xl border border-slate-800 bg-slate-950/70 p-6 ${className}`}>
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-full bg-slate-900 p-2 text-purple-300">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}
