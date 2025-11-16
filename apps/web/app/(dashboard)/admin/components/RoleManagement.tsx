"use client";

import { useState } from "react";
import { Shield, Plus } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
  aiLevel: "full" | "supervised" | "read-only" | "none";
  critical: boolean;
  editable: boolean;
}

interface PermissionCategory {
  name: string;
  permissions: { id: string; name: string; risk: "low" | "medium" | "high" | "critical" }[];
}

const predefinedRoles: Role[] = [
  {
    id: "admin",
    name: "System Administrator",
    description: "Full system access and configuration",
    userCount: 3,
    permissions: ["all"],
    aiLevel: "full",
    critical: true,
    editable: false,
  },
  {
    id: "ops-director",
    name: "Operations Director",
    description: "Oversee all operations and production",
    userCount: 2,
    permissions: ["inventory.all", "production.all", "quality.all", "reports.all"],
    aiLevel: "full",
    critical: true,
    editable: true,
  },
  {
    id: "warehouse-manager",
    name: "Warehouse Manager",
    description: "Manage warehouse operations",
    userCount: 5,
    permissions: ["inventory.read", "inventory.write", "warehouse.all"],
    aiLevel: "supervised",
    critical: false,
    editable: true,
  },
  {
    id: "quality-inspector",
    name: "Quality Inspector",
    description: "Perform quality checks and approvals",
    userCount: 12,
    permissions: ["quality.inspect", "quality.approve", "inventory.read"],
    aiLevel: "read-only",
    critical: false,
    editable: true,
  },
  {
    id: "operator",
    name: "Production Operator",
    description: "Execute production tasks",
    userCount: 45,
    permissions: ["production.execute", "inventory.read"],
    aiLevel: "none",
    critical: false,
    editable: true,
  },
];

const permissionCategories: Record<string, PermissionCategory> = {
  inventory: {
    name: "Inventory Management",
    permissions: [
      { id: "inventory.read", name: "View Inventory", risk: "low" },
      { id: "inventory.write", name: "Update Inventory", risk: "medium" },
      { id: "inventory.delete", name: "Delete Inventory", risk: "high" },
      { id: "inventory.adjust", name: "Adjust Stock Levels", risk: "high" },
    ],
  },
  production: {
    name: "Production",
    permissions: [
      { id: "production.read", name: "View Production Orders", risk: "low" },
      { id: "production.create", name: "Create Production Orders", risk: "medium" },
      { id: "production.execute", name: "Execute Production", risk: "medium" },
      { id: "production.approve", name: "Approve Production", risk: "high" },
    ],
  },
  quality: {
    name: "Quality Management",
    permissions: [
      { id: "quality.inspect", name: "Perform Inspections", risk: "medium" },
      { id: "quality.approve", name: "Approve/Reject Quality", risk: "high" },
      { id: "quality.override", name: "Override Quality Decisions", risk: "critical" },
    ],
  },
  finance: {
    name: "Finance",
    permissions: [
      { id: "finance.read", name: "View Financial Data", risk: "medium" },
      { id: "finance.approve", name: "Approve Payments", risk: "critical" },
      { id: "finance.transfer", name: "Transfer Funds", risk: "critical" },
    ],
  },
  ai: {
    name: "AI Controls",
    permissions: [
      { id: "ai.configure", name: "Configure AI Settings", risk: "high" },
      { id: "ai.override", name: "Override AI Decisions", risk: "high" },
      { id: "ai.train", name: "Train AI Models", risk: "critical" },
    ],
  },
};

export function RoleManagement() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Roles</h3>
          <button className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600">
            <Plus className="w-4 h-4 inline mr-1" />
            Add Role
          </button>
        </div>
        <div className="space-y-2">
          {predefinedRoles.map((role) => (
            <RoleCard key={role.id} role={role} selected={selectedRole?.id === role.id} onSelect={() => setSelectedRole(role)} />
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
        {selectedRole ? <RolePermissionEditor role={selectedRole} categories={permissionCategories} /> : <div className="text-center py-12 text-gray-500">Select a role to view and edit permissions</div>}
      </div>
    </div>
  );
}

function RoleCard({ role, selected, onSelect }: { role: Role; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className={`w-full p-3 rounded-lg text-left transition-all ${selected ? "bg-purple-50 border-2 border-purple-500" : "border border-gray-200 hover:border-gray-300"}`} type="button">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{role.name}</p>
          <p className="text-xs text-gray-600 mt-1">{role.description}</p>
          <div className="flex items-center space-x-3 mt-2 text-xs">
            <span className="text-gray-500">{role.userCount} users</span>
            <span
              className={`px-2 py-0.5 rounded ${
                role.aiLevel === "full"
                  ? "bg-purple-100 text-purple-700"
                  : role.aiLevel === "supervised"
                  ? "bg-blue-100 text-blue-700"
                  : role.aiLevel === "read-only"
                  ? "bg-gray-100 text-gray-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              AI: {role.aiLevel}
            </span>
          </div>
        </div>
        {role.critical && <Shield className="w-4 h-4 text-red-500" />}
      </div>
    </button>
  );
}

function RolePermissionEditor({ role, categories }: { role: Role; categories: Record<string, PermissionCategory> }) {
  const [permissions, setPermissions] = useState<string[]>(role.permissions);

  const togglePermission = (permId: string, checked: boolean) => {
    setPermissions((prev) => (checked ? [...prev, permId] : prev.filter((perm) => perm !== permId)));
  };

  const roleEditable = role.editable && !permissions.includes("all");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-gray-900">{role.name}</h3>
          <p className="text-sm text-gray-600">{role.description}</p>
        </div>
        {role.editable && (
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50" type="button">
              Duplicate
            </button>
            <button className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600" type="button">
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">AI Access Level</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {["full", "supervised", "read-only", "none"].map((level) => (
            <button
              key={level}
              className={`p-2 border rounded text-sm capitalize ${role.aiLevel === level ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-300"}`}
              type="button"
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(categories).map(([key, category]) => (
          <PermissionCategory
            key={key}
            category={category}
            grantedPermissions={permissions}
            onChange={togglePermission}
            editable={roleEditable}
          />
        ))}
      </div>
    </div>
  );
}

function PermissionCategory({
  category,
  grantedPermissions,
  onChange,
  editable,
}: {
  category: PermissionCategory;
  grantedPermissions: string[];
  onChange: (permissionId: string, checked: boolean) => void;
  editable: boolean;
}) {
  const riskColors = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
  } as const;

  const hasAll = category.permissions.every((perm) => grantedPermissions.includes(perm.id) || grantedPermissions.includes("all"));

  const toggleAll = () => {
    if (!editable) return;
    category.permissions.forEach((perm) => {
      onChange(perm.id, !hasAll);
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">{category.name}</h4>
        <button className="text-sm text-purple-600 hover:text-purple-700" type="button" onClick={toggleAll} disabled={!editable}>
          {hasAll ? "Remove All" : "Grant All"}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {category.permissions.map((perm) => (
          <label key={perm.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
            <input
              type="checkbox"
              checked={grantedPermissions.includes(perm.id) || grantedPermissions.includes("all")}
              onChange={(e) => onChange(perm.id, e.target.checked)}
              disabled={!editable || grantedPermissions.includes("all")}
              className="text-purple-600"
            />
            <span className="text-sm">{perm.name}</span>
            <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${riskColors[perm.risk]}`}>{perm.risk}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
