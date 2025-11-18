"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const assets = [
  { name: "Cash & Equivalents", value: 4.6 },
  { name: "Receivables", value: 3.8 },
  { name: "Inventory", value: 2.1 },
  { name: "Fixed Assets", value: 5.4 },
  { name: "Other", value: 1.4 },
];

const liabilities = [
  { name: "Payables", value: 3.2 },
  { name: "Short-term Debt", value: 1.7 },
  { name: "Long-term Debt", value: 4.5 },
  { name: "Equity", value: 7.9 },
];

const assetColors = ["#0EA5E9", "#6366F1", "#10B981", "#F97316", "#FACC15"];
const liabilityColors = ["#F43F5E", "#FB7185", "#F97316", "#10B981"];

export default function BalanceSheet() {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-1 gap-6">
        <ChartPanel title="Assets" data={assets} colors={assetColors} />
        <ChartPanel title="Liabilities & Equity" data={liabilities} colors={liabilityColors} />
      </div>
    </div>
  );
}

function ChartPanel({ title, data, colors }: { title: string; data: { name: string; value: number }[]; colors: string[] }) {
  return (
    <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50 p-4">
      <h4 className="mb-2 text-sm font-semibold text-slate-700">{title}</h4>
      <div className="flex h-48 items-center gap-6">
        <ResponsiveContainer width="50%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3} labelLine={false}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}M`, ""]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2 text-xs text-slate-500">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2">
              <span className="h-2 w-6 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="font-medium text-slate-700">{entry.name}</span>
              <span className="text-slate-900">${entry.value.toFixed(1)}M</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
