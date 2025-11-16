"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Factory,
  FileText,
  Gauge,
  PauseCircle,
  PlayCircle,
  ScanLine,
  TrendingUp,
} from "lucide-react";

type ProductionOrder = {
  id: string;
  product: string;
  sku: string;
  quantity: number;
  completed: number;
  status: "in-progress" | "scheduled" | "completed" | "paused";
  line: string;
  shift: string;
  startTime: string;
  estimatedCompletion: string;
  efficiency: number;
  qualityRate: number;
  bom: Record<string, { required: number; consumed: number; unit: string }>;
  qaCheckpoints?: Array<{
    name: string;
    status: "passed" | "monitoring" | "alert";
    value: string;
  }>;
};

type ProductionLine = {
  id: string;
  name: string;
  status: "running" | "idle" | "maintenance" | "error";
  currentOrder: string | null;
  oee: number;
  speed: number;
  temperature: number;
  pressure: number;
  lastMaintenance?: string;
  nextMaintenance?: string;
  maintenanceType?: string;
  estimatedCompletion?: string;
};

type BOMInventory = Record<
  string,
  {
    available: number;
    allocated: number;
    unit: string;
    reorderPoint: number;
  }
>;

const productionOrders: ProductionOrder[] = [
  {
    id: "PRD-2025-1125-001",
    product: "Greek Yogurt 500g",
    sku: "YOG-GRK-500",
    quantity: 5000,
    completed: 3250,
    status: "in-progress",
    line: "Line 1",
    shift: "Morning",
    startTime: "06:00",
    estimatedCompletion: "14:00",
    efficiency: 94,
    qualityRate: 99.2,
    bom: {
      milk: { required: 2500, consumed: 1625, unit: "L" },
      culture: { required: 50, consumed: 32.5, unit: "kg" },
      packaging: { required: 5000, consumed: 3250, unit: "units" },
    },
    qaCheckpoints: [
      { name: "pH Level", status: "passed", value: "4.6" },
      { name: "Viscosity", status: "passed", value: "850 cP" },
      { name: "Temperature", status: "monitoring", value: "4°C" },
    ],
  },
  {
    id: "PRD-2025-1125-002",
    product: "Organic Milk 1L",
    sku: "MLK-ORG-1L",
    quantity: 10000,
    completed: 1500,
    status: "scheduled",
    line: "Line 2",
    shift: "Afternoon",
    startTime: "14:00",
    estimatedCompletion: "22:00",
    efficiency: 0,
    qualityRate: 0,
    bom: {
      rawMilk: { required: 10200, consumed: 0, unit: "L" },
      bottles: { required: 10000, consumed: 0, unit: "units" },
      caps: { required: 10000, consumed: 0, unit: "units" },
    },
  },
];

const productionLines: ProductionLine[] = [
  {
    id: "line-1",
    name: "Dairy Line 1",
    status: "running",
    currentOrder: "PRD-2025-1125-001",
    oee: 87,
    speed: 250,
    temperature: 4.2,
    pressure: 2.3,
    lastMaintenance: "2025-11-10",
    nextMaintenance: "2025-11-25",
  },
  {
    id: "line-2",
    name: "Dairy Line 2",
    status: "idle",
    currentOrder: null,
    oee: 0,
    speed: 0,
    temperature: 22,
    pressure: 1.0,
    lastMaintenance: "2025-11-08",
    nextMaintenance: "2025-11-23",
  },
  {
    id: "line-3",
    name: "Packaging Line",
    status: "maintenance",
    currentOrder: null,
    oee: 0,
    speed: 0,
    temperature: 22,
    pressure: 1.0,
    maintenanceType: "Scheduled cleaning",
    estimatedCompletion: "15:00",
  },
];

const bomInventory: BOMInventory = {
  milk: { available: 15000, allocated: 12700, unit: "L", reorderPoint: 5000 },
  culture: { available: 200, allocated: 150, unit: "kg", reorderPoint: 50 },
  packaging: { available: 25000, allocated: 20000, unit: "units", reorderPoint: 10000 },
  bottles: { available: 30000, allocated: 25000, unit: "units", reorderPoint: 15000 },
};

