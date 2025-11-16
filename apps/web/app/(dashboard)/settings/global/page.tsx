"use client";

import { Shield, Globe, Building, Bell, Cpu } from "lucide-react";

interface PolicyToggle {
  label: string;
  description: string;
  enabled: boolean;
}

interface Tenant {
  name: string;
  markets: string;
  compliance: string;
}

export default function GlobalSettingsPage() {
  const policies: PolicyToggle[] = [
    {
      label: "Zero-trust perimeter",
      description: "Oonru cross-cloud perimeter enforced with continuous posture scoring.",
      enabled: true,
    },
    {
      label: "AI escalation playbooks",
      description: "Decision copilots trigger branded escalation workflows with audit trails.",
      enabled: true,
    },
    {
      label: "Tenant data residency",
      description: "Pin tenant data to regional sovereign clouds with automated proofs.",
      enabled: false,
    },
  ];

  const tenants: Tenant[] = [
    { name: "Oonru Foods", markets: "NA + LATAM", compliance: "SQF • FDA • ESG" },
    { name: "Oonru Pharma", markets: "EU + APAC", compliance: "GMP • EMA • MHRA" },
    { name: "Oonru Retail", markets: "Global", compliance: "PCI • SOC2 • GDPR" },
  ];

  return (
    <div className="p-6 space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Oonru Control Plane</p>
        <h1 className="text-3xl font-bold text-gray-900">Global Settings</h1>
        <p className="text-gray-500">Align every tenant, copilot, and compliance policy from one secure cockpit.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Enterprise Policies</h2>
              <p className="text-sm text-gray-500">Push locked settings to every workspace with one click.</p>
            </div>
            <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700">
              <Shield className="w-3.5 h-3.5 mr-2" /> Guardian Mode
            </span>
          </div>

          <div className="space-y-4">
            {policies.map((policy) => (
              <PolicyCard key={policy.label} {...policy} />
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <Globe className="w-6 h-6" />
            <div>
              <p className="text-sm uppercase tracking-wide text-white/70">Network posture</p>
              <p className="text-3xl font-bold">99.97%</p>
            </div>
          </div>
          <p className="text-sm text-white/80">Edge mesh synced across 42 regions. Decision latency under 320ms.</p>
          <div className="grid gap-3 text-sm">
            <StatRow label="Active copilots" value="128" />
            <StatRow label="Pending escalations" value="3" />
            <StatRow label="SLA status" value="All green" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Tenant Directory</h2>
              <p className="text-sm text-gray-500">Central visibility across Oonru industrial clusters.</p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
              <Building className="w-3.5 h-3.5 mr-2" /> Synced
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {tenants.map((tenant) => (
              <TenantRow key={tenant.name} {...tenant} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Telemetry & Notifications</h2>
              <p className="text-sm text-gray-500">Drive signal routing for AI copilots and program leads.</p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700">
              <Bell className="w-3.5 h-3.5 mr-2" /> Live
            </span>
          </div>
          <div className="space-y-3">
            <TelemetryToggle label="Decision alerts" detail="Push to PMO + Ops" enabled />
            <TelemetryToggle label="OT/IT incident bridge" detail="Bridges to Teams + PagerDuty" enabled />
            <TelemetryToggle label="Cold-chain excursions" detail="Escalate to QA" enabled />
            <TelemetryToggle label="AI drift monitor" detail="Route to model ops" enabled={false} />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Compute orchestration</h2>
            <p className="text-sm text-gray-500">Balance workloads between edge, private cloud, and sovereign GPU pools.</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
            <Cpu className="w-3.5 h-3.5 mr-2" /> Auto-balance
          </span>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <QuotaCard label="Edge AI" value="38%" detail="Dark warehouses" color="bg-emerald-100 text-emerald-700" />
          <QuotaCard label="Private cloud" value="42%" detail="SAP + datafusion" color="bg-blue-100 text-blue-700" />
          <QuotaCard label="GPU sovereign" value="20%" detail="Regulated pharma" color="bg-purple-100 text-purple-700" />
        </div>
      </section>
    </div>
  );
}

function PolicyCard({ label, description, enabled }: PolicyToggle) {
  return (
    <div className="flex flex-wrap items-center justify-between rounded-xl border border-gray-200 p-4">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        className={`mt-3 sm:mt-0 rounded-full px-4 py-1 text-sm font-semibold ${
          enabled ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
        }`}
      >
        {enabled ? "Locked" : "Enable"}
      </button>
    </div>
  );
}

function TenantRow({ name, markets, compliance }: Tenant) {
  return (
    <div className="flex flex-wrap items-center justify-between py-4 gap-3">
      <div>
        <p className="font-semibold">{name}</p>
        <p className="text-xs text-gray-500">{markets}</p>
      </div>
      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{compliance}</span>
    </div>
  );
}

function TelemetryToggle({ label, detail, enabled = true }: { label: string; detail: string; enabled?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-gray-500">{detail}</p>
      </div>
      <button
        className={`rounded-full px-4 py-1 text-xs font-semibold ${
          enabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
        }`}
      >
        {enabled ? "Active" : "Paused"}
      </button>
    </div>
  );
}

function QuotaCard({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className={`text-xs font-semibold mt-2 inline-flex px-2 py-1 rounded-full ${color}`}>{detail}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border border-white/10 rounded-lg px-3 py-2">
      <span className="text-white/70 text-sm">{label}</span>
      <span className="text-base font-semibold">{value}</span>
    </div>
  );
}
