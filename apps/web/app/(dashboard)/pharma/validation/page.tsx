"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Beaker,
  CheckCircle2,
  ClipboardCheck,
  Clock8,
  Droplet,
  ShieldCheck,
  ThermometerSnowflake,
} from "lucide-react";
import { DonutChart } from "@/components/charts/DonutChart";
import { fetchPharmaValidation } from "@/lib/api";
import { mockPharmaValidation } from "@/lib/pharma-mock";
import type { PharmaValidationResponse } from "@/lib/pharma-types";

export default function PharmaValidationDashboard() {
  const { data, isFetching, isError, refetch } = useQuery<PharmaValidationResponse>({
    queryKey: ["pharma-validation"],
    queryFn: fetchPharmaValidation,
    initialData: mockPharmaValidation,
  });

  const readinessMetrics = data.readinessMetrics;
  const releaseQueue = data.releaseQueue;
  const validationGates = data.validationGates;
  const riskSlices = data.riskSegmentation;
  const copilotInsights = data.copilotInsights;
  const coldChainLanes = data.coldChainLanes;
  const auditTrail = data.auditTrail;
  const telemetry = data.telemetry;

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Prompt 1 · Pharma Ops</p>
          <h1 className="text-3xl font-bold text-gray-900">Validation Release Cockpit</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time QA readiness, cold-chain stability, and AI-assisted release actions.
            {isFetching && <span className="ml-2 text-xs text-blue-500">Syncing…</span>}
          </p>
          {isError && (
            <button onClick={() => refetch()} className="mt-1 text-xs font-semibold text-rose-600 underline">
              Retry data sync
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
            Export CFR log
          </button>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            Launch QA Copilot
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {readinessMetrics.map((metric, index) => {
          const Icon = metricIconMap[metric.id] ?? ShieldCheck;
          const accent = metricAccentMap[metric.id] ?? "text-gray-900";
          return (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">{metric.title}</p>
                <p className={`mt-2 text-3xl font-semibold ${accent}`}>{metric.value}</p>
                <p className="text-xs text-gray-500">{metric.sublabel}</p>
              </div>
              <Icon className={`h-10 w-10 ${accent}`} />
            </div>
            <div className="mt-4 text-xs font-medium text-gray-600">{metric.trend}</div>
          </motion.div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Release queue</p>
              <h2 className="text-lg font-semibold text-gray-900">Batches under QA orchestration</h2>
            </div>
            <span className="text-xs text-gray-500">Auto-refresh · 90s cadence</span>
          </div>
          <div className="divide-y divide-gray-100">
            {releaseQueue.map((lot) => (
              <div key={lot.lot} className="flex flex-wrap items-center gap-4 px-6 py-4 text-sm">
                <div className="w-32 font-semibold text-gray-900">{lot.lot}</div>
                <div className="flex-1 text-gray-600">{lot.product}</div>
                <div className="flex items-center gap-2 text-gray-700">
                  <ClipboardCheck className="h-4 w-4 text-blue-500" /> {lot.stage}
                </div>
                <div className="w-32 text-gray-500">{lot.owner}</div>
                <div className="w-48 text-gray-500">{lot.risks}</div>
                <div className="w-20 text-right font-semibold text-gray-900">{lot.eta}</div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {lot.confidence}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-slate-900 p-6 text-white shadow-sm">
            <p className="text-xs uppercase tracking-wide text-teal-300">Risk telemetry</p>
            <div className="mt-2 flex items-center gap-3">
              <Activity className="h-8 w-8 text-emerald-300" />
              <div>
                <p className="text-sm text-slate-200">AI quality signal</p>
                <p className="text-3xl font-semibold">{telemetry.aiSignal.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
              <p>Documentation completeness: {(telemetry.documentationCompleteness * 100).toFixed(0)}%</p>
              <p>Sterility drift probability: {(telemetry.sterilityDriftProbability * 100).toFixed(0)}%</p>
              <p>Label OCR accuracy: {(telemetry.labelOcrAccuracy * 100).toFixed(1)}%</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-400">Risk segmentation</p>
            <div className="mt-4 flex flex-col items-center justify-center">
              <DonutChart
                data={riskSlices.map((slice, index) => ({
                  id: slice.id,
                  value: slice.value,
                  color: slice.color ?? riskPalette[index % riskPalette.length],
                }))}
                centerText="Top Risks"
                centerSubtext="live"
              />
              <div className="mt-4 w-full space-y-2 text-sm text-gray-600">
                {riskSlices.map((slice, index) => (
                  <div key={slice.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: slice.color ?? riskPalette[index % riskPalette.length] }}
                      />
                      <span className="capitalize">{slice.id?.replace("-", " ")}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{slice.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <p className="text-xs uppercase tracking-wide text-gray-400">Validation steps</p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">Gate readiness timeline</h2>
          <div className="mt-4 space-y-4">
            {validationGates.map((gate) => (
              <div key={gate.label} className="flex items-center gap-4">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-white ${statusColor(gate.status)}`}
                >
                  <Beaker className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{gate.label}</p>
                  <p className="text-xs text-gray-500">{gate.owner}</p>
                </div>
                <div className="text-xs font-semibold text-gray-600">{gate.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">AI QA Copilot</p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">Recommended actions</h2>
          <div className="mt-4 space-y-4">
            {copilotInsights.map((insight) => (
              <div key={insight.title} className="rounded-xl bg-gray-50 p-4 text-sm">
                <p className="font-semibold text-gray-900">{insight.title}</p>
                <p className="mt-1 text-gray-600">{insight.detail}</p>
                <p className="mt-2 text-xs font-semibold text-emerald-600">Impact: {insight.impact}</p>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full rounded-xl bg-slate-900 py-2 text-sm font-semibold text-white">
            Approve all automations
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">Cold-chain telemetry</p>
          <div className="mt-4 space-y-3 text-sm">
            {coldChainLanes.map((lane) => (
              <div key={lane.lane} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{lane.lane}</p>
                  <p className="text-xs text-gray-500">Humidity {lane.humidity}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Droplet className="h-4 w-4 text-sky-500" />
                  <span className="font-semibold text-gray-900">{lane.temperature}</span>
                </div>
                <span
                  className={`text-xs font-semibold uppercase tracking-wide ${lane.status === "watch" ? "text-amber-600" : "text-emerald-600"}`}
                >
                  {lane.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">Audit trail</p>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            {auditTrail.map((entry) => (
              <div key={entry} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>{entry}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case "complete":
      return "bg-emerald-500";
    case "in-progress":
      return "bg-blue-500";
    case "blocked":
      return "bg-rose-500";
    case "queued":
      return "bg-gray-400";
    case "up-next":
      return "bg-amber-500";
    default:
      return "bg-slate-500";
  }
}

const metricIconMap: Record<string, typeof ShieldCheck> = {
  "release-backlog": ShieldCheck,
  expedite: Clock8,
  "cold-chain": ThermometerSnowflake,
  deviation: AlertTriangle,
};

const metricAccentMap: Record<string, string> = {
  "release-backlog": "text-green-600",
  expedite: "text-amber-600",
  "cold-chain": "text-blue-600",
  deviation: "text-rose-600",
};

const riskPalette = ["#F97316", "#0EA5E9", "#8B5CF6", "#10B981"];
