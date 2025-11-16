"use client";

import { useMemo } from "react";

const industries = ["Manufacturing", "Food & Beverage", "Pharmaceutical", "Retail"];

export function OrganizationSettings() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Organization Details</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <TextField label="Organization Name" defaultValue="AcmeCorp" />
          <SelectField label="Industry" options={industries} />
          <TextField label="Primary Contact" type="email" defaultValue="admin@acmecorp.com" />
          <TextField label="Billing Email" type="email" defaultValue="billing@acmecorp.com" />
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Subscription & Usage</h2>
        <div className="space-y-4">
          <UsageMetric label="Active Users" current={198} limit={250} />
          <UsageMetric label="Data Storage" current={1.2} limit={5} unit="TB" />
          <UsageMetric label="API Calls (Monthly)" current={890_000} limit={1_000_000} />
        </div>
        <button className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
          Upgrade Plan
        </button>
      </section>
    </div>
  );
}

type TextFieldProps = {
  label: string;
  type?: string;
  defaultValue?: string | number;
};

function TextField({ label, type = "text", defaultValue }: TextFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      />
    </div>
  );
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function UsageMetric({ label, current, limit, unit = "" }: { label: string; current: number; limit: number; unit?: string }) {
  const percentage = useMemo(() => Math.min(100, (current / limit) * 100), [current, limit]);
  const color = percentage > 90 ? "bg-red-500" : percentage > 75 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">
          {current.toLocaleString()} / {limit.toLocaleString()} {unit}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
