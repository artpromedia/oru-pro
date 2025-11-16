"use client";

import { useState } from "react";
import {
  Activity,
  Brain,
  Building2,
  CreditCard,
  Download,
  RefreshCw,
  Server,
  Shield,
  Users,
  X,
} from "lucide-react";

type TenantStatus = "active" | "trial" | "suspended";

type TenantProfile = {
  id: string;
  name: string;
  industry: string;
  status: TenantStatus;
  plan: string;
  created: string;
  users: number;
  activeUsers: number;
  modules: number;
  aiModels: number;
  dataSize: string;
  monthlySpend: number;
  lastActive: string;
  primaryContact: string;
  dataRegion: string;
  compliance?: string[];
  issues?: string[];
};

type TenantDetailModalProps = {
  tenant: TenantProfile;
  onClose: () => void;
};

export function TenantDetailModal({ tenant, onClose }: TenantDetailModalProps) {
  const [activeTab, setActiveTab] = useState(
    "overview" as "overview" | "infrastructure" | "ai-models" | "users" | "billing" | "security" | "logs",
  );

  const tabs = [
    { id: "overview", name: "Overview", icon: Building2 },
    { id: "infrastructure", name: "Infrastructure", icon: Server },
    { id: "ai-models", name: "AI Models", icon: Brain },
    { id: "users", name: "Users", icon: Users },
    { id: "billing", name: "Billing", icon: CreditCard },
    { id: "security", name: "Security", icon: Shield },
    { id: "logs", name: "Activity Logs", icon: Activity },
  ] as const;

  const tabContent: Record<typeof tabs[number]["id"], JSX.Element> = {
    overview: <TenantOverview tenant={tenant} />,
    infrastructure: <TenantInfrastructure />,
    "ai-models": <TenantAIModels />,
    users: <TenantUsers />,
    billing: <TenantBilling tenant={tenant} />,
    security: <TenantSecurity tenant={tenant} />,
    logs: <TenantActivityLogs />,
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center space-x-4">
            <Building2 className="h-6 w-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{tenant.name}</h2>
              <p className="text-sm text-gray-500">
                {tenant.id} • {tenant.industry}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs capitalize ${
                tenant.status === "active"
                  ? "bg-green-100 text-green-700"
                  : tenant.status === "trial"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {tenant.status}
            </span>
          </div>
          <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b bg-gray-50 px-6">
          <nav className="flex flex-wrap gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 border-b-2 py-3 text-sm font-medium transition-colors ${
                    selected
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto p-6">{tabContent[activeTab]}</div>

        <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button className="rounded-lg px-4 py-2 hover:bg-gray-100">
              <Download className="mr-2 inline h-4 w-4" />
              Export Data
            </button>
            <button className="rounded-lg px-4 py-2 hover:bg-gray-100">
              <RefreshCw className="mr-2 inline h-4 w-4" />
              Sync Now
            </button>
          </div>
          <div className="space-x-2">
            <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Access Tenant Dashboard
            </button>
            <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}

function TenantOverview({ tenant }: { tenant: TenantProfile }) {
  const metrics = [
    { label: "Total Users", value: tenant.users.toString(), change: "+12 this month" },
    { label: "Active Users", value: tenant.activeUsers.toString(), change: "80% activity rate" },
    { label: "Data Storage", value: tenant.dataSize, change: "+120GB this month" },
    { label: "AI Models", value: tenant.aiModels.toString(), change: "All healthy" },
    { label: "API Calls", value: "1.2M", change: "This month" },
    { label: "Uptime", value: "99.99%", change: "Last 30 days" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-600">{metric.label}</p>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            <p className="text-xs text-gray-500">{metric.change}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Tenant Information</h3>
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <InfoRow label="Primary Contact" value={tenant.primaryContact} />
          <InfoRow label="Created Date" value={tenant.created} />
          <InfoRow label="Data Region" value={tenant.dataRegion} />
          <InfoRow label="Plan Type" value={tenant.plan} />
          <InfoRow label="Monthly Spend" value={`$${tenant.monthlySpend.toLocaleString()}`} />
          <InfoRow label="Last Active" value={tenant.lastActive} />
        </div>
      </div>

      {tenant.compliance && (
        <div className="rounded-xl border border-gray-200 p-6">
          <h3 className="mb-4 font-semibold text-gray-900">Compliance & Certifications</h3>
          <div className="flex flex-wrap gap-2">
            {tenant.compliance.map((cert) => (
              <span key={cert} className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                <Shield className="mr-1 inline h-3 w-3" />
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TenantInfrastructure() {
  const resourceBars = [
    { label: "CPU Usage", current: 45, max: 100, unit: "%" },
    { label: "Memory", current: 32, max: 64, unit: "GB" },
    { label: "Storage", current: 1200, max: 5000, unit: "GB" },
    { label: "Network", current: 250, max: 1000, unit: "Mbps" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Resource Allocation</h3>
        <div className="space-y-4">
          {resourceBars.map((bar) => (
            <ResourceBar key={bar.label} {...bar} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Federation Nodes</h3>
        <div className="space-y-3">
          <NodeStatus name="Primary Node" region="US-East-1" status="active" latency={12} />
          <NodeStatus name="Secondary Node" region="US-West-2" status="active" latency={24} />
          <NodeStatus name="Backup Node" region="EU-Central-1" status="standby" latency={45} />
        </div>
      </div>
    </div>
  );
}

type ResourceBarProps = {
  label: string;
  current: number;
  max: number;
  unit: string;
};

function ResourceBar({ label, current, max, unit }: ResourceBarProps) {
  const percentage = Math.round((current / max) * 100);
  const color = percentage > 80 ? "bg-red-500" : percentage > 60 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">
          {current} / {max} {unit} ({percentage}%)
        </span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

type NodeStatusProps = {
  name: string;
  region: string;
  status: "active" | "standby";
  latency: number;
};

function NodeStatus({ name, region, status, latency }: NodeStatusProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm">
      <div>
        <p className="font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-500">{region}</p>
      </div>
      <div className="flex items-center space-x-3">
        <span className="text-gray-600">{latency}ms</span>
        <span
          className={`rounded-full px-2 py-1 text-xs capitalize ${
            status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

function TenantAIModels() {
  const models = [
    { name: "Inventory Predictor", version: "2.3.1", accuracy: 94.5, status: "deployed", predictions: "12.4k/day" },
    { name: "Demand Forecaster", version: "1.8.0", accuracy: 89.2, status: "deployed", predictions: "8.2k/day" },
    { name: "Quality Inspector", version: "3.1.0", accuracy: 97.1, status: "training", predictions: "5.6k/day" },
    { name: "Route Optimizer", version: "2.0.0", accuracy: 92.3, status: "deployed", predictions: "3.1k/day" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Deployed AI Models</h3>
        <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
          Deploy New Model
        </button>
      </div>
      <div className="space-y-3">
        {models.map((model) => (
          <div key={model.name} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="font-medium text-gray-900">{model.name}</p>
              <p className="text-sm text-gray-500">Version {model.version}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{model.accuracy}%</p>
                <p className="text-xs text-gray-500">Accuracy</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{model.predictions}</p>
                <p className="text-xs text-gray-500">Predictions</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs capitalize ${
                  model.status === "deployed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {model.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TenantUsers() {
  const seats = [
    { group: "Operations", seats: 145, active: 128 },
    { group: "Supply Chain", seats: 82, active: 71 },
    { group: "Quality", seats: 34, active: 29 },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">User Allocation</h3>
      <div className="space-y-3">
        {seats.map((seat) => (
          <div key={seat.group} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="font-medium text-gray-900">{seat.group}</p>
              <p className="text-xs text-gray-500">Seat allocation</p>
            </div>
            <div className="text-sm text-gray-600">
              {seat.active}/{seat.seats} active
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TenantBilling({ tenant }: { tenant: TenantProfile }) {
  const invoices = [
    { id: "INV-2025-11", amount: "$24,500", status: "Paid", date: "Nov 1, 2025" },
    { id: "INV-2025-10", amount: "$24,200", status: "Paid", date: "Oct 1, 2025" },
    { id: "INV-2025-09", amount: "$23,900", status: "Paid", date: "Sep 1, 2025" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Current Plan</p>
          <p className="text-2xl font-bold text-gray-900">{tenant.plan}</p>
          <p className="text-xs text-gray-500">${tenant.monthlySpend.toLocaleString()} / month</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Billing Status</p>
          <p className="text-2xl font-bold text-gray-900">On Track</p>
          <p className="text-xs text-green-600">No overdue invoices</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Usage Credits</p>
          <p className="text-2xl font-bold text-gray-900">12,500</p>
          <p className="text-xs text-gray-500">Renews Dec 1</p>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Recent Invoices</h3>
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
              <div>
                <p className="font-medium text-gray-900">{invoice.id}</p>
                <p className="text-xs text-gray-500">{invoice.date}</p>
              </div>
              <div className="flex items-center space-x-4">
                <p className="text-sm font-semibold text-gray-900">{invoice.amount}</p>
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">{invoice.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TenantSecurity({ tenant }: { tenant: TenantProfile }) {
  const controls = [
    { name: "SSO Providers", value: "Okta, Azure AD", status: "stable" },
    { name: "Audit Queue", value: "3 open items", status: "warning" },
    { name: "Compliance", value: tenant.compliance?.join(", ") ?? "Not configured", status: "stable" },
    { name: "Threat Detections", value: "2 alerts", status: "critical" },
  ];

  return (
    <div className="space-y-4">
      {controls.map((control) => (
        <div key={control.name} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
          <div>
            <p className="font-medium text-gray-900">{control.name}</p>
            <p className="text-sm text-gray-500">{control.value}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs capitalize ${
              control.status === "stable"
                ? "bg-green-100 text-green-700"
                : control.status === "warning"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {control.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function TenantActivityLogs() {
  const logs = [
    { id: 1, action: "Model retrained", actor: "AI Ops", time: "5 mins ago" },
    { id: 2, action: "User seat added", actor: "Admin", time: "2 hours ago" },
    { id: 3, action: "Billing sync", actor: "System", time: "4 hours ago" },
  ];

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
          <div>
            <p className="font-medium text-gray-900">{log.action}</p>
            <p className="text-xs text-gray-500">{log.actor}</p>
          </div>
          <p className="text-xs text-gray-400">{log.time}</p>
        </div>
      ))}
    </div>
  );
}
