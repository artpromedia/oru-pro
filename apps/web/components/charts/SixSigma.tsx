"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const samples = Array.from({ length: 20 }).map((_, idx) => ({
  sample: idx + 1,
  value: 48 + Math.random() * 4,
}));

const target = 50;
const ucl = 53;
const lcl = 47;

export default function SixSigmaChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={samples} margin={{ top: 10, right: 30, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="sample" tickLine={false} axisLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
        <YAxis domain={[45, 55]} tickLine={false} axisLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
        <Tooltip formatter={(value: number) => value.toFixed(2)} />
        <ReferenceLine y={ucl} stroke="#EF4444" strokeDasharray="5 5" label={{ value: "UCL", position: "insideTopRight", fill: "#EF4444" }} />
        <ReferenceLine y={lcl} stroke="#EF4444" strokeDasharray="5 5" label={{ value: "LCL", position: "insideBottomRight", fill: "#EF4444" }} />
        <ReferenceLine y={target} stroke="#10B981" strokeDasharray="3 3" label={{ value: "Target", position: "insideRight", fill: "#10B981" }} />
        <Line type="monotone" dataKey="value" stroke="#1D4ED8" strokeWidth={3} dot={{ r: 4, fill: "#1D4ED8" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
