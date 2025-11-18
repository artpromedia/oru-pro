"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { month: "Jan", revenue: 8.2, expenses: 5.9 },
  { month: "Feb", revenue: 8.6, expenses: 6.1 },
  { month: "Mar", revenue: 9.1, expenses: 6.4 },
  { month: "Apr", revenue: 9.4, expenses: 6.6 },
  { month: "May", revenue: 9.8, expenses: 6.8 },
  { month: "Jun", revenue: 10.2, expenses: 7.1 },
  { month: "Jul", revenue: 10.4, expenses: 7.3 },
  { month: "Aug", revenue: 10.9, expenses: 7.5 },
  { month: "Sep", revenue: 11.3, expenses: 7.7 },
  { month: "Oct", revenue: 11.8, expenses: 7.9 },
  { month: "Nov", revenue: 12.4, expenses: 8.1 },
  { month: "Dec", revenue: 12.9, expenses: 8.4 },
];

export default function FinancialChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F97316" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#F97316" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#94A3B8" }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94A3B8" }} unit="M" />
        <Tooltip cursor={{ fill: "rgba(15,118,110,0.08)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} fill="url(#revenueFill)" name="Revenue (M)" />
        <Area type="monotone" dataKey="expenses" stroke="#EA580C" strokeWidth={2} fill="url(#expenseFill)" name="Expenses (M)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
