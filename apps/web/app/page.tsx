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
      <section className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-slate-500">Phase 1 — Operational wedge</p>
          <h1 className="text-3xl font-semibold text-slate-900">Realtime inventory pulse</h1>
          <p className="text-sm text-slate-500">{pulse.stale ? "Awaiting signal" : "Live feed"}</p>
        </div>
        <Button isLoading={pulse.stale}>Sync now</Button>
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
