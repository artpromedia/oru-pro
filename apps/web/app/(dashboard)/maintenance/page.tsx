"use client";

import { AlertTriangle, Calendar, Clock, Wrench } from "lucide-react";

interface MaintenanceRecord {
  date: string;
  type: string;
  duration: string;
  technician: string;
}

interface UpcomingTask {
  task: string;
  due: string;
  priority: "low" | "medium" | "high";
}

interface SparePart {
  part: string;
  stock: number;
  reorderPoint: number;
}

interface CurrentMaintenance {
  type: string;
  issue: string;
  startTime: string;
  expectedCompletion: string;
  technician: string;
  progress: number;
}

interface Equipment {
  id: string;
  name: string;
  type: string;
  status: "operational" | "maintenance" | "warning" | "down";
  health: number;
  lastMaintenance?: string;
  nextMaintenance?: string;
  runningHours?: number;
  mtbf?: number;
  mttr?: number;
  oee?: number;
  maintenanceHistory?: MaintenanceRecord[];
  upcomingTasks?: UpcomingTask[];
  spareParts?: SparePart[];
  currentMaintenance?: CurrentMaintenance;
  alerts?: string[];
}

interface MaintenanceScheduleItem {
  id: string;
  equipment: string;
  type: string;
  scheduled: string;
  duration: string;
  technician: string;
  status: "scheduled" | "in-progress" | "complete";
  prediction?: string;
}

const equipmentFleet: Equipment[] = [
  {
    id: "EQP-001",
    name: "Production Line 1",
    type: "Assembly Line",
    status: "operational",
    health: 92,
    lastMaintenance: "2025-10-15",
    nextMaintenance: "2025-12-15",
    runningHours: 1847,
    mtbf: 720,
    mttr: 2.5,
    oee: 82,
    maintenanceHistory: [
      { date: "2025-10-15", type: "Preventive", duration: "4 hrs", technician: "John Smith" },
      { date: "2025-08-15", type: "Preventive", duration: "3 hrs", technician: "Mike Wilson" },
    ],
    upcomingTasks: [
      { task: "Oil Change", due: "2025-11-20", priority: "medium" },
      { task: "Belt Inspection", due: "2025-11-25", priority: "low" },
    ],
    spareParts: [
      { part: "Drive Belt", stock: 2, reorderPoint: 1 },
      { part: "Filter", stock: 5, reorderPoint: 2 },
    ],
  },
  {
    id: "EQP-002",
    name: "Packaging Machine",
    type: "Packaging",
    status: "maintenance",
    health: 65,
    currentMaintenance: {
      type: "Corrective",
      issue: "Sensor malfunction",
      startTime: "2025-11-16 14:00",
      expectedCompletion: "2025-11-16 18:00",
      technician: "Sarah Chen",
      progress: 60,
    },
  },
  {
    id: "EQP-003",
    name: "Conveyor System",
    type: "Material Handling",
    status: "warning",
    health: 75,
    alerts: ["Unusual vibration detected", "Temperature above normal"],
  },
];

const maintenanceSchedule: MaintenanceScheduleItem[] = [
  {
    id: "MAINT-001",
    equipment: "Mixer Unit",
    type: "Preventive",
    scheduled: "2025-11-18 08:00",
    duration: "2 hrs",
    technician: "Team A",
    status: "scheduled",
  },
  {
    id: "MAINT-002",
    equipment: "Compressor",
    type: "Predictive",
    scheduled: "2025-11-19 10:00",
    duration: "1 hr",
    technician: "Team B",
    status: "scheduled",
    prediction: "Bearing wear detected - 85% confidence",
  },
];

const predictions = [
  {
    equipment: "Compressor Unit",
    issue: "Bearing failure",
    probability: 78,
    timeframe: "7-10 days",
    recommendation: "Schedule preventive maintenance",
  },
  {
    equipment: "Hydraulic Press",
    issue: "Seal degradation",
    probability: 65,
    timeframe: "2-3 weeks",
    recommendation: "Order replacement seals",
  },
];

const spareParts = [
  { name: "Drive Belt (Line-1)", stock: 1, status: "critical" },
  { name: "Oil Filter (Compressor)", stock: 2, status: "warning" },
  { name: "Bearing Set", stock: 5, status: "ok" },
] as const;

const maintenanceKPIs = [
  { label: "Equipment Uptime", value: "94.2%", trend: "+2.1%" },
  { label: "MTBF", value: "720 hrs", trend: "+12%" },
  { label: "MTTR", value: "2.5 hrs", trend: "-8%" },
  { label: "Maintenance Cost", value: "$45K", trend: "-5%" },
  { label: "Preventive Ratio", value: "78%", trend: "+5%" },
  { label: "Work Orders", value: "24", subvalue: "This month" },
];

