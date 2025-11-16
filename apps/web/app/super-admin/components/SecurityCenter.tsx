"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Database,
  FileText,
  Globe,
  Key,
  Lock,
  RefreshCw,
  Shield,
} from "lucide-react";

type SecurityMetricProps = {
  icon: typeof Shield;
  label: string;
  value: string | number;
  status: "safe" | "warning" | "critical" | "low" | "medium" | "high";
};

type SecurityEvent = {
  id: number;
  type: "critical" | "warning" | "info";
  tenant: string;
  event: string;
  user: string;
  timestamp: string;
  action: string;
};

type ComplianceEntry = {
  standard: string;
  status: "compliant" | "pending" | "issue";
  lastAudit: string;
  nextAudit: string;
};

type SecurityMetricMap = Record<SecurityMetricProps["status"], string>;

type SecurityEventsProps = {
  events: SecurityEvent[];
};

type ComplianceManagementProps = {
  compliance: ComplianceEntry[];
};

type StatusCardProps = {
  title: string;
  status: string;
  detail: string;
  icon: typeof Shield;
};

type KeyStatusProps = {
  name: string;
  status: "active" | "pending";
  rotated: string;
  expires: string;
};

type AuditEntryProps = {
  user: string;
  action: string;
  tenant: string;
  timestamp: string;
};

const securityMetrics = {
  threatLevel: "low",
  activeThreats: 2,
  blockedAttempts: 1247,
  complianceScore: 98,
  encryptedData: 100,
  mfaAdoption: 87,
  lastAudit: "2025-11-10",
  certificatesExpiring: 3,
};

const securityEvents: SecurityEvent[] = [
  {
    id: 1,
    type: "warning",
    tenant: "TechCorp Industries",
    event: "Multiple failed login attempts",
    user: "john.doe@techcorp.com",
    timestamp: "2025-11-16 02:45:00",
    action: "Account temporarily locked",
  },
  {
    id: 2,
    type: "info",
    tenant: "AcmeCorp",
    event: "New IP address detected",
    user: "admin@acmecorp.com",
    timestamp: "2025-11-16 01:30:00",
    action: "MFA challenge issued",
  },
  {
    id: 3,
    type: "critical",
    tenant: "Global Logistics Inc",
    event: "Potential data exfiltration attempt",
    user: "unknown",
    timestamp: "2025-11-15 23:15:00",
    action: "Connection blocked, investigating",
  },
];

const complianceStatus: ComplianceEntry[] = [
  { standard: "SOC 2 Type II", status: "compliant", lastAudit: "2025-10-15", nextAudit: "2026-04-15" },
  { standard: "ISO 27001", status: "compliant", lastAudit: "2025-09-20", nextAudit: "2026-03-20" },
  { standard: "GDPR", status: "compliant", lastAudit: "2025-11-01", nextAudit: "2026-02-01" },
  { standard: "HIPAA", status: "pending", lastAudit: "N/A", nextAudit: "2025-12-01" },
  { standard: "21 CFR Part 11", status: "compliant", lastAudit: "2025-08-10", nextAudit: "2026-02-10" },
];

const auditEntries: AuditEntryProps[] = [
  {
    user: "artpromedia@oonru.ai",
    action: "Accessed tenant dashboard",
    tenant: "AcmeCorp",
    timestamp: "2025-11-16 02:58:00",
  },
  {
    user: "artpromedia@oonru.ai",
    action: "Modified infrastructure settings",
    tenant: "System",
    timestamp: "2025-11-16 02:45:00",
  },
  {
    user: "support@oonru.ai",
    action: "Resolved support ticket",
    tenant: "TechCorp Industries",
    timestamp: "2025-11-16 01:30:00",
  },
];

export function SecurityCenter() {
  const [activeView, setActiveView] = useState("overview");

  const tabs = [
    { id: "overview", name: "Security Events" },
    { id: "compliance", name: "Compliance" },
    { id: "access", name: "Access Control" },
    { id: "encryption", name: "Data Encryption" },
    { id: "audit", name: "Audit Logs" },
  ];

  const tabContent = {
    overview: <SecurityEvents events={securityEvents} />,
    compliance: <ComplianceManagement compliance={complianceStatus} />,
    access: <AccessControlPanel />,
    encryption: <EncryptionStatus />,
    audit: <AuditLogs />,
  } as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <SecurityMetric icon={Shield} label="Threat Level" value={securityMetrics.threatLevel.toUpperCase()} status="low" />
        <SecurityMetric
          icon={AlertTriangle}
          label="Active Threats"
          value={securityMetrics.activeThreats}
          status={securityMetrics.activeThreats > 0 ? "warning" : "safe"}
        />
        <SecurityMetric icon={Lock} label="MFA Adoption" value={`${securityMetrics.mfaAdoption}%`} status="safe" />
        <SecurityMetric
          icon={CheckCircle}
          label="Compliance Score"
          value={`${securityMetrics.complianceScore}%`}
          status="safe"
        />
      </div>

      <div className="rounded-2xl bg-white shadow-sm">
        <div className="border-b">
          <nav className="flex flex-wrap gap-2 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeView === tab.id
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">{tabContent[activeView as keyof typeof tabContent]}</div>
      </div>
    </div>
  );
}

