"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Apple,
  Calendar,
  CheckCircle,
  Clock,
  Coffee,
  Droplets,
  Fish,
  Package,
  Shield,
  Thermometer,
  Wheat,
} from "lucide-react";

type TransactionKey =
  | "receiving"
  | "production"
  | "qualityControl"
  | "allergenManagement"
  | "shelfLife"
  | "recall";

type TemperatureSpec = {
  required: string;
  actual: string;
  status: string;
};

type MicroResult = {
  spec: string;
  result: string;
  status: string;
};

type SensoryResult = {
  score: number;
  max: number;
};

type AllergenTestResult = {
  detected: boolean;
  level: string;
};

type ProductionRecipeSpec = {
  required: string;
  allocated: string;
  temp?: string;
  viable?: string;
};

type ProductionProcessPhase = {
  temp?: string;
  time?: string;
  status?: string;
  ph?: string;
  currentPh?: string;
  targetPh?: string;
};

type DairyReceivingWorkflow = {
  id: string;
  type: "dairy_receiving";
  product: string;
  supplier: string;
  temperature: TemperatureSpec;
  microbiological: { required: string; actual: string; status: string };
  fatContent: { required: string; actual: string; status: string };
  quantity: string;
  batch: string;
  expiryDate: string;
  qualityScore: number;
  actions: string[];
};

type ProduceReceivingWorkflow = {
  id: string;
  type: "produce_receiving";
  product: string;
  supplier: string;
  temperature: TemperatureSpec;
  pesticides: { required: string; actual: string; status: string };
  freshness: { grade: string; score: number };
  quantity: string;
  harvestDate: string;
  shelfLife: string;
};

type ProductionWorkflow = {
  id: string;
  type: "batch_production";
  product: string;
  recipe: Record<string, ProductionRecipeSpec>;
  process: {
    pasteurization: ProductionProcessPhase;
    cooling: ProductionProcessPhase;
    inoculation: ProductionProcessPhase;
    fermentation: ProductionProcessPhase;
    cooling2: ProductionProcessPhase;
  };
  yield: { expected: string; current: string; efficiency: string };
  qualityChecks: Array<{ point: string; status: string }>;
};

type QualityReleaseWorkflowData = {
  id: string;
  type: "batch_release";
  batch: string;
  product: string;
  tests: {
    microbiological: Record<string, MicroResult>;
    chemical: Record<string, MicroResult>;
    sensory: Record<string, SensoryResult>;
  };
  decision: string;
  certificate: string;
};

type AllergenWorkflow = {
  id: string;
  type: "allergen_validation";
  product: string;
  declaredAllergens: string[];
  crossContamination: string[];
  tests: Record<string, AllergenTestResult>;
  labelCompliance: Record<string, string>;
  cleaningValidation: {
    lastCleaning: string;
    swabTest: string;
    nextRequired: string;
  };
};

type ShelfLifeCondition = {
  temp: string;
  humidity: string;
  timePoints: string[];
  results: Record<string, string[] | string>;
};

type ShelfLifeWorkflow = {
  id: string;
  type: "accelerated_stability";
  product: string;
  batch: string;
  conditions: ShelfLifeCondition[];
};

type RecallWorkflow = {
  id: string;
  type: "recall_execution";
  severity: string;
  product: string;
  issue: string;
  batches: string[];
  distribution: {
    totalUnits: number;
    shipped: number;
    inWarehouse: number;
    customers: number;
    regions: string[];
  };
  actions: {
    customerNotification: string;
    FDAReport: string;
    pressRelease: string;
    websiteNotice: string;
    recovered: number;
    destroyed: number;
    recoveryRate: string;
  };
  rootCause: string;
};

type WorkflowVariant =
  | DairyReceivingWorkflow
  | ProduceReceivingWorkflow
  | ProductionWorkflow
  | QualityReleaseWorkflowData
  | AllergenWorkflow
  | ShelfLifeWorkflow
  | RecallWorkflow;

type TransactionConfig<TWorkflow extends WorkflowVariant = WorkflowVariant> = {
  name: string;
  icon: typeof Package;
  critical?: boolean;
  workflows: TWorkflow[];
};