export default function MaintenanceManagementPage() {
  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Maintenance</p>
          <h1 className="text-3xl font-bold text-gray-900">Equipment Maintenance Management</h1>
          <p className="text-gray-500">Predictive maintenance powered by AI</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50">
            <Calendar className="h-4 w-4" /> Schedule Maintenance
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700">
            <AlertTriangle className="h-4 w-4" /> Report Issue
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {maintenanceKPIs.map((kpi) => (
          <MaintenanceKPI key={kpi.label} {...kpi} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Equipment Status</h2>
          <div className="space-y-4">
            {equipmentFleet.map((equipment) => (
              <EquipmentCard key={equipment.id} equipment={equipment} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">AI Predictions</h3>
            <AIPredictions />
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Upcoming Maintenance</h3>
            <div className="space-y-3">
              {maintenanceSchedule.map((task) => (
                <MaintenanceTask key={task.id} task={task} />
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Spare Parts Status</h3>
            <SparePartsAlert />
          </div>
        </div>
      </section>
    </div>
  );
}

function EquipmentCard({ equipment }: { equipment: Equipment }) {
  const statusColors: Record<Equipment["status"], string> = {
    operational: "bg-green-100 text-green-700",
    maintenance: "bg-yellow-100 text-yellow-700",
    warning: "bg-orange-100 text-orange-700",
    down: "bg-red-100 text-red-700",
  };

  const healthColor = equipment.health >= 90 ? "text-green-600" : equipment.health >= 70 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <Wrench className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">{equipment.name}</h3>
            <span className={`rounded px-2 py-1 text-xs font-medium ${statusColors[equipment.status]}`}>
              {equipment.status}
            </span>
          </div>
          <dl className="grid grid-cols-4 gap-4 text-sm text-gray-600">
            <div>
              <dt className="text-xs text-gray-500">Health Score</dt>
              <dd className={`text-xl font-bold ${healthColor}`}>{equipment.health}%</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Running Hours</dt>
              <dd className="font-semibold text-gray-900">{equipment.runningHours ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">OEE</dt>
              <dd className="font-semibold text-gray-900">{equipment.oee ?? "—"}%</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Next Maintenance</dt>
              <dd className="font-semibold text-gray-900">{equipment.nextMaintenance ?? "TBD"}</dd>
            </div>
          </dl>

          {equipment.currentMaintenance && (
            <div className="mt-3 rounded-lg bg-yellow-50 p-3">
              <p className="text-sm font-medium text-yellow-900">Maintenance in Progress</p>
              <p className="text-xs text-yellow-700">{equipment.currentMaintenance.issue}</p>
              <div className="mt-2">
                <div className="mb-1 flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{equipment.currentMaintenance.progress}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-yellow-200">
                  <div
                    className="h-1.5 rounded-full bg-yellow-600"
                    style={{ width: `${equipment.currentMaintenance.progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {equipment.alerts && (
            <div className="mt-3 space-y-1 text-xs text-orange-600">
              {equipment.alerts.map((alert) => (
                <div key={alert} className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AIPredictions() {
  return (
    <div className="space-y-3">
      {predictions.map((pred) => (
        <div key={pred.equipment} className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-900">{pred.equipment}</p>
          <p className="text-xs text-red-700">{pred.issue}</p>
          <p className="text-xs text-red-600">
            Probability: {pred.probability}% • {pred.timeframe}
          </p>
          <div className="mt-2 rounded bg-white p-2 text-xs">
            <span className="font-medium">Action:</span> {pred.recommendation}
          </div>
        </div>
      ))}
    </div>
  );
}

function MaintenanceTask({ task }: { task: MaintenanceScheduleItem }) {
  return (
    <div className="flex items-center justify-between rounded border border-gray-200 p-3 text-sm">
      <div>
        <p className="font-semibold text-gray-900">{task.equipment}</p>
        <p className="text-xs text-gray-500">
          {task.type} • {task.duration}
        </p>
        <p className="text-xs text-gray-400">{task.scheduled}</p>
        {task.prediction && <p className="text-xs text-purple-700">{task.prediction}</p>}
      </div>
      <Clock className="h-4 w-4 text-gray-400" />
    </div>
  );
}

function SparePartsAlert() {
  return (
    <div className="space-y-2 text-sm">
      {spareParts.map((part) => (
        <div key={part.name} className="flex items-center justify-between">
          <span className="text-gray-700">{part.name}</span>
          <span
            className={`font-medium ${
              part.status === "critical"
                ? "text-red-600"
                : part.status === "warning"
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {part.stock} in stock
          </span>
        </div>
      ))}
    </div>
  );
}

function MaintenanceKPI({
  label,
  value,
  trend,
  subvalue,
}: {
  label: string;
  value: string;
  trend?: string;
  subvalue?: string;
}) {
  const trendColor = !trend
    ? "text-gray-500"
    : trend.startsWith("+")
    ? "text-green-600"
    : "text-red-600";

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {trend && <p className={`text-xs ${trendColor}`}>{trend}</p>}
      {subvalue && <p className="text-xs text-gray-500">{subvalue}</p>}
    </div>
  );
}
