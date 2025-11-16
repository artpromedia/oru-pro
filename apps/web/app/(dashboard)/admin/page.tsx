"use client";

import { useMemo, useState } from "react";
import { Users, Shield, Key, Activity, UserPlus, Building2, Brain, AlertTriangle, CheckCircle, Clock, Lock, type LucideIcon } from "lucide-react";

import { UserManagement } from "./components/UserManagement";
import { RoleManagement } from "./components/RoleManagement";

type ActivityStatus = "success" | "warning" | "danger";

interface ActivityEntry {
  id: number;
  user: string;
  action: string;
  role: string;
  timestamp: string;
  status: ActivityStatus;
}

const tabs = [
  { id: "overview", name: "Overview", icon: Building2 },
  { id: "users", name: "Users", icon: Users },
  { id: "roles", name: "Roles & Permissions", icon: Shield },
  { id: "departments", name: "Departments", icon: Building2 },
  { id: "security", name: "Security", icon: Lock },
  { id: "ai-access", name: "AI Access Control", icon: Brain },
] as const;

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState<(typeof tabs)[number]["id"]>("overview");

  const tenant = useMemo(
    () => ({
      name: "AcmeCorp",
      id: "ORU-ACMECORP-001",
      plan: "Enterprise",
      users: { total: 247, active: 198, pending: 12, inactive: 37 },
      roles: 8,
      departments: 12,
      lastAudit: "2025-11-14",
    }),
    []
  );

  const recentActivity: ActivityEntry[] = [
    { id: 1, user: "john.smith@acmecorp.com", action: "User provisioned", role: "Warehouse Manager", timestamp: "10 minutes ago", status: "success" },
    { id: 2, user: "sarah.chen@acmecorp.com", action: "Role elevated", role: "Operations Director", timestamp: "1 hour ago", status: "warning" },
    { id: 3, user: "mike.johnson@acmecorp.com", action: "Access revoked", role: "Former Employee", timestamp: "2 hours ago", status: "danger" },
  ];

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Admin</h1>
          <p className="text-gray-500 mt-1">{tenant.name} — User &amp; Access Management</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50" type="button">
            <Activity className="w-4 h-4 inline mr-2" />
            Audit Log
          </button>
          <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600" type="button">
            <UserPlus className="w-4 h-4 inline mr-2" />
            Add User
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={tenant.users.total.toString()} change="+12 this month" trend="up" />
        <StatCard icon={CheckCircle} label="Active Users" value={tenant.users.active.toString()} change={`${Math.round((tenant.users.active / tenant.users.total) * 100)}% of total`} trend="stable" />
        <StatCard icon={Shield} label="Security Score" value="94%" change="Strong" trend="up" />
        <StatCard icon={Clock} label="Pending Approvals" value={tenant.users.pending.toString()} change="Requires action" trend="warning" />
      </section>

      <section className="bg-white rounded-xl shadow-sm">
        <nav className="flex flex-wrap space-x-6 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center space-x-2 py-4 text-sm font-medium border-b-2 transition-colors ${activeView === tab.id ? "text-purple-600 border-purple-600" : "text-gray-500 border-transparent hover:text-gray-700"}`}
                type="button"
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </section>

      {activeView === "overview" && <AdminOverview tenant={tenant} activity={recentActivity} />}
      {activeView === "users" && <UserManagement tenant={tenant} />}
      {activeView === "roles" && <RoleManagement />}
      {activeView === "departments" && <DepartmentManagement tenant={tenant} />}
      {activeView === "security" && <SecuritySettings tenant={tenant} />}
      {activeView === "ai-access" && <AIAccessControl />}
    </div>
  );
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "stable" | "warning";
}

