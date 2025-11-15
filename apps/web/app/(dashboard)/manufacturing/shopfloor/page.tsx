"use client";

import { type ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BadgeCheck,
  Gauge,
  Loader2,
  MoveRight,
  Target,
  Wrench,
} from "lucide-react";
import { DonutChart } from "@/components/charts/DonutChart";
import { fetchManufacturingShopfloor } from "@/lib/api";
import { mockManufacturingShopfloor } from "@/lib/manufacturing-mock";
import type { ManufacturingShopfloorResponse } from "@/lib/manufacturing-types";

export default function ManufacturingShopfloorDashboard() {
  const [selectedCell, setSelectedCell] = useState(
    () => mockManufacturingShopfloor.productionCells[0]?.id ?? "Cell A"
  );

  const { data, isFetching, isError, refetch } = useQuery<ManufacturingShopfloorResponse>({
    queryKey: ["manufacturing-shopfloor"],
    queryFn: fetchManufacturingShopfloor,
    initialData: mockManufacturingShopfloor,
  });

  const productionCells = data.productionCells;
  const lineEvents = data.lineEvents;
  const oeeSlices = data.oeeBreakdown;
  const scrapSlices = data.scrapRatio;
  const staffing = data.staffing;
  const optimizationQueue = data.optimizationQueue;

  useEffect(() => {
    if (productionCells.length === 0) return;
    setSelectedCell((prev) =>
      productionCells.some((cell) => cell.id === prev) ? prev : productionCells[0].id
    );
  }, [productionCells]);

  const averageOee = oeeSlices.length
    ? Math.round(oeeSlices.reduce((sum, slice) => sum + slice.value, 0) / oeeSlices.length)
    : 0;
  const scrapPercent = scrapSlices.find((slice) => slice.id === "scrap")?.value ?? 0;

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Prompt 2 · Precision Manufacturing</p>
          <h1 className="text-3xl font-bold text-gray-900">Shopfloor Autonomy Console</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor OEE, machine telemetry, and AI automation for every cell.
            {isFetching && <span className="ml-2 text-xs text-emerald-600">Syncing…</span>}
          </p>
          {isError && (
            <button onClick={() => refetch()} className="mt-1 text-xs font-semibold text-rose-600 underline">
              Retry data sync
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCell}
            onChange={(event) => setSelectedCell(event.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
          >
            {productionCells.map((cell) => (
              <option key={cell.id} value={cell.id}>
                {cell.id} · {cell.product}
              </option>
            ))}
          </select>
          <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
            Push new schedule
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {productionCells.map((cell) => {
          const isSelected = cell.id === selectedCell;
          return (
            <motion.div
              key={cell.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-5 shadow-sm transition ${
                cell.status === "maintenance"
                  ? "border-rose-200 bg-rose-50"
                  : cell.status === "changeover"
                    ? "border-amber-200 bg-amber-50"
                    : "border-gray-100 bg-white"
              } ${isSelected ? "ring-2 ring-emerald-200" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">{cell.id}</p>
                  <p className="text-lg font-semibold text-gray-900">{cell.product}</p>
                </div>
                <Badge status={cell.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                <Metric label="OEE" value={`${cell.oee}%`} />
                <Metric label="Throughput" value={`${cell.throughput}/shift`} />
                <Metric label="Changeover" value={cell.changeover} />
                <Metric label="Scrap" value={`${cell.scrap}%`} />
              </div>
            </motion.div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">OEE breakdown</p>
          <div className="mt-4 flex flex-col items-center justify-center">
            <DonutChart
              data={oeeSlices.map((slice, index) => ({
                id: slice.id,
                value: slice.value,
                color: slice.color ?? oeePalette[index % oeePalette.length],
              }))}
              centerText={`${averageOee}%`}
              centerSubtext="OEE"
            />
            <div className="mt-4 w-full space-y-2 text-sm text-gray-600">
              {oeeSlices.map((slice, index) => (
                <div key={slice.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: slice.color ?? oeePalette[index % oeePalette.length] }}
                    />
                    <span className="capitalize">{slice.id}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{slice.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">Scrap ratio</p>
          <div className="mt-4 flex items-center justify-center">
            <DonutChart
              data={scrapSlices.map((slice, index) => ({
                id: slice.id,
                value: slice.value,
                color: slice.color ?? scrapPalette[index % scrapPalette.length],
              }))}
              centerText={`${scrapPercent}%`}
              centerSubtext="scrap"
            />
          </div>
          <p className="mt-4 text-sm text-gray-500">
            AI flagged {scrapSlices.length} scrap signatures. Autonomic adjustments ready to deploy.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">Staffing & skills</p>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            {staffing.map((row) => (
              <div key={row.name} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                <div>
                  <p className="font-semibold text-gray-900">{row.name}</p>
                  <p className="text-xs">{row.skill}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-600">{row.coverage}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">Timeline</p>
          <h2 className="text-lg font-semibold text-gray-900">Autonomous shopfloor events</h2>
          <div className="mt-4 space-y-4">
            {lineEvents.map((event) => (
              <div key={`${event.event}-${event.time}`} className="flex gap-4">
                <div className="w-16 text-xs font-semibold text-gray-500">{event.time}</div>
                <div className="flex-1 rounded-xl bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{event.event}</p>
                    <Badge status={event.status} />
                  </div>
                  <p className="text-sm text-gray-600">{event.detail}</p>
                  <p className="mt-1 text-xs text-gray-500">Owner · {event.owner}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">AI optimization queue</p>
          <div className="mt-4 space-y-4">
            {optimizationQueue.map((task) => (
              <div key={task.title} className="rounded-xl bg-gray-50 p-4 text-sm">
                <p className="font-semibold text-gray-900">{task.title}</p>
                <p className="mt-1 text-gray-600">{task.detail}</p>
                <p className="mt-2 text-xs font-semibold text-emerald-600">Impact: {task.benefit}</p>
              </div>
            ))}
          </div>
          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2 text-sm font-semibold text-white">
            Deploy automations <MoveRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: ReactNode }> = {
    running: {
      label: "Running",
      className: "bg-emerald-100 text-emerald-700",
      icon: <Activity className="h-3.5 w-3.5" />,
    },
    changeover: {
      label: "Changeover",
      className: "bg-amber-100 text-amber-700",
      icon: <Loader2 className="h-3.5 w-3.5" />,
    },
    maintenance: {
      label: "Maintenance",
      className: "bg-rose-100 text-rose-700",
      icon: <Wrench className="h-3.5 w-3.5" />,
    },
    complete: {
      label: "Complete",
      className: "bg-emerald-100 text-emerald-700",
      icon: <BadgeCheck className="h-3.5 w-3.5" />,
    },
    attention: {
      label: "Attention",
      className: "bg-amber-100 text-amber-700",
      icon: <Target className="h-3.5 w-3.5" />,
    },
    queued: {
      label: "Queued",
      className: "bg-gray-100 text-gray-700",
      icon: <Gauge className="h-3.5 w-3.5" />,
    },
  };

  const config = map[status] ?? map.queued;

  return (
    <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

const oeePalette = ["#0EA5E9", "#22C55E", "#FACC15", "#8B5CF6"];
const scrapPalette = ["#16A34A", "#DC2626", "#F97316", "#0EA5E9"];
