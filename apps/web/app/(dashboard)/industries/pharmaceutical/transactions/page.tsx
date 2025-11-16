"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  Package,
  Shield,
  Thermometer,
  Truck,
} from "lucide-react";

const transactionOrder = ["dispensing", "compounding", "fillFinish", "validation", "clinical", "coldChain"] as const;

type TransactionKey = (typeof transactionOrder)[number];

type TransactionConfig<TWorkflow extends WorkflowVariant = WorkflowVariant> = {
  name: string;
  icon: typeof Activity;
  critical?: boolean;
  workflows: TWorkflow[];
};

type DispensingWorkflow = {
  id: string;
  lot: string;
  product: string;
  suite: string;
  materials: Array<{ name: string; spec: string; actual: string; deviation?: string }>;
  environment: { humidity: string; pressure: string; operator: string; status: string };
  weighTickets: Array<{ step: string; target: string; actual: string; owner: string; timestamp: string }>;
};

type CompoundingWorkflow = {
  id: string;
  product: string;
  vessel: string;
  batchSize: string;
  recipeSteps: Array<{ label: string; status: string; detail: string }>;
  parameters: Array<{ name: string; value: string; limit: string; state: "within" | "warning" }>;
  sampling: Array<{ test: string; result: string; spec: string; status: "pass" | "fail" | "pending" }>;
};

type FillFinishWorkflow = {
  id: string;
  batch: string;
  vialSize: string;
  targetUnits: number;
  producedUnits: number;
  isolatorStatus: string;
  asepticEvents: Array<{ time: string; description: string; resolved: boolean }>;
  sterility: Array<{ lane: string; status: string; completion: string }>;
};

type ValidationWorkflow = {
  id: string;
  lot: string;
  product: string;
  disposition: string;
  reviewers: Array<{ name: string; role: string; status: "approved" | "pending" | "flagged" }>;
  qualitySummary: Array<{ label: string; result: string; status: "pass" | "warning" | "fail" }>;
  deviations: Array<{ id: string; owner: string; status: string; classification: string }>;
};

type ClinicalSupplyWorkflow = {
  id: string;
  protocol: string;
  phase: string;
  enrollment: { totalSites: number; activeSites: number; kitsReleased: number; kitsInTransit: number };
  shipments: Array<{ site: string; country: string; kits: number; eta: string; excursions: number; status: string }>;
};

type ColdChainWorkflow = {
  id: string;
  lane: string;
  product: string;
  shipments: Array<{
    id: string;
    temp: { current: string; range: string };
    node: string;
    eta: string;
    status: "on-track" | "hold" | "investigate";
  }>;
  telemetry: Array<{ name: string; value: string; status: "ok" | "alert" }>;
};

type WorkflowVariant =
  | DispensingWorkflow
  | CompoundingWorkflow
  | FillFinishWorkflow
  | ValidationWorkflow
  | ClinicalSupplyWorkflow
  | ColdChainWorkflow;

