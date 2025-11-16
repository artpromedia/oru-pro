"use client";

import { useState } from "react";
import {
  AlertCircle,
  Brain,
  Calendar,
  Clock,
  Heart,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

const viewOptions = ["overview", "scheduling", "talent"] as const;

type ViewOption = (typeof viewOptions)[number];

type WorkforceMetrics = {
  totalEmployees: number;
  activeShifts: number;
  onLeave: number;
  openPositions: number;
  averageUtilization: number;
  overtimeHours: number;
  turnoverRate: number;
  engagementScore: number;
};

type DepartmentResource = {
  department: string;
  headcount: number;
  utilization: number;
  overtime: number;
  skills: string[];
  criticalGaps: string[];
  aiRecommendation?: string;
};

type SchedulingConflict =
  | {
      type: "understaffed";
      shift: string;
      date: string;
      required: number;
      scheduled: number;
      impact: "Critical" | "High" | "Medium";
      solution: string;
    }
  | {
      type: "skill_gap";
      area: string;
      date: string;
      required: string;
      available: number;
      impact: "Critical" | "High" | "Medium";
      solution: string;
    };

type TrainingProgram = {
  name: string;
  enrolled: number;
  completed: number;
  compliance: number;
  deadline: string;
  critical: boolean;
};

type AIInsight = {
  title: string;
  message: string;
  confidence: number;
  action: string;
};

export default function HCMDashboard() {
  const [activeView, setActiveView] = useState<ViewOption>("overview");

  const workforceMetrics: WorkforceMetrics = {
    totalEmployees: 1247,
    activeShifts: 89,
    onLeave: 23,
    openPositions: 12,
    averageUtilization: 87,
    overtimeHours: 234,
    turnoverRate: 8.3,
    engagementScore: 78,
  };

  const resourceAllocation: DepartmentResource[] = [
    {
      department: "Warehouse Operations",
      headcount: 234,
      utilization: 92,
      overtime: 45,
      skills: ["Forklift", "Inventory", "Scanning"],
      criticalGaps: ["Cold Storage Certified"],
      aiRecommendation: "Add 3 FTEs for peak season",
    },
    {
      department: "Production",
      headcount: 156,
      utilization: 88,
      overtime: 67,
      skills: ["Machine Operation", "Quality Control", "Safety"],
      criticalGaps: ["CNC Programming"],
      aiRecommendation: "Cross-train 5 operators",
    },
    {
      department: "Quality Assurance",
      headcount: 45,
      utilization: 95,
      overtime: 23,
      skills: ["FDA Regulations", "Testing", "Documentation"],
      criticalGaps: ["Microbiology"],
      aiRecommendation: "Hire 2 senior QA specialists",
    },
  ];

  const schedulingConflicts: SchedulingConflict[] = [
    {
      type: "understaffed",
      shift: "Night Shift - Warehouse",
      date: "2025-11-16",
      required: 15,
      scheduled: 12,
      impact: "High",
      solution: "Pull from day shift or approve overtime",
    },
    {
      type: "skill_gap",
      area: "Cold Storage",
      date: "2025-11-17",
      required: "Certified Handler",
      available: 0,
      impact: "Critical",
      solution: "Emergency certification training",
    },
  ];

  const trainingPrograms: TrainingProgram[] = [
    {
      name: "GMP Certification",
      enrolled: 34,
      completed: 28,
      compliance: 82,
      deadline: "2025-12-01",
      critical: true,
    },
    {
      name: "Forklift Safety",
      enrolled: 56,
      completed: 52,
      compliance: 93,
      deadline: "2025-11-30",
      critical: false,
    },
  ];

  const aiInsights: AIInsight[] = [
    {
      title: "Predicted Absence",
      message: "5 employees likely to call out tomorrow",
      confidence: 87,
      action: "Prepare backup assignments",
    },
    {
      title: "Skill Gap Analysis",
      message: "Critical shortage in certified QA specialists",
      confidence: 92,
      action: "Initiate recruitment or training",
    },
    {
      title: "Overtime Optimization",
      message: "Redistribute 23 hours to reduce costs",
      confidence: 89,
      action: "View suggested schedule",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Prompt 1 · HCM
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Human Capital Management</h1>
          <p className="mt-1 text-sm text-gray-500">Workforce optimization and resource planning</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex divide-x divide-gray-200 rounded-lg border border-gray-200">
            {viewOptions.map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-3 py-2 text-xs font-semibold capitalize transition ${
                  activeView === view ? "bg-indigo-600 text-white" : "bg-white text-gray-600"
                }`}
              >
                {view}
              </button>
            ))}
          </div>
          <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
            Schedule View
          </button>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
            New Schedule
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Users className="text-indigo-500" />} label="Total Staff" value={workforceMetrics.totalEmployees} />
        <MetricCard icon={<UserCheck className="text-emerald-500" />} label="Active Now" value={workforceMetrics.activeShifts} status="success" />
        <MetricCard icon={<Calendar className="text-amber-500" />} label="On Leave" value={workforceMetrics.onLeave} />
        <MetricCard icon={<Target className="text-blue-500" />} label="Utilization" value={`${workforceMetrics.averageUtilization}%`} />
        <MetricCard icon={<Clock className="text-rose-500" />} label="Overtime (hrs)" value={workforceMetrics.overtimeHours} status="warning" />
        <MetricCard icon={<TrendingUp className="text-indigo-500" />} label="Turnover" value={`${workforceMetrics.turnoverRate}%`} />
        <MetricCard icon={<Heart className="text-pink-500" />} label="Engagement" value={`${workforceMetrics.engagementScore}%`} />
        <MetricCard icon={<AlertCircle className="text-red-500" />} label="Open Roles" value={workforceMetrics.openPositions} status="alert" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Department Resource Allocation</h2>
          <p className="text-sm text-gray-500">AI recommendations tailored to shift coverage and skills.</p>
          <div className="mt-4 space-y-4">
            {resourceAllocation.map((dept) => (
              <DepartmentResourceCard key={dept.department} department={dept} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Scheduling Issues</h2>
          <p className="text-sm text-gray-500">Live conflicts and skill shortages surfaced by AI.</p>
          <div className="mt-4 space-y-3">
            {schedulingConflicts.map((conflict, index) => (
              <ConflictCard key={`${conflict.date}-${index}`} conflict={conflict} />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Training &amp; Compliance</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trainingPrograms.map((program) => (
            <TrainingCard key={program.name} program={program} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Workforce Insights</h2>
            <p className="text-sm text-gray-500">Predictive analytics powering proactive staffing actions.</p>
          </div>
          <Brain className="h-5 w-5 text-indigo-500" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {aiInsights.map((insight) => (
            <AIInsightCard key={insight.title} insight={insight} />
          ))}
        </div>
      </section>
    </div>
  );
}

type MetricCardProps = {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  status?: "success" | "warning" | "alert";
};

function MetricCard({ icon, label, value, status }: MetricCardProps) {
  const statusClasses: Record<NonNullable<MetricCardProps["status"]>, string> = {
    success: "text-emerald-600",
    warning: "text-amber-600",
    alert: "text-rose-600",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <span className="rounded-lg bg-gray-50 p-2 text-gray-400">{icon}</span>
      </div>
      <p className={`mt-2 text-2xl font-semibold ${status ? statusClasses[status] : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

type DepartmentResourceCardProps = {
  department: DepartmentResource;
};

function DepartmentResourceCard({ department }: DepartmentResourceCardProps) {
  const utilizationColor = department.utilization > 90 ? "text-rose-600" : "text-emerald-600";

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">{department.department}</h3>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{department.headcount} staff</span>
          <span className={`font-semibold ${utilizationColor}`}>{department.utilization}% utilized</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-gray-600">
        <div>
          <p className="text-xs uppercase text-gray-400">Overtime</p>
          <p className="font-semibold text-gray-900">{department.overtime} hrs</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-400">Key Skills</p>
          <p className="font-semibold text-gray-900">{department.skills.length} types</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-400">Critical Gap</p>
          <p className="font-semibold text-amber-600">{department.criticalGaps[0]}</p>
        </div>
      </div>
      {department.aiRecommendation && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-indigo-50 p-3">
          <div className="flex items-center gap-2 text-sm text-indigo-700">
            <Brain className="h-4 w-4" />
            {department.aiRecommendation}
          </div>
          <button className="text-xs font-semibold text-indigo-600">Apply →</button>
        </div>
      )}
    </div>
  );
}

type ConflictCardProps = {
  conflict: SchedulingConflict;
};

function ConflictCard({ conflict }: ConflictCardProps) {
  const severityClasses: Record<SchedulingConflict["impact"], string> = {
    Critical: "border-rose-500 bg-rose-50",
    High: "border-amber-500 bg-amber-50",
    Medium: "border-yellow-500 bg-yellow-50",
  };

  const label = conflict.type === "understaffed" ? conflict.shift : conflict.area;

  return (
    <div className={`rounded-lg border-l-4 p-3 ${severityClasses[conflict.impact]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-xs text-gray-600">{conflict.date}</p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            conflict.impact === "Critical"
              ? "bg-rose-100 text-rose-700"
              : conflict.impact === "High"
                ? "bg-amber-100 text-amber-700"
                : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {conflict.impact}
        </span>
      </div>
      <p className="mt-2 text-xs text-gray-600">
        {conflict.type === "understaffed"
          ? `Need ${conflict.required}, scheduled ${conflict.scheduled}`
          : `Missing: ${conflict.required}`}
      </p>
      <button className="text-xs font-semibold text-indigo-600">{conflict.solution} →</button>
    </div>
  );
}

type TrainingCardProps = {
  program: TrainingProgram;
};

function TrainingCard({ program }: TrainingCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{program.name}</p>
          <p className="text-xs text-gray-500">Due {program.deadline}</p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            program.critical ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {program.critical ? "Critical" : "On Track"}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
        <p>
          Enrolled <span className="font-semibold text-gray-900">{program.enrolled}</span>
        </p>
        <p>
          Completed <span className="font-semibold text-gray-900">{program.completed}</span>
        </p>
        <p className="font-semibold text-indigo-600">{program.compliance}% compliant</p>
      </div>
    </div>
  );
}

type AIInsightCardProps = {
  insight: AIInsight;
};

function AIInsightCard({ insight }: AIInsightCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{insight.title}</p>
          <p className="text-xs text-gray-500">Confidence {insight.confidence}%</p>
        </div>
        <Brain className="h-4 w-4 text-indigo-500" />
      </div>
      <p className="mt-3 text-sm text-gray-600">{insight.message}</p>
      <button className="mt-3 text-sm font-semibold text-indigo-600">{insight.action} →</button>
    </div>
  );
}
