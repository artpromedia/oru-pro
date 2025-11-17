"use client";

import { useQuery } from "@tanstack/react-query";
import { Button, Card, useRealtimePulse } from "@oru/ui";
import { InventorySnapshot } from "@oru/shared";
import { useEffect } from "react";
import io from "socket.io-client";
import { create } from "zustand";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000");

type InventoryState = {
  snapshots: InventorySnapshot[];
  upsert: (payload: InventorySnapshot) => void;
};

const useInventoryStore = create<InventoryState>((set) => ({
  snapshots: [],
  upsert: (payload) =>
    set((state) => ({
      snapshots: [...state.snapshots.filter((s) => s.sku !== payload.sku), payload]
    }))
}));

export default function HomePage() {
  const snapshots = useInventoryStore((state) => state.snapshots);
  const upsert = useInventoryStore((state) => state.upsert);
  const pulse = useRealtimePulse();
  const facilityCount = new Set(snapshots.map((snapshot) => snapshot.facilityId)).size;
  const skuCount = snapshots.length;
  const totalAvailable = snapshots.reduce(
    (acc, snapshot) => acc + Math.max(0, snapshot.quantityOnHand - snapshot.quantityOnHold),
    0
  );
  const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const statusLabel = pulse.stale ? "Reconnecting…" : "Live telemetry";
  const statusIndicatorClass = pulse.stale ? "bg-amber-500" : "bg-emerald-500";

  useQuery({
    queryKey: ["inventory", "initial"],
    queryFn: async () => {
      const res = await fetch(`${process.env.API_BASE_URL ?? "http://localhost:4000/api"}/inventory`);
      const data: InventorySnapshot[] = await res.json();
      data.forEach(upsert);
      return data;
    }
  });

  useEffect(() => {
    socket.on("inventory:update", upsert);
    return () => {
      socket.off("inventory:update", upsert);
    };
  }, [upsert]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/70 p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-500">Operational wedge</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-semibold text-slate-900">Realtime inventory pulse</h1>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-sm font-medium text-slate-700 shadow-inner">
                <span className={`h-2 w-2 rounded-full ${statusIndicatorClass} animate-pulse`} />
                {statusLabel}
              </span>
            </div>
            <p className="max-w-2xl text-base text-slate-600">
              Keep a single control surface on every SKU across plants, QA holds, and cold-chain buffers. This pulse tiles the
              freshest telemetry so planners know exactly what can ship before the next exception fires.
            </p>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Facilities streaming</dt>
                <dd className="text-2xl font-semibold text-slate-900">{facilityCount || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Active SKUs</dt>
                <dd className="text-2xl font-semibold text-slate-900">{skuCount || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Available units</dt>
                <dd className="text-2xl font-semibold text-slate-900">{totalAvailable ? numberFormatter.format(totalAvailable) : "—"}</dd>
              </div>
            </dl>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button isLoading={pulse.stale} className="flex-1 sm:flex-none" size="lg">
              {pulse.stale ? "Syncing" : "Sync now"}
            </Button>
            <Button variant="ghost" className="flex-1 border border-slate-200 text-slate-900 sm:flex-none" size="lg">
              View audit trail
            </Button>
          </div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        {snapshots.map((snapshot) => (
          <Card key={snapshot.sku}>
            <p className="text-xs uppercase text-slate-500">{snapshot.facilityId}</p>
            <p className="text-2xl font-semibold">{snapshot.quantityOnHand - snapshot.quantityOnHold}</p>
            <p className="text-sm text-slate-500">{snapshot.sku}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
