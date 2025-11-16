"use client";

import { Brain } from "lucide-react";

interface AgentActivity {
  agent: string;
  status: "active" | "learning" | "paused";
  currentTask: string;
  decisionsToday: number;
  automation: number;
  lastAction: string;
  timestamp: string;
}

const agentActivities: AgentActivity[] = [
  {
    agent: "Inventory Agent",
    status: "active",
    currentTask: "Analyzing reorder points across 2,847 SKUs",
    decisionsToday: 47,
    automation: 94,
    lastAction: "Created PO for RM-2847 (5000L)",
    timestamp: "2 mins ago"
  },
  {
    agent: "Production Agent",
    status: "learning",
    currentTask: "Optimizing tomorrow's production schedule",
    decisionsToday: 23,
    automation: 78,
    lastAction: "Rescheduled Greek Yogurt batch for efficiency",
    timestamp: "5 mins ago"
  },
  {
    agent: "Quality Agent",
    status: "active",
    currentTask: "Monitoring temperature excursions",
    decisionsToday: 156,
    automation: 100,
    lastAction: "Flagged Batch B-2025-1115 for review",
    timestamp: "1 min ago"
  }
];

export default function AIAgentActivity() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 mb-4">AI Agents Working</h3>
      <div className="space-y-4">
        {agentActivities.map((agent) => (
          <AgentRow key={agent.agent} data={agent} />
        ))}
      </div>
    </div>
  );
}

function AgentRow({ data }: { data: AgentActivity }) {
  const statusClasses = data.status === "active" ? "bg-green-100 text-green-600" : data.status === "learning" ? "bg-yellow-100 text-yellow-600" : "bg-gray-100 text-gray-600";

  return (
    <div className="flex items-start space-x-3">
      <div className={`p-2 rounded-lg ${statusClasses}`}>
        <Brain className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm text-gray-900">{data.agent}</p>
          <span className="text-xs text-gray-500">{data.timestamp}</span>
        </div>
        <p className="text-xs text-gray-600">{data.currentTask}</p>
        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
          <span>Decisions: {data.decisionsToday}</span>
          <span>Auto: {data.automation}%</span>
        </div>
        <p className="text-xs text-blue-600 mt-1">{data.lastAction}</p>
      </div>
    </div>
  );
}
