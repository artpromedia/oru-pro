"use client";

import { Brain, Shield, Database, Activity, Users } from "lucide-react";

export default function TenantOverview() {
  const tenantInfo = {
    id: "ORU-ACMECORP-001",
    name: "AcmeCorp",
    industry: "manufacturing",
    created: "2025-11-16",
    isolation: "complete",
    models: {
      total: 8,
      active: 8,
      training: 2,
      accuracy: 94.3,
    },
  };

  return (
    <div className="p-6 space-y-6">
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{tenantInfo.name} AI Instance</h1>
            <p className="mt-1 text-purple-100">Tenant ID: {tenantInfo.id}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-white/20 px-3 py-2 rounded-lg">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Fully Isolated</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 px-3 py-2 rounded-lg">
              <Brain className="w-4 h-4" />
              <span className="text-sm">{tenantInfo.models.total} AI Models</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <TenantMetric icon={Database} label="Data Isolation" value="100%" subvalue="Complete separation" status="secure" />
        <TenantMetric
          icon={Brain}
          label="AI Models"
          value={tenantInfo.models.active.toString()}
          subvalue={`${tenantInfo.models.training} training`}
        />
        <TenantMetric
          icon={Activity}
          label="Model Accuracy"
          value={`${tenantInfo.models.accuracy}%`}
          subvalue="Improving daily"
          status="success"
        />
        <TenantMetric icon={Users} label="Active Users" value="47" subvalue="12 online now" />
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your AI Models Health</h2>
        <AIModelsHealth />
      </section>
    </div>
  );
}

interface TenantMetricProps {
  icon: typeof Brain;
  label: string;
  value: string;
  subvalue?: string;
  status?: "secure" | "success" | "warning" | "default";
}

function TenantMetric({ icon: Icon, label, value, subvalue, status = "default" }: TenantMetricProps) {
  const statusColors: Record<string, string> = {
    secure: "text-green-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    default: "text-gray-900",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <Icon className="w-5 h-5 text-purple-500 mb-3" />
      <div className={`text-2xl font-bold ${statusColors[status] || "text-gray-900"}`}>{value}</div>
      <p className="text-sm text-gray-500">{label}</p>
      {subvalue && <p className="text-xs text-gray-400 mt-1">{subvalue}</p>}
    </div>
  );
}

function AIModelsHealth() {
  const models = [
    { name: "Inventory Prediction", health: 98, predictions: 1234, lastTrained: "2 hours ago" },
    { name: "Production Planning", health: 95, predictions: 567, lastTrained: "1 day ago" },
    { name: "Quality Detection", health: 99, predictions: 890, lastTrained: "3 hours ago" },
    { name: "Demand Forecasting", health: 92, predictions: 456, lastTrained: "6 hours ago" },
  ];

  return (
    <div className="space-y-3">
      {models.map((model) => (
        <div key={model.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${model.health > 95 ? "bg-green-500" : "bg-yellow-500"}`} />
            <div>
              <p className="font-medium text-sm">{model.name}</p>
              <p className="text-xs text-gray-500">Last trained: {model.lastTrained}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{model.health}%</p>
              <p className="text-xs text-gray-500">Health</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{model.predictions}</p>
              <p className="text-xs text-gray-500">Today</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
