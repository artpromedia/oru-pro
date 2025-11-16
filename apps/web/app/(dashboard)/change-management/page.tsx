"use client";

import { GitBranch, GitCommit } from "lucide-react";

type ChangeRecord = {
  id: string;
  type: string;
  description: string;
  requestedBy: string;
  status: "pending_approval" | "approved" | "scheduled";
  environment: string;
  impact: "low" | "medium" | "high";
  scheduledFor: string;
  approvals: {
    approver: string;
    status: "approved" | "pending" | "rejected";
    timestamp?: string;
  }[];
  rollbackPlan: string;
  testing: string;
};

type ConfigVersion = {
  version: string;
  environment: string;
  deployedAt: string;
  deployedBy: string;
  changes: string[];
  status: "active" | "testing";
};

export default function ChangeManagement() {
  const changes: ChangeRecord[] = [
    {
      id: "CHG-2025-001",
      type: "Configuration",
      description: "Update inventory reorder points",
      requestedBy: "sarah.chen@acmecorp.com",
      status: "pending_approval",
      environment: "production",
      impact: "medium",
      scheduledFor: "2025-11-17 02:00:00",
      approvals: [
        { approver: "john.doe@acmecorp.com", status: "approved", timestamp: "2025-11-16 01:00:00" },
        { approver: "mike.wilson@acmecorp.com", status: "pending" },
      ],
      rollbackPlan: "Automated rollback to previous configuration",
      testing: "Validated in staging environment",
    },
  ];

  const configVersions: ConfigVersion[] = [
    {
      version: "v2.3.1",
      environment: "Production",
      deployedAt: "2025-11-15 18:00:00",
      deployedBy: "CI/CD Pipeline",
      changes: ["Updated AI models", "Fixed calculation bug", "Performance improvements"],
      status: "active",
    },
    {
      version: "v2.3.2",
      environment: "Staging",
      deployedAt: "2025-11-16 02:00:00",
      deployedBy: "artpromedia@oonru.ai",
      changes: ["New reporting module", "UI improvements"],
      status: "testing",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Change Management &amp; Version Control</h1>
          <p className="text-gray-500">Track and control all system changes</p>
        </div>
        <button className="rounded-lg bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700">Request Change</button>
      </div>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Pending Changes</h2>
        <div className="space-y-3">
          {changes.map((change) => (
            <ChangeCard key={change.id} change={change} />
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Configuration Versions</h2>
        <div className="space-y-3">
          {configVersions.map((version) => (
            <VersionCard key={version.version} version={version} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ChangeCard({ change }: { change: ChangeRecord }) {
  const statusClasses: Record<ChangeRecord["status"], string> = {
    approved: "bg-green-100 text-green-700",
    pending_approval: "bg-yellow-100 text-yellow-700",
    scheduled: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <GitBranch className="h-4 w-4 text-gray-500" />
            {change.id}
            <span className={`rounded px-2 py-1 text-xs capitalize ${statusClasses[change.status]}`}>
              {change.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-sm text-gray-600">{change.description}</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span>Impact: {change.impact}</span>
            <span>Scheduled: {change.scheduledFor}</span>
            <span>Requested by: {change.requestedBy}</span>
          </div>
        </div>
        <button className="rounded bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 transition hover:bg-purple-200">Review</button>
      </div>
    </div>
  );
}

function VersionCard({ version }: { version: ConfigVersion }) {
  const statusClasses: Record<ConfigVersion["status"], string> = {
    active: "bg-green-100 text-green-700",
    testing: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-3">
        <GitCommit className="h-4 w-4 text-gray-500" />
        <div>
          <p className="text-sm font-medium text-gray-900">{version.version}</p>
          <p className="text-xs text-gray-500">
            {version.environment} • Deployed {version.deployedAt}
          </p>
        </div>
      </div>
      <span className={`rounded px-2 py-1 text-xs font-semibold capitalize ${statusClasses[version.status]}`}>{version.status}</span>
    </div>
  );
}
