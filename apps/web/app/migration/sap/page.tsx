"use client";

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle,
  Cpu,
  Database,
  HardDrive,
  Package,
  RefreshCw,
  Shield,
  Upload,
} from "lucide-react";

type PhaseStatus = "pending" | "in-progress" | "completed";
type PhaseTaskStatus = "pending" | "running" | "completed";

type MigrationPhase = {
  id: string;
  name: string;
  description: string;
  duration: string;
  status: PhaseStatus;
  tasks?: { name: string; status: PhaseTaskStatus }[];
};

const MIGRATION_PHASES: MigrationPhase[] = [
  {
    id: "assessment",
    name: "System Assessment",
    description: "Analyze SAP landscape and data structures",
    duration: "2-4 hours",
    status: "in-progress",
    tasks: [
      { name: "Connect to SAP System", status: "completed" },
      { name: "Scan Data Dictionary", status: "completed" },
      { name: "Analyze Custom Tables", status: "running" },
      { name: "Map Business Processes", status: "pending" },
      { name: "Generate Assessment Report", status: "pending" },
    ],
  },
  {
    id: "mapping",
    name: "Data Mapping",
    description: "Map SAP fields to Oonru schema",
    duration: "1-2 days",
    status: "pending",
  },
  {
    id: "pilot",
    name: "Pilot Migration",
    description: "Test migration with subset of data",
    duration: "2-3 days",
    status: "pending",
  },
  {
    id: "production",
    name: "Production Migration",
    description: "Full data migration and cutover",
    duration: "1-2 weeks",
    status: "pending",
  },
  {
    id: "validation",
    name: "Validation & Go-Live",
    description: "Verify data integrity and activate",
    duration: "2-3 days",
    status: "pending",
  },
] as const;

const SAP_MODULES = [
  { code: "MM", name: "Materials Management", tables: 234, records: "2.3M", selected: true },
  { code: "SD", name: "Sales & Distribution", tables: 156, records: "1.8M", selected: true },
  { code: "PP", name: "Production Planning", tables: 89, records: "450K", selected: true },
  { code: "FI", name: "Financial Accounting", tables: 178, records: "5.2M", selected: false },
  { code: "CO", name: "Controlling", tables: 124, records: "3.1M", selected: false },
  { code: "QM", name: "Quality Management", tables: 67, records: "890K", selected: true },
  { code: "PM", name: "Plant Maintenance", tables: 98, records: "340K", selected: false },
  { code: "WM", name: "Warehouse Management", tables: 76, records: "1.2M", selected: true },
] as const;

const DATA_MAPPINGS = [
  {
    sapTable: "MARA",
    sapField: "MATNR",
    sapDesc: "Material Number",
    oonruTable: "materials",
    oonruField: "material_id",
    transformation: "ALPHA_REMOVE",
    status: "mapped",
  },
  {
    sapTable: "MARA",
    sapField: "MAKTX",
    sapDesc: "Material Description",
    oonruTable: "materials",
    oonruField: "description",
    transformation: "DIRECT",
    status: "mapped",
  },
  {
    sapTable: "MARC",
    sapField: "WERKS",
    sapDesc: "Plant",
    oonruTable: "inventory",
    oonruField: "plant_code",
    transformation: "DIRECT",
    status: "review",
  },
  {
    sapTable: "MARD",
    sapField: "LABST",
    sapDesc: "Unrestricted Stock",
    oonruTable: "inventory",
    oonruField: "quantity_available",
    transformation: "DECIMAL_CONVERT",
    status: "mapped",
  },
] as const;

