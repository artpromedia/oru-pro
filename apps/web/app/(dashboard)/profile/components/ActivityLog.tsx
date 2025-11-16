"use client";

import { Activity, AlertTriangle, CheckCircle, Clock } from "lucide-react";

import type { UserProfileData } from "../page";

type ActivityEntry = {
  id: number;
  type: "login" | "security" | "preference" | "notification";
  description: string;
  timestamp: string;
  status: "success" | "warning" | "info";
};

const activityLog: ActivityEntry[] = [
  {
    id: 1,
    type: "login",
    description: "Signed in via SSO",
    timestamp: "2025-11-16 03:18:40",
    status: "success",
  },
  {
    id: 2,
    type: "security",
    description: "Updated API permissions",
    timestamp: "2025-11-15 22:45:00",
    status: "info",
  },
  {
    id: 3,
    type: "notification",
    description: "Adjusted system alert preferences",
    timestamp: "2025-11-15 20:05:12",
    status: "success",
  },
  {
    id: 4,
    type: "security",
    description: "Failed login attempt blocked",
    timestamp: "2025-11-15 18:10:03",
    status: "warning",
  },
];

export function ActivityLog({ user }: { user: UserProfileData }) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <p className="text-sm text-gray-500">Last login: {user.lastLogin}</p>
          </div>
          <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Export Activity
          </button>
        </div>
        <div className="space-y-3">
          {activityLog.map((entry) => (
            <ActivityRow key={entry.id} entry={entry} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const statusIcon = {
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    info: <Activity className="h-4 w-4 text-blue-500" />,
  }[entry.status];

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm">
      <div className="flex items-center gap-3">
        {statusIcon}
        <div>
          <p className="font-medium text-gray-900">{entry.description}</p>
          <p className="text-xs text-gray-500 capitalize">{entry.type}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Clock className="h-4 w-4" /> {entry.timestamp}
      </div>
    </div>
  );
}
