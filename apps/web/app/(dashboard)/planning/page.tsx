"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Cpu,
  Factory,
  Package,
  Pause,
  Play,
  Settings,
} from "lucide-react";

type Priority = "high" | "medium" | "low";

type OrderStatus = "scheduled" | "planned" | "running";

interface MaterialLine {
  id: string;
  required: number;
  available: number;
  status: "ok" | "warning";
}

interface ProductionOrder {
  id: string;
  product: string;
  quantity: number;
  unit: string;
  startDate: string;
  endDate: string;
  status: OrderStatus;
  resource: string;
  priority: Priority;
  completion: number;
  materials?: MaterialLine[];
}

interface ResourceSummary {
  id: string;
  name: string;
  capacity: number;
  utilization: number;
  status: "running" | "idle" | "maintenance";
  currentOrder: string | null;
  oee: number;
  maintenanceEnd?: string;
}

const productionOrders: ProductionOrder[] = [
  {
    id: "PRD-001",
    product: "Product A",
    quantity: 1000,
    unit: "units",
    startDate: "2025-11-17 06:00",
    endDate: "2025-11-17 14:00",
    status: "scheduled",
    resource: "Line-1",
    priority: "high",
    completion: 0,
    materials: [
      { id: "MAT-001", required: 500, available: 450, status: "warning" },
      { id: "MAT-002", required: 300, available: 320, status: "ok" },
    ],
  },
  {
    id: "PRD-002",
    product: "Product B",
    quantity: 500,
    unit: "units",
    startDate: "2025-11-17 14:00",
    endDate: "2025-11-17 22:00",
    status: "scheduled",
    resource: "Line-1",
    priority: "medium",
    completion: 0,
  },
  {
    id: "PRD-003",
    product: "Product C",
    quantity: 750,
    unit: "units",
    startDate: "2025-11-18 06:00",
    endDate: "2025-11-18 14:00",
    status: "planned",
    resource: "Line-2",
    priority: "low",
    completion: 0,
  },
];

const resources: ResourceSummary[] = [
  {
    id: "Line-1",
    name: "Production Line 1",
    capacity: 150,
    utilization: 78,
    status: "running",
    currentOrder: "PRD-001",
    oee: 82,
  },
  {
    id: "Line-2",
    name: "Production Line 2",
    capacity: 100,
    utilization: 65,
    status: "idle",
    currentOrder: null,
    oee: 78,
  },
  {
    id: "Line-3",
    name: "Production Line 3",
    capacity: 200,
    utilization: 92,
    status: "maintenance",
    currentOrder: null,
    oee: 0,
    maintenanceEnd: "2025-11-17 12:00",
  },
];

const kpiCards: {
  label: string;
  value: string;
  subvalue?: string;
  status?: "good" | "warning";
}[] = [
  { label: "Total Orders", value: "24", subvalue: "This week" },
  { label: "On-Time Delivery", value: "94%", subvalue: "+2% vs last week", status: "good" },
  { label: "Resource Utilization", value: "78%", subvalue: "3 lines active" },
  { label: "Material Availability", value: "92%", subvalue: "2 shortages", status: "warning" },
  { label: "Overall OEE", value: "80%", subvalue: "Target: 85%" },
];

const materialStatus = [
  { id: "MAT-001", name: "Raw Material A", available: 450, required: 500, unit: "kg" },
  { id: "MAT-002", name: "Raw Material B", available: 320, required: 300, unit: "kg" },
  { id: "MAT-003", name: "Component C", available: 100, required: 150, unit: "pcs" },
];

export default function ProductionPlanningPage() {
  const [currentWeek, setCurrentWeek] = useState("2025-W46");
  const [selectedResource, setSelectedResource] = useState<string>("all");

  const utilizationAverage = useMemo(
    () => Math.round(resources.reduce((sum, r) => sum + r.utilization, 0) / resources.length),
    []
  );

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Planning</p>
          <h1 className="text-3xl font-bold text-gray-900">Production Planning & Scheduling</h1>
          <p className="text-gray-500">
            Optimize production sequences, utilization ({utilizationAverage}%) and material readiness.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50">
            <Settings className="h-4 w-4" /> Constraints
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-purple-700">
            <Cpu className="h-4 w-4" /> AI Optimize
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-5">
        {kpiCards.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Resource Status</h2>
              <select
                value={selectedResource}
                onChange={(e) => setSelectedResource(e.target.value)}
                className="rounded border border-gray-200 px-3 py-1 text-sm"
              >
                <option value="all">All resources</option>
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              {resources
                .filter((resource) => selectedResource === "all" || resource.id === selectedResource)
                .map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Material Constraints</h2>
            <MaterialAvailability materials={materialStatus} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Production Schedule</h2>
                <p className="text-xs text-gray-500">Week {currentWeek.replace("2025-", "")} horizon</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentWeek("2025-W45")}>
                  <ChevronLeft className="h-5 w-5 text-gray-500" />
                </button>
                <span className="rounded bg-gray-100 px-3 py-1 text-sm font-medium">Week 46, 2025</span>
                <button onClick={() => setCurrentWeek("2025-W47")}>
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            <GanttChart orders={productionOrders} resources={resources} />
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Production Orders</h2>
              <span className="text-xs text-gray-500">Sequenced by priority</span>
            </div>
            <OrderQueue orders={productionOrders} />
          </div>
        </div>
      </section>
    </div>
  );
}

