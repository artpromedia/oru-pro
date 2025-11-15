"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ScanBarcode,
  Truck,
  Clock,
  ChevronRight,
  Navigation2,
  ThermometerSun,
  BatteryCharging,
  ArrowDownUp,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  QrCode,
  Radio,
} from "lucide-react";

const shiftWindow = {
  label: "Morning Shift",
  time: "06:00 - 14:00",
  supervisor: "Camila Reyes",
  zone: "North Dock + Ambient Aisles",
};

const liveMetrics = [
  { id: "pick", label: "Pick Waves", value: 18, detail: "+3 urgent routes", accent: "bg-blue-500" },
  { id: "putaway", label: "Put-Away", value: 42, detail: "6 pallets inbound", accent: "bg-emerald-500" },
  { id: "dock", label: "Dock Doors", value: "5/8", detail: "2 temp-sensitive", accent: "bg-amber-500" },
];

const taskQueue = [
  {
    id: "PICK-4821",
    sku: "SKU-CH-2847",
    description: "Crate pick for order #11927",
    location: "Aisle 12B → Dock 3",
    priority: "critical" as const,
    eta: "2 min",
    status: "in-progress" as const,
  },
  {
    id: "PUT-2389",
    sku: "SKU-FR-9921",
    description: "Put-away of chilled pallets",
    location: "Receiving → Cold Bay 4",
    priority: "high" as const,
    eta: "6 min",
    status: "waiting" as const,
  },
  {
    id: "COUNT-9043",
    sku: "Cycle Count",
    description: "Verify lot L-511A",
    location: "Aisle 4C",
    priority: "standard" as const,
    eta: "12 min",
    status: "waiting" as const,
  },
];

const dockTimeline = [
  {
    time: "09:42",
    label: "Carrier ARRived",
    detail: "Reefer 19 (SeaFresh Foods)",
    sentiment: "info" as const,
  },
  {
    time: "09:33",
    label: "Temp excursion",
    detail: "Bay 2 climbed to 42°F",
    sentiment: "alert" as const,
  },
  {
    time: "09:18",
    label: "Pick wave closed",
    detail: "24 totes sealed",
    sentiment: "success" as const,
  },
];

const dockDoors = [
  { id: 1, status: "loading" as const, trailer: "SF-019", eta: "12m" },
  { id: 2, status: "issue" as const, trailer: "QC-hold", eta: "--" },
  { id: 3, status: "staging" as const, trailer: "Open", eta: "Ready" },
];

const quickActions = [
  { id: "start", label: "Start Pick", icon: PlayCircle, accent: "bg-blue-500" },
  { id: "hold", label: "Hold Pallet", icon: PauseCircle, accent: "bg-amber-500" },
  { id: "complete", label: "Confirm Drop", icon: CheckCircle2, accent: "bg-emerald-500" },
];