export default function ProductionDashboard() {
  const [selectedLine, setSelectedLine] = useState("line-1");
  const [realTimeData, setRealTimeData] = useState({ timestamp: new Date().toLocaleTimeString() });

  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData({ timestamp: new Date().toLocaleTimeString() });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Management</h1>
          <p className="text-sm text-gray-500">Real-time production monitoring and control</p>
          <p className="text-xs text-gray-400">Last sync: {realTimeData.timestamp}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <FileText className="h-4 w-4" />
            Production Report
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
            <PlayCircle className="h-4 w-4" />
            New Order
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <KPICard icon={Factory} label="Active Lines" value="2/3" />
        <KPICard icon={BarChart3} label="Units Today" value="8,750" trend="+12%" />
        <KPICard icon={Gauge} label="Avg OEE" value="87%" status="good" />
        <KPICard icon={CheckCircle} label="Quality Rate" value="99.2%" status="excellent" />
        <KPICard icon={Clock} label="Cycle Time" value="14.2s" trend="-0.8s" />
        <KPICard icon={TrendingUp} label="Efficiency" value="94%" />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {productionLines.map((line) => (
          <button
            key={line.id}
            className={`text-left transition ${
              selectedLine === line.id ? "-translate-y-1" : "translate-y-0"
            }`}
            onClick={() => setSelectedLine(line.id)}
          >
            <ProductionLineCard line={line} />
          </button>
        ))}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Active Production Orders</h2>
        <div className="mt-4 space-y-4">
          {productionOrders.map((order) => (
            <ProductionOrderCard key={order.id} order={order} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">BOM Inventory Status</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(bomInventory).map(([material, data]) => (
              <BOMInventoryItem key={material} material={material} data={data} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Shop Floor Activity</h2>
          <ShopFloorActivity />
        </div>
      </section>
    </div>
  );
}

type KPICardProps = {
  icon: typeof Factory;
  label: string;
  value: string;
  trend?: string;
  status?: "excellent" | "good" | "default";
};

function KPICard({ icon: Icon, label, value, trend, status = "default" }: KPICardProps) {
  const statusClass =
    status === "excellent"
      ? "text-green-600"
      : status === "good"
        ? "text-blue-600"
        : "text-gray-900";

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <Icon className="h-4 w-4 text-gray-500" />
        {trend && (
          <span className={`text-xs ${trend.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
            {trend}
          </span>
        )}
      </div>
      <p className={`text-2xl font-semibold ${statusClass}`}>{value}</p>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  );
}

type StatusBadgeProps = {
  status: ProductionOrder["status"];
};

function StatusBadge({ status }: StatusBadgeProps) {
  const colors: Record<ProductionOrder["status"], string> = {
    "in-progress": "bg-blue-100 text-blue-700",
    scheduled: "bg-gray-100 text-gray-700",
    completed: "bg-green-100 text-green-700",
    paused: "bg-yellow-100 text-yellow-700",
  };

  return <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${colors[status]}`}>{status.replace("-", " ")}</span>;
}

type ProductionOrderCardProps = {
  order: ProductionOrder;
};

function ProductionOrderCard({ order }: ProductionOrderCardProps) {
  const progress = (order.completed / order.quantity) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gray-100 p-4 shadow-sm"
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">{order.product}</h3>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-gray-500">
            Order {order.id} · SKU {order.sku}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{progress.toFixed(0)}%</p>
          <p className="text-xs text-gray-500">Complete</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-gray-500">
          <span>
            {order.completed.toLocaleString()} / {order.quantity.toLocaleString()} units
          </span>
          <span>Est. {order.estimatedCompletion}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div className="h-2 rounded-full bg-blue-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
        {Object.entries(order.bom)
          .slice(0, 3)
          .map(([material, data]) => (
            <div key={material}>
              <p className="text-xs uppercase tracking-wide text-gray-500">{material}</p>
              <p className="text-sm font-semibold text-gray-900">
                {data.consumed}/{data.required} {data.unit}
              </p>
            </div>
          ))}
      </div>

      {order.qaCheckpoints && (
        <div className="mb-3 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 text-xs text-gray-600">
          {order.qaCheckpoints.map((checkpoint) => {
            const icon =
              checkpoint.status === "passed" ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : checkpoint.status === "monitoring" ? (
                <Clock className="h-3 w-3 text-blue-500" />
              ) : (
                <AlertCircle className="h-3 w-3 text-red-500" />
              );
            return (
              <span key={checkpoint.name} className="flex items-center gap-1">
                {icon}
                {checkpoint.name}
              </span>
            );
          })}
        </div>
      )}

      {order.status === "in-progress" && (
        <div className="flex flex-wrap gap-2">
          <button className="flex flex-1 items-center justify-center gap-1 rounded-md bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-200">
            <PauseCircle className="h-3 w-3" />
            Pause
          </button>
          <button className="flex flex-1 items-center justify-center gap-1 rounded-md bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200">
            <ScanLine className="h-3 w-3" />
            Scan Consumption
          </button>
          <button className="flex flex-1 items-center justify-center gap-1 rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200">
            <CheckCircle className="h-3 w-3" />
            Complete
          </button>
        </div>
      )}
    </motion.div>
  );
}

type ProductionLineCardProps = {
  line: ProductionLine;
};

function ProductionLineCard({ line }: ProductionLineCardProps) {
  const statusColors: Record<ProductionLine["status"], string> = {
    running: "bg-green-100 text-green-700",
    idle: "bg-gray-100 text-gray-700",
    maintenance: "bg-orange-100 text-orange-700",
    error: "bg-red-100 text-red-700",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{line.name}</p>
          <p className="text-xs text-gray-500">Last maintenance {line.lastMaintenance ?? "-"}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusColors[line.status]}`}>
          {line.status}
        </span>
      </div>

      {line.status === "running" && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">OEE</p>
              <p className="text-xl font-semibold text-gray-900">{line.oee}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Speed</p>
              <p className="text-xl font-semibold text-gray-900">{line.speed}/hr</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
            <p>
              Temperature <span className="font-semibold text-gray-900">{line.temperature}°C</span>
            </p>
            <p>
              Pressure <span className="font-semibold text-gray-900">{line.pressure} bar</span>
            </p>
          </div>
          {line.currentOrder && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500">Current Order</p>
              <p className="text-sm font-semibold text-gray-900">{line.currentOrder}</p>
            </div>
          )}
        </>
      )}

      {line.status === "maintenance" && (
        <div className="text-sm text-gray-600">
          <p>{line.maintenanceType}</p>
          <p className="text-xs text-gray-500">Est. completion {line.estimatedCompletion}</p>
        </div>
      )}

      {line.status === "idle" && (
        <div className="py-4 text-center text-sm text-gray-500">
          No active orders
          <button className="mt-2 block text-xs font-semibold text-blue-600 hover:text-blue-700">Assign Order →</button>
        </div>
      )}
    </div>
  );
}

type BOMInventoryItemProps = {
  material: string;
  data: BOMInventory[string];
};

function BOMInventoryItem({ material, data }: BOMInventoryItemProps) {
  const usage = ((data.allocated / data.available) * 100).toFixed(0);
  const remaining = data.available - data.allocated;
  const isLow = remaining < data.reorderPoint;

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
      <div>
        <p className="text-sm font-semibold capitalize text-gray-900">{material}</p>
        <p className="text-xs text-gray-500">
          {data.available.toLocaleString()} {data.unit} available
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">{usage}% allocated</p>
        {isLow && <p className="text-xs text-orange-600">Below reorder point</p>}
      </div>
    </div>
  );
}

function ShopFloorActivity() {
  const activities = [
    { time: "14:32", operator: "John D.", action: "Scanned 50kg of milk" },
    { time: "14:28", operator: "Sarah M.", action: "Quality check passed" },
    { time: "14:25", operator: "System", action: "Auto-adjusted line speed" },
    { time: "14:20", operator: "Mike R.", action: "Started batch B-1125-03" },
  ];

  return (
    <div className="divide-y divide-gray-100">
      {activities.map((activity) => (
        <div key={activity.time} className="flex items-start gap-3 py-3">
          <span className="w-12 text-xs text-gray-500">{activity.time}</span>
          <div>
            <p className="text-sm font-medium text-gray-900">{activity.action}</p>
            <p className="text-xs text-gray-500">{activity.operator}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
