"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  Building2,
  Database,
  Eye,
  Filter,
  Lock,
  MoreVertical,
  Package,
  Search,
  Settings,
  Unlock,
  Users,
} from "lucide-react";

import { TenantDetailModal } from "./TenantDetailModal";

type TenantStatus = "active" | "trial" | "suspended";

type TenantPlan = "Enterprise" | "Professional" | "Starter" | "Trial";

type TenantRecord = {
  id: string;
  name: string;
  industry: string;
  status: TenantStatus;
  plan: TenantPlan;
  created: string;
  users: number;
  activeUsers: number;
  modules: number;
  aiModels: number;
  dataSize: string;
  monthlySpend: number;
  health: number;
  lastActive: string;
  primaryContact: string;
  dataRegion: string;
  compliance?: string[];
  issues?: string[];
  trialEnds?: string;
};

export function TenantManagement() {
  const [selectedTenant, setSelectedTenant] = useState<TenantRecord | null>(null);
  const [showProvisionModal, setShowProvisionModal] = useState(false);

  const tenants: TenantRecord[] = [
    {
      id: "ORU-ACMECORP-001",
      name: "AcmeCorp",
      industry: "Manufacturing",
      status: "active",
      plan: "Enterprise",
      created: "2024-03-15",
      users: 247,
      activeUsers: 198,
      modules: 8,
      aiModels: 8,
      dataSize: "1.2TB",
      monthlySpend: 12_500,
      health: 98,
      lastActive: "2 mins ago",
      primaryContact: "john.doe@acmecorp.com",
      dataRegion: "US-East",
      compliance: ["SOC2", "ISO27001"],
    },
    {
      id: "ORU-TECHCORP-002",
      name: "TechCorp Industries",
      industry: "Technology",
      status: "active",
      plan: "Professional",
      created: "2024-06-20",
      users: 89,
      activeUsers: 67,
      modules: 5,
      aiModels: 5,
      dataSize: "450GB",
      monthlySpend: 4_500,
      health: 85,
      lastActive: "1 hour ago",
      primaryContact: "sarah.tech@techcorp.com",
      dataRegion: "EU-Central",
      compliance: ["GDPR", "SOC2"],
      issues: ["AI model degradation"],
    },
    {
      id: "ORU-FOODCHAIN-003",
      name: "FoodChain Co",
      industry: "Food & Beverage",
      status: "active",
      plan: "Enterprise",
      created: "2024-01-10",
      users: 523,
      activeUsers: 445,
      modules: 12,
      aiModels: 12,
      dataSize: "2.8TB",
      monthlySpend: 24_500,
      health: 96,
      lastActive: "15 mins ago",
      primaryContact: "ops@foodchain.com",
      dataRegion: "US-West",
      compliance: ["FDA", "USDA", "HACCP"],
    },
    {
      id: "ORU-STARTUP-004",
      name: "StartupXYZ",
      industry: "Retail",
      status: "trial",
      plan: "Trial",
      created: "2025-11-01",
      users: 12,
      activeUsers: 8,
      modules: 3,
      aiModels: 3,
      dataSize: "25GB",
      monthlySpend: 0,
      health: 100,
      lastActive: "3 hours ago",
      primaryContact: "founder@startupxyz.com",
      dataRegion: "US-East",
      trialEnds: "2025-12-01",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tenant Management</h2>
          <p className="text-gray-500">Manage all client organizations on the Oonru platform</p>
        </div>
        <button
          onClick={() => setShowProvisionModal(true)}
          className="rounded-lg bg-purple-600 px-4 py-2 text-white shadow-sm transition hover:bg-purple-700"
        >
          + Provision New Tenant
        </button>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tenants by name, ID, or contact..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm"
            />
          </div>
          <select className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">
            <option>All Status</option>
            <option>Active</option>
            <option>Trial</option>
            <option>Suspended</option>
          </select>
          <select className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">
            <option>All Plans</option>
            <option>Enterprise</option>
            <option>Professional</option>
            <option>Starter</option>
          </select>
          <button className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              {[
                "Tenant",
                "Status",
                "Users",
                "Resources",
                "Billing",
                "Health",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tenants.map((tenant) => (
              <TenantRow key={tenant.id} tenant={tenant} onSelect={() => setSelectedTenant(tenant)} />
            ))}
          </tbody>
        </table>
      </div>

      {selectedTenant && (
        <TenantDetailModal tenant={selectedTenant} onClose={() => setSelectedTenant(null)} />
      )}

      {showProvisionModal && <ProvisionTenantModal onClose={() => setShowProvisionModal(false)} />}
    </div>
  );
}

type TenantRowProps = {
  tenant: TenantRecord;
  onSelect: () => void;
};

function TenantRow({ tenant, onSelect }: TenantRowProps) {
  const [showMenu, setShowMenu] = useState(false);

  const statusColors: Record<TenantStatus, string> = {
    active: "bg-green-100 text-green-700",
    trial: "bg-yellow-100 text-yellow-700",
    suspended: "bg-red-100 text-red-700",
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">{tenant.name}</p>
            <p className="text-xs text-gray-500">{tenant.id}</p>
            <p className="text-xs text-gray-400">{tenant.industry}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div>
          <span className={`rounded-full px-2 py-1 text-xs capitalize ${statusColors[tenant.status]}`}>
            {tenant.status}
          </span>
          {tenant.trialEnds && <p className="text-xs text-gray-500">Ends: {tenant.trialEnds}</p>}
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-medium text-gray-900">
          {tenant.activeUsers}/{tenant.users}
        </p>
        <p className="text-xs text-gray-500">Active/Total</p>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <Package className="h-3 w-3 text-gray-400" />
          <span>{tenant.modules} modules</span>
        </div>
        <div className="mt-1 flex items-center space-x-2">
          <Brain className="h-3 w-3 text-gray-400" />
          <span>{tenant.aiModels} AI models</span>
        </div>
        <div className="mt-1 flex items-center space-x-2">
          <Database className="h-3 w-3 text-gray-400" />
          <span>{tenant.dataSize}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-semibold text-gray-900">${tenant.monthlySpend.toLocaleString()}/mo</p>
        <p className="text-xs text-gray-500">{tenant.plan}</p>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <span className={`text-2xl font-bold ${getHealthColor(tenant.health)}`}>
            {tenant.health}%
          </span>
          {tenant.issues && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2 text-gray-500">
          <button onClick={onSelect} className="rounded p-1 hover:bg-gray-100" title="View details">
            <Eye className="h-4 w-4" />
          </button>
          <div className="relative">
            <button onClick={() => setShowMenu((prev) => !prev)} className="rounded p-1 hover:bg-gray-100">
              <MoreVertical className="h-4 w-4" />
            </button>
            {showMenu && <TenantActionMenu tenant={tenant} onClose={() => setShowMenu(false)} />}
          </div>
        </div>
      </td>
    </tr>
  );
}

type TenantActionMenuProps = {
  tenant: TenantRecord;
  onClose: () => void;
};

function TenantActionMenu({ tenant, onClose }: TenantActionMenuProps) {
  return (
    <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
      <MenuButton label="Configure" icon={Settings} onClick={onClose} />
      <MenuButton label="Manage AI Models" icon={Brain} onClick={onClose} />
      <MenuButton label="Backup Data" icon={Database} onClick={onClose} />
      <MenuButton label="Access as Admin" icon={Users} onClick={onClose} />
      <hr />
      {tenant.status === "active" ? (
        <MenuButton label="Suspend Tenant" icon={Lock} onClick={onClose} variant="danger" />
      ) : (
        <MenuButton label="Activate Tenant" icon={Unlock} onClick={onClose} variant="success" />
      )}
    </div>
  );
}

type MenuButtonProps = {
  label: string;
  icon: typeof Activity;
  onClick: () => void;
  variant?: "default" | "danger" | "success";
};

function MenuButton({ label, icon: Icon, onClick, variant = "default" }: MenuButtonProps) {
  const variantStyles: Record<string, string> = {
    default: "hover:bg-gray-50 text-gray-700",
    danger: "text-red-600 hover:bg-red-50",
    success: "text-green-600 hover:bg-green-50",
  };

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center space-x-2 px-4 py-2 text-left text-sm ${variantStyles[variant]}`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

type ProvisionTenantModalProps = {
  onClose: () => void;
};

type ProvisionStep = "profile" | "plan" | "modules" | "review";

function ProvisionTenantModal({ onClose }: ProvisionTenantModalProps) {
  const [step, setStep] = useState<ProvisionStep>("profile");

  const nextStep: Record<ProvisionStep, ProvisionStep> = {
    profile: "plan",
    plan: "modules",
    modules: "review",
    review: "review",
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-purple-500">Provision Tenant</p>
            <h3 className="text-2xl font-bold text-gray-900">Create new enterprise tenant</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="flex items-center justify-between py-4 text-xs font-semibold">
          {["profile", "plan", "modules", "review"].map((label) => (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 uppercase ${
                  step === label
                    ? "border-purple-600 text-purple-600"
                    : "border-gray-200 text-gray-400"
                }`}
              >
                {label[0]}
              </div>
              {label !== "review" && <div className="mx-2 h-0.5 flex-1 bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {step === "profile" && <ProvisionSection title="Tenant Profile" subtitle="Company basics & contacts" />}
          {step === "plan" && <ProvisionSection title="Plan & Regions" subtitle="Choose plan + data residency" />}
          {step === "modules" && (
            <ProvisionSection title="Modules & AI" subtitle="Select initial workloads and copilots" />
          )}
          {step === "review" && (
            <ProvisionSection title="Review & Launch" subtitle="Confirm details before provisioning" />
          )}
        </div>

        <div className="mt-8 flex items-center justify-between border-t pt-4">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
            Cancel
          </button>
          <div className="space-x-3">
            {step !== "profile" && (
              <button
                onClick={() => setStep(step === "plan" ? "profile" : step === "modules" ? "plan" : "modules")}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (step === "review" ? onClose() : setStep(nextStep[step]))}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              {step === "review" ? "Provision Tenant" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type ProvisionSectionProps = {
  title: string;
  subtitle: string;
};

function ProvisionSection({ title, subtitle }: ProvisionSectionProps) {
  return (
    <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 p-6">
      <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-500">{subtitle}</p>
      <div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
        <div className="rounded-lg border border-white bg-white/70 p-4">
          <p className="font-medium text-gray-900">Company Snapshot</p>
          <p className="text-xs text-gray-500">Name, HQ, contacts, tenant slug</p>
        </div>
        <div className="rounded-lg border border-white bg-white/70 p-4">
          <p className="font-medium text-gray-900">Operational Scope</p>
          <p className="text-xs text-gray-500">Regions, industries, compliance</p>
        </div>
        <div className="rounded-lg border border-white bg-white/70 p-4">
          <p className="font-medium text-gray-900">Core Modules</p>
          <p className="text-xs text-gray-500">Manufacturing, logistics, procurement</p>
        </div>
        <div className="rounded-lg border border-white bg-white/70 p-4">
          <p className="font-medium text-gray-900">AI Access</p>
          <p className="text-xs text-gray-500">Copilots, decision engines, guardrails</p>
        </div>
      </div>
    </div>
  );
}
