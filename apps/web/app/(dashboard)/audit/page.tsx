"use client";

import { useState } from "react";
import { CheckCircle, Download, Filter, Search, Shield } from "lucide-react";

type AuditFilter = {
  dateRange: string;
  user: string;
  action: string;
  entity: string;
  compliance: string;
};

type AuditEntry = {
  id: string;
  timestamp: string;
  user: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "ACCESS";
  entity: string;
  details: string;
  ipAddress?: string;
  sessionId?: string;
  riskLevel: "low" | "medium" | "high";
  compliance?: string[];
  beforeValue?: Record<string, unknown>;
  afterValue?: Record<string, unknown>;
  reason?: string;
  approved?: boolean;
  approver?: string;
  mfaVerified?: boolean;
  recordCount?: number;
  automated?: boolean;
  policy?: string;
};

type ComplianceStandard = {
  standard: string;
  status: "compliant" | "review";
  requirements: number;
  met: number;
  lastAudit: string;
  criticalFindings: number;
  remediation?: string;
};

export default function AuditTrailSystem() {
  const [filters, setFilters] = useState<AuditFilter>({
    dateRange: "last7days",
    user: "all",
    action: "all",
    entity: "all",
    compliance: "all",
  });

  const auditEntries: AuditEntry[] = [
    {
      id: "AUD-2025-001847",
      timestamp: "2025-11-16 03:45:23",
      user: "john.smith@acmecorp.com",
      action: "UPDATE",
      entity: "Inventory",
      details: "Modified stock quantity for SKU-12345 from 100 to 95",
      ipAddress: "192.168.1.100",
      sessionId: "sess_abc123",
      riskLevel: "low",
      compliance: ["21CFR11", "SOX"],
      beforeValue: { quantity: 100, location: "WH-01" },
      afterValue: { quantity: 95, location: "WH-01" },
      reason: "Physical count adjustment",
      approved: true,
      approver: "sarah.chen@acmecorp.com",
    },
    {
      id: "AUD-2025-001848",
      timestamp: "2025-11-16 03:48:10",
      user: "artpromedia@oonru.ai",
      action: "ACCESS",
      entity: "SuperAdmin",
      details: "Accessed tenant configuration for AcmeCorp",
      ipAddress: "10.0.0.1",
      sessionId: "sess_xyz789",
      riskLevel: "high",
      compliance: ["SOC2", "ISO27001"],
      mfaVerified: true,
    },
    {
      id: "AUD-2025-001849",
      timestamp: "2025-11-16 03:49:00",
      user: "system@oru.ai",
      action: "DELETE",
      entity: "ExpiredData",
      details: "Automated deletion of records older than retention policy",
      recordCount: 1247,
      compliance: ["GDPR"],
      automated: true,
      policy: "DATA-RETENTION-90D",
      riskLevel: "medium",
    },
  ];

  const complianceStandards: ComplianceStandard[] = [
    {
      standard: "21 CFR Part 11",
      status: "compliant",
      requirements: 47,
      met: 47,
      lastAudit: "2025-11-01",
      criticalFindings: 0,
    },
    {
      standard: "SOX",
      status: "compliant",
      requirements: 23,
      met: 23,
      lastAudit: "2025-10-15",
      criticalFindings: 0,
    },
    {
      standard: "GDPR",
      status: "review",
      requirements: 89,
      met: 87,
      lastAudit: "2025-11-10",
      criticalFindings: 2,
      remediation: "In Progress",
    },
    {
      standard: "HIPAA",
      status: "compliant",
      requirements: 65,
      met: 65,
      lastAudit: "2025-09-20",
      criticalFindings: 0,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail &amp; Compliance</h1>
          <p className="text-gray-500">Complete audit history with regulatory compliance</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export Report
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700">
            <Shield className="h-4 w-4" /> Compliance Check
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {complianceStandards.map((standard) => (
          <ComplianceCard key={standard.standard} standard={standard} />
        ))}
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Audit Trail</h2>
            <AuditFilters filters={filters} setFilters={setFilters} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">Compliance</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {auditEntries.map((entry) => (
                <AuditRow key={entry.id} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Electronic Signatures (21 CFR Part 11)</h2>
        <ElectronicSignatureLog />
      </div>
    </div>
  );
}

function ComplianceCard({ standard }: { standard: ComplianceStandard }) {
  const badgeClasses = standard.status === "compliant" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between">
        <Shield className="h-5 w-5 text-purple-500" />
        <span className={`rounded px-2 py-1 text-xs font-semibold capitalize ${badgeClasses}`}>{standard.status}</span>
      </div>
      <h3 className="text-base font-medium text-gray-900">{standard.standard}</h3>
      <p className="mt-1 text-sm text-gray-500">
        {standard.met}/{standard.requirements} requirements
      </p>
      {standard.criticalFindings > 0 && (
        <p className="mt-1 text-xs text-red-600">{standard.criticalFindings} critical findings • {standard.remediation ?? "Remediation pending"}</p>
      )}
      <p className="mt-2 text-xs text-gray-400">Last audit: {standard.lastAudit}</p>
    </div>
  );
}

