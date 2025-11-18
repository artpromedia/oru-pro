"use client";

import { useMemo } from "react";

import type { TraceabilityEdge, TraceabilityNode } from "./ForceGraph";

type TimelineProps = {
  nodes: TraceabilityNode[];
  edges: TraceabilityEdge[];
  traceDirection?: "forward" | "backward" | "both";
};

export default function Timeline({ nodes, edges, traceDirection = "both" }: TimelineProps) {
  const ordered = useMemo(() => {
    return [...nodes].sort((a, b) => (new Date(a.date ?? "").getTime() || 0) - (new Date(b.date ?? "").getTime() || 0));
  }, [nodes]);

  const directionLabel = traceDirection === "both" ? "Forward & backward" : traceDirection === "forward" ? "Forward" : "Backward";

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm text-sm text-gray-500">
        Direction: {directionLabel} • {edges.length} edges
      </div>
      <div className="flex-1 overflow-auto rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
        <div className="relative ml-6">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-blue-200 via-purple-200 to-blue-200" />
          <div className="space-y-6">
            {ordered.map((node) => (
              <div key={node.id} className="relative pl-6">
                <div className="absolute -left-6 top-2 h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow" />
                <p className="text-xs uppercase tracking-wide text-gray-400">{node.date ?? "Unknown"}</p>
                <p className="text-sm font-semibold text-gray-900">{node.batch} • {node.material}</p>
                <p className="text-xs text-gray-500">Status {node.status} • {node.qty?.toLocaleString()} {node.uom}</p>
              </div>
            ))}
            {ordered.length === 0 && <p className="text-sm text-gray-500">No events available.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
