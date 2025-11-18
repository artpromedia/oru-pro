"use client";

import type { TraceabilityEdge, TraceabilityNode } from "./ForceGraph";

type HeatProps = {
  nodes: TraceabilityNode[];
  edges: TraceabilityEdge[];
  riskLayer?: string;
};

export default function HeatMap({ nodes, edges, riskLayer = "quality" }: HeatProps) {
  const nodeScores = nodes.map((node) => ({
    ...node,
    score: getScore(node, riskLayer),
  }));

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-3 text-sm text-gray-500">
        {riskLayer} hotspots • {edges.length} lineage edges
      </div>
      <div className="grid flex-1 grid-cols-4 gap-3">
        {nodeScores.map((node) => (
          <div key={node.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs uppercase text-gray-400">{node.type}</p>
            <p className="text-sm font-semibold text-gray-900">{node.batch}</p>
            <div className="mt-2 h-2 rounded-full bg-gray-200">
              <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${node.score}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-gray-500">Risk index {node.score.toFixed(0)}%</p>
          </div>
        ))}
        {nodeScores.length === 0 && <p className="col-span-4 text-center text-sm text-gray-500">No nodes to render.</p>}
      </div>
    </div>
  );
}

function getScore(node: TraceabilityNode, layer: string) {
  if (layer === "quality") {
    return node.qualityScore ?? 50;
  }
  if (layer === "recall") {
    return (node.alerts ?? 0) * 20 + 30;
  }
  if (layer === "cold_chain") {
    return 40 + Math.random() * 40;
  }
  return 50 + Math.random() * 30;
}