const transactionTypes: Record<TransactionKey, TransactionConfig> = {
  receiving: {
    name: "Goods Receiving with Temperature Control",
    icon: Thermometer,
    critical: true,
    workflows: [
      {
        id: "RCV-FB-001",
        type: "dairy_receiving",
        product: "Fresh Milk Delivery",
        supplier: "Green Valley Farms",
        temperature: { required: "2-4°C", actual: "3.2°C", status: "pass" },
        microbiological: { required: "<10 CFU", actual: "7 CFU", status: "pass" },
        fatContent: { required: "3.5%", actual: "3.48%", status: "pass" },
        quantity: "5000L",
        batch: "GVF-2025-1115",
        expiryDate: "2025-11-22",
        qualityScore: 98,
        actions: ["Accept", "Reject", "Hold for QA"],
      },
      {
        id: "RCV-FB-002",
        type: "produce_receiving",
        product: "Organic Vegetables",
        supplier: "Fresh Farms Co",
        temperature: { required: "8-12°C", actual: "10°C", status: "pass" },
        pesticides: { required: "None", actual: "Not Detected", status: "pass" },
        freshness: { grade: "A", score: 95 },
        quantity: "500kg",
        harvestDate: "2025-11-14",
        shelfLife: "7 days",
      },
    ],
  },
  production: {
    name: "Production Batch with Recipe Management",
    icon: Coffee,
    workflows: [
      {
        id: "PRD-FB-001",
        type: "batch_production",
        product: "Greek Yogurt 500g",
        recipe: {
          milk: { required: "2500L", allocated: "2500L", temp: "43°C" },
          culture: { required: "25kg", allocated: "25kg", viable: "10^9 CFU/g" },
          stabilizer: { required: "5kg", allocated: "5kg" },
        },
        process: {
          pasteurization: { temp: "85°C", time: "30min", status: "completed" },
          cooling: { temp: "43°C", time: "15min", status: "completed" },
          inoculation: { ph: "6.5", status: "in-progress" },
          fermentation: { time: "4-6hrs", currentPh: "4.8", targetPh: "4.6" },
          cooling2: { temp: "4°C", status: "pending" },
        },
        yield: { expected: "5000 units", current: "0", efficiency: "0%" },
        qualityChecks: [
          { point: "Pre-pasteurization", status: "passed" },
          { point: "Post-inoculation", status: "passed" },
          { point: "Mid-fermentation", status: "in-progress" },
        ],
      },
    ],
  },
  qualityControl: {
    name: "Quality Testing & Release",
    icon: Shield,
    workflows: [
      {
        id: "QC-FB-001",
        type: "batch_release",
        batch: "B-2025-1115-YOG",
        product: "Greek Yogurt",
        tests: {
          microbiological: {
            totalPlateCount: { spec: "<100 CFU/g", result: "45 CFU/g", status: "pass" },
            coliform: { spec: "<10 CFU/g", result: "Not Detected", status: "pass" },
            yeastMold: { spec: "<50 CFU/g", result: "12 CFU/g", status: "pass" },
            salmonella: { spec: "Absent/25g", result: "Absent", status: "pass" },
          },
          chemical: {
            ph: { spec: "4.4-4.8", result: "4.6", status: "pass" },
            protein: { spec: ">5%", result: "5.3%", status: "pass" },
            fat: { spec: "2-3%", result: "2.5%", status: "pass" },
          },
          sensory: {
            appearance: { score: 9, max: 10 },
            texture: { score: 9, max: 10 },
            taste: { score: 10, max: 10 },
            odor: { score: 9, max: 10 },
          },
        },
        decision: "PASS",
        certificate: "COA-2025-1115-3847",
      },
    ],
  },
  allergenManagement: {
    name: "Allergen Control & Labeling",
    icon: AlertTriangle,
    workflows: [
      {
        id: "ALG-FB-001",
        type: "allergen_validation",
        product: "Multi-Grain Bread",
        declaredAllergens: ["Wheat", "Soy", "Sesame"],
        crossContamination: ["Nuts", "Milk"],
        tests: {
          gluten: { detected: true, level: "20000 ppm" },
          soy: { detected: true, level: "500 ppm" },
          nuts: { detected: false, level: "<2 ppm" },
          milk: { detected: false, level: "<2 ppm" },
        },
        labelCompliance: {
          FDA: "Compliant",
          EU: "Compliant",
          Canada: "Review Required",
        },
        cleaningValidation: {
          lastCleaning: "2025-11-15 06:00",
          swabTest: "Negative",
          nextRequired: "2025-11-15 14:00",
        },
      },
    ],
  },
  shelfLife: {
    name: "Shelf Life & Stability Testing",
    icon: Clock,
    workflows: [
      {
        id: "SLF-FB-001",
        type: "accelerated_stability",
        product: "Organic Juice Blend",
        batch: "JCE-2025-1115",
        conditions: [
          {
            temp: "25°C",
            humidity: "60%",
            timePoints: ["0", "1M", "3M", "6M"],
            results: {
              vitaminC: ["100%", "95%", "88%", "pending"],
              color: ["L*45", "L*44", "L*43", "pending"],
              ph: ["3.8", "3.8", "3.7", "pending"],
              microbes: ["<10", "<10", "<10", "pending"],
            },
          },
          {
            temp: "40°C",
            humidity: "75%",
            timePoints: ["0", "2W", "1M", "2M"],
            results: {
              vitaminC: ["100%", "92%", "85%", "78%"],
              predicted: "8 months at 4°C",
            },
          },
        ],
      },
    ],
  },
  recall: {
    name: "Product Recall & Traceability",
    icon: AlertTriangle,
    critical: true,
    workflows: [
      {
        id: "RCL-FB-001",
        type: "recall_execution",
        severity: "Class II",
        product: "Chocolate Cookies 200g",
        issue: "Undeclared milk allergen",
        batches: ["CK-2025-1110", "CK-2025-1111"],
        distribution: {
          totalUnits: 10000,
          shipped: 8500,
          inWarehouse: 1500,
          customers: 45,
          regions: ["Midwest", "Northeast"],
        },
        actions: {
          customerNotification: "Sent",
          FDAReport: "Filed",
          pressRelease: "Published",
          websiteNotice: "Posted",
          recovered: 6200,
          destroyed: 1500,
          recoveryRate: "73%",
        },
        rootCause: "Ingredient supplier label change not communicated",
      },
    ],
  },
};