const transactionTypes: Record<TransactionKey, TransactionConfig> = {
  dispensing: {
    name: "Dispensing & Weighing",
    icon: ClipboardCheck,
    workflows: [
      {
        id: "DSP-PH-1842",
        lot: "Lyo-25-1118",
        product: "mRNA-2012 Bulk",
        suite: "Dispensary 2A",
        materials: [
          { name: "mRNA API", spec: "12.5 kg", actual: "12.48 kg" },
          { name: "Buffer A", spec: "240 L", actual: "239 L", deviation: "-0.4%" },
          { name: "Stabilizer Blend", spec: "8.0 kg", actual: "8.02 kg" },
        ],
        environment: {
          humidity: "42%",
          pressure: "+12 Pa",
          operator: "C. Ramos",
          status: "Compliant",
        },
        weighTickets: [
          { step: "API transfer", target: "12.5 kg", actual: "12.48 kg", owner: "CR", timestamp: "08:12" },
          { step: "Buffer charge", target: "240 L", actual: "239 L", owner: "CR", timestamp: "08:26" },
          { step: "Excipient blend", target: "8.0 kg", actual: "8.02 kg", owner: "CR", timestamp: "08:39" },
        ],
      },
    ],
  },
  compounding: {
    name: "Compounding & Mixing",
    icon: Activity,
    workflows: [
      {
        id: "CMP-PH-0933",
        product: "Sterile Suspension Vial",
        vessel: "Mix Tank MT-07",
        batchSize: "1,500 L",
        recipeSteps: [
          { label: "Charge buffer", status: "complete", detail: "09:05" },
          { label: "High-shear mix", status: "running", detail: "RPM 1,200" },
          { label: "In-line homogenize", status: "queued", detail: "Heads ready" },
        ],
        parameters: [
          { name: "Temp", value: "18.4°C", limit: "18-20°C", state: "within" },
          { name: "pH", value: "6.92", limit: "6.8-7.0", state: "within" },
          { name: "Viscosity", value: "84 cP", limit: "<= 90 cP", state: "within" },
        ],
        sampling: [
          { test: "Appearance", result: "Pass", spec: "No particles", status: "pass" },
          { test: "APC", result: "Pending", spec: "< 10 CFU/mL", status: "pending" },
          { test: "Assay", result: "99.1%", spec: "98-102%", status: "pass" },
        ],
      },
    ],
  },
  fillFinish: {
    name: "Fill-Finish Isolator",
    icon: Package,
    critical: true,
    workflows: [
      {
        id: "FFI-PH-2210",
        batch: "FF-BT-7781",
        vialSize: "3 mL",
        targetUnits: 48000,
        producedUnits: 31200,
        isolatorStatus: "Running · Grade A",
        asepticEvents: [
          { time: "10:32", description: "Glove integrity challenge", resolved: true },
          { time: "11:18", description: "Particle counter alert", resolved: false },
        ],
        sterility: [
          { lane: "Lane A", status: "in-progress", completion: "68%" },
          { lane: "Lane B", status: "pending", completion: "—" },
        ],
      },
    ],
  },
  validation: {
    name: "QA Release & Validation",
    icon: Shield,
    workflows: [
      {
        id: "VAL-PH-557",
        lot: "Lot 25NOV17",
        product: "Cell Therapy LV-04",
        disposition: "Awaiting Final QA",
        reviewers: [
          { name: "Dr. Alvarez", role: "QA Director", status: "approved" },
          { name: "S. Nataraj", role: "CMC", status: "pending" },
        ],
        qualitySummary: [
          { label: "Sterility", result: "No growth", status: "pass" },
          { label: "Endotoxin", result: "0.12 EU/mL", status: "pass" },
          { label: "Potency", result: "94%", status: "warning" },
        ],
        deviations: [
          { id: "DEV-4412", owner: "QA", status: "open", classification: "Major" },
          { id: "CAPA-0087", owner: "Manufacturing", status: "implementing", classification: "Minor" },
        ],
      },
    ],
  },
  clinical: {
    name: "Clinical Supply Network",
    icon: Droplets,
    workflows: [
      {
        id: "CLN-PH-902",
        protocol: "ONC-302",
        phase: "Phase II",
        enrollment: { totalSites: 42, activeSites: 35, kitsReleased: 1280, kitsInTransit: 210 },
        shipments: [
          { site: "MD Anderson", country: "USA", kits: 60, eta: "Arrived", excursions: 0, status: "Received" },
          { site: "Sheba", country: "Israel", kits: 40, eta: "+2 days", excursions: 1, status: "Investigate" },
          { site: "Charité", country: "Germany", kits: 55, eta: "In transit", excursions: 0, status: "On Track" },
        ],
      },
    ],
  },
  coldChain: {
    name: "Cold Chain & Lanes",
    icon: Thermometer,
    critical: true,
    workflows: [
      {
        id: "CCN-PH-304",
        lane: "Boston → Singapore",
        product: "mRNA Bulk",
        shipments: [
          { id: "CC-1187", temp: { current: "-71°C", range: "-75 to -65" }, node: "In flight", eta: "12h", status: "on-track" },
          { id: "CC-1188", temp: { current: "-63°C", range: "-75 to -65" }, node: "CDG Hub", eta: "Hold", status: "investigate" },
        ],
        telemetry: [
          { name: "Dry Ice", value: "62% remaining", status: "ok" },
          { name: "Shock Sensor", value: "Event at 08:42", status: "alert" },
        ],
      },
    ],
  },
};