function StatCard({ icon: Icon, label, value, change, trend }: StatCardProps) {
  const trendColors: Record<StatCardProps["trend"], string> = {
    up: "text-green-600",
    down: "text-red-600",
    stable: "text-gray-600",
    warning: "text-yellow-600",
  };
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <Icon className="w-5 h-5 text-purple-500 mb-2" />
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-xs mt-1 ${trendColors[trend]}`}>{change}</p>
    </div>
  );
}

function AdminOverview({
  tenant,
  activity,
}: {
  tenant: { name: string; id: string; plan: string; users: { total: number; active: number; pending: number; inactive: number }; roles: number; departments: number; lastAudit: string };
  activity: ActivityEntry[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Tenant {tenant.plan}</p>
              <h2 className="text-xl font-semibold mt-1">Directory Snapshot</h2>
              <p className="text-sm text-gray-500">{tenant.roles} roles • {tenant.departments} departments • Last audit {tenant.lastAudit}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">{tenant.users.active} active</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700">{tenant.users.pending} pending</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <OverviewCard title="Provisioning" value="Avg 4m 12s" detail="Time to activate" icon={UserPlus} trend="down" />
            <OverviewCard title="RBAC Coverage" value="98%" detail="Users mapped to roles" icon={Key} trend="up" />
            <OverviewCard title="AI Seats" value="142" detail="Copilot-enabled" icon={Brain} trend="up" />
            <OverviewCard title="Compliance" value="SOC2 • FDA" detail="All controls green" icon={Shield} trend="stable" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-purple-600" type="button">View all</button>
          </div>
          <div className="space-y-4">
            {activity.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-900">{entry.user}</p>
                  <p className="text-xs text-gray-500">{entry.action} — {entry.role}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${entry.status === "success" ? "bg-green-100 text-green-700" : entry.status === "warning" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {entry.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{entry.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Risk &amp; Alerts</h3>
          <div className="space-y-3 text-sm">
            <RiskRow label="Pending role approvals" value="12" tone="warning" />
            <RiskRow label="MFA exemptions" value="6" tone="danger" />
            <RiskRow label="Dormant accounts" value="23" tone="neutral" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-xl p-6 space-y-3">
          <h3 className="text-lg font-semibold">AI Access Guardrail</h3>
          <p className="text-sm text-white/80">Oonru monitors AI escalations and auto-pauses risky automations.</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span>Auto-paused copilots</span><span>3</span></div>
            <div className="flex items-center justify-between"><span>Manual overrides</span><span>1</span></div>
            <div className="flex items-center justify-between"><span>Last review</span><span>4 hours ago</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewCard({ title, value, detail, icon: Icon, trend }: { title: string; value: string; detail: string; icon: typeof Users; trend: "up" | "down" | "stable" }) {
  const colors = { up: "text-emerald-600", down: "text-red-600", stable: "text-slate-500" } as const;
  return (
    <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className="text-xs uppercase text-gray-400">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{detail}</p>
      </div>
      <Icon className={`w-8 h-8 ${colors[trend]}`} />
    </div>
  );
}

function RiskRow({ label, value, tone }: { label: string; value: string; tone: "warning" | "danger" | "neutral" }) {
  const toneClasses = {
    warning: "text-yellow-600",
    danger: "text-red-600",
    neutral: "text-gray-300",
  } as const;
  const Icon = tone === "danger" ? AlertTriangle : tone === "warning" ? Clock : Shield;
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center space-x-2">
        <Icon className={`w-4 h-4 ${toneClasses[tone]}`} />
        <span>{label}</span>
      </div>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function DepartmentManagement({ tenant }: { tenant: { departments: number } }) {
  const departments = [
    { name: "Operations", owner: "Sarah Chen", users: 42, copilots: 6 },
    { name: "Warehouse", owner: "John Smith", users: 37, copilots: 4 },
    { name: "Production", owner: "Emma Wilson", users: 55, copilots: 8 },
    { name: "Quality", owner: "Mike Johnson", users: 31, copilots: 3 },
  ];
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Departments ({tenant.departments})</h3>
          <p className="text-sm text-gray-500">Align RBAC with org structure.</p>
        </div>
        <button className="px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded" type="button">Add Department</button>
      </div>
      <div className="divide-y divide-gray-100">
        {departments.map((dept) => (
          <div key={dept.name} className="flex flex-wrap items-center justify-between py-4">
            <div>
              <p className="font-medium text-gray-900">{dept.name}</p>
              <p className="text-xs text-gray-500">Owner: {dept.owner}</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Users</p>
                <p className="font-semibold text-gray-900">{dept.users}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Copilots</p>
                <p className="font-semibold text-gray-900">{dept.copilots}</p>
              </div>
              <button className="text-purple-600 text-sm" type="button">
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecuritySettings({ tenant }: { tenant: { plan: string } }) {
  const controls = [
    { name: "MFA Required", description: "Enforce MFA across all workforce", enabled: true },
    { name: "Just-in-time access", description: "Time-bound elevation for sensitive roles", enabled: true },
    { name: "Session watermarking", description: "Track shared credentials", enabled: false },
    { name: "SOC2 attestation", description: `${tenant.plan} signed controls`, enabled: true },
  ];
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900">Security Controls</h3>
        <p className="text-sm text-gray-500">Harmonize identity, RBAC, and AI guardrails.</p>
      </div>
      {controls.map((control) => (
        <div key={control.name} className="flex flex-wrap items-center justify-between border border-gray-100 rounded-lg p-4">
          <div>
            <p className="font-medium text-gray-900">{control.name}</p>
            <p className="text-sm text-gray-500">{control.description}</p>
          </div>
          <button className={`px-4 py-1 rounded-full text-xs font-semibold ${control.enabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`} type="button">
            {control.enabled ? "Enabled" : "Disabled"}
          </button>
        </div>
      ))}
    </div>
  );
}

function AIAccessControl() {
  const tiers = [
    { name: "Full Autonomy", description: "Copilots execute decisions instantly", seats: 48, risk: "high" },
    { name: "Supervised", description: "Humans approve AI actions", seats: 72, risk: "medium" },
    { name: "Read only", description: "Insights without actions", seats: 56, risk: "low" },
  ];
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">AI Access Control</h3>
        <button className="text-sm text-purple-600" type="button">Policies</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => (
          <div key={tier.name} className="border border-gray-100 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900">{tier.name}</p>
            <p className="text-xs text-gray-500 mb-2">{tier.description}</p>
            <p className="text-2xl font-semibold text-gray-900">{tier.seats}</p>
            <p className="text-xs text-gray-500 mb-2">assigned seats</p>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${tier.risk === "high" ? "bg-red-100 text-red-700" : tier.risk === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
              {tier.risk} risk
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
