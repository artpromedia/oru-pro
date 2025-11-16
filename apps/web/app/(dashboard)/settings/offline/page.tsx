"use client";

import { Wifi, WifiOff, Download, HardDrive } from "lucide-react";

interface OfflineModuleProps {
  name: string;
  size: string;
  lastSync: string;
  aiModel: string;
  enabled: boolean;
}

export default function OfflineSettings() {
  const modules: OfflineModuleProps[] = [
    {
      name: "Inventory Management",
      size: "234 MB",
      lastSync: "2 mins ago",
      aiModel: "Lightweight prediction model",
      enabled: true,
    },
    {
      name: "Quality Inspections",
      size: "156 MB",
      lastSync: "5 mins ago",
      aiModel: "Anomaly detection model",
      enabled: true,
    },
    {
      name: "Production Tracking",
      size: "89 MB",
      lastSync: "1 hour ago",
      aiModel: "Process optimization model",
      enabled: false,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Oonru Edge Mesh
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Offline & Edge Computing</h1>
        <p className="text-gray-500">Push AI copilots to plants, dark warehouses, and mobile crews.</p>
      </header>

      <section className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Edge AI Configuration</h2>
            <p className="text-sm text-gray-500">Modules continue to operate with zero connectivity.</p>
          </div>
          <div className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            <Wifi className="mr-2 h-3.5 w-3.5" /> Sync Online
          </div>
        </div>

        <div className="space-y-4">
          {modules.map((module) => (
            <OfflineModule key={module.name} {...module} />
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="p-4 border border-blue-100 rounded-lg bg-blue-50 text-sm text-blue-800">
            <p className="font-medium flex items-center"><Download className="mr-2 h-4 w-4" /> Bulk Sync</p>
            <p>Stage pending updates for 14 field devices.</p>
          </div>
          <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50 text-sm text-yellow-800">
            <p className="font-medium flex items-center"><WifiOff className="mr-2 h-4 w-4" /> Offline Mode</p>
            <p>Edge AI continues working offline. Data syncs once connection returns.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function OfflineModule({ name, size, lastSync, aiModel, enabled }: OfflineModuleProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <HardDrive className="w-5 h-5 text-gray-500" />
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-gray-500">
            {aiModel} • {size}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span className="text-xs text-gray-500">Synced {lastSync}</span>
        <button
          className={`px-3 py-1 rounded text-sm ${enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
        >
          {enabled ? "Enabled" : "Disabled"}
        </button>
      </div>
    </div>
  );
}