type AuditFiltersProps = {
  filters: AuditFilter;
  setFilters: (filters: AuditFilter) => void;
};

function AuditFilters({ filters, setFilters }: AuditFiltersProps) {
  const updateFilter = (key: keyof AuditFilter, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input className="w-44 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm" placeholder="Search user or entity" />
      </div>
      <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700">
        <Filter className="h-4 w-4" /> Filters
      </button>
      <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={filters.action} onChange={(event) => updateFilter("action", event.target.value)}>
        <option value="all">All actions</option>
        <option value="CREATE">Create</option>
        <option value="UPDATE">Update</option>
        <option value="DELETE">Delete</option>
        <option value="ACCESS">Access</option>
      </select>
    </div>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const actionColors: Record<AuditEntry["action"], string> = {
    CREATE: "bg-green-100 text-green-700",
    UPDATE: "bg-blue-100 text-blue-700",
    DELETE: "bg-red-100 text-red-700",
    ACCESS: "bg-purple-100 text-purple-700",
  };

  const riskColors: Record<AuditEntry["riskLevel"], string> = {
    low: "text-green-600",
    medium: "text-yellow-600",
    high: "text-red-600",
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 font-mono text-xs text-gray-600">{entry.id}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{entry.timestamp}</td>
      <td className="px-4 py-3 text-sm text-gray-900">{entry.user}</td>
      <td className="px-4 py-3">
        <span className={`rounded px-2 py-1 text-xs font-semibold ${actionColors[entry.action]}`}>{entry.action}</span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{entry.entity}</td>
      <td className="max-w-xs px-4 py-3 text-sm text-gray-600">{entry.details}</td>
      <td className="px-4 py-3">
        {entry.compliance?.map((standard) => (
          <span key={standard} className="mr-1 inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
            {standard}
          </span>
        ))}
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm font-semibold capitalize ${riskColors[entry.riskLevel]}`}>{entry.riskLevel}</span>
      </td>
      <td className="px-4 py-3">
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View Details</button>
      </td>
    </tr>
  );
}

function ElectronicSignatureLog() {
  const signatures = [
    {
      id: "SIG-001",
      document: "Batch Release BR-2025-1847",
      signedBy: "john.doe@acmecorp.com",
      role: "Quality Manager",
      timestamp: "2025-11-16 02:30:00",
      meaning: "Approved for Release",
      hash: "SHA256:7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730",
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            <th className="py-2">Document</th>
            <th className="py-2">Signed By</th>
            <th className="py-2">Role</th>
            <th className="py-2">Timestamp</th>
            <th className="py-2">Meaning</th>
            <th className="py-2">Verification</th>
          </tr>
        </thead>
        <tbody>
          {signatures.map((signature) => (
            <tr key={signature.id} className="border-b">
              <td className="py-2">{signature.document}</td>
              <td className="py-2">{signature.signedBy}</td>
              <td className="py-2">{signature.role}</td>
              <td className="py-2">{signature.timestamp}</td>
              <td className="py-2">{signature.meaning}</td>
              <td className="py-2">
                <CheckCircle className="inline h-4 w-4 text-green-500" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
