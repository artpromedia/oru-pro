"use client";

import { useState } from "react";
import {
  Bell,
  CreditCard,
  Database,
  Globe,
  Key,
  Monitor,
  Package,
  Settings,
  Shield,
  Users,
  Workflow,
} from "lucide-react";

const sections = [
  { id: "general", name: "General", icon: Settings },
  { id: "users", name: "Users & Permissions", icon: Users },
  { id: "security", name: "Security", icon: Shield },
  { id: "integrations", name: "Integrations", icon: Workflow },
  { id: "notifications", name: "Notifications", icon: Bell },
  { id: "billing", name: "Billing", icon: CreditCard },
  { id: "data", name: "Data Management", icon: Database },
  { id: "modules", name: "Module Configuration", icon: Package },
] as const;

type SectionId = (typeof sections)[number]["id"];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("general");

  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Prompt 4 · Admin</p>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
  <p className="text-sm text-gray-500">Manage your Oonru platform configuration</p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:w-64">
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-blue-500" : "text-gray-400"}`} />
                  {section.name}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="flex-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {activeSection === "general" && <GeneralSettings />}
          {activeSection === "users" && <UserManagement />}
          {activeSection === "security" && <SecuritySettings />}
          {activeSection === "integrations" && <IntegrationsPanel />}
          {activeSection === "notifications" && <NotificationSettings />}
          {activeSection === "billing" && <BillingSettings />}
          {activeSection === "data" && <DataManagement />}
          {activeSection === "modules" && <ModuleConfiguration />}
        </section>
      </div>
    </div>
  );
}

function GeneralSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
        <p className="text-sm text-gray-500">Org profile, localization, platform defaults</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <LabeledField label="Organization Name">
          <input className="w-full rounded-lg border border-gray-200 px-3 py-2" defaultValue="Acme Foods Co" />
        </LabeledField>
        <LabeledField label="Industry">
          <select className="w-full rounded-lg border border-gray-200 px-3 py-2">
            <option>Food & Beverage</option>
            <option>Pharmaceutical</option>
            <option>Manufacturing</option>
            <option>Retail</option>
          </select>
        </LabeledField>
        <LabeledField label="Time Zone" icon={<Globe className="h-4 w-4 text-gray-400" />}>
          <select className="w-full rounded-lg border border-gray-200 px-3 py-2">
            <option>UTC-05:00 Eastern Time</option>
            <option>UTC-06:00 Central Time</option>
            <option>UTC-07:00 Mountain Time</option>
            <option>UTC-08:00 Pacific Time</option>
          </select>
        </LabeledField>
        <LabeledField label="Language">
          <select className="w-full rounded-lg border border-gray-200 px-3 py-2">
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
          </select>
        </LabeledField>
      </div>
      <button className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
        Save Changes
      </button>
    </div>
  );
}

function UserManagement() {
  const users = [
    { name: "John Doe", email: "john@acmefoods.com", role: "Admin", status: "active" },
    { name: "Sarah Chen", email: "sarah@acmefoods.com", role: "QA Manager", status: "active" },
    { name: "Mike Johnson", email: "mike@acmefoods.com", role: "Warehouse Lead", status: "active" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">Add User</button>
      </div>
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.email} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
            <div>
              <p className="font-semibold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">
                {user.email} • {user.role}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">{user.status}</span>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
      <SecurityCard
        title="Two-Factor Authentication"
        description="Require 2FA for all platform users"
        control={<ToggleSwitch defaultChecked />}
      />
      <SecurityCard
        title="SSO Integration"
        description="Enable single sign-on with your identity provider"
        control={<button className="text-sm font-semibold text-blue-600 hover:text-blue-700">Configure</button>}
      />
      <SecurityCard
        title="Password Policy"
        description="Minimum 12 characters with special symbols"
        control={<button className="text-sm font-semibold text-blue-600 hover:text-blue-700">Edit Policy</button>}
      />
      <SecurityCard
        title="Session Timeout"
        description="Auto-logout after 30 minutes of inactivity"
        control={
          <select className="rounded border border-gray-200 px-3 py-1 text-sm">
            <option>30 minutes</option>
            <option>1 hour</option>
            <option>4 hours</option>
            <option>Never</option>
          </select>
        }
      />
      <SecurityCard
        title="API Access"
        description="Manage API keys and service tokens"
        icon={<Key className="h-4 w-4 text-gray-400" />}
        control={<button className="text-sm font-semibold text-blue-600 hover:text-blue-700">Manage Keys</button>}
      />
      <SecurityCard
        title="Audit Logging"
        description="Stream security events to your SIEM"
        icon={<Monitor className="h-4 w-4 text-gray-400" />}
        control={<ToggleSwitch />}
      />
    </div>
  );
}

