"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

export type TraceabilityNode = {
  id: string;
  batch: string;
  material?: string;
  type?: string;
  status?: string;
  qty?: number;
  uom?: string;
  qualityScore?: number;
  location?: string;
  alerts?: number;
  date?: string;
};

export type TraceabilityEdge = {
  id?: string;
  source: string;
  target: string;
  qty?: number;
  uom?: string;
  date?: string;
  traceConfidence?: number;
};

type Props = {
  nodes: TraceabilityNode[];
  edges: TraceabilityEdge[];
  riskLayer?: string;
  coverage?: string;
  onNodeClick?: (node: TraceabilityNode) => void;
  onEdgeHover?: (edge: TraceabilityEdge | null) => void;
};

const TYPE_COLUMNS: Array<TraceabilityNode["type"]> = ["raw", "intermediate", "finished", "distribution"];

export default function ForceGraph({ nodes, edges, riskLayer, coverage, onNodeClick, onEdgeHover }: Props) {
  const grouped = useMemo(() => {
    return TYPE_COLUMNS.map((type) => ({
      type,
      nodes: nodes.filter((node) => node.type === type),
    }));
  }, [nodes]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="grid flex-1 grid-cols-4 gap-4">
        {grouped.map(({ type, nodes: typeNodes }) => (
          <div key={type} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">{formatType(type)}</p>
            <div className="mt-3 space-y-3">
              {typeNodes.map((node) => (
                <motion.button
                  key={node.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => onNodeClick?.(node)}
                  className="w-full rounded-xl border border-white/70 bg-white p-3 text-left shadow-sm"
                >
                  <p className="text-sm font-semibold text-gray-900">{node.batch}</p>
                  <p className="text-xs text-gray-500">{node.material}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>{node.qty?.toLocaleString()} {node.uom}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 capitalize">{node.status}</span>
                  </div>
                  {typeof node.qualityScore === "number" && (
                    <p className="mt-1 text-[11px] text-gray-400">Quality {node.qualityScore}%</p>
                  )}
                </motion.button>
              ))}
              {typeNodes.length === 0 && (
                <p className="text-xs text-gray-400">No {formatType(type)} nodes</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 flex flex-wrap items-center justify-between gap-2">
        <span>Risk layer: {riskLayer ?? "quality"}</span>
        <span>Coverage: {coverage ?? "global"}</span>
        <span>{edges.length} trace edges mapped</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {edges.slice(0, 6).map((edge) => (
          <div
            key={`${edge.source}-${edge.target}`}
            onMouseEnter={() => onEdgeHover?.(edge)}
            onMouseLeave={() => onEdgeHover?.(null)}
            className="rounded-xl border border-gray-100 bg-white p-3 text-xs text-gray-600"
          >
            <p className="font-semibold text-gray-900">{edge.source} → {edge.target}</p>
            <p className="mt-1">{edge.qty?.toLocaleString()} {edge.uom}</p>
            <p className="text-[11px] text-gray-400">Confidence {edge.traceConfidence ?? 90}% • {edge.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatType(type?: string | null) {
  if (!type) return "Unknown";
  switch (type) {
    case "raw":
      return "Raw materials";
    case "intermediate":
      return "WIP";
    case "finished":
      return "Finished goods";
    case "distribution":
      return "Distribution";
    default:
      return type;
  }
}
