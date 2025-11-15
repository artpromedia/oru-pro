"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Package, AlertTriangle, Clock, Activity } from "lucide-react";
import { DonutChart } from "@/components/charts/DonutChart";

export default function OperationsDashboard() {
  const [selectedWarehouse, setSelectedWarehouse] = useState("main-warehouse");

  const operationalMetrics = useMemo(
    () => [
      {
        title: "Inventory Health",
        value: 87,
        chart: {
          healthy: 87,
          warning: 8,
          critical: 5,
        },
        details: {
          "Total SKUs": 2847,
          "Active Items": 2476,
          "QA Holds": 23,
          "Expiring Soon": 142,
        },
        colors: ["#52C41A", "#FADB14", "#FF4D4F"],
      },
      {
        title: "QA Compliance Rate",
        value: 94.5,
        chart: {
          passed: 94.5,
          pending: 3.2,
          failed: 2.3,
        },
        details: {
          "Tests Today": 64,
          Passed: 60,
          Pending: 2,
          Failed: 2,
        },
        colors: ["#1677FF", "#FADB14", "#FF4D4F"],
      },
      {
        title: "Production Efficiency",
        value: 78,
        chart: {
          onSchedule: 78,
          delayed: 15,
          ahead: 7,
        },
        details: {
          "Active Orders": 34,
          "On Schedule": 26,
          Delayed: 5,
          Completed: 3,
        },
        colors: ["#13C2C2", "#FA8C16", "#52C41A"],
      },
      {
        title: "Cold Chain Integrity",
        value: 99.2,
        chart: {
          maintained: 99.2,
          excursion: 0.8,
        },
        details: {
          "Monitored Items": 892,
          "In Range": 885,
          Excursions: 7,
          Critical: 0,
        },
        colors: ["#722ED1", "#FF4D4F"],
      },
    ],
    []
  );

  const criticalAlerts = useMemo(
    () => [
      { type: "expiry", count: 15, label: "Items Expiring", urgency: "high", detail: "3 days left" },
      { type: "stock", count: 8, label: "Low Stock Items", urgency: "medium", detail: "Below 20%" },
      { type: "qa", count: 23, label: "Pending QA Approval", urgency: "high", detail: "Avg wait 4.2h" },
      { type: "temperature", count: 2, label: "Temperature Excursions", urgency: "critical", detail: "15 min" },
      { type: "production", count: 5, label: "Production Delays", urgency: "medium", detail: "120 units" },
    ],
    []
  );

  const aiAgentActions = {
    total: 195,
    today: 35,
    autonomous: 28,
    supervised: 7,
    successRate: 96.4,
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Command Center</h1>
          <p className="mt-1 text-gray-500">Real-time monitoring and control</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedWarehouse}
            onChange={(event) => setSelectedWarehouse(event.target.value)}
            className="rounded-lg border border-gray-200 px-4 py-2"
          >
            <option value="main-warehouse">Main Warehouse - Chicago</option>
            <option value="cold-storage">Cold Storage Facility</option>
            <option value="distribution">Distribution Center</option>
          </select>
          <button className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
            Live Data Sandbox
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {operationalMetrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">{metric.title}</h3>
              <Package className="h-5 w-5 text-gray-400" />
            </div>

            <div className="relative mx-auto mb-4 h-40 w-40">
              <DonutChart
                data={Object.entries(metric.chart).map(([key, value], colorIndex) => ({
                  id: key,
                  value,
                  color: metric.colors[colorIndex % metric.colors.length],
                }))}
                centerText={`${metric.value}%`}
                centerSubtext="Score"
              />
            </div>

            <div className="space-y-2 text-xs">
              {Object.entries(metric.details).map(([key, value]) => (
                <div key={key} className="flex justify-between text-gray-600">
                  <span>{key}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Critical Alerts Requiring Action
          </h2>
          <span className="text-sm text-gray-500">Auto-refresh in 30s</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {criticalAlerts.map((alert, index) => (
            <motion.div
              key={alert.type}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-lg border-2 p-4 ${
                alert.urgency === "critical"
                  ? "border-red-500 bg-red-50"
                  : alert.urgency === "high"
                    ? "border-orange-500 bg-orange-50"
                    : "border-yellow-500 bg-yellow-50"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={`text-2xl font-bold ${
                    alert.urgency === "critical"
                      ? "text-red-600"
                      : alert.urgency === "high"
                        ? "text-orange-600"
                        : "text-yellow-600"
                  }`}
                >
                  {alert.count}
                </span>
                {alert.urgency === "critical" ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : alert.urgency === "high" ? (
                  <Clock className="h-5 w-5 text-orange-600" />
                ) : (
                  <Activity className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <p className="text-sm font-medium text-gray-900">{alert.label}</p>
              <p className="mt-1 text-xs text-gray-600">{alert.detail}</p>
              <button className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700">
                Take Action →
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Agent Activity</h2>
            <p className="text-sm text-gray-500">Autonomous operations monitoring</p>
          </div>
          <div className="flex items-center space-x-6">
            <SummaryStat label="Actions Today" value={aiAgentActions.today} className="text-blue-600" />
            <SummaryStat
              label="Success Rate"
              value={`${aiAgentActions.successRate}%`}
              className="text-green-600"
            />
            <SummaryStat
              label="Autonomous / Total"
              value={`${aiAgentActions.autonomous} / ${aiAgentActions.total}`}
              className="text-orange-600"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AgentCard
            name="Inventory Agent"
            status="active"
            lastAction="Reorder initiated for SKU-2847"
            confidence={92}
          />
          <AgentCard
            name="QA Agent"
            status="analyzing"
            lastAction="Analyzing batch B2024-1125"
            confidence={87}
          />
          <AgentCard
            name="Logistics Agent"
            status="idle"
            lastAction="Route optimization completed"
            confidence={95}
          />
          <AgentCard
            name="Production Agent"
            status="active"
            lastAction="Scheduling next batch"
            confidence={89}
          />
        </div>
      </div>
    </div>
  );
}

interface AgentCardProps {
  name: string;
  status: "active" | "analyzing" | "idle";
  lastAction: string;
  confidence: number;
}

function AgentCard({ name, status, lastAction, confidence }: AgentCardProps) {
  const statusClasses: Record<AgentCardProps["status"], string> = {
    active: "bg-green-100 text-green-700",
    analyzing: "bg-blue-100 text-blue-700",
    idle: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-medium text-gray-900">{name}</h4>
        <span className={`rounded-full px-2 py-1 text-xs ${statusClasses[status]}`}>
          {status}
        </span>
      </div>
      <p className="mb-2 text-xs text-gray-600">{lastAction}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Confidence</span>
        <span className="text-sm font-medium text-gray-900">{confidence}%</span>
      </div>
    </div>
  );
}

interface SummaryStatProps {
  label: string;
  value: number | string;
  className?: string;
}

function SummaryStat({ label, value, className }: SummaryStatProps) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${className ?? "text-gray-900"}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
