"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  GitBranch,
} from "lucide-react";

type Portfolio = {
  id: string;
  name: string;
  projects: number;
  budget: number;
  spent: number;
  health: "green" | "yellow" | "red";
  completion: number;
  risks: number;
  blockers: number;
};

type Project = {
  id: string;
  name: string;
  portfolio: string;
  start: string;
  end: string;
  progress: number;
  budget: number;
  spent: number;
  health: "green" | "yellow" | "red";
  milestone: string;
  dependencies: string[];
  teamSize: number;
  aiRisk: "low" | "medium" | "high";
};

type PortfolioHealth = {
  budgetUtilization: number;
  scheduleAdherence: number;
  resourceUtilization: number;
  riskScore: number;
  decisionVelocity: number;
  changeRequests: number;
  completedProjects: number;
  activeProjects: number;
};

const portfolios: Portfolio[] = [
  {
    id: "operations-excellence",
    name: "Operations Excellence",
    projects: 12,
    budget: 2_500_000,
    spent: 1_847_000,
    health: "green",
    completion: 68,
    risks: 3,
    blockers: 1,
  },
  {
    id: "digital-transformation",
    name: "Digital Transformation",
    projects: 8,
    budget: 3_200_000,
    spent: 2_100_000,
    health: "yellow",
    completion: 45,
    risks: 5,
    blockers: 2,
  },
  {
    id: "compliance-regulatory",
    name: "Compliance & Regulatory",
    projects: 6,
    budget: 800_000,
    spent: 450_000,
    health: "green",
    completion: 72,
    risks: 1,
    blockers: 0,
  },
];

const projectTimeline: Project[] = [
  {
    id: "PRJ-2025-001",
    name: "ERP Migration Phase 1",
    portfolio: "digital-transformation",
    start: "2025-10-01",
    end: "2025-12-31",
    progress: 65,
    budget: 850_000,
    spent: 523_000,
    health: "green",
    milestone: "Data Migration",
    dependencies: ["PRJ-2025-003"],
    teamSize: 15,
    aiRisk: "low",
  },
  {
    id: "PRJ-2025-002",
    name: "FDA Compliance Upgrade",
    portfolio: "compliance-regulatory",
    start: "2025-09-15",
    end: "2025-11-30",
    progress: 78,
    budget: 320_000,
    spent: 250_000,
    health: "yellow",
    milestone: "Documentation Review",
    dependencies: [],
    teamSize: 8,
    aiRisk: "medium",
  },
  {
    id: "PRJ-2025-003",
    name: "Warehouse Automation",
    portfolio: "operations-excellence",
    start: "2025-11-01",
    end: "2026-03-31",
    progress: 23,
    budget: 1_200_000,
    spent: 276_000,
    health: "green",
    milestone: "Vendor Selection",
    dependencies: [],
    teamSize: 12,
    aiRisk: "low",
  },
];

const portfolioHealth: PortfolioHealth = {
  budgetUtilization: 72,
  scheduleAdherence: 84,
  resourceUtilization: 89,
  riskScore: 23,
  decisionVelocity: 4.2,
  changeRequests: 7,
  completedProjects: 45,
  activeProjects: 26,
};

export default function PMODashboard() {
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>("all");

  const timelineRange = useMemo(() => {
    const startDates = projectTimeline.map((project) => new Date(project.start).getTime());
    const endDates = projectTimeline.map((project) => new Date(project.end).getTime());
    const min = Math.min(...startDates);
    const max = Math.max(...endDates);
    const totalDays = (max - min) / (1000 * 60 * 60 * 24) || 1;
    return { start: min, end: max, totalDays };
  }, []);

  const filteredProjects = useMemo(() => {
    if (selectedPortfolio === "all") return projectTimeline;
    return projectTimeline.filter((project) => project.portfolio === selectedPortfolio);
  }, [selectedPortfolio]);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Prompt 3 · Execution PMO
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio Management Office</h1>
          <p className="text-sm text-gray-500">Strategic oversight and portfolio health monitoring</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedPortfolio}
            onChange={(event) => setSelectedPortfolio(event.target.value)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
          >
            <option value="all">All Portfolios</option>
            {portfolios.map((portfolio) => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.name}
              </option>
            ))}
          </select>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
            Executive Report
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HealthMetric label="Budget Used" value={`${portfolioHealth.budgetUtilization}%`} status={portfolioHealth.budgetUtilization > 80 ? "warning" : "good"} />
        <HealthMetric label="On Schedule" value={`${portfolioHealth.scheduleAdherence}%`} status={portfolioHealth.scheduleAdherence > 75 ? "good" : "warning"} />
        <HealthMetric label="Resources" value={`${portfolioHealth.resourceUtilization}%`} status={portfolioHealth.resourceUtilization > 90 ? "warning" : "good"} />
        <HealthMetric label="Risk Score" value={portfolioHealth.riskScore} status={portfolioHealth.riskScore > 30 ? "critical" : "good"} />
        <HealthMetric label="Decision Time" value={`${portfolioHealth.decisionVelocity}d`} status={portfolioHealth.decisionVelocity > 5 ? "warning" : "good"} />
        <HealthMetric label="Changes" value={portfolioHealth.changeRequests} status="neutral" />
        <HealthMetric label="Completed" value={portfolioHealth.completedProjects} status="good" />
        <HealthMetric label="Active" value={portfolioHealth.activeProjects} status="neutral" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {portfolios.map((portfolio) => (
          <PortfolioCard key={portfolio.id} portfolio={portfolio} />
        ))}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Project Timeline</h2>
        <p className="text-sm text-gray-500">Live Gantt across ERP, compliance, and automation initiatives.</p>
        <div className="mt-4 overflow-x-auto">
          <GanttChart projects={filteredProjects} timelineRange={timelineRange} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Risk Matrix</h2>
          <RiskMatrix projects={filteredProjects} />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Dependency Graph</h2>
          <DependencyGraph projects={filteredProjects} />
        </div>
      </section>
    </div>
  );
}