export default function PharmaceuticalTransactions() {
  const [activeTransaction, setActiveTransaction] = useState<TransactionKey>("dispensing");
  const transactionEntries = useMemo(() => transactionOrder.map((key) => [key, transactionTypes[key]] as const), []);

  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Prompt 2 · Pharma Ops</p>
        <h1 className="text-3xl font-bold text-gray-900">Pharmaceutical Transactions</h1>
        <p className="text-sm text-gray-500">Multi-stage GMP workflows with validation context</p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {transactionEntries.map(([key, config]) => {
          const Icon = config.icon;
          const isActive = activeTransaction === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTransaction(key)}
              className={`rounded-xl border-2 p-4 text-left transition ${
                isActive ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <Icon className={`mb-2 h-6 w-6 ${config.critical ? "text-red-500" : "text-slate-600"}`} />
              <p className="text-xs font-semibold text-gray-900">{config.name}</p>
            </button>
          );
        })}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <TransactionWorkflow type={activeTransaction} data={transactionTypes[activeTransaction]} />
      </section>
    </div>
  );
}

type TransactionWorkflowProps = {
  type: TransactionKey;
  data: TransactionConfig;
};

function TransactionWorkflow({ type, data }: TransactionWorkflowProps) {
  switch (type) {
    case "dispensing":
      return <DispensingWorkflowView data={data} />;
    case "compounding":
      return <CompoundingWorkflowView data={data} />;
    case "fillFinish":
      return <FillFinishWorkflowView data={data} />;
    case "validation":
      return <ValidationWorkflowView data={data} />;
    case "clinical":
      return <ClinicalSupplyWorkflowView data={data} />;
    case "coldChain":
      return <ColdChainWorkflowView data={data} />;
    default:
      return null;
  }
}

function DataPoint({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function DispensingWorkflowView({ data }: { data: TransactionConfig }) {
  const workflow = data.workflows[0] as DispensingWorkflow;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Controlled Dispensing</h2>
          <p className="text-sm text-gray-500">{workflow.product} · Lot {workflow.lot}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{workflow.suite}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Environment</h3>
          <div className="mt-3 space-y-3">
            <DataPoint label="Humidity" value={workflow.environment.humidity} />
            <DataPoint label="Pressure" value={workflow.environment.pressure} />
            <DataPoint label="Operator" value={workflow.environment.operator} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Materials</h3>
          <div className="mt-3 space-y-3">
            {workflow.materials.map((material) => (
              <div key={material.name} className="rounded-lg bg-slate-50 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{material.name}</p>
                  <span className="text-xs text-gray-500">Spec {material.spec}</span>
                </div>
                <p className="text-xs text-gray-600">Actual: {material.actual}</p>
                {material.deviation && <p className="text-xs text-amber-600">Deviation {material.deviation}</p>}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Weigh Tickets</h3>
          <div className="mt-3 space-y-3">
            {workflow.weighTickets.map((ticket) => (
              <div key={ticket.step} className="text-sm">
                <p className="font-semibold text-gray-900">{ticket.step}</p>
                <p className="text-xs text-gray-500">Target {ticket.target}</p>
                <p className="text-xs text-gray-500">Actual {ticket.actual} · {ticket.owner}</p>
                <p className="text-xs text-gray-400">{ticket.timestamp}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompoundingWorkflowView({ data }: { data: TransactionConfig }) {
  const workflow = data.workflows[0] as CompoundingWorkflow;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Compounding Execution</h2>
          <p className="text-sm text-gray-500">{workflow.product} · {workflow.vessel}</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">{workflow.batchSize}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Recipe Steps</h3>
          <div className="mt-3 space-y-3">
            {workflow.recipeSteps.map((step) => (
              <div key={step.label} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-gray-900">{step.label}</p>
                  <p className="text-xs text-gray-500">{step.detail}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    step.status === "complete"
                      ? "bg-emerald-50 text-emerald-700"
                      : step.status === "running"
                        ? "bg-sky-50 text-sky-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {step.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Critical Parameters</h3>
          <div className="mt-3 space-y-3">
            {workflow.parameters.map((parameter) => (
              <div key={parameter.name} className="rounded-lg bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-gray-900">{parameter.name}</p>
                <p className="text-xs text-gray-500">{parameter.value}</p>
                <p className="text-xs text-gray-500">Limit {parameter.limit}</p>
                <p
                  className={`text-xs font-semibold ${
                    parameter.state === "within" ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {parameter.state === "within" ? "Within limits" : "Warning"}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Sampling & IPC</h3>
          <div className="mt-3 space-y-3">
            {workflow.sampling.map((sample) => (
              <div key={sample.test} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-gray-900">{sample.test}</p>
                  <p className="text-xs text-gray-500">Spec {sample.spec}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    sample.status === "pass"
                      ? "bg-emerald-50 text-emerald-700"
                      : sample.status === "pending"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-red-50 text-red-600"
                  }`}
                >
                  {sample.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FillFinishWorkflowView({ data }: { data: TransactionConfig }) {
  const workflow = data.workflows[0] as FillFinishWorkflow;
  const progress = Math.round((workflow.producedUnits / workflow.targetUnits) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Fill-Finish Isolation</h2>
          <p className="text-sm text-gray-500">Batch {workflow.batch} · {workflow.vialSize}</p>
        </div>
        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">{workflow.isolatorStatus}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Throughput</h3>
          <div className="mt-3 space-y-2 text-sm">
            <DataPoint label="Target" value={workflow.targetUnits.toLocaleString()} />
            <DataPoint label="Produced" value={workflow.producedUnits.toLocaleString()} />
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Progress</p>
              <div className="mt-1 h-2 rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-500">{progress}% complete</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Aseptic Events</h3>
          <div className="mt-3 space-y-3 text-sm">
            {workflow.asepticEvents.map((event) => (
              <div key={event.time} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{event.description}</p>
                  <p className="text-xs text-gray-500">{event.time}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    event.resolved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {event.resolved ? "Resolved" : "Open"}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Sterility</h3>
          <div className="mt-3 space-y-3 text-sm">
            {workflow.sterility.map((lane) => (
              <div key={lane.lane} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{lane.lane}</p>
                  <p className="text-xs text-gray-500">{lane.status}</p>
                </div>
                <span className="text-xs font-semibold text-gray-600">{lane.completion}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ValidationWorkflowView({ data }: { data: TransactionConfig }) {
  const workflow = data.workflows[0] as ValidationWorkflow;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Release & Validation</h2>
          <p className="text-sm text-gray-500">{workflow.product} · {workflow.lot}</p>
        </div>
        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
          {workflow.disposition}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Quality Summary</h3>
          <div className="mt-3 space-y-3 text-sm">
            {workflow.qualitySummary.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">{metric.label}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    metric.status === "pass"
                      ? "bg-emerald-50 text-emerald-700"
                      : metric.status === "warning"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                  }`}
                >
                  {metric.result}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Reviewers</h3>
          <div className="mt-3 space-y-3 text-sm">
            {workflow.reviewers.map((reviewer) => (
              <div key={reviewer.name} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{reviewer.name}</p>
                  <p className="text-xs text-gray-500">{reviewer.role}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    reviewer.status === "approved"
                      ? "bg-emerald-50 text-emerald-700"
                      : reviewer.status === "pending"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-red-50 text-red-700"
                  }`}
                >
                  {reviewer.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Deviations & CAPA</h3>
          <div className="mt-3 space-y-3 text-sm">
            {workflow.deviations.map((deviation) => (
              <div key={deviation.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{deviation.id}</p>
                  <p className="text-xs text-gray-500">{deviation.classification}</p>
                </div>
                <span className="text-xs text-gray-600">{deviation.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClinicalSupplyWorkflowView({ data }: { data: TransactionConfig }) {
  const workflow = data.workflows[0] as ClinicalSupplyWorkflow;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Clinical Supply Network</h2>
          <p className="text-sm text-gray-500">Protocol {workflow.protocol} · {workflow.phase}</p>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          {workflow.enrollment.activeSites}/{workflow.enrollment.totalSites} active sites
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Network KPIs</h3>
          <div className="mt-3 space-y-3">
            <DataPoint label="Kits Released" value={workflow.enrollment.kitsReleased} />
            <DataPoint label="In Transit" value={workflow.enrollment.kitsInTransit} />
            <DataPoint label="Active Sites" value={workflow.enrollment.activeSites} />
          </div>
        </div>
        <div className="md:col-span-3">
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Site Shipments</h3>
            <div className="mt-3 divide-y divide-gray-100 text-sm">
              {workflow.shipments.map((shipment) => (
                <div key={shipment.site} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-gray-900">{shipment.site}</p>
                    <p className="text-xs text-gray-500">{shipment.country}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Kits {shipment.kits}</p>
                    <p className="text-xs text-gray-500">ETA {shipment.eta}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      shipment.status === "Received"
                        ? "bg-emerald-50 text-emerald-700"
                        : shipment.status === "On Track"
                          ? "bg-sky-50 text-sky-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {shipment.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColdChainWorkflowView({ data }: { data: TransactionConfig }) {
  const workflow = data.workflows[0] as ColdChainWorkflow;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Cold Chain Control</h2>
          <p className="text-sm text-gray-500">{workflow.product} · {workflow.lane}</p>
        </div>
        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Live telemetry</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Shipments</h3>
          <div className="mt-3 space-y-3 text-sm">
            {workflow.shipments.map((shipment) => (
              <div key={shipment.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{shipment.id}</p>
                  <span
                    className={`text-xs font-semibold ${
                      shipment.status === "on-track"
                        ? "text-emerald-600"
                        : shipment.status === "hold"
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {shipment.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{shipment.node}</p>
                <p className="text-xs text-gray-500">ETA {shipment.eta}</p>
                <p className="text-xs text-gray-500">
                  Temp {shipment.temp.current} ({shipment.temp.range})
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Telemetry</h3>
          <div className="mt-3 space-y-3 text-sm">
            {workflow.telemetry.map((signal) => (
              <div key={signal.name} className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">{signal.name}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    signal.status === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {signal.value}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Response Actions</h3>
          <div className="mt-3 space-y-3 text-sm">
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
              <Truck className="h-4 w-4" /> Reroute courier
            </button>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Launch investigation
            </button>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Confirm release
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
