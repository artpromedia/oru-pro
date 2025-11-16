'use client';

import {
  Calendar,
  Lock,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

export default function PeriodCloseDashboard() {
  const closeChecklist: Record<"preClose" | "mainClose" | "reporting", CloseTask[]> = {
    preClose: [
      {
        task: "Cutoff Procedures",
        owner: "Operations Team",
        status: "completed",
        substeps: [
          { name: "Stop goods receipts", status: "completed", time: "2025-10-31 17:00" },
          { name: "Final shipping cutoff", status: "completed", time: "2025-10-31 18:00" },
          { name: "Lock production orders", status: "completed", time: "2025-10-31 18:30" },
        ],
      },
      {
        task: "Accruals & Deferrals",
        owner: "AP Team",
        status: "in-progress",
        substeps: [
          { name: "Utility accruals", status: "completed", amount: 45670 },
          { name: "Payroll accrual", status: "in-progress", amount: 234500 },
          { name: "Rent prepayment", status: "pending", amount: 78000 },
        ],
      },
      {
        task: "Inventory Count & Valuation",
        owner: "Warehouse Team",
        status: "in-progress",
        variance: 2.3,
        adjustments: [
          { location: "WH-01", variance: -12450, status: "approved" },
          { location: "WH-02", variance: 3200, status: "pending" },
        ],
      },
    ],
    mainClose: [
      {
        task: "Sub-ledger Reconciliation",
        owner: "Accounting Team",
        status: "pending",
        ledgers: [
          { name: "AP Sub-ledger", balance: 1234567, glBalance: 1234567, variance: 0 },
          { name: "AR Sub-ledger", balance: 2345678, glBalance: 2345650, variance: 28 },
          { name: "Fixed Assets", balance: 5678900, glBalance: 5678900, variance: 0 },
        ],
      },
      {
        task: "Intercompany Reconciliation",
        owner: "Corporate Accounting",
        status: "pending",
        entities: [
          { from: "US-Entity", to: "CA-Entity", amount: 234500, matched: false },
          { from: "US-Entity", to: "MX-Entity", amount: 145670, matched: true },
        ],
      },
      {
        task: "Foreign Currency Revaluation",
        owner: "Treasury",
        status: "pending",
        impact: {
          unrealizedGain: 23450,
          unrealizedLoss: -12300,
          netImpact: 11150,
        },
      },
    ],
    reporting: [
      {
        task: "Trial Balance",
        status: "pending",
        balanced: null,
        debits: 0,
        credits: 0,
      },
      {
        task: "Financial Statements",
        status: "pending",
        statements: ["P&L", "Balance Sheet", "Cash Flow"],
        consolidation: "Not started",
      },
      {
        task: "Management Reporting Pack",
        status: "pending",
        reports: ["KPI Dashboard", "Variance Analysis", "Segment Reporting"],
      },
    ],
  };

  const periodStatuses = [
    { period: "2025-08", status: "closed", closedDate: "2025-09-05" },
    { period: "2025-09", status: "closed", closedDate: "2025-10-04" },
    { period: "2025-10", status: "in-progress", day: 4 },
    { period: "2025-11", status: "open", current: true },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Period-End Close Process</h1>
          <p className="text-gray-500 mt-1">October 2025 - Day 4 of Close</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Calendar className="w-4 h-4 inline mr-2" />
            Close Calendar
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <Download className="w-4 h-4 inline mr-2" />
            Export Checklist
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Period Status</h2>
        <div className="flex items-center space-x-4">
          {periodStatuses.map((period, index) => (
            <div key={period.period} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    period.status === "closed"
                      ? "bg-gray-400 text-white"
                      : period.status === "in-progress"
                      ? "bg-yellow-500 text-white"
                      : period.current
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {period.status === "closed" ? (
                    <Lock className="w-5 h-5" />
                  ) : period.status === "in-progress" ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Calendar className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs mt-2 font-medium">{period.period}</span>
                {period.closedDate && <span className="text-xs text-gray-500">Closed {period.closedDate}</span>}
                {period.day && <span className="text-xs text-yellow-600">Day {period.day}</span>}
              </div>
              {index < periodStatuses.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300 mx-2" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Pre-Close Activities</h3>
          <div className="space-y-3">
            {closeChecklist.preClose.map((task) => (
              <CloseTaskCard key={task.task} task={task} />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Main Close Process</h3>
          <div className="space-y-3">
            {closeChecklist.mainClose.map((task) => (
              <CloseTaskCard key={task.task} task={task} />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Reporting & Analysis</h3>
          <div className="space-y-3">
            {closeChecklist.reporting.map((task) => (
              <CloseTaskCard key={task.task} task={task} />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Critical Issues & Blockers</h2>
        <div className="space-y-3">
          <IssueAlert
            severity="high"
            title="AR Sub-ledger Variance"
            description="$28 variance between AR sub-ledger and GL requires investigation"
            owner="Jane Smith"
            eta="Today 5:00 PM"
          />
          <IssueAlert
            severity="medium"
            title="Intercompany Mismatch"
            description="US-CA transaction of $234,500 not matched by Canadian entity"
            owner="Corporate Team"
            eta="Tomorrow 12:00 PM"
          />
          <IssueAlert
            severity="low"
            title="Inventory Adjustment Pending"
            description="WH-02 variance of $3,200 awaiting manager approval"
            owner="Mike Johnson"
            eta="Today 3:00 PM"
          />
        </div>
      </div>
    </div>
  );
}
type CloseSubstep = {
  name: string;
  status: string;
  time?: string;
  amount?: number;
};

type CloseTask = {
  task: string;
  owner?: string;
  status: "completed" | "in-progress" | "pending";
  substeps?: CloseSubstep[];
  variance?: number;
  adjustments?: Array<{ location: string; variance: number; status: string }>;
  ledgers?: Array<{ name: string; balance: number; glBalance: number; variance: number }>;
  entities?: Array<{ from: string; to: string; amount: number; matched: boolean }>;
  impact?: { unrealizedGain: number; unrealizedLoss: number; netImpact: number };
  statements?: string[];
  reports?: string[];
  debits?: number;
  credits?: number;
  balanced?: boolean | null;
  consolidation?: string;
};

type IssueAlertProps = {
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  owner: string;
  eta: string;
};

function CloseTaskCard({ task }: { task: CloseTask }) {
  const statusColors: Record<CloseTask["status"], string> = {
    completed: "bg-green-100 text-green-700",
    "in-progress": "bg-yellow-100 text-yellow-700",
    pending: "bg-gray-100 text-gray-700",
  };

  const statusIcons: Record<CloseTask["status"], typeof CheckCircle> = {
    completed: CheckCircle,
    "in-progress": Clock,
    pending: AlertTriangle,
  };

  const StatusIcon = statusIcons[task.status];

  return (
    <div
      className={`p-3 border rounded-lg ${
        task.status === "completed"
          ? "border-green-200 bg-green-50"
          : task.status === "in-progress"
          ? "border-yellow-200 bg-yellow-50"
          : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start space-x-2">
          <StatusIcon
            className={`w-4 h-4 mt-0.5 ${
              task.status === "completed"
                ? "text-green-600"
                : task.status === "in-progress"
                ? "text-yellow-600"
                : "text-gray-400"
            }`}
          />
          <div>
            <p className="font-medium text-sm text-gray-900">{task.task}</p>
            {task.owner && <p className="text-xs text-gray-500">{task.owner}</p>}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[task.status]}`}>
          {task.status}
        </span>
      </div>

      {task.substeps && (
        <div className="ml-6 mt-2 space-y-1">
          {task.substeps.slice(0, 2).map((step: CloseSubstep) => (
            <div key={step.name} className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{step.name}</span>
              {step.amount && <span className="font-medium">${step.amount.toLocaleString()}</span>}
              {step.status === "completed" && <CheckCircle className="w-3 h-3 text-green-500" />}
            </div>
          ))}
        </div>
      )}

      {task.variance !== undefined && (
        <div className="mt-2 text-xs">
          <span className="text-gray-600">Variance: </span>
          <span className={task.variance > 3 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
            {task.variance}%
          </span>
        </div>
      )}
    </div>
  );
}

function IssueAlert({ severity, title, description, owner, eta }: IssueAlertProps) {
  const severityColors: Record<IssueAlertProps["severity"], string> = {
    high: "border-red-500 bg-red-50",
    medium: "border-yellow-500 bg-yellow-50",
    low: "border-blue-500 bg-blue-50",
  };

  return (
    <div className={`p-4 border-l-4 rounded ${severityColors[severity]}`}>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
            <span>Owner: {owner}</span>
            <span>•</span>
            <span>ETA: {eta}</span>
          </div>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700">View Details →</button>
      </div>
    </div>
  );
}