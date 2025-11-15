"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Pause,
  Play,
  Settings,
  AlertTriangle,
  CheckCircle,
  Zap,
  Shield,
  Terminal,
  Power,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const agents = [
  {
    id: "inv-agent-01",
    name: "Inventory Optimizer",
    type: "inventory",
    status: "active",
    mode: "autonomous",
    uptime: "99.8%",
    lastAction: "Created PO for low stock items",
    lastActionTime: "2 mins ago",
    confidence: 94,
    tasksCompleted: 847,
    tasksToday: 23,
    errorRate: 0.3,
    permissions: ["read_inventory", "create_po", "update_stock", "alert_users"],
    performance: {
      accuracy: 96.5,
      speed: 1.2,
      savings: 45000,
    },
    currentLoad: 45,
  },
  {
    id: "qa-agent-01",
    name: "Quality Assurance Bot",
    type: "quality",
    status: "active",
    mode: "supervised",
    uptime: "98.2%",
    lastAction: "Analyzed batch B2025-1115",
    lastActionTime: "5 mins ago",
    confidence: 89,
    tasksCompleted: 523,
    tasksToday: 18,
    errorRate: 1.2,
    permissions: ["read_qa", "approve_batch", "flag_issues", "request_retest"],
    performance: {
      accuracy: 94.2,
      speed: 2.8,
      savings: 28000,
    },
    currentLoad: 67,
  },
  {
    id: "log-agent-01",
    name: "Logistics Coordinator",
    type: "logistics",
    status: "idle",
    mode: "autonomous",
    uptime: "99.5%",
    lastAction: "Optimized delivery routes",
    lastActionTime: "1 hour ago",
    confidence: 91,
    tasksCompleted: 234,
    tasksToday: 8,
    errorRate: 0.8,
    permissions: ["read_shipments", "update_routes", "notify_carriers", "track_deliveries"],
    performance: {
      accuracy: 93.8,
      speed: 3.5,
      savings: 32000,
    },
    currentLoad: 12,
  },
  {
    id: "prod-agent-01",
    name: "Production Scheduler",
    type: "production",
    status: "learning",
    mode: "training",
    uptime: "97.1%",
    lastAction: "Scheduled next production batch",
    lastActionTime: "30 mins ago",
    confidence: 78,
    tasksCompleted: 156,
    tasksToday: 5,
    errorRate: 3.2,
    permissions: ["read_production", "suggest_schedule"],
    performance: {
      accuracy: 87.3,
      speed: 4.2,
      savings: 18000,
    },
    currentLoad: 23,
  },
  {
    id: "dec-agent-01",
    name: "Decision Analyzer",
    type: "decision",
    status: "active",
    mode: "autonomous",
    uptime: "99.9%",
    lastAction: "Detected bias in procurement decision",
    lastActionTime: "10 mins ago",
    confidence: 92,
    tasksCompleted: 1247,
    tasksToday: 42,
    errorRate: 0.1,
    permissions: ["read_all", "analyze_decisions", "flag_biases", "suggest_alternatives"],
    performance: {
      accuracy: 98.2,
      speed: 0.8,
      savings: 67000,
    },
    currentLoad: 78,
  },
];

const agentPerformanceData = [
  { time: "00:00", decisions: 12, accuracy: 95, load: 45 },
  { time: "04:00", decisions: 8, accuracy: 94, load: 32 },
  { time: "08:00", decisions: 25, accuracy: 96, load: 67 },
  { time: "12:00", decisions: 35, accuracy: 97, load: 78 },
  { time: "16:00", decisions: 28, accuracy: 95, load: 72 },
  { time: "20:00", decisions: 18, accuracy: 96, load: 54 },
  { time: "Now", decisions: 22, accuracy: 96, load: 58 },
];

const systemMetrics = {
  totalAgents: 5,
  activeAgents: 4,
  totalDecisions: 195,
  autonomousDecisions: 167,
  supervisedDecisions: 28,
  averageConfidence: 92.4,
  monthlySavings: 190000,
  systemLoad: 56,
};

