"use client";

import { useState } from "react";
import { AlertTriangle, Lock, Zap, type LucideIcon } from "lucide-react";

const initialSettings = {
  autoScaling: true,
  maintenanceMode: false,
  debugMode: false,
  apiRateLimit: 10_000,
  maxTenantsPerNode: 50,
  dataRetention: 90,
  backupFrequency: "daily",
  monitoringLevel: "detailed",
};

type PlatformSettingsState = typeof initialSettings;

type ToggleProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  danger?: boolean;
};

export function PlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettingsState>(initialSettings);

  const updateSetting = <K extends keyof PlatformSettingsState>(key: K, value: PlatformSettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Platform Configuration</h2>
        <div className="space-y-4">
          <SettingToggle
            icon={Zap}
            title="Auto Scaling"
            description="Automatically scale resources based on demand"
            enabled={settings.autoScaling}
            onChange={(value) => updateSetting("autoScaling", value)}
          />
          <SettingToggle
            icon={AlertTriangle}
            title="Maintenance Mode"
            description="Enable maintenance mode for all tenants"
            enabled={settings.maintenanceMode}
            onChange={(value) => updateSetting("maintenanceMode", value)}
            danger
          />
          <SettingToggle
            icon={Lock}
            title="Debug Mode"
            description="Enable detailed logging for troubleshooting"
            enabled={settings.debugMode}
            onChange={(value) => updateSetting("debugMode", value)}
          />
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Resource Limits</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <NumberField
            label="API Rate Limit (requests/hour)"
            value={settings.apiRateLimit}
            onChange={(value) => updateSetting("apiRateLimit", Number(value))}
          />
          <NumberField
            label="Max Tenants per Node"
            value={settings.maxTenantsPerNode}
            onChange={(value) => updateSetting("maxTenantsPerNode", Number(value))}
          />
          <NumberField
            label="Data Retention (days)"
            value={settings.dataRetention}
            onChange={(value) => updateSetting("dataRetention", Number(value))}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Backup Frequency</label>
            <select
              value={settings.backupFrequency}
              onChange={(event) => updateSetting("backupFrequency", event.target.value as PlatformSettingsState["backupFrequency"])}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Platform Admin Access</h2>
        <div className="space-y-3">
          <AdminUser
            name="Art Pro Media"
            email="artpromedia@oonru.ai"
            role="Super Administrator"
            lastAccess="2025-11-16 03:18:40"
            current
          />
          <AdminUser
            name="Support Team"
            email="support@oonru.ai"
            role="Support Administrator"
            lastAccess="2025-11-15 18:30:00"
          />
        </div>
        <button className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
          Add Platform Admin
        </button>
      </section>
    </div>
  );
}

function SettingToggle({ icon: Icon, title, description, enabled, onChange, danger }: ToggleProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${danger ? "text-red-500" : "text-gray-500"}`} />
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} />
    </div>
  );
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        enabled ? "bg-purple-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      />
    </div>
  );
}

type AdminUserProps = {
  name: string;
  email: string;
  role: string;
  lastAccess: string;
  current?: boolean;
};

function AdminUser({ name, email, role, lastAccess, current }: AdminUserProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm">
      <div>
        <p className="font-semibold text-gray-900">{name}</p>
        <p className="text-gray-500">{email}</p>
        <p className="text-xs text-gray-400">
          {role} • Last access: {lastAccess}
        </p>
      </div>
      {current && <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">You</span>}
    </div>
  );
}