function SecurityMetric({ icon: Icon, label, value, status }: SecurityMetricProps) {
  const statusColors: SecurityMetricMap = {
    safe: "text-green-600",
    low: "text-green-600",
    warning: "text-yellow-600",
    medium: "text-yellow-600",
    critical: "text-red-600",
    high: "text-red-600",
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <Icon className="h-5 w-5 text-purple-500" />
        <span
          className={`h-2 w-2 rounded-full ${
            status === "safe" || status === "low"
              ? "bg-green-500"
              : status === "warning" || status === "medium"
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
        />
      </div>
      <div className={`text-2xl font-bold ${statusColors[status]}`}>{value}</div>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function SecurityEvents({ events }: SecurityEventsProps) {
  const typeColors: Record<SecurityEvent["type"], string> = {
    critical: "border-red-200 bg-red-50 text-red-700",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className={`rounded-xl border p-4 ${typeColors[event.type]}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4" />
                {event.event}
              </div>
              <div className="text-xs">
                <p>Tenant: {event.tenant}</p>
                <p>User: {event.user}</p>
                <p>Time: {event.timestamp}</p>
              </div>
            </div>
            <div className="text-right text-xs">
              <p className="font-semibold">Action Taken</p>
              <p>{event.action}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ComplianceManagement({ compliance }: ComplianceManagementProps) {
  return (
    <div className="space-y-3">
      {compliance.map((item) => (
        <div key={item.standard} className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-semibold text-gray-900">{item.standard}</p>
                <p className="text-xs text-gray-500">
                  Last audit: {item.lastAudit} • Next: {item.nextAudit}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs ${
                item.status === "compliant"
                  ? "bg-green-100 text-green-700"
                  : item.status === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {item.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AccessControlPanel() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Super Admin Access</h4>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>Total Super Admins</span>
            <span className="font-semibold text-gray-900">3</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Last Access</span>
            <span className="font-semibold text-gray-900">2 mins ago</span>
          </div>
          <div className="flex items-center justify-between">
            <span>MFA Required</span>
            <span className="font-semibold text-green-600">Enabled</span>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-900">API Access</h4>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>Active API Keys</span>
            <span className="font-semibold text-gray-900">47</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Rate Limiting</span>
            <span className="font-semibold text-green-600">Enabled</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Keys Expiring Soon</span>
            <span className="font-semibold text-yellow-600">3</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EncryptionStatus() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <StatusCard title="Data at Rest" status="Encrypted" detail="AES-256-GCM" icon={Database} />
        <StatusCard title="Data in Transit" status="Encrypted" detail="TLS 1.3" icon={Globe} />
        <StatusCard title="Key Rotation" status="Automatic" detail="Every 90 days" icon={RefreshCw} />
      </div>
      <div className="rounded-xl border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Encryption Keys</h4>
        <div className="space-y-2 text-xs text-gray-600">
          <KeyStatus name="Master Key" status="active" rotated="2025-10-15" expires="2026-01-15" />
          <KeyStatus name="Database Key" status="active" rotated="2025-11-01" expires="2026-02-01" />
          <KeyStatus name="Backup Key" status="active" rotated="2025-10-20" expires="2026-01-20" />
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, status, detail, icon: Icon }: StatusCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="mb-2 flex items-center gap-3">
        <Icon className="h-5 w-5 text-purple-500" />
        <h5 className="text-sm font-semibold text-gray-900">{title}</h5>
      </div>
      <p className="text-sm font-semibold text-green-600">{status}</p>
      <p className="text-xs text-gray-500">{detail}</p>
    </div>
  );
}

function KeyStatus({ name, status, rotated, expires }: KeyStatusProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Key className="h-4 w-4 text-gray-500" />
        {name}
      </div>
      <div className="text-xs text-gray-500">
        Rotated: {rotated} • Expires: {expires}
      </div>
      <span className={`rounded-full px-2 py-1 text-xs ${status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
        {status}
      </span>
    </div>
  );
}

function AuditLogs() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
        <p>Showing last 24 hours of admin activity</p>
        <button className="rounded-lg bg-purple-600 px-3 py-1 font-semibold text-white hover:bg-purple-700">
          Export Logs
        </button>
      </div>
      <div className="space-y-2">
        {auditEntries.map((entry) => (
          <AuditEntry key={`${entry.user}-${entry.timestamp}`} {...entry} />
        ))}
      </div>
    </div>
  );
}

function AuditEntry({ user, action, tenant, timestamp }: AuditEntryProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3 text-sm">
      <div className="flex items-center gap-3">
        <Activity className="h-4 w-4 text-gray-500" />
        <div>
          <p className="font-semibold text-gray-900">{action}</p>
          <p className="text-xs text-gray-500">User: {user} • Tenant: {tenant}</p>
        </div>
      </div>
      <span className="text-xs text-gray-500">{timestamp}</span>
    </div>
  );
}