const activityLog: ActivityLogEntryProps[] = [
  { time: "15:38:45", agent: "Inventory Optimizer", action: "Created PO-11251", status: "success" },
  { time: "15:35:22", agent: "QA Bot", action: "Approved batch B2025-1115", status: "success" },
  { time: "15:30:11", agent: "Decision Analyzer", action: "Flagged bias in DEC-2025-003", status: "warning" },
  { time: "15:28:03", agent: "Production Scheduler", action: "Failed to optimize schedule", status: "error" },
  { time: "15:25:44", agent: "Logistics Coordinator", action: "Route optimization saved 23km", status: "success" },
];

export default function AgentManagementPage() {
  const [selectedAgent, setSelectedAgent] = useState<typeof agents[number] | null>(agents[0]);

  useEffect(() => {
    if (!selectedAgent) {
      setSelectedAgent(agents[0]);
    }
  }, [selectedAgent]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Management</h1>
          <p className="text-gray-500 mt-1">Monitor and control autonomous AI agents</p>
        </div>

        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Terminal className="w-4 h-4" />
            <span>Console</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <Brain className="w-4 h-4" />
            <span>Deploy New Agent</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-4 mb-6">
        <SystemMetricCard label="Total Agents" value={systemMetrics.totalAgents} />
        <SystemMetricCard label="Active" value={systemMetrics.activeAgents} status="success" />
        <SystemMetricCard label="Decisions Today" value={systemMetrics.totalDecisions} />
        <SystemMetricCard label="Autonomous" value={systemMetrics.autonomousDecisions} />
        <SystemMetricCard label="Supervised" value={systemMetrics.supervisedDecisions} />
        <SystemMetricCard label="Avg Confidence" value={`${systemMetrics.averageConfidence}%`} />
        <SystemMetricCard label="Monthly Savings" value={`$${systemMetrics.monthlySavings / 1000}K`} status="success" />
        <SystemMetricCard label="System Load" value={`${systemMetrics.systemLoad}%`} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Active Agents</h2>
            </div>
            <div className="p-4 space-y-4">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onSelect={() => setSelectedAgent(agent)}
                  isSelected={selectedAgent?.id === agent.id}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">System Performance (24h)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={agentPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="decisions" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="load" stroke="#F59E0B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          {selectedAgent ? (
            <AgentDetailPanel agent={selectedAgent} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-center text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select an agent to view details</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Recent Activity</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activityLog.map((log) => (
                <ActivityLogEntry key={`${log.agent}-${log.time}`} {...log} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type Agent = typeof agents[number];

type AgentCardProps = {
  agent: Agent;
  onSelect: () => void;
  isSelected: boolean;
};

function AgentCard({ agent, onSelect, isSelected }: AgentCardProps) {
  const statusColors: Record<Agent["status"], string> = {
    active: "bg-green-100 text-green-700",
    idle: "bg-gray-100 text-gray-700",
    learning: "bg-blue-100 text-blue-700",
    error: "bg-red-100 text-red-700",
  };

  const modeColors: Record<Agent["mode"], string> = {
    autonomous: "text-purple-600",
    supervised: "text-orange-600",
    training: "text-blue-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onSelect}
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-medium text-gray-900">{agent.name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[agent.status]}`}>{agent.status}</span>
            <span className={`text-xs font-medium ${modeColors[agent.mode]}`}>{agent.mode}</span>
          </div>
          <p className="text-sm text-gray-600">{agent.lastAction}</p>
          <p className="text-xs text-gray-500">{agent.lastActionTime}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{agent.confidence}%</div>
          <div className="text-xs text-gray-500">confidence</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-gray-500">Tasks Today</span>
          <p className="font-medium text-gray-900">{agent.tasksToday}</p>
        </div>
        <div>
          <span className="text-gray-500">Total Tasks</span>
          <p className="font-medium text-gray-900">{agent.tasksCompleted}</p>
        </div>
        <div>
          <span className="text-gray-500">Error Rate</span>
          <p className={`font-medium ${agent.errorRate > 2 ? "text-red-600" : "text-green-600"}`}>
            {agent.errorRate}%
          </p>
        </div>
        <div>
          <span className="text-gray-500">Load</span>
          <p className={`font-medium ${agent.currentLoad > 80 ? "text-red-600" : "text-gray-900"}`}>
            {agent.currentLoad}%
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Performance</span>
          <span className="font-medium text-green-600">${(agent.performance.savings / 1000).toFixed(0)}K saved</span>
        </div>
        <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-1.5 rounded-full"
            style={{ width: `${agent.performance.accuracy}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

type AgentDetailPanelProps = {
  agent: Agent;
};

function AgentDetailPanel({ agent }: AgentDetailPanelProps) {
  const [isAutonomous, setIsAutonomous] = useState(agent.mode === "autonomous");

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Agent Configuration</h3>
        <button className="p-2 hover:bg-gray-50 rounded-lg">
          <Settings className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Power className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium">Agent Status</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-1 bg-green-500 text-white rounded hover:bg-green-600">
              <Play className="w-3 h-3" />
            </button>
            <button className="p-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
              <Pause className="w-3 h-3" />
            </button>
            <button className="p-1 bg-red-500 text-white rounded hover:bg-red-600">
              <Power className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium">Autonomous Mode</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAutonomous}
              onChange={(event) => setIsAutonomous(event.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:outline-none peer-checked:bg-blue-600"></div>
            <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
          </label>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions</h4>
          <div className="space-y-1">
            {agent.permissions.map((permission) => (
              <div key={permission} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-xs text-gray-600">{permission}</span>
                <Shield className="w-3 h-3 text-green-500" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Performance Metrics</h4>
          <div className="space-y-2 text-xs">
            <span className="flex justify-between">
              <span className="text-gray-500">Accuracy</span>
              <span className="font-medium">{agent.performance.accuracy}%</span>
            </span>
            <span className="flex justify-between">
              <span className="text-gray-500">Avg Decision Time</span>
              <span className="font-medium">{agent.performance.speed}s</span>
            </span>
            <span className="flex justify-between">
              <span className="text-gray-500">Uptime</span>
              <span className="font-medium">{agent.uptime}</span>
            </span>
          </div>
        </div>

        <div className="space-y-2 pt-4">
          <button className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
            View Agent Logs
          </button>
          <button className="w-full py-2 px-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
            Configure Rules
          </button>
        </div>
      </div>
    </div>
  );
}

type ActivityLogEntryProps = {
  time: string;
  agent: string;
  action: string;
  status: "success" | "warning" | "error";
};

function ActivityLogEntry({ time, agent, action, status }: ActivityLogEntryProps) {
  const statusIcons: Record<ActivityLogEntryProps["status"], JSX.Element> = {
    success: <CheckCircle className="w-3 h-3 text-green-500" />,
    warning: <AlertTriangle className="w-3 h-3 text-yellow-500" />,
    error: <AlertTriangle className="w-3 h-3 text-red-500" />,
  };

  return (
    <div className="flex items-start space-x-2 py-2 border-b border-gray-100 last:border-0">
      {statusIcons[status]}
      <div className="flex-1">
        <p className="text-xs text-gray-900">{action}</p>
        <p className="text-xs text-gray-500">
          {agent} • {time}
        </p>
      </div>
    </div>
  );
}

type SystemMetricCardProps = {
  label: string;
  value: string | number;
  status?: "success" | "default";
};

function SystemMetricCard({ label, value, status = "default" }: SystemMetricCardProps) {
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm">
      <div className={`text-xl font-bold ${status === "success" ? "text-green-600" : "text-gray-900"}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
