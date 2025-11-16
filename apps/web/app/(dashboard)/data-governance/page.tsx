"use client";

import { Database } from "lucide-react";

type DataAsset = {
  name: string;
  owner: string;
  classification: "Highly Confidential" | "Confidential" | "Internal";
  quality: number;
  records: number;
  lastAudit: string;
  piiFields?: string[];
  retention: string;
  encryption: string;
  compliance?: string[];
};

type DataQualityRule = {
  rule: string;
  entity: string;
  field: string;
  violations: number;
  lastRun: string;
  status: "active" | "paused";
};

export default function DataGovernance() {
  const dataAssets: DataAsset[] = [
    {
      name: "Customer Master Data",
      owner: "Sales Department",
      classification: "Confidential",
      quality: 98,
      records: 45_789,
      lastAudit: "2025-11-10",
      piiFields: ["email", "phone", "address"],
      retention: "7 years",
      encryption: "AES-256",
    },
    {
      name: "Product Master Data",
      owner: "Operations",
      classification: "Internal",
      quality: 94,
      records: 12_456,
      lastAudit: "2025-11-05",
      retention: "10 years",
      encryption: "AES-256",
    },
    {
      name: "Financial Transactions",
      owner: "Finance Department",
      classification: "Highly Confidential",
      quality: 100,
      records: 2_456_789,
      lastAudit: "2025-11-15",
      retention: "10 years",
      encryption: "AES-256",
      compliance: ["SOX", "GDPR"],
    },
  ];

  const dataQualityRules: DataQualityRule[] = [
    {
      rule: "Email Format Validation",
      entity: "Customer",
      field: "email",
      violations: 12,
      lastRun: "2025-11-16 03:00:00",
      status: "active",
    },
    {
      rule: "Duplicate Detection",
      entity: "Product",
      field: "SKU",
      violations: 0,
      lastRun: "2025-11-16 02:00:00",
      status: "active",
    },
    {
      rule: "Completeness Check",
      entity: "Vendor",
      field: "tax_id",
      violations: 45,
      lastRun: "2025-11-16 01:00:00",
      status: "active",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Governance &amp; MDM</h1>
          <p className="text-gray-500">Master data management and quality control</p>
        </div>
        <button className="rounded-lg bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700">Run Data Quality Check</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DataQualityMetric label="Overall Quality" value="96%" status="good" />
        <DataQualityMetric label="Data Completeness" value="94%" status="good" />
        <DataQualityMetric label="Data Accuracy" value="98%" status="good" />
        <DataQualityMetric label="Data Consistency" value="97%" status="good" />
      </div>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Master Data Assets</h2>
        <div className="space-y-4">
          {dataAssets.map((asset) => (
            <DataAssetCard key={asset.name} asset={asset} />
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Data Quality Rules</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="py-2">Rule</th>
                <th className="py-2">Entity</th>
                <th className="py-2">Field</th>
                <th className="py-2 text-center">Violations</th>
                <th className="py-2">Last Run</th>
                <th className="py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {dataQualityRules.map((rule) => (
                <tr key={rule.rule} className="border-b">
                  <td className="py-2">{rule.rule}</td>
                  <td className="py-2">{rule.entity}</td>
                  <td className="py-2">{rule.field}</td>
                  <td className="py-2 text-center">
                    <span className={`font-semibold ${rule.violations === 0 ? "text-green-600" : "text-red-600"}`}>{rule.violations}</span>
                  </td>
                  <td className="py-2">{rule.lastRun}</td>
                  <td className="py-2 text-center">
                    <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">{rule.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DataQualityMetric({ label, value, status }: { label: string; value: string; status: "good" | "warning" }) {
  const color = status === "good" ? "text-green-600" : "text-yellow-600";
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function DataAssetCard({ asset }: { asset: DataAsset }) {
  const classificationClasses: Record<DataAsset["classification"], string> = {
    "Highly Confidential": "bg-red-100 text-red-700",
    Confidential: "bg-orange-100 text-orange-700",
    Internal: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-gray-500" />
        <p className="font-medium text-gray-900">{asset.name}</p>
        <span className={`rounded px-2 py-1 text-xs font-semibold ${classificationClasses[asset.classification]}`}>
          {asset.classification}
        </span>
      </div>
      <div className="mt-3 grid gap-4 text-sm md:grid-cols-4">
        <div>
          <p className="text-gray-500">Owner</p>
          <p className="font-medium text-gray-900">{asset.owner}</p>
        </div>
        <div>
          <p className="text-gray-500">Records</p>
          <p className="font-medium text-gray-900">{asset.records.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500">Quality Score</p>
          <p className="font-medium text-gray-900">{asset.quality}%</p>
        </div>
        <div>
          <p className="text-gray-500">Retention</p>
          <p className="font-medium text-gray-900">{asset.retention}</p>
        </div>
      </div>
    </div>
  );
}