export default function SapMigrationKit() {
  const [currentPhase, setCurrentPhase] = useState("assessment");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected">("disconnected");

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SAP Migration Kit</h1>
          <p className="text-gray-500">Automated migration from SAP ECC/S4HANA to Oonru</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              connectionStatus === "connected" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            SAP {connectionStatus}
          </span>
          <button className="px-5 py-2 bg-purple-600 text-white rounded-lg">Start Migration</button>
        </div>
      </header>

      <section className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Migration Progress</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Cpu className="w-4 h-4" /> Phase: {currentPhase}
          </div>
        </div>
        <MigrationTimeline currentPhase={currentPhase} onPhaseSelect={setCurrentPhase} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h3 className="font-semibold">SAP Connection</h3>
          <SAPConnectionForm setConnectionStatus={setConnectionStatus} />
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Select SAP Modules</h3>
            <button className="text-sm text-purple-600">Auto select</button>
          </div>
          <div className="space-y-2 max-h-96 overflow-auto pr-2">
            {SAP_MODULES.map((module) => (
              <ModuleRow key={module.code} module={module} />
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h3 className="font-semibold">Current Status</h3>
          <MigrationStatus />
        </section>
      </div>

      <section className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Data Mapping</h2>
          <button className="text-sm text-purple-600">Export Mapping</button>
        </div>
        <DataMappingTable />
      </section>
    </div>
  );
}

function MigrationTimeline({
  currentPhase,
  onPhaseSelect,
}: {
  currentPhase: string;
  onPhaseSelect: (phase: string) => void;
}) {
  return (
    <div className="relative overflow-x-auto">
      <div className="absolute top-10 left-12 right-12 h-0.5 bg-gray-200" />
      <div className="flex justify-between relative z-10">
        {MIGRATION_PHASES.map((phase, index) => {
          const isSelected = currentPhase === phase.id;
          return (
            <button
              key={phase.id}
              className={`flex flex-col items-center ${isSelected ? "text-purple-700" : "text-gray-800"}`}
              onClick={() => onPhaseSelect(phase.id)}
            >
            <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition ${
                phase.status === "completed"
                  ? "bg-green-500"
                  : phase.status === "in-progress"
                    ? "bg-purple-500"
                      : "bg-gray-300"
              }`}
                style={isSelected ? { boxShadow: "0 0 0 6px rgba(147, 51, 234, 0.2)" } : undefined}
            >
              {phase.status === "completed" ? (
                <CheckCircle className="w-8 h-8 text-white" />
              ) : phase.status === "in-progress" ? (
                <RefreshCw className="w-8 h-8 text-white animate-spin" />
              ) : (
                <span className="text-white font-bold">{index + 1}</span>
              )}
            </div>
              <p className={`mt-2 text-sm font-medium ${isSelected ? "text-purple-700" : "text-gray-800"}`}>{phase.name}</p>
              <p className="text-xs text-gray-500">{phase.duration}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SAPConnectionForm({
  setConnectionStatus,
}: {
  setConnectionStatus: (status: "connected" | "disconnected") => void;
}) {
  return (
    <form className="space-y-3">
      <SelectField label="SAP System" options={["SAP ECC 6.0", "SAP S/4HANA 2021", "SAP S/4HANA Cloud"]} />
      <InputField label="Application Server" placeholder="sap.company.com" />
      <InputField label="System ID" placeholder="PRD" />
      <InputField label="Client" placeholder="100" />
      <InputField label="Username" placeholder="RFC_USER" />
      <InputField label="Password" type="password" />
      <button
        type="button"
        onClick={() => setConnectionStatus("connected")}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg"
      >
        Connect to SAP
      </button>
    </form>
  );
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="text-sm text-gray-700 block">
      {label}
      <select className="mt-1 w-full px-3 py-2 border rounded-lg">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function InputField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="text-sm text-gray-700 block">
      {label}
      <input className="mt-1 w-full px-3 py-2 border rounded-lg" {...props} />
    </label>
  );
}

function ModuleRow({
  module,
}: {
  module: (typeof SAP_MODULES)[number];
}) {
  return (
    <div className={`p-3 border rounded-lg flex items-center justify-between ${module.selected ? "bg-purple-50 border-purple-200" : "bg-white"}`}>
      <div>
        <p className="font-semibold">{module.code}</p>
        <p className="text-xs text-gray-500">{module.name}</p>
      </div>
      <div className="text-right text-xs text-gray-500">
        <p>{module.tables} tables</p>
        <p>{module.records} records</p>
      </div>
    </div>
  );
}

function MigrationStatus() {
  return (
    <div className="space-y-3 text-sm text-gray-600">
      <StatusRow icon={<Upload className="w-4 h-4" />} label="Data Extraction" value="Running" color="text-blue-600" />
      <StatusRow icon={<Shield className="w-4 h-4" />} label="Compliance Checks" value="Aligned" color="text-green-600" />
      <StatusRow icon={<HardDrive className="w-4 h-4" />} label="Storage" value="8.9 TB provisioned" />
      <StatusRow icon={<Database className="w-4 h-4" />} label="Tables processed" value="1,245 / 2,010" />
      <StatusRow icon={<Package className="w-4 h-4" />} label="Custom objects" value="112 tracked" />
    </div>
  );
}

function StatusRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`font-medium ${color ?? ""}`}>{value}</span>
    </div>
  );
}

function DataMappingTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b text-xs text-gray-500 uppercase">
            <th className="py-2">SAP Table</th>
            <th className="py-2">SAP Field</th>
            <th className="py-2">Description</th>
            <th className="py-2 text-center">→</th>
            <th className="py-2">Oonru Table</th>
            <th className="py-2">Oonru Field</th>
            <th className="py-2">Transformation</th>
            <th className="py-2 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {DATA_MAPPINGS.map((mapping) => (
            <tr key={`${mapping.sapTable}-${mapping.sapField}`} className="border-t">
              <td className="py-2 font-mono">{mapping.sapTable}</td>
              <td className="py-2 font-mono">{mapping.sapField}</td>
              <td className="py-2">{mapping.sapDesc}</td>
              <td className="py-2 text-center">
                <ArrowRight className="inline w-4 h-4 text-gray-400" />
              </td>
              <td className="py-2 font-mono">{mapping.oonruTable}</td>
              <td className="py-2 font-mono">{mapping.oonruField}</td>
              <td className="py-2">{mapping.transformation}</td>
              <td className="py-2 text-center">
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    mapping.status === "mapped"
                      ? "bg-green-100 text-green-700"
                      : mapping.status === "review"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {mapping.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
