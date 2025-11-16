"use client";

import { useState } from "react";
import { AlertTriangle, Bell, CheckCircle, Clock, Info, Settings, X } from "lucide-react";

type NotificationType = "alert" | "success" | "warning" | "info";
type NotificationSeverity = "low" | "medium" | "high" | "critical" | "info";

type NotificationItem = {
  id: number;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  source: string;
  time: string;
  read: boolean;
  actionable: boolean;
  actions?: string[];
};

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    type: "alert",
    severity: "high",
    title: "Low Stock Alert",
    message: "SKU-2847 (Organic Milk) has fallen below reorder point. Current stock: 187 units",
    source: "Inventory Agent",
    time: "5 minutes ago",
    read: false,
    actionable: true,
    actions: ["Create PO", "Ignore", "Snooze"],
  },
  {
    id: 2,
    type: "success",
    severity: "info",
    title: "QA Test Passed",
    message: "Batch B-2025-1125 has passed all quality tests and is ready for release",
    source: "QA Module",
    time: "15 minutes ago",
    read: false,
    actionable: false,
  },
  {
    id: 3,
    type: "warning",
    severity: "medium",
    title: "Delivery Delay",
    message: "DEL-2025-1847 is running 30 minutes behind schedule due to traffic",
    source: "TMS",
    time: "1 hour ago",
    read: true,
    actionable: true,
    actions: ["Notify Customer", "Reassign"],
  },
  {
    id: 4,
    type: "info",
    severity: "low",
    title: "Agent Learning Complete",
    message: "Production Agent has completed training phase with 94% accuracy",
    source: "AI Platform",
    time: "2 hours ago",
    read: true,
    actionable: false,
  },
  {
    id: 5,
    type: "alert",
    severity: "critical",
    title: "Temperature Excursion",
    message: "Cold storage unit #3 temperature at 6.2°C (threshold: 4°C)",
    source: "IoT Sensors",
    time: "3 hours ago",
    read: true,
    actionable: true,
    actions: ["Investigate", "Transfer Inventory"],
  },
];

const filterTabs = ["all", "unread", "critical", "operations", "ai agents", "system"] as const;
type FilterTab = (typeof filterTabs)[number];

export default function NotificationsCenter() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [notifications, setNotifications] = useState(initialNotifications);

  const notificationStats = {
    unread: notifications.filter((n) => !n.read).length,
    critical: notifications.filter((n) => n.severity === "critical").length,
    actionable: notifications.filter((n) => n.actionable).length,
    today: 23,
    thisWeek: 156,
  };

  const categorize = (notification: NotificationItem) => {
    const source = notification.source.toLowerCase();
    if (["inventory agent", "qa module", "tms", "iot sensors"].some((label) => source.includes(label))) {
      return "operations";
    }
    if (["ai platform", "production agent", "decision engine"].some((label) => source.includes(label))) {
      return "ai agents";
    }
    return "system";
  };

  const filteredNotifications = notifications.filter((notification) => {
    switch (filter) {
      case "all":
        return true;
      case "unread":
        return !notification.read;
      case "critical":
        return notification.severity === "critical";
      default:
        return categorize(notification) === filter;
    }
  });

  const handleMarkAsRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleDismiss = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications Center</h1>
          <p className="text-sm text-gray-500">System alerts and notifications</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Settings className="h-4 w-4" /> Preferences
          </button>
          <button onClick={handleMarkAllRead} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
            Mark All Read
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <NotificationStat label="Unread" value={notificationStats.unread} icon={Bell} alert />
        <NotificationStat label="Critical" value={notificationStats.critical} icon={AlertTriangle} />
        <NotificationStat label="Actionable" value={notificationStats.actionable} icon={CheckCircle} />
        <NotificationStat label="Today" value={notificationStats.today} icon={Info} />
        <NotificationStat label="This Week" value={notificationStats.thisWeek} icon={Clock} />
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <nav className="flex flex-wrap gap-4 border-b border-gray-100 px-6">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`py-4 text-sm font-medium capitalize transition-colors ${
                filter === tab ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.replace("ai", "AI")}
              {tab === "unread" && notificationStats.unread > 0 && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-1 text-xs text-red-600">{notificationStats.unread}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-6">
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
                No notifications for this filter.
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDismiss={handleDismiss}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

type NotificationCardProps = {
  notification: NotificationItem;
  onMarkAsRead: (id: number) => void;
  onDismiss: (id: number) => void;
};

function NotificationCard({ notification, onMarkAsRead, onDismiss }: NotificationCardProps) {
  const typeIcons: Record<NotificationType, typeof AlertTriangle> = {
    alert: AlertTriangle,
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const typeStyles: Record<NotificationType, string> = {
    alert: "border-red-500 bg-red-50",
    success: "border-green-500 bg-green-50",
    warning: "border-yellow-500 bg-yellow-50",
    info: "border-blue-500 bg-blue-50",
  };

  const Icon = typeIcons[notification.type];

  return (
    <div className={`rounded-xl border-l-4 p-4 shadow-sm ${typeStyles[notification.type]} ${notification.read ? "opacity-80" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 gap-3">
          <Icon
            className={`h-5 w-5 ${
              notification.type === "alert"
                ? "text-red-600"
                : notification.type === "success"
                  ? "text-green-600"
                  : notification.type === "warning"
                    ? "text-yellow-600"
                    : "text-blue-600"
            }`}
          />
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">{notification.title}</h3>
              {!notification.read && <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">New</span>}
              {notification.severity === "critical" && (
                <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">Critical</span>
              )}
            </div>
            <p className="text-sm text-gray-700">{notification.message}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span>{notification.source}</span>
              <span>•</span>
              <span>{notification.time}</span>
            </div>
            {notification.actionable && notification.actions && (
              <div className="mt-3 flex flex-wrap gap-2">
                {notification.actions.map((action) => (
                  <button key={action} className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50">
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!notification.read && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="rounded p-1 text-gray-500 transition hover:bg-white"
              title="Mark as read"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => onDismiss(notification.id)} className="rounded p-1 text-gray-500 transition hover:bg-white" title="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

type NotificationStatProps = {
  label: string;
  value: number;
  icon: typeof Bell;
  alert?: boolean;
};

function NotificationStat({ label, value, icon: Icon, alert = false }: NotificationStatProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <Icon className={`h-5 w-5 ${alert ? "text-red-500" : "text-gray-500"}`} />
      </div>
      <p className={`text-3xl font-bold ${alert ? "text-red-600" : "text-gray-900"}`}>{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
