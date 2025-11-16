"use client";

import { useState } from "react";
import { AlertTriangle, RefreshCw, Server } from "lucide-react";

type DRMetricStatus = "healthy" | "warning";

type DRMetricProps = {
  label: string;
  value: string | number;
  status: DRMetricStatus;
};

type BackupLocation = {
  region: string;
  status: "active" | "standby" | "archive";
  lastBackup: string;
  size: string;
  type: string;
  health: number;
};

type RecoveryProcedure = {
  id: string;
  name: string;
  automated: boolean;
  steps: number;
  estimatedTime: string;
  lastTested: string;
  successRate: number;
};

export default function DisasterRecoverySystem() {
  const [, setActiveIncident] = useState<string | null>(null);

  const drMetrics = {
    rto: 4,
    rpo: 15,
    lastBackup: "2025-11-16 03:45:00",
    lastDrTest: "2025-11-10",
    backupLocations: 5,
    replicationLag: 2,
    failoverTime: 180,
  };

  const backupStatus: BackupLocation[] = [
    {
      region: "US-East Primary",
      status: "active",
      lastBackup: "2 minutes ago",
      size: "2.4TB",
      type: "Continuous",
      health: 100,
    },
    {
      region: "US-West Secondary",
      status: "standby",
      lastBackup: "2 minutes ago",
      size: "2.4TB",
      type: "Continuous",
      health: 100,
    },
    {
      region: "EU-Central DR",
      status: "standby",
      lastBackup: "15 minutes ago",
      size: "2.4TB",
      type: "Incremental",
      health: 100,
    },
    {
      region: "AP-South Archive",
      status: "archive",
      lastBackup: "1 hour ago",
      size: "8.7TB",
      type: "Daily Snapshot",
      health: 100,
    },
  ];

  const recoveryProcedures: RecoveryProcedure[] = [
    {
      id: "proc-001",
      name: "Database Failure Recovery",
      automated: true,
      steps: 12,
      estimatedTime: "15 minutes",
      lastTested: "2025-11-10",
      successRate: 100,
    },
    {
      id: "proc-002",
      name: "Regional Failover",
      automated: true,
      steps: 24,
      estimatedTime: "3 minutes",
      lastTested: "2025-11-05",
      successRate: 98,
    },
    {
      id: "proc-003",
      name: "Ransomware Recovery",
      automated: false,
      steps: 45,
      estimatedTime: "2 hours",
      lastTested: "2025-10-20",
      successRate: 100,
    },
    {
      id: "proc-004",
      name: "Complete Platform Recovery",
      automated: false,
      steps: 87,
      estimatedTime: "4 hours",
      lastTested: "2025-10-01",
      successRate: 95,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disaster Recovery &amp; Business Continuity</h1>
          <p className="text-gray-500">Enterprise-grade backup and recovery systems</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700" onClick={() => setActiveIncident("failover")}> 
            <AlertTriangle className="h-4 w-4" />
            Initiate Failover
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700">
            <RefreshCw className="h-4 w-4" />
            Test DR Procedure
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <DRMetric label="RTO" value={`${drMetrics.rto} hours`} status="healthy" />
        <DRMetric label="RPO" value={`${drMetrics.rpo} minutes`} status="healthy" />
        <DRMetric label="Backup Locations" value={drMetrics.backupLocations} status="healthy" />
        <DRMetric label="Replication Lag" value={`${drMetrics.replicationLag}s`} status="healthy" />
        <DRMetric label="Last Backup" value="2 min ago" status="healthy" />
        <DRMetric label="Failover Ready" value="Yes" status="healthy" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Backup Infrastructure</h2>
          <div className="space-y-3">
            {backupStatus.map((backup) => (
              <BackupLocationCard key={backup.region} backup={backup} />
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recovery Procedures</h2>
          <div className="space-y-3">
            {recoveryProcedures.map((procedure) => (
              <RecoveryProcedureCard key={procedure.id} procedure={procedure} />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Point-in-Time Recovery</h2>
        <PointInTimeRecovery />
      </div>
    </div>
  );
}

function DRMetric({ label, value, status }: DRMetricProps) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
        <span className={`h-2 w-2 rounded-full ${status === "healthy" ? "bg-green-500" : "bg-yellow-500"}`} />
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function BackupLocationCard({ backup }: { backup: BackupLocation }) {
  const statusClasses: Record<BackupLocation["status"], string> = {
    active: "bg-green-100 text-green-700",
    standby: "bg-blue-100 text-blue-700",
    archive: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-3">
        <Server className="h-5 w-5 text-gray-500" />
        <div>
          <p className="text-sm font-medium text-gray-900">{backup.region}</p>
          <p className="text-xs text-gray-500">
            {backup.type} • {backup.size}
          </p>
        </div>
      </div>
      <span className={`rounded px-2 py-1 text-xs font-medium capitalize ${statusClasses[backup.status]}`}>
        {backup.status}
      </span>
    </div>
  );
}

function RecoveryProcedureCard({ procedure }: { procedure: RecoveryProcedure }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{procedure.name}</p>
          <p className="text-xs text-gray-500">
            {procedure.steps} steps • {procedure.estimatedTime}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Last tested: {procedure.lastTested} • Success: {procedure.successRate}%
          </p>
        </div>
        <button className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 transition hover:bg-purple-200">
          Execute
        </button>
      </div>
    </div>
  );
}

function PointInTimeRecovery() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">Select Recovery Point</label>
          <input type="datetime-local" className="w-full rounded-lg border border-gray-300 px-3 py-2" max="2025-11-16T03:50" />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">Target Environment</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option>Production</option>
            <option>Staging</option>
            <option>Development</option>
            <option>New Instance</option>
          </select>
        </div>
        <div className="flex items-end">
          <button className="rounded-lg bg-purple-600 px-6 py-2 text-white transition hover:bg-purple-700">Initiate Recovery</button>
        </div>
      </div>
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        <AlertTriangle className="mr-2 inline h-4 w-4" /> Recovery will restore all data to the selected point in time. Current data will be backed up first.
      </div>
    </div>
  );
}
