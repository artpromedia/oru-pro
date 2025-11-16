"use client";

import { useMemo, useState } from "react";
import { Activity, Cpu, GitBranch, Layers, Target, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type TransactionKey =
  | "cnc_machining"
  | "additive_manufacturing"
  | "quality_inspection"
  | "assembly_line"
  | "maintenance"
  | "tooling";

type TransactionConfig<TWorkflow extends WorkflowVariant> = {
  name: string;
  icon: LucideIcon;
  precision?: boolean;
  aiDriven?: boolean;
  workflows: TWorkflow[];
};

type CNCMachiningWorkflow = {
  id: string;
  type: string;
  part: string;
  material: string;
  drawing: string;
  operation: {
    machine: string;
    program: string;
    tools: Array<{ position: string; type: string; life: string; rpm: number; feed: number }>;
    coolant: { type: string; concentration: string; temperature: string };
    fixtures: { id: string; qualification: string };
  };
  dimensions: {
    critical: Array<{ feature: string; nominal: string; tolerance: string; actual: string; cpk: number }>;
    cmm: { program: string; probe: string; points: number; deviations: string[] };
  };
  quality: {
    firstArticle: string;
    inProcess: { interval: string; lastCheck: string };
    surfaceFinish: { required: string; achieved: string };
    visualInspection: string;
  };
};

type AdditiveWorkflow = {
  id: string;
  type: string;
  technology: string;
  part: string;
  material: {
    type: string;
    batch: string;
    particleSize: string;
    flowability: string;
    oxygen: string;
  };
  buildParameters: {
    machine: string;
    laserPower: string;
    scanSpeed: string;
    layerThickness: string;
    hatchDistance: string;
    buildPlatform: string;
    atmosphere: string;
  };
  buildProgress: {
    totalLayers: number;
    completedLayers: number;
    estimatedTime: string;
    remainingTime: string;
    recoaterIssues: number;
  };
  postProcessing: Array<{ step: string; status: string; params?: string; tolerance?: string; type?: string }>;
};

type QualityInspectionWorkflow = {
  id: string;
  type: string;
  part: string;
  batch: string;
  quantity: number;
  sampling: string;
  measurements: {
    cmm: {
      machine: string;
      program: string;
      datums: string[];
      features: Array<{ type: string; nominal: string; measured: string; deviation: string }>;
    };
    visual: {
      inspector: string;
      defects: string[];
      photos: string[];
    };
    hardness: {
      method: string;
      specification: string;
      results: number[];
      average: number;
    };
  };
  statistics: {
    cp: number;
    cpk: number;
    ppk: number;
    defectRate: string;
  };
};

type AssemblyWorkflow = {
  id: string;
  type: string;
  product: string;
  workOrder: string;
  quantity: number;
  stations: Array<
    | {
        id: string;
        name: string;
        operator: string;
        components: number;
        placementRate: string;
        defects: number;
        yield: string;
      }
    | {
        id: string;
        name: string;
        operator: string;
        profile: string;
        peakTemp: string;
        timeAboveLiquidus: string;
      }
    | {
        id: string;
        name: string;
        operator: string;
        defectsFound: number;
        falsePositives: number;
        escapes: number;
      }
    | {
        id: string;
        name: string;
        operator: string;
        testPoints: number;
        passed: number;
        failed: number;
        yield: string;
      }
  >;
  traceability: {
    serialNumbers: [string, string, string];
    components: Record<string, { vendor: string; lot: string; dateCode: string }>;
  };
};

type MaintenanceWorkflow = {
  id: string;
  type: string;
  equipment: string;
  monitoring: {
    sensors: Array<{ type: string; location: string; value: string; threshold: string }>;
    fft: { dominant: string; harmonics: string[]; indication: string };
    trend: { period: string; pattern: string; projection: string };
  };
  recommendations: {
    immediate: string[];
    scheduled: string[];
    spares: Array<{ part: string; quantity: string | number; leadTime: string }>;
  };
  history: Array<{ date: string; action: string; runtime: string }>;
};

type ToolingWorkflow = {
  id: string;
  type: string;
  operation: string;
  tool: {
    id: string;
    type: string;
    diameter: string;
    flutes: number;
    coating: string;
    vendor: string;
    cost: string;
  };
  usage: {
    totalLife: string;
    used: string;
    remaining: string;
    partsProduced: number;
    targetParts: number;
  };
  conditions: {
    material: string;
    speed: string;
    feed: string;
    doc: string;
    woc: string;
  };
  monitoring: {
    spindleLoad: { current: string; limit: string };
    vibration: { current: string; limit: string };
    powerConsumption: { current: string; baseline: string };
    surfaceFinish: { current: string; limit: string };
  };
  prediction: {
    remainingLife: string;
    confidence: string;
    recommendation: string;
  };
};

type WorkflowVariant =
  | CNCMachiningWorkflow
  | AdditiveWorkflow
  | QualityInspectionWorkflow
  | AssemblyWorkflow
  | MaintenanceWorkflow
  | ToolingWorkflow;

const transactionTypes: Record<TransactionKey, TransactionConfig<WorkflowVariant>> = {
  cnc_machining: {
    name: "CNC Machining Operation",
    icon: Cpu,
    precision: true,
    workflows: [
      {
        id: "CNC-MF-001",
        type: "5axis_milling",
        part: "Aerospace Turbine Blade",
        material: "Titanium Ti-6Al-4V",
        drawing: "DWG-2025-1115 Rev C",
        operation: {
          machine: "5-Axis Mill DMG MORI",
          program: "PRG-BLADE-001.nc",
          tools: [
            { position: "T1", type: "End Mill 10mm", life: "87%", rpm: 8000, feed: 450 },
            { position: "T2", type: "Ball Mill 6mm", life: "92%", rpm: 12000, feed: 300 },
            { position: "T3", type: "Drill 8mm", life: "45%", rpm: 3000, feed: 150 },
          ],
          coolant: { type: "Flood", concentration: "7%", temperature: "22°C" },
          fixtures: { id: "FXT-2025-001", qualification: "Valid until 2025-12-01" },
        },
        dimensions: {
          critical: [
            { feature: "Blade Root Diameter", nominal: "25.000mm", tolerance: "±0.010mm", actual: "25.002mm", cpk: 1.67 },
            { feature: "Airfoil Thickness", nominal: "2.500mm", tolerance: "±0.015mm", actual: "2.498mm", cpk: 1.72 },
            { feature: "Leading Edge Radius", nominal: "0.500mm", tolerance: "±0.005mm", actual: "0.501mm", cpk: 1.55 },
          ],
          cmm: {
            program: "CMM-BLADE-001",
            probe: "Renishaw TP20",
            points: 250,
            deviations: [],
          },
        },
        quality: {
          firstArticle: "Approved",
          inProcess: { interval: "Every 5 pieces", lastCheck: "Piece #45" },
          surfaceFinish: { required: "Ra 0.8μm", achieved: "Ra 0.6μm" },
          visualInspection: "No defects",
        },
      },
    ],
  },
  additive_manufacturing: {
    name: "3D Printing / Additive",
    icon: Layers,
    workflows: [
      {
        id: "ADD-MF-001",
        type: "metal_3d_printing",
        technology: "DMLS (Direct Metal Laser Sintering)",
        part: "Medical Implant - Hip Joint",
        material: {
          type: "Ti-6Al-4V Powder",
          batch: "PWD-2025-1115",
          particleSize: "15-45μm",
          flowability: "18.5 s/50g",
          oxygen: "0.12%",
        },
        buildParameters: {
          machine: "EOS M290",
          laserPower: "285W",
          scanSpeed: "1200mm/s",
          layerThickness: "30μm",
          hatchDistance: "0.11mm",
          buildPlatform: "35°C",
          atmosphere: "Argon, O2 < 0.1%",
        },
        buildProgress: {
          totalLayers: 2847,
          completedLayers: 1923,
          estimatedTime: "18h 30min",
          remainingTime: "6h 45min",
          recoaterIssues: 0,
        },
        postProcessing: [
          { step: "Support Removal", status: "Pending" },
          { step: "Heat Treatment", params: "800°C for 2hrs", status: "Pending" },
          { step: "HIP", params: "920°C, 100MPa, 2hrs", status: "Pending" },
          { step: "Machining", tolerance: "±0.05mm", status: "Pending" },
          { step: "Surface Treatment", type: "Bead Blasting", status: "Pending" },
        ],
      },
    ],
  },
  quality_inspection: {
    name: "Quality Control & Inspection",
    icon: Target,
    workflows: [
      {
        id: "QCI-MF-001",
        type: "coordinate_measuring",
        part: "Engine Block",
        batch: "EB-2025-1115",
        quantity: 50,
        sampling: "AQL 2.5, Level II",
        measurements: {
          cmm: {
            machine: "Zeiss CONTURA",
            program: "EB-INSPECT-001",
            datums: ["A: Top Surface", "B: Front Face", "C: Left Side"],
            features: [
              { type: "Bore", nominal: "85.000mm", measured: "85.003mm", deviation: "+0.003mm" },
              { type: "Position", nominal: "0.000mm", measured: "0.012mm", deviation: "0.012mm" },
              { type: "Perpendicularity", nominal: "0.000mm", measured: "0.008mm", deviation: "0.008mm" },
            ],
          },
          visual: {
            inspector: "QC Tech #3",
            defects: ["Minor tool mark on non-critical surface"],
            photos: ["IMG_2025_1115_001.jpg"],
          },
          hardness: {
            method: "Rockwell C",
            specification: "28-32 HRC",
            results: [29.5, 30.2, 30.8, 29.9],
            average: 30.1,
          },
        },
        statistics: {
          cp: 1.45,
          cpk: 1.38,
          ppk: 1.35,
          defectRate: "0.2%",
        },
      },
    ],
  },
  assembly_line: {
    name: "Assembly Line Operation",
    icon: GitBranch,
    workflows: [
      {
        id: "ASM-MF-001",
        type: "electronic_assembly",
        product: "Control Module PCB",
        workOrder: "WO-2025-1115",
        quantity: 500,
        stations: [
          {
            id: "ST-01",
            name: "SMT Placement",
            operator: "Auto",
            components: 1247,
            placementRate: "45000 cph",
            defects: 2,
            yield: "99.84%",
          },
          {
            id: "ST-02",
            name: "Reflow Soldering",
            operator: "Auto",
            profile: "Lead-Free SAC305",
            peakTemp: "245°C",
            timeAboveLiquidus: "65s",
          },
          {
            id: "ST-03",
            name: "AOI Inspection",
            operator: "Auto",
            defectsFound: 3,
            falsePositives: 1,
            escapes: 0,
          },
          {
            id: "ST-04",
            name: "Functional Test",
            operator: "Manual",
            testPoints: 127,
            passed: 497,
            failed: 3,
            yield: "99.4%",
          },
        ],
        traceability: {
          serialNumbers: ["SN-2025111500001", "to", "SN-2025111500500"],
          components: {
            microprocessor: { vendor: "STM", lot: "STM2025A", dateCode: "2545" },
            memory: { vendor: "Samsung", lot: "SM2025B", dateCode: "2544" },
          },
        },
      },
    ],
  },
  maintenance: {
    name: "Predictive Maintenance",
    icon: Wrench,
    aiDriven: true,
    workflows: [
      {
        id: "MNT-MF-001",
        type: "vibration_analysis",
        equipment: "CNC Spindle #3",
        monitoring: {
          sensors: [
            { type: "Accelerometer", location: "Front Bearing", value: "2.3 mm/s", threshold: "4.5 mm/s" },
            { type: "Accelerometer", location: "Rear Bearing", value: "1.8 mm/s", threshold: "4.5 mm/s" },
            { type: "Temperature", location: "Motor", value: "65°C", threshold: "80°C" },
            { type: "Current", location: "Drive", value: "45A", threshold: "60A" },
          ],
          fft: {
            dominant: "1X RPM",
            harmonics: ["2X", "3X"],
            indication: "Slight imbalance",
          },
          trend: {
            period: "30 days",
            pattern: "Gradual increase",
            projection: "Service needed in 15 days",
          },
        },
        recommendations: {
          immediate: [],
          scheduled: ["Balance spindle", "Replace front bearing"],
          spares: [
            { part: "Bearing 7209", quantity: 2, leadTime: "3 days" },
            { part: "Balance weights", quantity: "Set", leadTime: "In stock" },
          ],
        },
        history: [
          { date: "2025-08-15", action: "Bearing replaced", runtime: "2,847 hrs" },
          { date: "2025-05-20", action: "Spindle balanced", runtime: "1,923 hrs" },
        ],
      },
    ],
  },
  tooling: {
    name: "Tool Life Management",
    icon: Wrench,
    workflows: [
      {
        id: "TLM-MF-001",
        type: "cutting_tool_monitoring",
        operation: "Titanium Roughing",
        tool: {
          id: "T-2025-1115-001",
          type: "Carbide End Mill",
          diameter: "16mm",
          flutes: 4,
          coating: "AlTiN",
          vendor: "Sandvik",
          cost: "$285",
        },
        usage: {
          totalLife: "180 minutes",
          used: "157 minutes",
          remaining: "23 minutes",
          partsProduced: 47,
          targetParts: 54,
        },
        conditions: {
          material: "Ti-6Al-4V",
          speed: "150 m/min",
          feed: "0.15 mm/tooth",
          doc: "1.5mm",
          woc: "8mm",
        },
        monitoring: {
          spindleLoad: { current: "78%", limit: "85%" },
          vibration: { current: "3.2 mm/s", limit: "4.5 mm/s" },
          powerConsumption: { current: "12.5 kW", baseline: "10.2 kW" },
          surfaceFinish: { current: "Ra 1.2μm", limit: "Ra 1.6μm" },
        },
        prediction: {
          remainingLife: "23 minutes",
          confidence: "92%",
          recommendation: "Schedule tool change after current part",
        },
      },
    ],
  },
};

export default function ManufacturingTransactions() {
  const [activeTransaction, setActiveTransaction] = useState<TransactionKey>("cnc_machining");
  const transactionEntries = useMemo(() => Object.entries(transactionTypes) as Array<[TransactionKey, TransactionConfig<WorkflowVariant>]>, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Prompt 3 · Manufacturing Ops</p>
          <h1 className="text-3xl font-bold text-gray-900">Manufacturing Transactions</h1>
          <p className="text-sm text-gray-500">Precision manufacturing and Industry 4.0 workflows</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
          <Activity className="h-4 w-4" /> Real-time Monitoring Active
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {transactionEntries.map(([key, config]) => {
          const Icon = config.icon;
          const isActive = activeTransaction === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTransaction(key)}
              className={`rounded-xl border-2 p-4 text-left transition ${
                isActive ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <Icon
                className={`mb-2 h-6 w-6 ${
                  config.precision ? "text-purple-500" : config.aiDriven ? "text-emerald-500" : "text-gray-600"
                }`}
              />
              <p className="text-xs font-semibold text-gray-900">{config.name}</p>
            </button>
          );
        })}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <ManufacturingWorkflow type={activeTransaction} data={transactionTypes[activeTransaction]} />
      </section>
    </div>
  );
}

function ManufacturingWorkflow({ type, data }: { type: TransactionKey; data: TransactionConfig<WorkflowVariant> }) {
  const workflow = data.workflows[0];

  switch (type) {
    case "cnc_machining":
      return <CNCMachiningWorkflowView workflow={workflow as CNCMachiningWorkflow} />;
    case "additive_manufacturing":
      return <AdditiveWorkflowView workflow={workflow as AdditiveWorkflow} />;
    case "quality_inspection":
      return <QualityInspectionWorkflowView workflow={workflow as QualityInspectionWorkflow} />;
    case "assembly_line":
      return <AssemblyWorkflowView workflow={workflow as AssemblyWorkflow} />;
    case "maintenance":
      return <MaintenanceWorkflowView workflow={workflow as MaintenanceWorkflow} />;
    case "tooling":
      return <ToolLifeWorkflowView workflow={workflow as ToolingWorkflow} />;
    default:
      return null;
  }
}

function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3 text-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-lg font-semibold text-gray-900 ${accent ?? ""}`}>{value}</p>
    </div>
  );
}

function CNCMachiningWorkflowView({ workflow }: { workflow: CNCMachiningWorkflow }) {
  const deviation = (actual: string, nominal: string) => {
    const actualValue = parseFloat(actual);
    const nominalValue = parseFloat(nominal);
    if (Number.isNaN(actualValue) || Number.isNaN(nominalValue)) return "—";
    const diff = actualValue - nominalValue;
    return `${diff.toFixed(3)}mm`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900">Part Details</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Part</span><span className="font-semibold">{workflow.part}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Material</span><span className="font-semibold">{workflow.material}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Drawing</span><span className="text-xs font-semibold">{workflow.drawing}</span></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900">Machine Status</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Machine</span><span className="text-xs font-semibold">{workflow.operation.machine}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Program</span><span className="font-semibold">{workflow.operation.program}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Coolant</span><span className="font-semibold">{workflow.operation.coolant.type}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Fixture</span><span className="text-xs font-semibold">{workflow.operation.fixtures.id}</span></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900">Quality Status</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">First Article</span><span className="font-semibold text-green-600">{workflow.quality.firstArticle}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Surface Finish</span><span className="font-semibold">{workflow.quality.surfaceFinish.achieved}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Visual</span><span className="font-semibold text-green-600">{workflow.quality.visualInspection}</span></div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Critical Dimensions</h3>
          <span className="text-xs text-gray-500">CMM program {workflow.dimensions.cmm.program}</span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Feature</th>
                <th className="px-3 py-2 text-right">Nominal</th>
                <th className="px-3 py-2 text-right">Tolerance</th>
                <th className="px-3 py-2 text-right">Actual</th>
                <th className="px-3 py-2 text-right">Deviation</th>
                <th className="px-3 py-2 text-right">Cpk</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {workflow.dimensions.critical.map((dim) => (
                <tr key={dim.feature} className="border-t">
                  <td className="px-3 py-2">{dim.feature}</td>
                  <td className="px-3 py-2 text-right">{dim.nominal}</td>
                  <td className="px-3 py-2 text-right">{dim.tolerance}</td>
                  <td className="px-3 py-2 text-right font-semibold">{dim.actual}</td>
                  <td className="px-3 py-2 text-right">{deviation(dim.actual, dim.nominal)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{dim.cpk}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Pass</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-medium text-gray-900">Tool Status</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {workflow.operation.tools.map((tool) => {
            const lifeValue = parseInt(tool.life, 10);
            const lifeColor = lifeValue > 80 ? "text-emerald-600" : lifeValue > 50 ? "text-amber-600" : "text-red-600";
            return (
              <div key={tool.position} className="rounded-xl border border-gray-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{tool.position}</span>
                  <span className={lifeColor}>{tool.life}</span>
                </div>
                <p className="text-gray-600">{tool.type}</p>
                <p className="text-xs text-gray-500">{tool.rpm} RPM · {tool.feed} mm/min</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">Continue Production</button>
        <button className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">Pause for Inspection</button>
        <button className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">Adjust Parameters</button>
        <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Export Report</button>
      </div>
    </div>
  );
}

function AdditiveWorkflowView({ workflow }: { workflow: AdditiveWorkflow }) {
  const progress = Math.round((workflow.buildProgress.completedLayers / workflow.buildProgress.totalLayers) * 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatTile label="Technology" value={workflow.technology} />
        <StatTile label="Material Batch" value={workflow.material.batch} />
        <StatTile label="Layers Complete" value={`${workflow.buildProgress.completedLayers}/${workflow.buildProgress.totalLayers}`} />
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900">Build Parameters</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
          <StatTile label="Machine" value={workflow.buildParameters.machine} />
          <StatTile label="Laser Power" value={workflow.buildParameters.laserPower} />
          <StatTile label="Layer Thickness" value={workflow.buildParameters.layerThickness} />
          <StatTile label="Scan Speed" value={workflow.buildParameters.scanSpeed} />
          <StatTile label="Platform" value={workflow.buildParameters.buildPlatform} />
          <StatTile label="Atmosphere" value={workflow.buildParameters.atmosphere} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900">Build Progress</h3>
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Overall Progress</p>
            <div className="h-2 rounded-full bg-gray-200">
              <div className="h-2 rounded-full bg-purple-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-500">{progress}% complete · Recoater issues {workflow.buildProgress.recoaterIssues}</p>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Est. Time" value={workflow.buildProgress.estimatedTime} />
              <StatTile label="Remaining" value={workflow.buildProgress.remainingTime} />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900">Post Processing</h3>
          <div className="mt-3 space-y-3 text-sm">
            {workflow.postProcessing.map((step) => (
              <div key={step.step} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{step.step}</p>
                  <p className="text-xs text-gray-500">{step.params ?? step.tolerance ?? step.type ?? "Pending"}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{step.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QualityInspectionWorkflowView({ workflow }: { workflow: QualityInspectionWorkflow }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatTile label="Batch" value={workflow.batch} />
        <StatTile label="Quantity" value={workflow.quantity} />
        <StatTile label="Sampling" value={workflow.sampling} />
        <StatTile label="Defect Rate" value={workflow.statistics.defectRate} />
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900">CMM Measurements</h3>
        <div className="mt-3 space-y-2 text-sm">
          <p className="text-xs text-gray-500">{workflow.measurements.cmm.machine} · Program {workflow.measurements.cmm.program}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Feature</th>
                  <th className="px-3 py-2 text-right">Nominal</th>
                  <th className="px-3 py-2 text-right">Measured</th>
                  <th className="px-3 py-2 text-right">Deviation</th>
                </tr>
              </thead>
              <tbody>
                {workflow.measurements.cmm.features.map((feature) => (
                  <tr key={feature.type} className="border-t">
                    <td className="px-3 py-2">{feature.type}</td>
                    <td className="px-3 py-2 text-right">{feature.nominal}</td>
                    <td className="px-3 py-2 text-right">{feature.measured}</td>
                    <td className="px-3 py-2 text-right">{feature.deviation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900">Visual Inspection</h3>
          <p className="text-sm text-gray-500">Inspector {workflow.measurements.visual.inspector}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">
            {workflow.measurements.visual.defects.map((defect) => (
              <li key={defect}>{defect}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900">Hardness Results</h3>
          <p className="text-sm text-gray-500">{workflow.measurements.hardness.method} · Spec {workflow.measurements.hardness.specification}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {workflow.measurements.hardness.results.map((result, index) => (
              <span key={index} className="rounded-full bg-gray-100 px-3 py-1">{result} HRC</span>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">Average {workflow.measurements.hardness.average} HRC</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900">Process Capability</h3>
          <div className="mt-3 space-y-2">
            <StatTile label="Cp" value={workflow.statistics.cp} />
            <StatTile label="Cpk" value={workflow.statistics.cpk} />
            <StatTile label="Ppk" value={workflow.statistics.ppk} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AssemblyWorkflowView({ workflow }: { workflow: AssemblyWorkflow }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatTile label="Work Order" value={workflow.workOrder} />
        <StatTile label="Quantity" value={workflow.quantity} />
        <StatTile label="Product" value={workflow.product} />
      </div>

      <div>
        <h3 className="mb-3 font-medium text-gray-900">Stations</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {workflow.stations.map((station) => (
            <div key={station.id} className="rounded-xl border border-gray-200 p-4 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{station.name}</p>
                  <p className="text-xs text-gray-500">Operator {station.operator}</p>
                </div>
                <span className="text-xs text-gray-500">{station.id}</span>
              </div>
              {"components" in station && (
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <dt>Components</dt>
                    <dd className="font-semibold text-gray-900">{station.components}</dd>
                  </div>
                  <div>
                    <dt>Placement Rate</dt>
                    <dd className="font-semibold text-gray-900">{station.placementRate}</dd>
                  </div>
                  <div>
                    <dt>Defects</dt>
                    <dd className="font-semibold text-gray-900">{station.defects}</dd>
                  </div>
                  <div>
                    <dt>Yield</dt>
                    <dd className="font-semibold text-gray-900">{station.yield}</dd>
                  </div>
                </dl>
              )}
              {"profile" in station && (
                <div className="mt-3 space-y-1 text-xs text-gray-600">
                  <p>Profile: <span className="font-semibold text-gray-900">{station.profile}</span></p>
                  <p>Peak Temp: <span className="font-semibold text-gray-900">{station.peakTemp}</span></p>
                  <p>TAL: <span className="font-semibold text-gray-900">{station.timeAboveLiquidus}</span></p>
                </div>
              )}
              {"defectsFound" in station && (
                <div className="mt-3 space-y-1 text-xs text-gray-600">
                  <p>Defects Found: <span className="font-semibold text-gray-900">{station.defectsFound}</span></p>
                  <p>False Positives: <span className="font-semibold text-gray-900">{station.falsePositives}</span></p>
                  <p>Escapes: <span className="font-semibold text-gray-900">{station.escapes}</span></p>
                </div>
              )}
              {"testPoints" in station && (
                <div className="mt-3 space-y-1 text-xs text-gray-600">
                  <p>Test Points: <span className="font-semibold text-gray-900">{station.testPoints}</span></p>
                  <p>Passed: <span className="font-semibold text-gray-900">{station.passed}</span></p>
                  <p>Failed: <span className="font-semibold text-gray-900">{station.failed}</span></p>
                  <p>Yield: <span className="font-semibold text-gray-900">{station.yield}</span></p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900">Traceability</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">Serial Range</p>
            <p className="text-sm font-semibold text-gray-900">{workflow.traceability.serialNumbers.join(" ")}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Critical Components</p>
            <div className="mt-2 space-y-1 text-sm text-gray-700">
              {Object.entries(workflow.traceability.components).map(([component, meta]) => (
                <p key={component}>
                  <span className="font-semibold text-gray-900">{component}</span>: {meta.vendor} · Lot {meta.lot} · DC {meta.dateCode}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MaintenanceWorkflowView({ workflow }: { workflow: MaintenanceWorkflow }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatTile label="Equipment" value={workflow.equipment} />
        <StatTile label="Dominant FFT" value={workflow.monitoring.fft.dominant} />
        <StatTile label="Projection" value={workflow.monitoring.trend.projection} />
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900">Sensor Readings</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {workflow.monitoring.sensors.map((sensor) => (
            <div key={`${sensor.type}-${sensor.location}`} className="rounded-lg border border-gray-100 p-3 text-sm">
              <p className="font-semibold text-gray-900">{sensor.type}</p>
              <p className="text-xs text-gray-500">{sensor.location}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-gray-600">Value</span>
                <span className="font-semibold">{sensor.value}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Threshold</span>
                <span>{sensor.threshold}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900">Recommendations</h3>
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Scheduled</p>
            <ul className="list-disc space-y-1 pl-5 text-gray-700">
              {workflow.recommendations.scheduled.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="text-xs uppercase tracking-wide text-gray-500">Spares</p>
            <ul className="list-disc space-y-1 pl-5 text-gray-700">
              {workflow.recommendations.spares.map((spare) => (
                <li key={spare.part}>
                  {spare.part} · Qty {spare.quantity} · Lead {spare.leadTime}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900">Maintenance History</h3>
          <div className="mt-3 space-y-3 text-sm">
            {workflow.history.map((entry) => (
              <div key={entry.date} className="rounded-lg bg-gray-50 p-3">
                <p className="font-semibold text-gray-900">{entry.date}</p>
                <p className="text-gray-600">{entry.action}</p>
                <p className="text-xs text-gray-500">Runtime {entry.runtime}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolLifeWorkflowView({ workflow }: { workflow: ToolingWorkflow }) {
  const partsProgress = Math.round((workflow.usage.partsProduced / workflow.usage.targetParts) * 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatTile label="Tool" value={workflow.tool.id} />
        <StatTile label="Operation" value={workflow.operation} />
        <StatTile label="Remaining Life" value={workflow.usage.remaining} />
        <StatTile label="Confidence" value={workflow.prediction.confidence} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900">Usage & Production</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="h-2 rounded-full bg-gray-200">
              <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${partsProgress}%` }} />
            </div>
            <p className="text-xs text-gray-500">{workflow.usage.partsProduced}/{workflow.usage.targetParts} parts</p>
            <p className="text-xs text-gray-500">Used {workflow.usage.used} · Remaining {workflow.usage.remaining}</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900">Monitoring Signals</h3>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
            <StatTile label="Spindle Load" value={`${workflow.monitoring.spindleLoad.current} / ${workflow.monitoring.spindleLoad.limit}`} />
            <StatTile label="Vibration" value={`${workflow.monitoring.vibration.current} / ${workflow.monitoring.vibration.limit}`} />
            <StatTile label="Power" value={`${workflow.monitoring.powerConsumption.current} (baseline ${workflow.monitoring.powerConsumption.baseline})`} />
            <StatTile label="Surface Finish" value={`${workflow.monitoring.surfaceFinish.current} (limit ${workflow.monitoring.surfaceFinish.limit})`} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900">Prediction</h3>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-gray-100 px-3 py-1">Remaining {workflow.prediction.remainingLife}</span>
          <span className="rounded-full bg-gray-100 px-3 py-1">Confidence {workflow.prediction.confidence}</span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{workflow.prediction.recommendation}</span>
        </div>
      </div>
    </div>
  );
}
