"use client";

import { useState } from "react";
import {
  Activity,
  Brain,
  Building2,
  CreditCard,
  Database,
  DollarSign,
  Server,
  Settings,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";

import { BillingManagement } from "../components/BillingManagement";
import { InfrastructureManagement } from "../components/InfrastructureManagement";
import { SecurityCenter } from "../components/SecurityCenter";
import { SupportCenter } from "../components/SupportCenter";
import { TenantManagement } from "../components/TenantManagement";

type PlatformMetrics = {
  tenants: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
    growth: string;
  };
  infrastructure: {
    nodes: number;
    utilization: number;
    uptime: number;
    activeRegions: number;
  };
  aiModels: {
    deployed: number;
    training: number;
    accuracy: number;
    predictions: string;
  };
  revenue: {
    mrr: number;
    arr: number;
    avgPerTenant: number;
    growth: string;
  };
};

type SystemAlert = {
  id: number;
  severity: "critical" | "warning" | "info";
  tenant: string;
  issue: string;
  time: string;
  action: string;
};

export default function OonruSuperAdminDashboard() {
  const [selectedView, setSelectedView] = useState("overview");

  const platformMetrics: PlatformMetrics = {
    tenants: {
      total: 147,
      active: 134,
      trial: 8,
      suspended: 5,
      growth: "+12%",
    },
    infrastructure: {
      nodes: 23,
      utilization: 67,
      uptime: 99.98,
      activeRegions: 7,
    },
    aiModels: {
      deployed: 1176,
      training: 89,
      accuracy: 94.3,
      predictions: "2.4M/day",
    },
    revenue: {
      mrr: 734_500,
      arr: 8_814_000,
      avgPerTenant: 5000,
      growth: "+28%",
    },
  };

  const alerts: SystemAlert[] = [
    {
      id: 1,
      severity: "critical",
      tenant: "TechCorp Industries",
      issue: "AI model degradation detected",
      time: "5 mins ago",
      action: "Investigate",
    },
    {
      id: 2,
      severity: "warning",
      tenant: "Global Logistics Inc",
      issue: "Approaching storage limit (92%)",
      time: "1 hour ago",
      action: "Upgrade Plan",
    },
    {
      id: 3,
      severity: "info",
      tenant: "FoodChain Co",
      issue: "Scheduled maintenance reminder",
      time: "2 hours ago",
      action: "Schedule",
    },
  ];

  const viewMap: Record<string, JSX.Element> = {
    overview: <PlatformOverview metrics={platformMetrics} alerts={alerts} />,
    tenants: <TenantManagement />,
    infrastructure: <InfrastructureManagement />,
    "ai-models": <AIModelManagement />,
    billing: <BillingManagement />,
    support: <SupportCenter />,
    security: <SecurityCenter />,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Brain className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Oonru Enterprise Management</h1>
                <p className="text-purple-200">Master Control Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-purple-200">Logged in as</p>
                <p className="font-medium">artpromedia@oonru.ai</p>
              </div>
              <button className="rounded-lg p-2 hover:bg-purple-800">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-purple-800 px-6">
          <nav className="flex space-x-8">
            {[
              { id: "overview", name: "Overview", icon: Activity },
              { id: "tenants", name: "Tenants", icon: Building2 },
              { id: "infrastructure", name: "Infrastructure", icon: Server },
              { id: "ai-models", name: "AI Models", icon: Brain },
              { id: "billing", name: "Billing", icon: CreditCard },
              { id: "support", name: "Support", icon: Users },
              { id: "security", name: "Security", icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedView(tab.id)}
                  className={`flex items-center space-x-2 border-b-2 py-4 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-white text-white"
                      : "border-transparent text-purple-300 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-6">{viewMap[selectedView]}</div>
    </div>
  );
}

type PlatformOverviewProps = {
  metrics: PlatformMetrics;
  alerts: SystemAlert[];
};

type ActivityEntry = {
  day: string;
  predictions: number;
  incidents: number;
  deployments: number;
};

function PlatformOverview({ metrics, alerts }: PlatformOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <MetricCard
          icon={Building2}
          label="Active Tenants"
          value={metrics.tenants.active}
          total={`${metrics.tenants.total} total`}
          change={metrics.tenants.growth}
          color="purple"
        />
        <MetricCard
          icon={Brain}
          label="AI Models Running"
          value={metrics.aiModels.deployed}
          total={`${metrics.aiModels.training} training`}
          change={`${metrics.aiModels.accuracy}% avg accuracy`}
          color="blue"
        />
        <MetricCard
          icon={Server}
          label="Infrastructure Health"
          value={`${metrics.infrastructure.uptime}%`}
          total={`${metrics.infrastructure.nodes} nodes`}
          change={`${metrics.infrastructure.utilization}% utilized`}
          color="green"
        />
        <MetricCard
          icon={DollarSign}
          label="Monthly Revenue"
          value={`$${(metrics.revenue.mrr / 1000).toFixed(0)}k`}
          total={`$${metrics.revenue.avgPerTenant} avg/tenant`}
          change={metrics.revenue.growth}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-2 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">System Alerts</h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="space-y-2">
            <QuickAction icon={Building2} label="Provision New Tenant" />
            <QuickAction icon={Brain} label="Deploy AI Update" />
            <QuickAction icon={Server} label="Scale Infrastructure" />
            <QuickAction icon={Shield} label="Security Audit" />
            <QuickAction icon={Database} label="Backup All Tenants" />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Platform Activity (Last 7 Days)
        </h2>
        <PlatformActivityChart />
      </div>
    </div>
  );
}

type MetricCardProps = {
  icon: typeof Building2;
  label: string;
  value: number | string;
  total?: string;
  change: string;
  color: "purple" | "blue" | "green" | "emerald";
};

function MetricCard({ icon: Icon, label, value, total, change, color }: MetricCardProps) {
  const bgMap: Record<string, string> = {
    purple: "bg-purple-100 text-purple-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    emerald: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className={`rounded-lg p-2 ${bgMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <TrendingUp className="h-4 w-4 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {total && <p className="text-xs text-gray-400">{total}</p>}
      <p className="mt-1 text-xs text-gray-500">{change}</p>
    </div>
  );
}

type AlertCardProps = {
  alert: SystemAlert;
};

function AlertCard({ alert }: AlertCardProps) {
  const severityColor: Record<SystemAlert["severity"], string> = {
    critical: "bg-red-100 text-red-700",
    warning: "bg-yellow-100 text-yellow-700",
    info: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
      <div>
        <div className="flex items-center space-x-3">
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${severityColor[alert.severity]}`}>
            {alert.severity.toUpperCase()}
          </span>
          <p className="text-sm font-medium text-gray-900">{alert.tenant}</p>
        </div>
        <p className="mt-1 text-sm text-gray-600">{alert.issue}</p>
        <p className="text-xs text-gray-400">{alert.time}</p>
      </div>
      <button className="text-sm font-medium text-purple-600 hover:text-purple-700">
        {alert.action} →
      </button>
    </div>
  );
}

type QuickActionProps = {
  icon: typeof Building2;
  label: string;
};

function QuickAction({ icon: Icon, label }: QuickActionProps) {
  return (
    <button className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 text-left hover:border-purple-200 hover:bg-purple-50">
      <div className="flex items-center space-x-3">
        <Icon className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-900">{label}</span>
      </div>
      <TrendingUp className="h-4 w-4 text-gray-400" />
    </button>
  );
}

function PlatformActivityChart() {
  const activity: ActivityEntry[] = [
    { day: "Mon", predictions: 2.1, incidents: 2, deployments: 3 },
    { day: "Tue", predictions: 2.4, incidents: 1, deployments: 2 },
    { day: "Wed", predictions: 2.3, incidents: 0, deployments: 4 },
    { day: "Thu", predictions: 2.5, incidents: 1, deployments: 3 },
    { day: "Fri", predictions: 2.7, incidents: 3, deployments: 2 },
    { day: "Sat", predictions: 2.2, incidents: 0, deployments: 1 },
    { day: "Sun", predictions: 2.0, incidents: 1, deployments: 2 },
  ];

  return (
    <div className="grid grid-cols-7 gap-4 text-sm">
      {activity.map((entry) => (
        <div key={entry.day} className="rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">{entry.day}</p>
          <p className="text-lg font-semibold text-gray-900">
            {entry.predictions.toFixed(1)}M
          </p>
          <div className="mt-2 text-xs text-gray-500">
            <p>Deployments: {entry.deployments}</p>
            <p>Incidents: {entry.incidents}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AIModelManagement() {
  const models = [
    { name: "Demand Forecaster", tenants: 62, accuracy: 93.4, status: "stable" },
    { name: "Inventory Guardian", tenants: 54, accuracy: 91.2, status: "monitor" },
    { name: "Route Optimizer", tenants: 48, accuracy: 95.1, status: "stable" },
    { name: "Risk Sentinel", tenants: 31, accuracy: 88.7, status: "action" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">AI Model Fleet</h2>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4">
          {models.map((model) => (
            <div key={model.name} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <p className="font-medium text-gray-900">{model.name}</p>
                <p className="text-sm text-gray-500">{model.tenants} tenants active</p>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{model.accuracy}%</p>
                  <p className="text-xs text-gray-500">Avg accuracy</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  model.status === "stable"
                    ? "bg-green-100 text-green-700"
                    : model.status === "monitor"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {model.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// BillingManagement and SecurityCenter components are now imported from ../components
