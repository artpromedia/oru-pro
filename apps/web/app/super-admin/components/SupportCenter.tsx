"use client";

import {
  AlertCircle,
  Building2,
  CheckCircle,
  Clock,
  Filter,
  Mail,
  MessageSquare,
  Phone,
  Search,
  TrendingUp,
  Video,
} from "lucide-react";

type TicketPriority = "high" | "medium" | "low";

type TicketStatus = "open" | "in-progress" | "resolved";

type Ticket = {
  id: string;
  tenant: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  created: string;
  assignee: string;
  lastUpdate: string;
  category: string;
};

const tickets: Ticket[] = [
  {
    id: "TKT-2025-1847",
    tenant: "AcmeCorp",
    subject: "AI model not updating predictions",
    priority: "high",
    status: "open",
    created: "2 hours ago",
    assignee: "Tech Team",
    lastUpdate: "30 mins ago",
    category: "Technical",
  },
  {
    id: "TKT-2025-1846",
    tenant: "TechCorp Industries",
    subject: "Request for additional storage",
    priority: "medium",
    status: "in-progress",
    created: "5 hours ago",
    assignee: "Sales Team",
    lastUpdate: "1 hour ago",
    category: "Billing",
  },
  {
    id: "TKT-2025-1845",
    tenant: "StartupXYZ",
    subject: "How to configure warehouse zones?",
    priority: "low",
    status: "resolved",
    created: "1 day ago",
    assignee: "Support Team",
    lastUpdate: "4 hours ago",
    category: "How-To",
  },
];

export function SupportCenter() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <SupportMetric icon={MessageSquare} label="Open Tickets" value="23" change="-5 from yesterday" trend="positive" />
        <SupportMetric icon={Clock} label="Avg Response Time" value="12 min" change="3 min faster" trend="positive" />
        <SupportMetric icon={CheckCircle} label="Resolution Rate" value="94%" change="+2% this week" trend="positive" />
        <SupportMetric icon={TrendingUp} label="Customer Satisfaction" value="4.8/5" change="Excellent" trend="stable" />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Support Tickets</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                className="w-48 rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm"
              />
            </div>
            <select className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">
              <option>All Status</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
            <button className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Ticket</th>
                <th className="px-6 py-3 text-left">Tenant</th>
                <th className="px-6 py-3 text-left">Subject</th>
                <th className="px-6 py-3 text-left">Priority</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Assignee</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Enterprise Support Options</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <ContactOption icon={Phone} title="Priority Phone Support" description="24/7 dedicated hotline" action="Call Now" />
          <ContactOption icon={Video} title="Screen Share Support" description="Real-time troubleshooting" action="Start Session" />
          <ContactOption icon={Mail} title="Email Support" description="Response within 2 hours" action="Send Email" />
        </div>
      </div>
    </div>
  );
}

type SupportMetricProps = {
  icon: typeof MessageSquare;
  label: string;
  value: string;
  change: string;
  trend: "positive" | "negative" | "stable";
};

function SupportMetric({ icon: Icon, label, value, change, trend }: SupportMetricProps) {
  const trendColors: Record<SupportMetricProps["trend"], string> = {
    positive: "text-green-600",
    negative: "text-red-600",
    stable: "text-gray-600",
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-purple-500" />
        <AlertCircle className="h-4 w-4 text-gray-200" />
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-xs ${trendColors[trend]}`}>{change}</p>
    </div>
  );
}

type TicketRowProps = {
  ticket: Ticket;
};

function TicketRow({ ticket }: TicketRowProps) {
  const priorityColors: Record<TicketPriority, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
  };

  const statusColors: Record<TicketStatus, string> = {
    open: "bg-blue-100 text-blue-700",
    "in-progress": "bg-yellow-100 text-yellow-700",
    resolved: "bg-green-100 text-green-700",
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <p className="text-sm font-semibold text-gray-900">{ticket.id}</p>
        <p className="text-xs text-gray-500">{ticket.created}</p>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2 text-sm text-gray-700">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span>{ticket.tenant}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        <p>{ticket.subject}</p>
        <p className="text-xs text-gray-500">{ticket.category}</p>
      </td>
      <td className="px-6 py-4">
        <span className={`rounded-full px-2 py-1 text-xs ${priorityColors[ticket.priority]}`}>
          {ticket.priority}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`rounded-full px-2 py-1 text-xs capitalize ${statusColors[ticket.status]}`}>
          {ticket.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-medium text-gray-900">{ticket.assignee}</p>
        <p className="text-xs text-gray-500">Updated {ticket.lastUpdate}</p>
      </td>
      <td className="px-6 py-4">
        <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View →</button>
      </td>
    </tr>
  );
}

type ContactOptionProps = {
  icon: typeof Phone;
  title: string;
  description: string;
  action: string;
};

function ContactOption({ icon: Icon, title, description, action }: ContactOptionProps) {
  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="flex items-start space-x-3">
        <div className="rounded-lg bg-purple-100 p-2">
          <Icon className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
          <button className="mt-3 text-sm font-semibold text-purple-600 hover:text-purple-700">{action} →</button>
        </div>
      </div>
    </div>
  );
}