export default function WarehouseMobilePage() {
  const [selectedTask, setSelectedTask] = useState(taskQueue[0]);

  const completionPulse = useMemo(() => ({ complete: 86, delayed: 3, blocked: 1 }), []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-300">{shiftWindow.label}</p>
            <h1 className="text-2xl font-semibold">Warehouse Ops</h1>
            <p className="text-xs text-slate-400">
              {shiftWindow.time} · {shiftWindow.zone}
            </p>
          </div>
          <button className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/90">
            Live
          </button>
        </header>

        <section className="rounded-2xl bg-white/10 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-slate-200">
            <span>Supervisor · {shiftWindow.supervisor}</span>
            <span className="flex items-center gap-1">
              <Radio className="h-3.5 w-3.5 text-emerald-300" /> LTE SafeLink
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
            {liveMetrics.map((metric) => (
              <div key={metric.id} className="rounded-xl bg-white/5 p-3">
                <div className="text-2xl font-semibold">{metric.value}</div>
                <p className="text-xs text-slate-300">{metric.label}</p>
                <p className="mt-1 text-[10px] text-slate-400">{metric.detail}</p>
                <div className={`mt-2 h-0.5 w-full rounded-full ${metric.accent}`}></div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Task queue</span>
            <span>{completionPulse.complete}% on-time</span>
          </div>
          {taskQueue.map((task) => (
            <motion.button
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              onClick={() => setSelectedTask(task)}
              className={`w-full rounded-2xl border p-4 text-left backdrop-blur transition ${
                selectedTask.id === task.id
                  ? "border-emerald-400 bg-emerald-400/10"
                  : "border-white/5 bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>{task.id}</span>
                <span className="flex items-center gap-1 text-[11px]">
                  <Clock className="h-3 w-3" /> {task.eta}
                </span>
              </div>
              <p className="mt-1 text-base font-medium text-white">{task.description}</p>
              <p className="text-sm text-slate-200">{task.location}</p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className={priorityBadge(task.priority)}>{task.priority.toUpperCase()}</span>
                <span className={statusBadge(task.status)}>{task.status}</span>
              </div>
            </motion.button>
          ))}
        </section>

        <section className="rounded-2xl bg-white/5 p-4 text-sm text-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Active route</p>
              <h3 className="text-lg font-semibold">{selectedTask.location}</h3>
              <p className="text-xs text-slate-400">Tracking {selectedTask.sku}</p>
            </div>
            <button className="rounded-xl bg-slate-900/50 px-3 py-1 text-xs">Directions</button>
          </div>
          <RouteSteps />
        </section>

        <section className="rounded-2xl bg-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-300">Scan + confirm</p>
              <h3 className="text-lg font-semibold">Smart barcode capture</h3>
            </div>
            <span className="text-[11px] text-emerald-300">Secure</span>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-white/30 bg-black/20 p-6 text-center">
            <ScanBarcode className="mx-auto h-8 w-8 text-emerald-300" />
            <p className="mt-2 text-sm">Align label in frame</p>
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-2 text-sm font-semibold text-slate-900">
              <QrCode className="h-4 w-4" /> Start Scanner
            </button>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">Auto validates lot, expiry, and temperature band.</p>
        </section>

        <section className="rounded-2xl bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-300">
            <span>Dock visibility</span>
            <span className="flex items-center gap-1 text-emerald-300">
              <Truck className="h-3.5 w-3.5" /> Dynamic routing
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {dockDoors.map((door) => (
              <DockDoorCard key={door.id} {...door} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white/10 p-4">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Timeline</span>
            <button className="flex items-center gap-1 text-[11px] text-emerald-300">
              Refresh <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-3 space-y-4">
            {dockTimeline.map((entry) => (
              <TimelineEntry key={entry.time} {...entry} />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3 pb-6">
          {quickActions.map((action) => (
            <button
              key={action.id}
              className={`${action.accent} rounded-2xl p-3 text-left text-sm font-semibold text-white`}
            >
              <action.icon className="mb-2 h-6 w-6" />
              {action.label}
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}

type Priority = "critical" | "high" | "standard";
type TaskStatus = "in-progress" | "waiting";

type TimelineEntryProps = {
  time: string;
  label: string;
  detail: string;
  sentiment: "alert" | "success" | "info";
};

type DockDoorProps = {
  id: number;
  status: "loading" | "issue" | "staging";
  trailer: string;
  eta: string;
};

function RouteSteps() {
  const steps = [
    { id: 1, label: "Scan tote", icon: ScanBarcode },
    { id: 2, label: "Navigate", icon: Navigation2 },
    { id: 3, label: "Temp check", icon: ThermometerSun },
    { id: 4, label: "Battery", icon: BatteryCharging },
  ];

  return (
    <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
      {steps.map((step) => (
        <div key={step.id} className="flex flex-col items-center gap-2">
          <div className="rounded-2xl bg-white/10 p-3">
            <step.icon className="h-4 w-4" />
          </div>
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  );
}

function priorityBadge(priority: Priority) {
  switch (priority) {
    case "critical":
      return "rounded-full bg-red-500/20 px-3 py-1 text-red-200";
    case "high":
      return "rounded-full bg-amber-500/20 px-3 py-1 text-amber-200";
    default:
      return "rounded-full bg-slate-500/20 px-3 py-1 text-slate-200";
  }
}

function statusBadge(status: TaskStatus) {
  return status === "in-progress"
    ? "rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200"
    : "rounded-full bg-slate-500/20 px-3 py-1 text-slate-200";
}

function TimelineEntry({ time, label, detail, sentiment }: TimelineEntryProps) {
  const colors: Record<TimelineEntryProps["sentiment"], string> = {
    alert: "border-red-500/60 bg-red-500/10 text-red-100",
    success: "border-emerald-500/60 bg-emerald-500/10 text-emerald-100",
    info: "border-blue-500/60 bg-blue-500/10 text-blue-100",
  };

  return (
    <div className={`rounded-2xl border p-3 text-xs ${colors[sentiment]}`}>
      <div className="flex items-center justify-between text-[11px]">
        <span>{time}</span>
        <ArrowDownUp className="h-3 w-3" />
      </div>
      <p className="mt-1 text-sm font-semibold text-white">{label}</p>
      <p className="text-[11px] text-white/80">{detail}</p>
    </div>
  );
}

function DockDoorCard({ id, status, trailer, eta }: DockDoorProps) {
  const palette: Record<DockDoorProps["status"], string> = {
    loading: "bg-emerald-500/10 border-emerald-400/40",
    issue: "bg-red-500/10 border-red-400/40",
    staging: "bg-blue-500/10 border-blue-400/40",
  };

  return (
    <div className={`rounded-2xl border p-4 text-sm text-white ${palette[status]}`}>
      <div className="flex items-center justify-between text-xs">
        <span>Door {id}</span>
        <span className="text-[11px] uppercase tracking-widest">{status}</span>
      </div>
      <p className="mt-1 text-lg font-semibold">{trailer}</p>
      <p className="text-xs text-white/80">ETA {eta}</p>
    </div>
  );
}