function ResourceCard({ resource }: { resource: ResourceSummary }) {
  const statusColors: Record<ResourceSummary["status"], string> = {
    running: "bg-green-100 text-green-700",
    idle: "bg-yellow-100 text-yellow-700",
    maintenance: "bg-red-100 text-red-700",
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Factory className="h-4 w-4 text-gray-500" />
          <p className="font-medium text-gray-900">{resource.name}</p>
        </div>
        <span className={`rounded px-2 py-1 text-xs font-medium ${statusColors[resource.status]}`}>
          {resource.status}
        </span>
      </div>
      <dl className="space-y-2 text-sm text-gray-600">
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span>Utilization</span>
            <span>{resource.utilization}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-purple-600"
              style={{ width: `${resource.utilization}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between">
          <span>Capacity</span>
          <span>{resource.capacity} units/hr</span>
        </div>
        <div className="flex justify-between">
          <span>OEE</span>
          <span className="font-semibold text-gray-900">{resource.oee}%</span>
        </div>
        {resource.currentOrder && (
          <div className="border-t pt-2 text-xs text-gray-500">Current: {resource.currentOrder}</div>
        )}
        {resource.maintenanceEnd && (
          <div className="text-xs text-red-500">
            Back online {resource.maintenanceEnd}
          </div>
        )}
      </dl>
    </div>
  );
}

function GanttChart({
  orders,
  resources,
}: {
  orders: ProductionOrder[];
  resources: ResourceSummary[];
}) {
  const timelineStart = new Date("2025-11-17T00:00:00").getTime();
  const timelineEnd = new Date("2025-11-21T23:59:59").getTime();
  const total = timelineEnd - timelineStart;

  const days = ["Mon 17", "Tue 18", "Wed 19", "Thu 20", "Fri 21"];

  const toPercent = (dateStr: string) => {
    const normalized = dateStr.replace(" ", "T");
    const diff = new Date(`${normalized}:00`).getTime() - timelineStart;
    return Math.max(0, Math.min(100, (diff / total) * 100));
  };

  const barWidth = (start: string, end: string) => {
    const startPct = toPercent(start);
    const endPct = toPercent(end);
    return Math.max(4, endPct - startPct);
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="flex border-b text-xs font-medium text-gray-500">
          <div className="w-32 px-2 py-2">Resource</div>
          {days.map((day) => (
            <div key={day} className="flex-1 border-l px-2 py-2 text-center">
              {day}
            </div>
          ))}
        </div>
        {resources.map((resource) => (
          <div key={resource.id} className="flex border-b">
            <div className="w-32 px-2 py-4 text-sm font-medium text-gray-900">
              {resource.name}
            </div>
            <div className="relative flex-1">
              {orders
                .filter((order) => order.resource === resource.id)
                .map((order) => (
                  <GanttBar
                    key={order.id}
                    order={order}
                    left={toPercent(order.startDate)}
                    width={barWidth(order.startDate, order.endDate)}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GanttBar({
  order,
  left,
  width,
}: {
  order: ProductionOrder;
  left: number;
  width: number;
}) {
  const priorityColors: Record<Priority, string> = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  };

  return (
    <div
      className={`absolute top-2 h-10 rounded-md px-3 py-2 text-xs font-semibold text-white shadow ${priorityColors[order.priority]}`}
      style={{ left: `${left}%`, width: `${width}%` }}
    >
      <p className="truncate">
        {order.id}: {order.product}
      </p>
      <p className="text-[10px] opacity-80">
        {order.startDate} → {order.endDate}
      </p>
    </div>
  );
}

function OrderQueue({ orders }: { orders: ProductionOrder[] }) {
  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-3">
            <Package className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {order.id}: {order.product}
              </p>
              <p className="text-xs text-gray-500">
                {order.quantity} {order.unit} • {order.resource}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded px-2 py-1 text-xs font-medium ${
                order.priority === "high"
                  ? "bg-red-100 text-red-700"
                  : order.priority === "medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {order.priority}
            </span>
            <button className="rounded p-1 hover:bg-gray-100">
              {order.status === "running" ? (
                <Pause className="h-4 w-4 text-gray-500" />
              ) : (
                <Play className="h-4 w-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MaterialAvailability({
  materials,
}: {
  materials: { id: string; name: string; available: number; required: number; unit: string }[];
}) {
  return (
    <div className="space-y-3 text-sm text-gray-700">
      {materials.map((material) => {
        const pct = Math.min(100, Math.round((material.available / material.required) * 100));
        const shortage = material.available < material.required;
        return (
          <div key={material.id}>
            <div className="mb-1 flex justify-between text-xs">
              <span>{material.name}</span>
              <span className={shortage ? "text-red-600" : "text-green-600"}>
                {material.available}/{material.required} {material.unit}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-200">
              <div
                className={`${shortage ? "bg-red-500" : "bg-green-500"} h-1.5 rounded-full`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KPICard({
  label,
  value,
  subvalue,
  status,
}: {
  label: string;
  value: string;
  subvalue?: string;
  status?: "good" | "warning";
}) {
  const colorClass =
    status === "good"
      ? "text-green-600"
      : status === "warning"
      ? "text-yellow-600"
      : "text-gray-500";

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {subvalue && <p className={`text-xs ${colorClass}`}>{subvalue}</p>}
    </div>
  );
}
