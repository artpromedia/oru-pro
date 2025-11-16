"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  ChevronRight,
  Download,
  FileText,
  GitBranch,
  MapPin,
  Package,
  Search,
  Truck,
} from "lucide-react";

interface QualityTest {
  test: string;
  result: string;
  spec: string;
  status: "pass" | "fail";
}

interface Ingredient {
  id: string;
  name: string;
  batch: string;
  supplier: string;
  quantity: number;
  unit: string;
  receivedDate: string;
  certificates?: string[];
  qualityTests?: QualityTest[];
}

interface Shipment {
  id: string;
  customer: string;
  quantity: number;
  shipDate: string;
  deliveryDate?: string;
  poNumber?: string;
  status: "delivered" | "in-transit" | "pending";
  invoiceNumber?: string;
  tracking?: string;
}

interface ProcessStep {
  step: string;
  timestamp: string;
  operator: string;
  equipment?: string | null;
  approval?: string;
  parameters?: Record<string, string>;
}

interface BatchData {
  id: string;
  product: string;
  quantity: number;
  unit: string;
  manufactureDate: string;
  expiryDate: string;
  status: string;
  qualityStatus: string;
  location: string;
  ingredients: Ingredient[];
  shipments: Shipment[];
  processSteps: ProcessStep[];
}

const batchData: BatchData = {
  id: "BATCH-2025-001847",
  product: "Finished Product A",
  quantity: 1000,
  unit: "kg",
  manufactureDate: "2025-11-10",
  expiryDate: "2026-11-10",
  status: "released",
  qualityStatus: "approved",
  location: "Warehouse A - Zone 3",
  ingredients: [
    {
      id: "RM-001",
      name: "Raw Material X",
      batch: "BATCH-2025-001234",
      supplier: "Supplier ABC",
      quantity: 400,
      unit: "kg",
      receivedDate: "2025-11-05",
      certificates: ["COA-123", "MSDS-456"],
      qualityTests: [
        { test: "Purity", result: "99.8%", spec: ">99%", status: "pass" },
        { test: "Moisture", result: "0.3%", spec: "<0.5%", status: "pass" },
      ],
    },
    {
      id: "RM-002",
      name: "Raw Material Y",
      batch: "BATCH-2025-001235",
      supplier: "Supplier XYZ",
      quantity: 300,
      unit: "kg",
      receivedDate: "2025-11-06",
    },
    {
      id: "RM-003",
      name: "Additive Z",
      batch: "BATCH-2025-001236",
      supplier: "Supplier DEF",
      quantity: 50,
      unit: "kg",
      receivedDate: "2025-11-07",
    },
  ],
  shipments: [
    {
      id: "SHIP-001",
      customer: "Customer Alpha",
      quantity: 300,
      shipDate: "2025-11-12",
      deliveryDate: "2025-11-13",
      poNumber: "PO-2025-4567",
      status: "delivered",
      invoiceNumber: "INV-2025-1234",
    },
    {
      id: "SHIP-002",
      customer: "Customer Beta",
      quantity: 500,
      shipDate: "2025-11-14",
      deliveryDate: "2025-11-15",
      poNumber: "PO-2025-4568",
      status: "delivered",
    },
    {
      id: "SHIP-003",
      customer: "Customer Gamma",
      quantity: 200,
      shipDate: "2025-11-16",
      status: "in-transit",
      tracking: "TRK123456789",
    },
  ],
  processSteps: [
    {
      step: "Receiving",
      timestamp: "2025-11-05 08:00:00",
      operator: "John Doe",
      equipment: null,
    },
    {
      step: "Mixing",
      timestamp: "2025-11-10 09:00:00",
      operator: "Jane Smith",
      equipment: "Mixer-01",
      parameters: { speed: "100 rpm", duration: "30 min", temperature: "25°C" },
    },
    {
      step: "Packaging",
      timestamp: "2025-11-10 14:00:00",
      operator: "Mike Wilson",
      equipment: "Pack-Line-01",
      parameters: { packSize: "25 kg", packType: "Bag" },
    },
    {
      step: "Quality Release",
      timestamp: "2025-11-11 10:00:00",
      operator: "Sarah Chen",
      approval: "QA-APPROVED-2025-1847",
    },
  ],
};

