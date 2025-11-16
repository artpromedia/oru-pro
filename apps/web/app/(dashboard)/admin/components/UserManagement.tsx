"use client";

import { useMemo, useState } from "react";
import { Search, Filter, Download, MoreVertical, UserPlus, Mail, Shield, Lock, Unlock, Edit, Trash2 } from "lucide-react";

import { AddUserModal } from "./AddUserModal";

interface TenantContext {
  name: string;
  id: string;
}

interface TenantUser {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "pending" | "inactive" | "locked";
  lastLogin: string | null;
  aiAccess: "full" | "supervised" | "read-only" | "none";
  modules: string[];
  riskScore: "low" | "medium" | "high";
  mfa: boolean;
}

interface UserManagementProps {
  tenant: TenantContext;
}

export function UserManagement({ tenant }: UserManagementProps) {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const users: TenantUser[] = [
    {
      id: 1,
      name: "Sarah Chen",
      email: "sarah.chen@acmecorp.com",
      role: "Operations Director",
      department: "Operations",
      status: "active",
      lastLogin: "2025-11-16 09:15",
      aiAccess: "full",
      modules: ["inventory", "production", "quality", "analytics"],
      riskScore: "low",
      mfa: true,
    },
    {
      id: 2,
      name: "John Smith",
      email: "john.smith@acmecorp.com",
      role: "Warehouse Manager",
      department: "Warehouse",
      status: "active",
      lastLogin: "2025-11-16 08:45",
      aiAccess: "supervised",
      modules: ["inventory", "warehouse"],
      riskScore: "low",
      mfa: true,
    },
    {
      id: 3,
      name: "Emma Wilson",
      email: "emma.wilson@acmecorp.com",
      role: "Quality Inspector",
      department: "Quality",
      status: "active",
      lastLogin: "2025-11-15 17:30",
      aiAccess: "read-only",
      modules: ["quality"],
      riskScore: "low",
      mfa: false,
    },
    {
      id: 4,
      name: "Mike Johnson",
      email: "mike.johnson@acmecorp.com",
      role: "Production Operator",
      department: "Production",
      status: "pending",
      lastLogin: null,
      aiAccess: "none",
      modules: [],
      riskScore: "medium",
      mfa: false,
    },
  ];

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = filterDepartment === "all" || user.department === filterDepartment;
      return matchesSearch && matchesDept;
    });
  }, [filterDepartment, searchTerm, users]);

  const toggleSelectAll = (checked: boolean) => {
    setSelectedUsers(checked ? users.map((user) => user.id) : []);
  };

  const toggleSelection = (userId: number, checked: boolean) => {
    setSelectedUsers((prev) => (checked ? [...prev, userId] : prev.filter((id) => id !== userId)));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{tenant.name} directory</h3>
          <p className="text-sm text-gray-500">Provision users and copilots inside tenant {tenant.id}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
              />
            </div>
            <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
              <option value="all">All Departments</option>
              <option value="Operations">Operations</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Production">Production</option>
              <option value="Quality">Quality</option>
            </select>
            <button className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Advanced filters">
              <Filter className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Download className="w-4 h-4 inline mr-2" />
              Export
            </button>
            <button onClick={() => setShowAddUser(true)} className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
              <UserPlus className="w-4 h-4 inline mr-2" />
              Add User
            </button>
          </div>
        </div>

        {selectedUsers.length > 0 && (
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-purple-700">{selectedUsers.length} users selected</span>
            <div className="flex items-center flex-wrap gap-2 text-sm">
              <button className="px-3 py-1 text-purple-700 hover:bg-purple-100 rounded">Assign Role</button>
              <button className="px-3 py-1 text-purple-700 hover:bg-purple-100 rounded">Change Department</button>
              <button className="px-3 py-1 text-red-600 hover:bg-red-50 rounded">Deactivate</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left">
                <input type="checkbox" onChange={(e) => toggleSelectAll(e.target.checked)} checked={selectedUsers.length === users.length} aria-label="Select all users" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Access</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Security</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <UserRow key={user.id} user={user} selected={selectedUsers.includes(user.id)} onSelect={(checked) => toggleSelection(user.id, checked)} />
            ))}
          </tbody>
        </table>
      </div>

      {showAddUser && <AddUserModal onClose={() => setShowAddUser(false)} />}
    </div>
  );
}

interface UserRowProps {
  user: TenantUser;
  selected: boolean;
  onSelect: (checked: boolean) => void;
}

function UserRow({ user, selected, onSelect }: UserRowProps) {
  const [showMenu, setShowMenu] = useState(false);

  const statusColors: Record<TenantUser["status"], string> = {
    active: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    inactive: "bg-gray-100 text-gray-700",
    locked: "bg-red-100 text-red-700",
  };

  const aiAccessColors: Record<TenantUser["aiAccess"], string> = {
    full: "bg-purple-100 text-purple-700",
    supervised: "bg-blue-100 text-blue-700",
    "read-only": "bg-gray-100 text-gray-700",
    none: "bg-red-100 text-red-700",
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <input type="checkbox" checked={selected} onChange={(e) => onSelect(e.target.checked)} aria-label={`Select ${user.name}`} />
      </td>
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-gray-900">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          {user.lastLogin && <p className="text-xs text-gray-400">Last login: {user.lastLogin}</p>}
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-gray-900">{user.role}</p>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-gray-900">{user.department}</p>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 text-xs rounded-full capitalize ${aiAccessColors[user.aiAccess]}`}>{user.aiAccess}</span>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 text-xs rounded-full capitalize ${statusColors[user.status]}`}>{user.status}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <Shield className={`w-4 h-4 ${user.mfa ? "text-green-500" : "text-gray-300"}`} aria-label={user.mfa ? "MFA Enabled" : "MFA Disabled"} />
          <span className={`text-xs ${user.riskScore === "low" ? "text-green-600" : user.riskScore === "medium" ? "text-yellow-600" : "text-red-600"}`}>
            {user.riskScore} risk
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="relative">
          <button onClick={() => setShowMenu((prev) => !prev)} className="p-1 hover:bg-gray-100 rounded" aria-label="User actions">
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          {showMenu && <UserActionMenu user={user} onClose={() => setShowMenu(false)} />}
        </div>
      </td>
    </tr>
  );
}

function UserActionMenu({ user, onClose }: { user: TenantUser; onClose: () => void }) {
  return (
    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
      <ActionButton icon={Edit} label="Edit User" onClick={onClose} />
      <ActionButton icon={Shield} label="Change Permissions" onClick={onClose} />
      <ActionButton icon={Mail} label="Send Reset Password" onClick={onClose} />
      {user.status === "active" ? (
        <ActionButton icon={Lock} label="Deactivate" onClick={onClose} />
      ) : (
        <ActionButton icon={Unlock} label="Activate" onClick={onClose} />
      )}
      <hr />
      <ActionButton icon={Trash2} label="Delete User" danger onClick={onClose} />
    </div>
  );
}

function ActionButton({ icon: Icon, label, danger, onClick }: { icon: typeof Edit; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <button
      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 ${danger ? "text-red-600 hover:bg-red-50" : "text-gray-700"}`}
      type="button"
      onClick={onClick}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