function IntegrationsPanel() {
  const integrations = [
    { name: "SAP S/4HANA", status: "Connected", lastSync: "2m ago" },
    { name: "Oracle Fusion", status: "Connected", lastSync: "12m ago" },
    { name: "Salesforce", status: "Needs review", lastSync: "1d ago" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
        <p className="text-sm text-gray-500">Connections to ERP, CRM, and logistics platforms</p>
      </div>
      <div className="space-y-3">
        {integrations.map((integration) => (
          <div key={integration.name} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
            <div>
              <p className="font-semibold text-gray-900">{integration.name}</p>
              <p className="text-xs text-gray-500">Last sync {integration.lastSync}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={`rounded-full px-2 py-1 text-xs ${integration.status === "Connected" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {integration.status}
              </span>
              <button className="text-blue-600 hover:text-blue-700">Configure</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
      <NotificationToggle label="Production alerts" description="Line downtime, QA holds, and batch deviations" defaultChecked />
      <NotificationToggle label="Procurement updates" description="PO approvals, supplier risks, and contract renewals" defaultChecked />
      <NotificationToggle label="Finance & billing" description="Invoice approvals and credit limit warnings" />
      <NotificationToggle label="Security" description="Login anomalies and policy changes" defaultChecked />
    </div>
  );
}

function BillingSettings() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
      <div className="rounded-xl border border-gray-100 p-4">
        <p className="text-sm text-gray-600">Plan</p>
        <p className="text-xl font-semibold text-gray-900">Enterprise</p>
        <p className="text-sm text-gray-500">Includes unlimited modules and AI agents</p>
        <button className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700">Manage plan</button>
      </div>
      <div className="rounded-xl border border-gray-100 p-4">
        <p className="text-sm text-gray-600">Payment Method</p>
        <p className="text-gray-900">Visa •••• 4242 · Expires 09/28</p>
        <button className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700">Update card</button>
      </div>
    </div>
  );
}

function DataManagement() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
      <p className="text-sm text-gray-500">Retention, exports, and compliance tooling</p>
      <div className="rounded-xl border border-gray-100 p-4">
        <p className="font-semibold text-gray-900">Data retention window</p>
        <p className="text-sm text-gray-500">Operational telemetry retained for 24 months</p>
        <select className="mt-2 w-48 rounded border border-gray-200 px-3 py-1 text-sm">
          <option>24 months</option>
          <option>12 months</option>
          <option>36 months</option>
        </select>
      </div>
      <div className="rounded-xl border border-gray-100 p-4">
        <p className="font-semibold text-gray-900">Export archive</p>
        <p className="text-sm text-gray-500">Generate GDPR exports or bulk partner packets</p>
        <button className="mt-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Request export
        </button>
      </div>
    </div>
  );
}

function ModuleConfiguration() {
  const modules = [
    { name: "WMS", description: "Warehouse Management System", enabled: true },
    { name: "Production", description: "Production Planning & Control", enabled: true },
    { name: "TMS", description: "Transportation Management", enabled: true },
    { name: "Procurement", description: "Purchase Order Management", enabled: true },
    { name: "Projects", description: "Project Execution Suite", enabled: true },
    { name: "Finance", description: "Financial Management", enabled: true },
    { name: "HCM", description: "Human Capital Management", enabled: false },
    { name: "CRM", description: "Customer Relationship Management", enabled: false },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Module Configuration</h2>
      {modules.map((module) => (
        <div key={module.name} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
          <div>
            <p className="font-semibold text-gray-900">{module.name}</p>
            <p className="text-sm text-gray-500">{module.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold ${module.enabled ? "text-green-600" : "text-gray-400"}`}>
              {module.enabled ? "Active" : "Inactive"}
            </span>
            <ToggleSwitch defaultChecked={module.enabled} />
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">Configure</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function LabeledField({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="flex items-center gap-2 font-medium text-gray-700">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function SecurityCard({
  title,
  description,
  control,
  icon,
}: {
  title: string;
  description: string;
  control: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-xl border border-gray-100 p-4 md:flex-row md:items-center">
      <div>
        <p className="flex items-center gap-2 font-semibold text-gray-900">
          {icon}
          {title}
        </p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      {control}
    </div>
  );
}

function ToggleSwitch({ defaultChecked }: { defaultChecked?: boolean }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" className="peer sr-only" defaultChecked={defaultChecked} />
      <span className="h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-blue-600"></span>
      <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
    </label>
  );
}

function NotificationToggle({ label, description, defaultChecked }: { label: string; description: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
      <div>
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <ToggleSwitch defaultChecked={defaultChecked} />
    </div>
  );
}