export default function TraceabilityPage() {
  const [selectedBatch, setSelectedBatch] = useState(batchData.id);

  const summary = useMemo(
    () => ({
      ingredientCount: batchData.ingredients.length,
      shipmentCount: batchData.shipments.length,
    }),
    []
  );

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-purple-600 font-semibold">
            Traceability cockpit
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Batch Traceability & Genealogy</h1>
          <p className="text-gray-500 mt-1">
            Complete forward and backward traceability across {summary.ingredientCount} inputs
            and {summary.shipmentCount} outbound nodes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export Report
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700">
            <AlertTriangle className="h-4 w-4" /> Initiate Recall
          </button>
        </div>
      </header>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-10 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
              placeholder="Search by batch, product, or lot"
            />
          </div>
          <select className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700">
            <option>All Products</option>
            <option>Raw Materials</option>
            <option>Finished Goods</option>
            <option>Intermediates</option>
          </select>
          <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-purple-700">
            Trace
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
            <ArrowRight className="mr-2 h-5 w-5 rotate-180" /> Backward Trace (Sources)
          </h2>
          <div className="space-y-3">
            {batchData.ingredients.map((ingredient) => (
              <IngredientCard key={ingredient.id} ingredient={ingredient} />
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
            <Package className="mr-2 h-5 w-5" /> Batch Details
          </h2>
          <BatchSummary batch={batchData} />
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
            <ArrowRight className="mr-2 h-5 w-5" /> Forward Trace (Destinations)
          </h2>
          <div className="space-y-3">
            {batchData.shipments.map((shipment) => (
              <ShipmentCard key={shipment.id} shipment={shipment} />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-1 flex items-center text-lg font-semibold text-gray-900">
          <GitBranch className="mr-2 h-5 w-5" /> Batch Genealogy Tree
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Visualize lineage from inbound ingredients through finished goods to customer destinations.
        </p>
        <GenealogyTree batch={batchData} />
      </section>
    </div>
  );
}

function BatchSummary({ batch }: { batch: BatchData }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
        <h3 className="text-xl font-semibold text-purple-900">{batch.id}</h3>
        <p className="text-sm text-purple-700">{batch.product}</p>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <dt>Quantity</dt>
            <dd className="font-medium text-gray-900">
              {batch.quantity} {batch.unit}
            </dd>
          </div>
          <div className="flex justify-between text-gray-600">
            <dt>Mfg Date</dt>
            <dd className="font-medium text-gray-900">{batch.manufactureDate}</dd>
          </div>
          <div className="flex justify-between text-gray-600">
            <dt>Expiry</dt>
            <dd className="font-medium text-gray-900">{batch.expiryDate}</dd>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <dt className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> Location
            </dt>
            <dd className="font-medium text-gray-900">{batch.location}</dd>
          </div>
        </dl>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded bg-green-100 px-2 py-1 font-medium text-green-700">Released</span>
          <span className="rounded bg-blue-100 px-2 py-1 font-medium text-blue-700">QA Approved</span>
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-medium text-gray-900">Process Timeline</h3>
        <div className="space-y-2">
          {batch.processSteps.map((step) => (
            <ProcessStep key={step.step + step.timestamp} step={step} />
          ))}
        </div>
      </div>
    </div>
  );
}

function IngredientCard({ ingredient }: { ingredient: Ingredient }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <p className="text-sm font-medium text-gray-900">{ingredient.name}</p>
          <p className="text-xs text-gray-500">{ingredient.batch}</p>
        </div>
        <ChevronRight
          className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`}
        />
      </button>
      {expanded && (
        <div className="mt-3 space-y-1 border-t pt-3 text-xs">
          <p>
            Supplier: <span className="font-medium text-gray-900">{ingredient.supplier}</span>
          </p>
          <p>
            Quantity: {ingredient.quantity} {ingredient.unit}
          </p>
          <p>Received: {ingredient.receivedDate}</p>
          {ingredient.certificates && (
            <p>
              Certificates:
              <span className="ml-1 font-medium text-blue-600">
                {ingredient.certificates.join(", ")}
              </span>
            </p>
          )}
          {ingredient.qualityTests && (
            <div className="space-y-1 pt-2">
              <p className="font-medium text-gray-900">Quality Tests</p>
              {ingredient.qualityTests.map((test) => (
                <div key={test.test} className="flex items-center justify-between">
                  <span>
                    {test.test}: {test.result}
                  </span>
                  <span
                    className={`rounded px-1 py-0.5 text-[10px] uppercase ${
                      test.status === "pass"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {test.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ShipmentCard({ shipment }: { shipment: Shipment }) {
  const badgeStyles = {
    delivered: "bg-green-100 text-green-700",
    "in-transit": "bg-blue-100 text-blue-700",
    pending: "bg-gray-100 text-gray-700",
  } as const;

  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{shipment.customer}</p>
          <p className="text-xs text-gray-500">{shipment.id}</p>
        </div>
        <span className={`rounded px-2 py-1 text-xs font-medium ${badgeStyles[shipment.status]}`}>
          {shipment.status}
        </span>
      </div>
      <dl className="mt-2 space-y-1 text-xs text-gray-600">
        <div className="flex justify-between">
          <dt>Quantity</dt>
          <dd className="font-medium text-gray-900">{shipment.quantity} kg</dd>
        </div>
        <div className="flex justify-between">
          <dt>Ship Date</dt>
          <dd className="font-medium text-gray-900">{shipment.shipDate}</dd>
        </div>
        {shipment.poNumber && (
          <div className="flex justify-between">
            <dt>PO</dt>
            <dd className="font-medium text-gray-900">{shipment.poNumber}</dd>
          </div>
        )}
        {shipment.tracking && (
          <div className="flex justify-between text-blue-700">
            <dt>Tracking</dt>
            <dd className="font-medium">{shipment.tracking}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function ProcessStep({ step }: { step: ProcessStep }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1.5 h-2 w-2 rounded-full bg-purple-600" />
      <div>
        <p className="text-sm font-medium text-gray-900">{step.step}</p>
        <p className="text-xs text-gray-500">{step.timestamp}</p>
        <p className="text-xs text-gray-600">By: {step.operator}</p>
        {step.equipment && (
          <p className="text-xs text-gray-600">Equipment: {step.equipment}</p>
        )}
        {step.parameters && (
          <div className="mt-1 text-[11px] text-gray-500">
            {Object.entries(step.parameters).map(([key, value]) => (
              <span key={key} className="mr-2">
                {key}: <span className="font-medium text-gray-700">{value}</span>
              </span>
            ))}
          </div>
        )}
        {step.approval && (
          <p className="text-xs text-green-700">Approval: {step.approval}</p>
        )}
      </div>
    </div>
  );
}

function GenealogyTree({ batch }: { batch: BatchData }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[960px] space-y-6 rounded-lg border border-dashed border-gray-200 p-4">
        <div className="flex items-center justify-center gap-8">
          <div className="space-y-2">
            {batch.ingredients.map((ingredient) => (
              <div key={ingredient.id} className="rounded bg-gray-100 px-3 py-2 text-xs font-medium">
                {ingredient.name}
              </div>
            ))}
          </div>
          <ArrowRight className="h-6 w-6 text-gray-300" />
          <div className="rounded-lg border-2 border-purple-500 bg-purple-50 px-4 py-3 text-center">
            <p className="text-sm font-bold text-purple-900">{batch.id}</p>
            <p className="text-xs text-purple-700">{batch.product}</p>
          </div>
          <ArrowRight className="h-6 w-6 text-gray-300" />
          <div className="space-y-2">
            {batch.shipments.map((shipment) => (
              <div key={shipment.id} className="rounded bg-blue-100 px-3 py-2 text-xs font-medium">
                {shipment.customer}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Certificates & QA docs linked to inbound lots
          </div>
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4" /> Shipments synced to TMS & customer ASN records
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Batch lifecycle spans {batch.processSteps.length} process steps
          </div>
        </div>
      </div>
    </div>
  );
}
