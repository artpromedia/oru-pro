"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const baseData = [
  { month: "Jan", gross: 380, net: 280, taxes: 65, benefits: 35 },
  { month: "Feb", gross: 392, net: 288, taxes: 68, benefits: 36 },
  { month: "Mar", gross: 405, net: 295, taxes: 70, benefits: 38 },
  { month: "Apr", gross: 410, net: 300, taxes: 71, benefits: 39 },
  { month: "May", gross: 420, net: 306, taxes: 73, benefits: 41 },
  { month: "Jun", gross: 432, net: 312, taxes: 76, benefits: 42 },
  { month: "Jul", gross: 445, net: 322, taxes: 78, benefits: 45 },
  { month: "Aug", gross: 452, net: 328, taxes: 80, benefits: 46 },
  { month: "Sep", gross: 460, net: 334, taxes: 82, benefits: 47 },
  { month: "Oct", gross: 468, net: 340, taxes: 84, benefits: 48 },
  { month: "Nov", gross: 477, net: 345, taxes: 86, benefits: 50 },
  { month: "Dec", gross: 489, net: 352, taxes: 89, benefits: 51 },
];

const scenarios = {
  baseline: 1,
  growth: 1.08,
  contraction: 0.94,
} as const;

type ScenarioKey = keyof typeof scenarios;

export default function PayrollAnalytics() {
  const [scenario, setScenario] = useState<ScenarioKey>("baseline");

  const chartData = useMemo(() => {
    const multiplier = scenarios[scenario];
    return baseData.map((row) => ({
      ...row,
      gross: Math.round(row.gross * multiplier),
      net: Math.round(row.net * multiplier),
      taxes: Math.round(row.taxes * multiplier),
      benefits: Math.round(row.benefits * multiplier),
    }));
  }, [scenario]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600">
        {Object.keys(scenarios).map((key) => (
          <button
            key={key}
            onClick={() => setScenario(key as ScenarioKey)}
            className={`rounded-full border px-3 py-1 capitalize transition-colors ${
              scenario === key ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white"
            }`}
          >
            {key}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, left: 0, right: 0 }}>
          <defs>
            <linearGradient id="gross" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="net" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#9ca3af" />
          <YAxis unit="k" stroke="#9ca3af" />
          <Tooltip
            formatter={(value: number) => [`$${value}k`, undefined]}
            contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb" }}
          />
          <Legend verticalAlign="top" height={36} />
          <Area type="monotone" dataKey="gross" stroke="#2563eb" fill="url(#gross)" strokeWidth={2} />
          <Area type="monotone" dataKey="net" stroke="#059669" fill="url(#net)" strokeWidth={2} />
          <Area type="monotone" dataKey="taxes" stroke="#f97316" fill="#fb923c20" strokeWidth={2} />
          <Area type="monotone" dataKey="benefits" stroke="#9333ea" fill="#c084fc20" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