type HealthMetricProps = {
  label: string;
  value: number | string;
  status: "good" | "warning" | "critical" | "neutral";
};

function HealthMetric({ label, value, status }: HealthMetricProps) {
  const statusColors: Record<HealthMetricProps["status"], string> = {
    good: "text-emerald-600",
    warning: "text-amber-600",
    critical: "text-rose-600",
    neutral: "text-gray-600",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className={`text-2xl font-semibold ${statusColors[status]}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

type PortfolioCardProps = {
  portfolio: Portfolio;
};

function PortfolioCard({ portfolio }: PortfolioCardProps) {
  const healthColors: Record<Portfolio["health"], string> = {
    green: "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
  };
  const spendRatio = portfolio.spent / portfolio.budget;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{portfolio.name}</h3>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${healthColors[portfolio.health]}`}>
          {portfolio.health}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500">Projects</p>
          <p className="text-xl font-bold text-gray-900">{portfolio.projects}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Completion</p>
          <p className="text-xl font-bold text-gray-900">{portfolio.completion}%</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Budget</span>
          <span>
            ${(portfolio.spent / 1_000_000).toFixed(1)}M / ${(portfolio.budget / 1_000_000).toFixed(1)}M
          </span>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
          <div
            className={`h-2 rounded-full ${spendRatio > 0.9 ? "bg-rose-500" : spendRatio > 0.7 ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${Math.min(spendRatio * 100, 100)}%` }}
          />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          {portfolio.risks} risks
        </span>
        <span className="flex items-center gap-1">
          <span className="text-rose-500">✖</span>
          {portfolio.blockers} blockers
        </span>
      </div>
    </div>
  );
}

type GanttChartProps = {
  projects: Project[];
  timelineRange: { start: number; end: number; totalDays: number };
};

function GanttChart({ projects, timelineRange }: GanttChartProps) {
  if (projects.length === 0) {
    return <p className="text-sm text-gray-500">No projects in this portfolio.</p>;
  }

  const monthLabels = useMemo(() => {
    const startDate = new Date(timelineRange.start);
    const endDate = new Date(timelineRange.end);
    const labels: string[] = [];
    const cursor = new Date(startDate);
    cursor.setDate(1);
    while (cursor <= endDate) {
      labels.push(cursor.toLocaleString("default", { month: "short" }));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return labels;
  }, [timelineRange]);

  return (
    <div className="min-w-[720px]">
      <div className="ml-48 flex border-b border-gray-200 pb-2 text-xs text-gray-500">
        {monthLabels.map((label) => (
          <div key={label} className="flex-1 text-center">
            {label}
          </div>
        ))}
      </div>
      {projects.map((project) => {
        const start = new Date(project.start).getTime();
        const end = new Date(project.end).getTime();
        const leftPct = ((start - timelineRange.start) / (timelineRange.totalDays * 24 * 3600 * 1000)) * 100;
        const widthPct = ((end - start) / (timelineRange.totalDays * 24 * 3600 * 1000)) * 100;
        const barColor = project.health === "green" ? "bg-emerald-500" : project.health === "yellow" ? "bg-amber-500" : "bg-rose-500";
        return (
          <div key={project.id} className="flex items-center gap-4 border-b border-gray-100 py-3">
            <div className="w-48">
              <p className="text-sm font-semibold text-gray-900">{project.name}</p>
              <p className="text-xs text-gray-500">{project.teamSize} members · {project.milestone}</p>
            </div>
            <div className="relative h-8 flex-1 rounded bg-gray-100">
              <div
                className={`absolute h-full rounded ${barColor}`}
                style={{ left: `${Math.max(leftPct, 0)}%`, width: `${Math.min(widthPct, 100)}%` }}
              >
                <span className="px-2 text-xs font-semibold text-white">{project.progress}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type RiskMatrixProps = {
  projects: Project[];
};

function RiskMatrix({ projects }: RiskMatrixProps) {
  const highImpact = projects.filter((project) => project.aiRisk === "high").length;
  const mediumImpact = projects.filter((project) => project.aiRisk === "medium").length;
  const lowImpact = projects.filter((project) => project.aiRisk === "low").length;

  return (
    <div className="grid grid-cols-2 gap-4 text-center text-sm">
      <div className="rounded-lg bg-rose-50 p-6">
        <p className="text-xs uppercase text-rose-500">High Risk</p>
        <p className="text-3xl font-bold text-rose-600">{highImpact}</p>
      </div>
      <div className="rounded-lg bg-amber-50 p-6">
        <p className="text-xs uppercase text-amber-500">Medium Risk</p>
        <p className="text-3xl font-bold text-amber-600">{mediumImpact}</p>
      </div>
      <div className="col-span-2 rounded-lg bg-emerald-50 p-6">
        <p className="text-xs uppercase text-emerald-500">Low Risk</p>
        <p className="text-3xl font-bold text-emerald-600">{lowImpact}</p>
      </div>
    </div>
  );
}

type DependencyGraphProps = {
  projects: Project[];
};

function DependencyGraph({ projects }: DependencyGraphProps) {
  const criticalPaths = projects.filter((project) => project.dependencies.length > 0).length;
  return (
    <div className="flex h-64 flex-col items-center justify-center text-center text-sm text-gray-500">
      <GitBranch className="mb-3 h-12 w-12 text-gray-300" />
      <p>Interactive dependency visualization placeholder</p>
      <p className="text-xs text-gray-400">{criticalPaths} critical path dependencies tracked</p>
    </div>
  );
}
