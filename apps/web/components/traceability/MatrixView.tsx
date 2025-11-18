"use client";

import type { TraceabilityEdge, TraceabilityNode } from "./ForceGraph";

type MatrixProps = {
  nodes: TraceabilityNode[];
  edges: TraceabilityEdge[];
};

export default function MatrixView({ nodes, edges }: MatrixProps) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node.batch]));
  return (
    <div className="h-full overflow-auto rounded-2xl border border-gray-100 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2 text-left">From</th>
            <th className="px-3 py-2 text-left">To</th>
            <th className="px-3 py-2 text-left">Quantity</th>
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-left">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {edges.map((edge) => (
            <tr key={`${edge.source}-${edge.target}-${edge.date}`} className="border-t border-gray-100">
              <td className="px-3 py-2 text-gray-700">{nodeMap.get(edge.source) ?? edge.source}</td>
              <td className="px-3 py-2 text-gray-700">{nodeMap.get(edge.target) ?? edge.target}</td>
              <td className="px-3 py-2 text-gray-600">{edge.qty?.toLocaleString()} {edge.uom}</td>
              <td className="px-3 py-2 text-gray-500">{edge.date ?? "—"}</td>
              <td className="px-3 py-2">
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                  {edge.traceConfidence ?? 100}%
                </span>
              </td>
            </tr>
          ))}
          {edges.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500">
                No lineage edges found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