export default function FoodBeverageTransactions() {
  const [activeTransaction, setActiveTransaction] = useState<TransactionKey>("receiving");

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Food & Beverage Transactions</h1>
          <p className="text-sm text-gray-500">Industry-specific workflows and compliance</p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Object.entries(transactionTypes).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveTransaction(key as TransactionKey)}
              className={`rounded-xl border-2 p-4 text-left transition ${
                activeTransaction === key
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <Icon
                className={`mx-auto mb-2 h-6 w-6 ${config.critical ? "text-red-500" : "text-gray-600"}`}
              />
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
    case "receiving":
      return <DairyReceivingWorkflow data={data} />;
    case "production":
      return <ProductionBatchWorkflow data={data} />;
    case "qualityControl":
      return <QualityReleaseWorkflow data={data} />;
    case "allergenManagement":
      return <AllergenControlWorkflow data={data} />;
    case "shelfLife":
      return <ShelfLifeTestingWorkflow data={data} />;
    case "recall":
      return <RecallExecutionWorkflow data={data} />;
    default:
  return null;
  }
}

type WorkflowData = TransactionConfig;

function DataPoint({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function DairyReceivingWorkflow({ data }: { data: WorkflowData }) {
  const [milkDelivery, produceDelivery] = data.workflows as [DairyReceivingWorkflow, ProduceReceivingWorkflow];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Dairy Receiving with Cold Chain</h2>
          <p className="text-sm text-gray-500">Shipment ID {milkDelivery.batch}</p>
        </div>
        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">QA Cleared</span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="mb-3 font-medium text-gray-900">Temperature Control</h3>
          <DataPoint label="Required" value={milkDelivery.temperature.required} />
          <DataPoint label="Actual" value={milkDelivery.temperature.actual} />
          <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            <CheckCircle className="mr-1 inline h-4 w-4" /> Temperature Compliant
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="mb-3 font-medium text-gray-900">Microbiological</h3>
          <DataPoint label="Specification" value={milkDelivery.microbiological.required} />
          <DataPoint label="Result" value={milkDelivery.microbiological.actual} />
          <div className="mt-4">
            <p className="text-xs text-gray-500">Quality Score</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-green-500" style={{ width: `${milkDelivery.qualityScore}%` }} />
              </div>
              <span className="text-sm font-semibold">{milkDelivery.qualityScore}%</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="mb-3 font-medium text-gray-900">Batch Details</h3>
          <DataPoint label="Batch" value={milkDelivery.batch} />
          <DataPoint label="Quantity" value={milkDelivery.quantity} />
          <DataPoint label="Expiry" value={milkDelivery.expiryDate} />
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 p-4">
        <h3 className="font-medium text-gray-900">Produce Receiving Snapshot</h3>
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <DataPoint label="Product" value={produceDelivery.product} />
          <DataPoint label="Supplier" value={produceDelivery.supplier} />
          <DataPoint label="Temperature" value={`${produceDelivery.temperature.actual} (${produceDelivery.temperature.required})`} />
          <DataPoint label="Freshness" value={`${produceDelivery.freshness.grade} (${produceDelivery.freshness.score}%)`} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600">
          Accept & Move to Storage
        </button>
        <button className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-600">
          Hold for Additional QA
        </button>
        <button className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600">
          Reject Shipment
        </button>
        <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Print COA
        </button>
      </div>
    </div>
  );
}

function ProductionBatchWorkflow({ data }: { data: WorkflowData }) {
  const workflow = data.workflows[0] as ProductionWorkflow;
  const phases: Array<{ label: string; status: string; detail?: string }> = [
    {
      label: "Pasteurization",
      status: workflow.process.pasteurization.status ?? "pending",
      detail: workflow.process.pasteurization.temp,
    },
    {
      label: "Cooling",
      status: workflow.process.cooling.status ?? "pending",
      detail: workflow.process.cooling.temp,
    },
    {
      label: "Inoculation",
      status: workflow.process.inoculation.status ?? "pending",
      detail: `pH ${workflow.process.inoculation.ph ?? "—"}`,
    },
    {
      label: "Fermentation",
      status: `pH ${workflow.process.fermentation.currentPh ?? "—"}`,
      detail: `${workflow.process.fermentation.time ?? ""} (target ${workflow.process.fermentation.targetPh ?? "—"})`,
    },
    {
      label: "Cold Hold",
      status: workflow.process.cooling2.status ?? "pending",
      detail: workflow.process.cooling2.temp,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Recipe Execution</h2>
          <p className="text-sm text-gray-500">{workflow.product}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Batch {workflow.id}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(Object.entries(workflow.recipe) as Array<[string, ProductionRecipeSpec]>).map(([ingredient, spec]) => (
          <div key={ingredient} className="rounded-xl border border-gray-200 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 capitalize">
              <Package className="h-4 w-4 text-gray-400" /> {ingredient}
            </h3>
            <p className="mt-2 text-xs text-gray-500">Required</p>
            <p className="font-semibold text-gray-900">{spec.required}</p>
            <p className="mt-2 text-xs text-gray-500">Allocated</p>
            <p className="font-semibold text-gray-900">{spec.allocated}</p>
            {spec.temp && <p className="mt-2 text-xs text-gray-500">Temp: {spec.temp}</p>}
            {spec.viable && <p className="text-xs text-gray-500">Viable: {spec.viable}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {phases.map((phase) => {
          const stateColor = phase.status.toLowerCase().includes("completed")
            ? "text-green-600"
            : phase.status.toLowerCase().includes("pending")
              ? "text-gray-500"
              : "text-blue-600";

          return (
            <div key={phase.label} className="rounded-xl border border-gray-200 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">{phase.label}</p>
              <p className={`text-sm font-semibold ${stateColor}`}>{phase.status}</p>
              {phase.detail && <p className="text-xs text-gray-400">{phase.detail}</p>}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900">Quality Checkpoints</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          {workflow.qualityChecks.map((checkpoint: { point: string; status: string }) => (
            <span
              key={checkpoint.point}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                checkpoint.status === "passed" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {checkpoint.point} · {checkpoint.status}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function QualityReleaseWorkflow({ data }: { data: WorkflowData }) {
  const workflow = data.workflows[0] as QualityReleaseWorkflowData;

  const microTests = workflow.tests.microbiological;
  const chemicalTests = workflow.tests.chemical;
  const sensoryTests = workflow.tests.sensory;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Batch Release Decision</h2>
          <p className="text-sm text-gray-500">{workflow.product} · Batch {workflow.batch}</p>
        </div>
        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">{workflow.decision}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="mb-3 flex items-center gap-2 font-medium text-gray-900">
            <Droplets className="h-4 w-4 text-blue-500" /> Microbiological
          </h3>
          {Object.entries(microTests).map(([label, test]) => (
            <DataPoint key={label} label={label} value={`${test.result} (spec ${test.spec})`} />
          ))}
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="mb-3 flex items-center gap-2 font-medium text-gray-900">
            <Thermometer className="h-4 w-4 text-red-500" /> Chemical
          </h3>
          {Object.entries(chemicalTests).map(([label, test]) => (
            <DataPoint key={label} label={label.toUpperCase()} value={`${test.result} (spec ${test.spec})`} />
          ))}
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="mb-3 flex items-center gap-2 font-medium text-gray-900">
            <Apple className="h-4 w-4 text-orange-500" /> Sensory Panel
          </h3>
          {Object.entries(sensoryTests).map(([label, test]) => (
            <DataPoint key={label} label={label} value={`${test.score}/${test.max}`} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 p-4">
        <p className="text-sm text-gray-600">Certificate of Analysis</p>
        <p className="text-lg font-semibold text-gray-900">{workflow.certificate}</p>
      </div>
    </div>
  );
}

function AllergenControlWorkflow({ data }: { data: WorkflowData }) {
  const workflow = data.workflows[0] as AllergenWorkflow;

  const icons: Record<string, typeof Wheat> = {
    Wheat,
    Soy: Droplets,
    Sesame: AlertTriangle,
    Nuts: Fish,
    Milk: Thermometer,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Allergen Management</h2>
          <p className="text-sm text-gray-500">{workflow.product}</p>
        </div>
        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
          Validation {workflow.id}
        </span>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900">Declared Allergens</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {workflow.declaredAllergens.map((allergen: string) => {
            const Icon = icons[allergen] ?? AlertTriangle;
            return (
              <span key={allergen} className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs text-red-700">
                <Icon className="h-3 w-3" /> {allergen}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Test Results</h3>
          {Object.entries(workflow.tests).map(([name, payload]) => (
            <DataPoint key={name} label={name} value={`${payload.detected ? "Detected" : "Not Detected"} (${payload.level})`} />
          ))}
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Label Compliance</h3>
            {Object.entries(workflow.labelCompliance).map(([region, status]) => (
              <DataPoint key={region} label={region} value={status} />
            ))}
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Cleaning Validation</h3>
            <DataPoint label="Last Cleaning" value={workflow.cleaningValidation.lastCleaning} />
            <DataPoint label="Swab Test" value={workflow.cleaningValidation.swabTest} />
            <DataPoint label="Next Required" value={workflow.cleaningValidation.nextRequired} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ShelfLifeTestingWorkflow({ data }: { data: WorkflowData }) {
  const workflow = data.workflows[0] as ShelfLifeWorkflow;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Stability Program</h2>
          <p className="text-sm text-gray-500">{workflow.product} · Batch {workflow.batch}</p>
        </div>
        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
          Accelerated Study
        </span>
      </div>

      <div className="space-y-4">
  {workflow.conditions.map((condition, index) => (
          <div key={`${condition.temp}-${index}`} className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {condition.temp} · {condition.humidity}
                </p>
                <p className="text-xs text-gray-500">Time points: {condition.timePoints.join(", ")}</p>
              </div>
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
              {Object.entries(condition.results).map(([metric, values]) => (
                <div key={metric} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">{metric}</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {Array.isArray(values) ? values.join(" → ") : values}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecallExecutionWorkflow({ data }: { data: WorkflowData }) {
  const workflow = data.workflows[0] as RecallWorkflow;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Recall Command Center</h2>
          <p className="text-sm text-gray-500">{workflow.product} · Severity {workflow.severity}</p>
        </div>
        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Critical</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Distribution</h3>
          <DataPoint label="Total Units" value={workflow.distribution.totalUnits} />
          <DataPoint label="Shipped" value={workflow.distribution.shipped} />
          <DataPoint label="In Warehouse" value={workflow.distribution.inWarehouse} />
          <DataPoint label="Customers" value={workflow.distribution.customers} />
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
          <DataPoint label="Customer Notices" value={workflow.actions.customerNotification} />
          <DataPoint label="FDA Report" value={workflow.actions.FDAReport} />
          <DataPoint label="Press Release" value={workflow.actions.pressRelease} />
          <DataPoint label="Website" value={workflow.actions.websiteNotice} />
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Recovery Status</h3>
          <DataPoint label="Recovered" value={workflow.actions.recovered} />
          <DataPoint label="Destroyed" value={workflow.actions.destroyed} />
          <DataPoint label="Recovery Rate" value={workflow.actions.recoveryRate} />
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 p-4">
        <h3 className="text-sm font-semibold text-gray-900">Root Cause</h3>
        <p className="mt-2 text-sm text-gray-700">{workflow.rootCause}</p>
      </div>
    </div>
  );
}
