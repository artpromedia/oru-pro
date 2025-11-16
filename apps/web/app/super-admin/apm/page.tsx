"use client";

import { Activity, AlertTriangle, TrendingUp, Users, Zap } from "lucide-react";

type MetricStatus = "good" | "warning";

type APMMetricProps = {
  icon: typeof Activity;
  label: string;
  value: string | number;
  trend: string;
  status: MetricStatus;
};

type ResourceUsageProps = {
  label: string;
  value: number;
  unit: string;
  max?: number;
};

type SlowTransaction = {
  endpoint: string;
  avgTime: number;
  p95Time: number;
  calls: number;
  trend: "increasing" | "stable";
};

type RealtimeAlert = {
  severity: "critical" | "warning" | "info";
  service: string;
  message: string;
  timestamp: string;
};

export default function ApplicationPerformanceMonitoring() {
  const metrics = {
    responseTime: 142,
    throughput: 4567,
    errorRate: 0.02,
    apdex: 0.98,
    uptime: 99.99,
    activeUsers: 3421,
    cpuUsage: 34,
    memoryUsage: 67,
    diskIO: 234,
    networkIO: 567,
  };

  const slowTransactions: SlowTransaction[] = [
    {
      endpoint: "/api/inventory/calculate-mrp",
      avgTime: 2340,
      p95Time: 4500,
      calls: 234,
      trend: "increasing",
    },
    {
      endpoint: "/api/reports/generate",
      avgTime: 1850,
      p95Time: 3200,
      calls: 456,
      trend: "stable",
    },
  ];

  const realtimeAlerts: RealtimeAlert[] = [
    {
      severity: "warning",
      service: "Database",
      message: "Connection pool reaching limit (85/100)",
      timestamp: "2025-11-16 03:48:00",
    },
    {
      severity: "info",
      service: "API Gateway",
      message: "Rate limiting triggered for tenant ABC",
      timestamp: "2025-11-16 03:45:00",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Application Performance Monitoring</h1>
          <p className="text-gray-500">Real-time system performance and health</p>
        </div>
        <span className="rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700">All Systems Operational</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <APMMetric icon={Activity} label="Response Time" value={`${metrics.responseTime}ms`} trend="-12%" status="good" />
        <APMMetric icon={Zap} label="Throughput" value={`${metrics.throughput}/min`} trend="+8%" status="good" />
        <APMMetric icon={AlertTriangle} label="Error Rate" value={`${metrics.errorRate}%`} trend="0%" status="good" />
        <APMMetric icon={TrendingUp} label="Apdex Score" value={metrics.apdex} trend="+0.02" status="good" />
        <APMMetric icon={Users} label="Active Users" value={metrics.activeUsers.toLocaleString()} trend="+145" status="good" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">System Resources</h2>
          <div className="space-y-4">
            <ResourceUsage label="CPU Usage" value={metrics.cpuUsage} unit="%" />
            <ResourceUsage label="Memory Usage" value={metrics.memoryUsage} unit="%" />
            <ResourceUsage label="Disk I/O" value={metrics.diskIO} unit="MB/s" max={1000} />
            <ResourceUsage label="Network I/O" value={metrics.networkIO} unit="Mbps" max={1000} />
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Slow Transactions</h2>
          <div className="space-y-3">
            {slowTransactions.map((transaction) => (
              <SlowTransactionCard key={transaction.endpoint} transaction={transaction} />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Real-time Alerts</h2>
        <div className="space-y-2">
          {realtimeAlerts.map((alert, index) => (
            <AlertCard key={index} alert={alert} />
          ))}
        </div>
      </div>
    </div>
  );
}

function APMMetric({ icon: Icon, label, value, trend, status }: APMMetricProps) {
  const trendColor = status === "good" ? "text-green-600" : "text-yellow-600";
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <Icon className="h-5 w-5 text-purple-500" />
        <span className={`text-xs font-semibold ${trendColor}`}>{trend}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function ResourceUsage({ label, value, unit, max = 100 }: ResourceUsageProps) {
  const percentage = Math.min(100, (value / max) * 100);
  const barColor = percentage > 80 ? "bg-red-500" : percentage > 60 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm text-gray-600">
        <span>{label}</span>
        <span className="font-semibold text-gray-900">
          {value}
          {unit}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function SlowTransactionCard({ transaction }: { transaction: SlowTransaction }) {
  const trendColor = transaction.trend === "increasing" ? "text-red-600" : "text-gray-600";
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{transaction.endpoint}</p>
        <p className="text-xs text-gray-500">
          Avg: {transaction.avgTime}ms • P95: {transaction.p95Time}ms • Calls: {transaction.calls}
        </p>
      </div>
      <span className={`text-xs font-semibold capitalize ${trendColor}`}>{transaction.trend}</span>
    </div>
  );
}

function AlertCard({ alert }: { alert: RealtimeAlert }) {
  const severityClasses: Record<RealtimeAlert["severity"], string> = {
    critical: "border-red-500 bg-red-50",
    warning: "border-yellow-500 bg-yellow-50",
    info: "border-blue-500 bg-blue-50",
  };

  return (
    <div className={`rounded-lg border p-3 ${severityClasses[alert.severity]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{alert.service}</p>
          <p className="text-sm text-gray-700">{alert.message}</p>
        </div>
        <span className="text-xs text-gray-500">{alert.timestamp}</span>
      </div>
    </div>
  );
}
