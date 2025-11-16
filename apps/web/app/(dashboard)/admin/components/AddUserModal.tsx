"use client";

import { useState } from "react";
import { X, User, Mail, Building2, ChevronRight } from "lucide-react";

interface AddUserModalProps {
  onClose: () => void;
}

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  modules: string[];
  aiAccess: "full" | "supervised" | "read-only" | "none";
  permissions: string[];
}

export function AddUserModal({ onClose }: AddUserModalProps) {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<UserData>({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    role: "",
    modules: [],
    aiAccess: "supervised",
    permissions: [],
  });

  const departments = ["Operations", "Warehouse", "Production", "Quality", "Finance", "Sales", "IT", "HR", "Management"];

  const roles: Record<string, { id: string; name: string; level: "executive" | "manager" | "supervisor" | "staff" | "operator" }[]> = {
    Operations: [
      { id: "ops-director", name: "Operations Director", level: "executive" },
      { id: "ops-manager", name: "Operations Manager", level: "manager" },
      { id: "ops-analyst", name: "Operations Analyst", level: "staff" },
    ],
    Warehouse: [
      { id: "wh-manager", name: "Warehouse Manager", level: "manager" },
      { id: "wh-supervisor", name: "Warehouse Supervisor", level: "supervisor" },
      { id: "wh-operator", name: "Warehouse Operator", level: "staff" },
    ],
    Production: [
      { id: "prod-manager", name: "Production Manager", level: "manager" },
      { id: "prod-planner", name: "Production Planner", level: "staff" },
      { id: "prod-operator", name: "Production Operator", level: "operator" },
    ],
  };

  const modules = [
    { id: "inventory", name: "Inventory Management", critical: true },
    { id: "procurement", name: "Procurement", critical: true },
    { id: "production", name: "Production", critical: true },
    { id: "quality", name: "Quality Management", critical: false },
    { id: "warehouse", name: "Warehouse Management", critical: true },
    { id: "sales", name: "Sales & CRM", critical: false },
    { id: "finance", name: "Finance", critical: true },
    { id: "analytics", name: "Analytics & Reports", critical: false },
  ];

  const aiAccessLevels = [
    {
      id: "full",
      name: "Full Autonomy",
      description: "AI can make decisions and execute actions automatically",
      risk: "high",
    },
    {
      id: "supervised",
      name: "Supervised",
      description: "AI suggests actions, user approves before execution",
      risk: "medium",
    },
    {
      id: "read-only",
      name: "Read Only",
      description: "Can view AI insights but cannot execute actions",
      risk: "low",
    },
    {
      id: "none",
      name: "No AI Access",
      description: "No access to AI features",
      risk: "none",
    },
  ] as const;

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    setUserData((prev) => ({
      ...prev,
      modules: checked ? [...prev.modules, moduleId] : prev.modules.filter((m) => m !== moduleId),
    }));
  };

  const handleCreateUser = () => {
    console.info("Creating user", userData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label="Close add user modal">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-3 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            <StepIndicator number={1} label="Basic Info" active={step === 1} completed={step > 1} />
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <StepIndicator number={2} label="Role & Department" active={step === 2} completed={step > 2} />
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <StepIndicator number={3} label="Access Control" active={step === 3} completed={step > 3} />
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <StepIndicator number={4} label="Review" active={step === 4} completed={false} />
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">User Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="First Name"
                  value={userData.firstName}
                  onChange={(value) => setUserData((prev) => ({ ...prev, firstName: value }))}
                  placeholder="John"
                  icon={User}
                />
                <TextField
                  label="Last Name"
                  value={userData.lastName}
                  onChange={(value) => setUserData((prev) => ({ ...prev, lastName: value }))}
                  placeholder="Doe"
                  icon={User}
                />
              </div>
              <TextField
                label="Email Address"
                type="email"
                value={userData.email}
                onChange={(value) => setUserData((prev) => ({ ...prev, email: value }))}
                placeholder="john.doe@acmecorp.com"
                icon={Mail}
              />
              <TextField label="Phone Number (Optional)" placeholder="+1 (555) 123-4567" icon={Building2} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Department & Role</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setUserData((prev) => ({ ...prev, department: dept, role: "" }))}
                      className={`p-3 border rounded-lg text-sm ${
                        userData.department === dept ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-300 hover:border-gray-400"
                      }`}
                      type="button"
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>

              {userData.department && roles[userData.department] && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <div className="space-y-2">
                    {roles[userData.department].map((role) => (
                      <button
                        key={role.id}
                        onClick={() => setUserData((prev) => ({ ...prev, role: role.id }))}
                        className={`w-full p-3 border rounded-lg text-left ${
                          userData.role === role.id ? "border-purple-500 bg-purple-50" : "border-gray-300 hover:border-gray-400"
                        }`}
                        type="button"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{role.name}</p>
                            <p className="text-xs text-gray-500">Access level: {role.level}</p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              role.level === "executive"
                                ? "bg-purple-100 text-purple-700"
                                : role.level === "manager"
                                ? "bg-blue-100 text-blue-700"
                                : role.level === "supervisor"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {role.level}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Module Access</h3>
                <p className="text-sm text-gray-600 mb-4">Select which modules this user can access</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {modules.map((module) => (
                    <label key={module.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userData.modules.includes(module.id)}
                        onChange={(e) => handleModuleToggle(module.id, e.target.checked)}
                        className="text-purple-600"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{module.name}</p>
                        {module.critical && <span className="text-xs text-red-600">Critical</span>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">AI Access Level</h3>
                <p className="text-sm text-gray-600 mb-4">Configure how this user interacts with AI</p>
                <div className="space-y-2">
                  {aiAccessLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setUserData((prev) => ({ ...prev, aiAccess: level.id }))}
                      className={`w-full p-4 border rounded-lg text-left ${
                        userData.aiAccess === level.id ? "border-purple-500 bg-purple-50" : "border-gray-300 hover:border-gray-400"
                      }`}
                      type="button"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{level.name}</p>
                          <p className="text-sm text-gray-600 mt-1">{level.description}</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            level.risk === "high"
                              ? "bg-red-100 text-red-700"
                              : level.risk === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : level.risk === "low"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {level.risk} risk
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900 mb-4">Review &amp; Confirm</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <ReviewItem label="Name" value={`${userData.firstName} ${userData.lastName}`.trim() || "Not specified"} />
                <ReviewItem label="Email" value={userData.email || "Not specified"} />
                <ReviewItem label="Department" value={userData.department || "Not selected"} />
                <ReviewItem label="Role" value={userData.role || "Not selected"} />
                <ReviewItem label="Modules" value={userData.modules.length ? userData.modules.join(", ") : "None"} />
                <ReviewItem label="AI Access" value={userData.aiAccess} />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <p>
                  <strong>Note:</strong> The user will receive an email invitation to set up their password and enable two-factor authentication.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <button onClick={prevStep} className={`px-4 py-2 text-gray-600 hover:text-gray-800 ${step === 1 ? "invisible" : ""}`} type="button">
            ← Previous
          </button>
          <div className="flex items-center space-x-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800" type="button">
              Cancel
            </button>
            {step < 4 ? (
              <button onClick={nextStep} className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600" type="button">
                Continue →
              </button>
            ) : (
              <button onClick={handleCreateUser} className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600" type="button">
                Create User
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  icon?: typeof User;
}

function TextField({ label, value = "", onChange, placeholder, type = "text", icon: Icon }: TextFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${Icon ? "pl-9" : ""}`}
        />
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}

function StepIndicator({ number, label, active, completed }: StepIndicatorProps) {
  return (
    <div className="flex items-center space-x-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
          completed ? "bg-green-500 text-white" : active ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-500"
        }`}
      >
        {completed ? "✓" : number}
      </div>
      <span className={`text-sm ${active ? "font-medium" : "text-gray-500"}`}>{label}</span>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}:</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
