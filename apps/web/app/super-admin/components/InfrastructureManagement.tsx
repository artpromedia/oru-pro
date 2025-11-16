"use client";

import {
  Activity,
  AlertTriangle,
  Cpu,
  Globe,
  HardDrive,
  RefreshCw,
  Server,
  Wifi,
  Zap,
} from "lucide-react";

type RegionStatus = "healthy" | "warning";

type Region = {
  id: string;
  name: string;
  nodes: number;
  tenants: number;
  status: RegionStatus;
  load: number;
  latency: number;
  uptime: number;
  issues?: string[];
};

const regions: Region[] = [
  {
    id: "us-east-1",
    name: "US East (Virginia)",
    nodes: 8,
    tenants: 45,
    status: "healthy",
    load: 67,
    latency: 12,
    uptime: 99.99,
  },
  {
    id: "us-west-2",
    name: "US West (Oregon)",
    nodes: 6,
    tenants: 32,
    status: "healthy",
    load: 54,
    latency: 18,
    uptime: 99.98,
  },
  {
    id: "eu-central-1",
    name: "EU Central (Frankfurt)",
    nodes: 5,
    tenants: 28,
    status: "warning",
    load: 82,
    latency: 24,
    uptime: 99.95,
    issues: ["High CPU usage on node-3"],
  },
  {
    id: "ap-south-1",
    name: "Asia Pacific (Singapore)",
    nodes: 4,
    tenants: 22,
    status: "healthy",
    load: 45,
    latency: 35,
    uptime: 99.97,
  },
];

const globalMetrics: GlobalMetricProps[] = [
  { icon: Server, label: "Total Nodes", value: "23", status: "healthy" },
  { icon: Activity, label: "Active Nodes", value: "22", status: "healthy" },
  { icon: Cpu, label: "Total Capacity", value: "920 vCPUs" },
  { icon: HardDrive, label: "Used Capacity", value: "618 vCPUs" },
  { icon: Wifi, label: "Network Traffic", value: "12.4 TB/day" },
  { icon: Zap, label: "API Requests", value: "42M/day" },
];

const nodes = [
  { id: "node-us-east-1-001", region: "US-East", cpu: 78, memory: 65, storage: 45, status: "active" },
  { id: "node-us-east-1-002", region: "US-East", cpu: 82, memory: 71, storage: 52, status: "active" },
  { id: "node-eu-central-1-003", region: "EU-Central", cpu: 91, memory: 88, storage: 67, status: "warning" },
  { id: "node-ap-south-1-001", region: "AP-South", cpu: 45, memory: 38, storage: 31, status: "active" },
];

const autoScalingRules = [
  { metric: "CPU Usage", threshold: "> 80%", action: "Add 2 nodes", cooldown: "5 min" },
  { metric: "Memory Usage", threshold: "> 85%", action: "Add 1 node", cooldown: "5 min" },
  { metric: "Request Rate", threshold: "> 10k/sec", action: "Add 3 nodes", cooldown: "3 min" },
  { metric: "CPU Usage", threshold: "< 30%", action: "Remove 1 node", cooldown: "15 min" },
];

export function InfrastructureManagement() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-6">
        {globalMetrics.map((metric) => (
          <GlobalMetric key={metric.label} {...metric} />
        ))}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Regional Infrastructure</h2>
          <button className="text-sm text-purple-600 hover:text-purple-700">
            <RefreshCw className="mr-2 inline h-4 w-4" /> Refresh
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {regions.map((region) => (
            <RegionCard key={region.id} region={region} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Node Management</h2>
          <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
            + Add Node
          </button>
        </div>
        <NodeManagementTable />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Auto-Scaling Configuration</h2>
        <div className="mt-4 space-y-3">
          {autoScalingRules.map((rule) => (
            <div key={`${rule.metric}-${rule.threshold}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 text-sm">
              <div className="flex items-center space-x-3">
                <Activity className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-900">{rule.metric}</span>
                <span className="text-gray-500">{rule.threshold}</span>
              </div>
              <div className="flex items-center space-x-4 text-gray-600">
                <span className="text-purple-600">{rule.action}</span>
                <span className="text-xs text-gray-400">Cooldown: {rule.cooldown}</span>
                <button className="text-xs text-blue-600 hover:text-blue-700">Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type GlobalMetricProps = {
  icon: typeof Server;
  label: string;
  value: string;
  status?: "healthy" | "warning";
};

function GlobalMetric({ icon: Icon, label, value, status }: GlobalMetricProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <Icon className="h-5 w-5 text-purple-500" />
        {status && <span className="h-2 w-2 rounded-full bg-green-500" />}
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

type RegionCardProps = {
  region: Region;
};

function RegionCard({ region }: RegionCardProps) {
  return (
    <div className={`rounded-2xl border p-4 ${region.status === "warning" ? "border-yellow-500 bg-yellow-50" : "border-gray-200"}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-gray-500" />
          <div>
            <p className="font-medium text-gray-900">{region.name}</p>
            <p className="text-xs text-gray-500">{region.id}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs capitalize ${
            region.status === "healthy" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {region.status}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <Metric label="Nodes" value={`${region.nodes}`} />
        <Metric label="Tenants" value={`${region.tenants}`} />
        <Metric label="Load" value={`${region.load}%`} />
        <Metric label="Latency" value={`${region.latency}ms`} />
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Uptime</span>
          <span className="font-medium text-green-600">{region.uptime}%</span>
        </div>
        <div className="mt-1 h-1 w-full rounded-full bg-gray-200">
          <div className="h-1 rounded-full bg-green-500" style={{ width: `${region.uptime}%` }} />
        </div>
      </div>
      {region.issues && (
        <div className="mt-3 rounded-lg bg-yellow-100 p-2 text-xs text-yellow-700">
          <AlertTriangle className="mr-1 inline h-3 w-3" />
          {region.issues[0]}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function NodeManagementTable() {
  return (
    <div className="mt-4 overflow-x-auto text-sm">
      <table className="w-full min-w-[600px]">
        <thead className="border-b text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="py-2 text-left">Node ID</th>
            <th className="py-2 text-left">Region</th>
            <th className="py-2 text-center">CPU</th>
            <th className="py-2 text-center">Memory</th>
            <th className="py-2 text-center">Storage</th>
            <th className="py-2 text-center">Status</th>
            <th className="py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => (
            <tr key={node.id} className="border-b last:border-0">
              <td className="py-2 font-medium text-gray-900">{node.id}</td>
              <td className="py-2 text-gray-600">{node.region}</td>
              <td className={`py-2 text-center font-semibold ${node.cpu > 80 ? "text-red-600" : "text-gray-700"}`}>
                {node.cpu}%
              </td>
              <td className={`py-2 text-center font-semibold ${node.memory > 80 ? "text-red-600" : "text-gray-700"}`}>
                {node.memory}%
              </td>
              <td className="py-2 text-center text-gray-700">{node.storage}%</td>
              <td className="py-2 text-center">
                <span
                  className={`rounded-full px-2 py-1 text-xs capitalize ${
                    node.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {node.status}
                </span>
              </td>
              <td className="py-2 text-center">
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">Manage</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
