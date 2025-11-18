"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const cashData = [
  { month: "Jan", operations: 4.2, investing: -1.1, financing: 0.4 },
  { month: "Feb", operations: 3.8, investing: -0.8, financing: 0.6 },
  { month: "Mar", operations: 4.1, investing: -1.3, financing: 0.3 },
  { month: "Apr", operations: 4.5, investing: -1.6, financing: 0.2 },
  { month: "May", operations: 4.0, investing: -1.2, financing: -0.2 },
  { month: "Jun", operations: 4.4, investing: -1.0, financing: -0.4 },
  { month: "Jul", operations: 4.6, investing: -1.1, financing: 0.1 },
  { month: "Aug", operations: 4.1, investing: -0.9, financing: -0.1 },
  { month: "Sep", operations: 4.3, investing: -1.4, financing: 0.2 },
  { month: "Oct", operations: 4.1, investing: -1.1, financing: 0.5 },
  { month: "Nov", operations: 4.2, investing: -1.0, financing: 0.6 },
  { month: "Dec", operations: 4.5, investing: -1.5, financing: 0.7 },
];

export default function CashFlowChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={cashData} stackOffset="sign" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#94A3B8" }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94A3B8" }} unit="M" />
        <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}M`, ""]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="operations" stackId="cash" fill="#10B981" name="Operating" radius={[4, 4, 0, 0]} />
        <Bar dataKey="investing" stackId="cash" fill="#F97316" name="Investing" radius={[4, 4, 0, 0]} />
        <Bar dataKey="financing" stackId="cash" fill="#6366F1" name="Financing" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
