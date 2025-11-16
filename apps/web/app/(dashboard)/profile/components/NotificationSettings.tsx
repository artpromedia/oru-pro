"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Brain,
  Building2,
  Mail,
  MessageSquare,
  Package,
  Settings,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";

type UserType = "super-admin" | "tenant-admin" | "user";

type NotificationPreferences = {
  email: Record<string, boolean>;
  push: Record<string, boolean>;
  inApp: Record<string, boolean>;
};

type Category = {
  id: string;
  name: string;
  description: string;
  icon: typeof Bell;
  priority: "low" | "medium" | "high";
};

export function NotificationSettings({ userType }: { userType: UserType }) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      systemAlerts: true,
      securityAlerts: true,
      performanceReports: false,
      newFeatures: true,
      maintenance: true,
    },
    push: {
      systemAlerts: true,
      securityAlerts: true,
      performanceReports: false,
      newFeatures: false,
      maintenance: true,
    },
    inApp: {
      systemAlerts: true,
      securityAlerts: true,
      performanceReports: true,
      newFeatures: true,
      maintenance: true,
    },
  });

  const categories: Category[] = [
    {
      id: "systemAlerts",
      name: "System Alerts",
      description: "Critical system notifications and downtime alerts",
      icon: AlertTriangle,
      priority: "high",
    },
    {
      id: "securityAlerts",
      name: "Security Alerts",
      description: "Login attempts, password changes, and security events",
      icon: Shield,
      priority: "high",
    },
    {
      id: "performanceReports",
      name: "Performance Reports",
      description: "Weekly and monthly performance summaries",
      icon: TrendingUp,
      priority: "medium",
    },
    {
      id: "newFeatures",
      name: "New Features",
      description: "Updates about new features and improvements",
      icon: Package,
      priority: "low",
    },
    {
      id: "maintenance",
      name: "Maintenance Updates",
      description: "Scheduled maintenance and system updates",
      icon: Settings,
      priority: "medium",
    },
  ];

  if (userType === "tenant-admin") {
    categories.push(
      {
        id: "userActivity",
        name: "User Activity",
        description: "New user registrations and important user actions",
        icon: Users,
        priority: "medium",
      },
      {
        id: "aiInsights",
        name: "AI Insights",
        description: "Important AI predictions and recommendations",
        icon: Brain,
        priority: "medium",
      }
    );
  }

  if (userType === "super-admin") {
    categories.push(
      {
        id: "tenantAlerts",
        name: "Tenant Alerts",
        description: "Critical tenant issues and subscription changes",
        icon: Building2,
        priority: "high",
      },
      {
        id: "platformHealth",
        name: "Platform Health",
        description: "Infrastructure and platform-wide issues",
        icon: Activity,
        priority: "high",
      }
    );
  }

  const togglePreference = (channel: keyof NotificationPreferences, id: string) => {
    setPreferences((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [id]: !(prev[channel]?.[id] ?? false),
      },
    }));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Notification Preferences</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
                <th className="py-3 text-left">Notification Type</th>
                <th className="py-3 text-center">
                  <Mail className="mr-1 inline h-4 w-4" /> Email
                </th>
                <th className="py-3 text-center">
                  <Bell className="mr-1 inline h-4 w-4" /> Push
                </th>
                <th className="py-3 text-center">
                  <MessageSquare className="mr-1 inline h-4 w-4" /> In-App
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <tr key={category.id} className="border-b transition hover:bg-gray-50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">{category.name}</p>
                          <p className="text-xs text-gray-500">{category.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <ToggleSwitch
                        enabled={preferences.email[category.id] ?? false}
                        onChange={() => togglePreference("email", category.id)}
                      />
                    </td>
                    <td className="py-4 text-center">
                      <ToggleSwitch
                        enabled={preferences.push[category.id] ?? false}
                        onChange={() => togglePreference("push", category.id)}
                      />
                    </td>
                    <td className="py-4 text-center">
                      <ToggleSwitch
                        enabled={preferences.inApp[category.id] ?? false}
                        onChange={() => togglePreference("inApp", category.id)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Email Digest</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Digest Frequency</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
              <option>Real-time (as they happen)</option>
              <option>Daily summary</option>
              <option>Weekly summary</option>
              <option>Monthly summary</option>
              <option>Never</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Preferred Time</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
              <option>6:00 AM</option>
              <option>9:00 AM</option>
              <option>12:00 PM</option>
              <option>6:00 PM</option>
              <option>9:00 PM</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Do Not Disturb</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Enable Do Not Disturb</p>
              <p className="text-sm text-gray-500">Pause all non-critical notifications</p>
            </div>
            <ToggleSwitch enabled={false} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Start Time</label>
              <input type="time" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">End Time</label>
              <input type="time" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-semibold text-white hover:bg-purple-700">
          Save Notification Settings
        </button>
      </div>
    </div>
  );
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange?: () => void }) {
  return (
    <button
      onClick={onChange}
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
