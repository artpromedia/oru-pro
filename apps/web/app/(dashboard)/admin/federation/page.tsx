"use client";

import { useMemo, useState } from "react";
import { Globe, Server, Link, Activity, Shield } from "lucide-react";

interface FederationNode {
  id: string;
  name: string;
  type: "primary" | "secondary" | "backup";
  status: "active" | "syncing" | "error";
  latency: number;
  transactions: number;
  tenants: string[];
  health: number;
}

export default function FederationManagement() {
  const [nodes] = useState<FederationNode[]>([
    {
      id: "node-chicago",
      name: "Chicago Orchestrator",
      type: "primary",
      status: "active",
      latency: 12,
      transactions: 4567,
      tenants: ["OonruFoods", "OonruPharma"],
      health: 98,
    },
    {
      id: "node-milwaukee",
      name: "Milwaukee Edge",
      type: "secondary",
      status: "syncing",
      latency: 24,
      transactions: 2345,
      tenants: ["OonruFoods"],
      health: 95,
    },
    {
      id: "node-cloud",
      name: "GCP Resilience Cloud",
      type: "backup",
      status: "active",
      latency: 45,
      transactions: 0,
      tenants: ["All"],
      health: 100,
    },
  ]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            <Globe className="mr-2 h-3.5 w-3.5" /> Oonru Federation Cloud
          </p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Federation Management</h1>
          <p className="text-gray-500">Multi-tenant mesh spanning plants, DCs, and sovereign clouds.</p>
        </div>
        <button className="inline-flex items-center rounded-lg bg-purple-500 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-purple-600">
          <Link className="mr-2 h-4 w-4" /> Add Federation Node
        </button>
      </header>

      <section className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Federation Topology</h2>
            <p className="text-sm text-gray-500">Latency-aware routing with tenant-aware failover.</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            <Activity className="mr-2 h-3.5 w-3.5" /> 99.982% uptime trailing 30d
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {nodes.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tenant Isolation</h2>
            <p className="text-sm text-gray-500">Zero-trust segmentation with dedicated AI pipelines.</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Shield className="mr-2 h-3.5 w-3.5" /> Compliance posture: SOC2 | FDA | GDPR
          </span>
        </div>
        <TenantIsolationView />
      </section>
    </div>
  );
}

function NodeCard({ node }: { node: FederationNode }) {
  const statusColors: Record<FederationNode["status"], string> = {
    active: "bg-green-100 text-green-700",
    syncing: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Server className="w-5 h-5 text-gray-500" />
          <div>
            <p className="font-medium">{node.name}</p>
            <p className="text-xs text-gray-500 capitalize">{node.type}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs rounded ${statusColors[node.status]}`}>
          {node.status}
        </span>
      </div>

      <dl className="space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Latency</dt>
          <dd className="font-medium">{node.latency}ms</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Transactions / hr</dt>
          <dd className="font-medium">{node.transactions.toLocaleString()}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Health</dt>
          <dd className="font-medium text-green-600">{node.health}%</dd>
        </div>
      </dl>

      <div className="mt-3 border-t pt-3">
        <p className="text-xs uppercase tracking-wide text-gray-500">Tenants</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {node.tenants.map((tenant) => (
            <span key={tenant} className="px-2 py-1 bg-gray-100 text-xs rounded">
              {tenant}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TenantIsolationView() {
  const tenants = useMemo(
    () => [
      {
        id: "tenant-1",
        name: "OonruFoods",
        dataSeparation: "Complete",
        encryption: "AES-256",
        aiModels: "Dedicated",
        dataResidency: "US-Central",
        compliance: ["FDA", "USDA", "SOC2"],
      },
      {
        id: "tenant-2",
        name: "OonruPharma",
        dataSeparation: "Complete",
        encryption: "AES-256",
        aiModels: "Isolated",
        dataResidency: "US-East",
        compliance: ["FDA", "21 CFR Part 11", "HIPAA"],
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {tenants.map((tenant) => (
        <div key={tenant.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">{tenant.name}</h3>
              <p className="text-xs text-gray-500">AI Pipelines: {tenant.aiModels}</p>
            </div>
            <Shield className="w-5 h-5 text-green-500" />
          </div>
          <div className="grid gap-4 text-sm md:grid-cols-3">
            <div>
              <p className="text-gray-500">Data Separation</p>
              <p className="font-medium">{tenant.dataSeparation}</p>
            </div>
            <div>
              <p className="text-gray-500">Encryption</p>
              <p className="font-medium">{tenant.encryption}</p>
            </div>
            <div>
              <p className="text-gray-500">Residency</p>
              <p className="font-medium">{tenant.dataResidency}</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-gray-500">Compliance</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {tenant.compliance.map((cert) => (
                <span key={cert} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  {cert}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
