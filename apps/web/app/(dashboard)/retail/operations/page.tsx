"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  BarChart3,
  Boxes,
  CreditCard,
  Flame,
  PackageCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import { DonutChart } from "@/components/charts/DonutChart";
import { fetchRetailOperations } from "@/lib/api";
import { mockRetailOperations } from "@/lib/retail-mock";
import type { RetailOperationsResponse } from "@/lib/retail-types";

export default function RetailOperationsDashboard() {
  const [timeframe, setTimeframe] = useState(
    () => mockRetailOperations.timeframeOptions[0] ?? "24h"
  );

  const { data, isFetching, isError, refetch } = useQuery<RetailOperationsResponse>({
    queryKey: ["retail-operations"],
    queryFn: fetchRetailOperations,
    initialData: mockRetailOperations,
  });

  const timeframeOptions = data.timeframeOptions;
  const statCards = data.statCards;
  const channelMix = data.channelMix;
  const fulfillmentWaves = data.fulfillmentWaves;
  const demandBoard = data.demandBoard;
  const storeHealth = data.storeHealth;
  const promoIdeas = data.promoIdeas;
  const inventoryGuardrails = data.inventoryGuardrails;
  const automationCards = data.automationCards;

  useEffect(() => {
    if (timeframeOptions.length === 0) return;
    if (!timeframeOptions.includes(timeframe)) {
      setTimeframe(timeframeOptions[0]);
    }
  }, [timeframeOptions, timeframe]);

  const leadingChannel = channelMix.find((slice) => slice.id === "DTC") ?? channelMix[0];
  const channelCenterText = leadingChannel
    ? `${leadingChannel.id} ${leadingChannel.value}%`
    : "Mix";


  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-600">Prompt 3 · Retail & Unified Commerce</p>
          <h1 className="text-3xl font-bold text-gray-900">Omni-channel Operations Nerve Center</h1>
          <p className="mt-1 text-sm text-gray-500">
            Channel health, fulfillment velocity, and loyalty telemetry in a single pane.
            {isFetching && <span className="ml-2 text-xs text-fuchsia-600">Syncing…</span>}
          </p>
          {isError && (
            <button onClick={() => refetch()} className="mt-1 text-xs font-semibold text-rose-600 underline">
              Retry data sync
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={timeframe}
            onChange={(event) => setTimeframe(event.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
          >
            {timeframeOptions.map((option) => (
              <option key={option} value={option}>
                {option === "24h" ? "Last 24h" : option === "7d" ? "Last 7d" : option === "30d" ? "Last 30d" : option}
              </option>
            ))}
          </select>
          <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
            Sync AI forecast
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = statIconMap[card.id] ?? ShoppingBag;
          const accent = card.accent ?? "text-gray-900";
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">{card.label}</p>
                  <p className={`mt-2 text-3xl font-semibold ${accent}`}>{card.value}</p>
                  <p className="text-xs text-gray-500">{card.helper}</p>
                </div>
                <Icon className={`h-10 w-10 ${accent}`} />
              </div>
              <div className="mt-4 text-xs font-semibold text-emerald-600">{card.delta}</div>
            </motion.div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">Channel mix</p>
          <div className="mt-4 flex flex-col items-center justify-center">
            <DonutChart
              data={channelMix.map((slice, index) => ({
                id: slice.id,
                value: slice.value,
                color: slice.color ?? channelPalette[index % channelPalette.length],
              }))}
              centerText={channelCenterText}
              centerSubtext="share"
            />
            <div className="mt-4 w-full space-y-2 text-sm text-gray-600">
              {channelMix.map((slice, index) => (
                <div key={slice.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: slice.color ?? channelPalette[index % channelPalette.length] }}
                    />
                    <span>{slice.id}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{slice.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">Fulfillment waves</p>
          <div className="mt-4 space-y-3 text-sm">
            {fulfillmentWaves.map((wave) => (
              <div key={wave.label} className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{wave.label}</p>
                  <StatusPill status={wave.status} />
                </div>
                <p className="text-xs text-gray-500">{wave.lanes}</p>
                <div className="mt-3 flex items-center justify-between text-gray-600">
                  <span>{wave.orders} orders</span>
                  <span className="font-semibold text-emerald-600">{wave.sla}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">Demand board</p>
          <div className="mt-4 space-y-3 text-sm">
            {demandBoard.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-600">{item.detail}</p>
                </div>
                <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">{item.action}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">Store cohort health</p>
          <div className="mt-4 divide-y divide-gray-100 text-sm">
            {storeHealth.map((store) => (
              <div key={store.store} className="flex flex-wrap items-center gap-4 py-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{store.store}</p>
                  <p className="text-xs text-gray-500">{store.doc}</p>
                </div>
                <Metric label="Sell-thru" value={store.sellThru} />
                <Metric label="Footfall" value={store.traffic} />
                <div className="text-xs font-medium text-gray-500">{store.actions}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">Promo + loyalty experiments</p>
          <div className="mt-4 space-y-4 text-sm">
            {promoIdeas.map((idea) => (
              <div key={idea.title} className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <p className="font-semibold text-gray-900">{idea.title}</p>
                </div>
                <p className="mt-2 text-gray-600">{idea.detail}</p>
                <p className="mt-2 text-xs font-semibold text-emerald-600">Projected lift {idea.lift}</p>
              </div>
            ))}
          </div>
          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2 text-sm font-semibold text-white">
            Launch promo wave
            <Flame className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">Inventory guardrails</p>
          <div className="mt-4 space-y-3 text-sm">
            {inventoryGuardrails.map((item) => (
              <div key={item.sku} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.sku}</p>
                  <p className="text-xs text-gray-500">{item.note}</p>
                </div>
                <StatusPill status={item.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">Fulfillment automation</p>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            {automationCards.map((card) => {
              const Icon = automationIconMap[card.icon] ?? Sparkles;
              return (
                <div key={card.label} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <Icon className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{card.label}</p>
                    <p className="text-xs text-gray-600">{card.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    packing: { label: "Packing", className: "bg-emerald-100 text-emerald-700" },
    picking: { label: "Picking", className: "bg-amber-100 text-amber-700" },
    exception: { label: "Exception", className: "bg-rose-100 text-rose-700" },
    healthy: { label: "Healthy", className: "bg-emerald-100 text-emerald-700" },
    risk: { label: "Risk", className: "bg-rose-100 text-rose-700" },
    watch: { label: "Watch", className: "bg-amber-100 text-amber-700" },
  };

  const config = map[status] ?? map.healthy;
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}>{config.label}</span>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

type IconComponent = typeof ShoppingBag;

const statIconMap: Record<string, IconComponent> = {
  gmv: ShoppingBag,
  fulfillment: Truck,
  loyalty: CreditCard,
  margin: Banknote,
};

const automationIconMap: Record<string, IconComponent> = {
  boxes: Boxes,
  package: PackageCheck,
  credit: CreditCard,
  truck: Truck,
};

const channelPalette = ["#6366F1", "#14B8A6", "#F97316", "#EC4899", "#0EA5E9"];
