"use client";

import { Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from "recharts";

const data = [
  { month: "Jan", score: 96.2 },
  { month: "Feb", score: 96.8 },
  { month: "Mar", score: 97.4 },
  { month: "Apr", score: 97.1 },
  { month: "May", score: 97.9 },
  { month: "Jun", score: 98.1 },
  { month: "Jul", score: 98.6 },
  { month: "Aug", score: 98.2 },
  { month: "Sep", score: 98.4 },
  { month: "Oct", score: 98.9 },
  { month: "Nov", score: 99.1 },
  { month: "Dec", score: 99.3 },
];

export default function QualityTrendChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
        <YAxis domain={[95, 100]} tickLine={false} axisLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
        <Tooltip cursor={{ stroke: "#94A3B8", strokeDasharray: 4 }} />
        <defs>
          <linearGradient id="qualityArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="score" stroke="none" fill="url(#qualityArea)" />
        <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: "#2563EB" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
