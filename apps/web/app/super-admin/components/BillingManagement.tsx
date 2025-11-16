"use client";

import { useMemo, useState } from "react";
import { Building2, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";

type RevenueMetrics = {
  mrr: number;
  arr: number;
  growth: number;
  churn: number;
  arpu: number;
  ltv: number;
  collections: number;
  outstanding: number;
};

type Subscription = {
  tenant: string;
  id: string;
  plan: string;
  amount: number;
  billing: string;
  nextBill: string;
  status: "active" | "past_due" | "cancelled";
  paymentMethod: string;
  modules: number;
  users: number;
  overages: number;
  pastDue?: number;
};

type UpcomingInvoice = {
  id: string;
  tenant: string;
  amount: number;
  dueDate: string;
  items: string[];
};

type RevenueCardProps = {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  isPositive?: boolean;
};

type SubscriptionRowProps = {
  subscription: Subscription;
};

type InvoiceCardProps = {
  invoice: UpcomingInvoice;
};

type PaymentMethodStat = {
  type: string;
  count: number;
  percentage: number;
};

const revenueMetrics: RevenueMetrics = {
  mrr: 734_500,
  arr: 8_814_000,
  growth: 28,
  churn: 2.1,
  arpu: 5000,
  ltv: 125_000,
  collections: 98.5,
  outstanding: 23_450,
};

const subscriptions: Subscription[] = [
  {
    tenant: "AcmeCorp",
    id: "ORU-ACMECORP-001",
    plan: "Enterprise",
    amount: 24_500,
    billing: "Monthly",
    nextBill: "2025-12-01",
    status: "active",
    paymentMethod: "ACH Transfer",
    modules: 12,
    users: 523,
    overages: 2340,
  },
  {
    tenant: "TechCorp Industries",
    id: "ORU-TECHCORP-002",
    plan: "Professional",
    amount: 12_500,
    billing: "Annual",
    nextBill: "2026-06-20",
    status: "active",
    paymentMethod: "Credit Card",
    modules: 8,
    users: 247,
    overages: 0,
  },
  {
    tenant: "FoodChain Co",
    id: "ORU-FOODCHAIN-003",
    plan: "Enterprise",
    amount: 18_500,
    billing: "Monthly",
    nextBill: "2025-12-01",
    status: "active",
    paymentMethod: "Wire Transfer",
    modules: 10,
    users: 445,
    overages: 1250,
  },
  {
    tenant: "Global Logistics Inc",
    id: "ORU-LOGISTICS-004",
    plan: "Professional",
    amount: 8500,
    billing: "Monthly",
    nextBill: "2025-12-01",
    status: "past_due",
    paymentMethod: "Credit Card",
    modules: 6,
    users: 156,
    overages: 0,
    pastDue: 17_000,
  },
];

const upcomingInvoices: UpcomingInvoice[] = [
  {
    id: "INV-2025-11-001",
    tenant: "AcmeCorp",
    amount: 26_840,
    dueDate: "2025-12-01",
    items: ["Enterprise Plan", "User Overages", "Storage Overages"],
  },
  {
    id: "INV-2025-11-002",
    tenant: "FoodChain Co",
    amount: 19_750,
    dueDate: "2025-12-01",
    items: ["Enterprise Plan", "API Overages"],
  },
];

const methodStats: PaymentMethodStat[] = [
  { type: "ACH Transfer", count: 45, percentage: 38 },
  { type: "Wire Transfer", count: 32, percentage: 27 },
  { type: "Credit Card", count: 28, percentage: 24 },
  { type: "Invoice", count: 13, percentage: 11 },
];

export function BillingManagement() {
  const [selectedPeriod, setSelectedPeriod] = useState("current");

  const tableSubscriptions = useMemo(() => {
    if (selectedPeriod === "next") {
      return subscriptions.filter((sub) => sub.billing !== "Monthly");
    }
    if (selectedPeriod === "quarter") {
      return subscriptions;
    }
    return subscriptions.filter((sub) => sub.billing === "Monthly");
  }, [selectedPeriod]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <RevenueCard
          label="Monthly Recurring"
          value={`$${(revenueMetrics.mrr / 1000).toFixed(0)}k`}
          change={`+${revenueMetrics.growth}%`}
          trend="up"
        />
        <RevenueCard
          label="Annual Recurring"
          value={`$${(revenueMetrics.arr / 1_000_000).toFixed(1)}M`}
          change={`+${revenueMetrics.growth}%`}
          trend="up"
        />
        <RevenueCard
          label="Avg Revenue per User"
          value={`$${revenueMetrics.arpu.toLocaleString()}`}
          change="+12% MoM"
          trend="up"
        />
        <RevenueCard
          label="Churn Rate"
          value={`${revenueMetrics.churn}%`}
          change="-0.3% MoM"
          trend="down"
          isPositive={false}
        />
      </div>

      <div className="rounded-2xl bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Active Subscriptions</h2>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(event) => setSelectedPeriod(event.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
            >
              <option value="current">Current Month</option>
              <option value="next">Next Month</option>
              <option value="quarter">This Quarter</option>
            </select>
            <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
              Export Invoices
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {[
                  "Tenant",
                  "Plan",
                  "Amount",
                  "Billing",
                  "Usage",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} className="px-6 py-3 text-left">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableSubscriptions.map((subscription) => (
                <SubscriptionRow key={subscription.id} subscription={subscription} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Upcoming Invoices</h3>
          <div className="space-y-3">
            {upcomingInvoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Payment Method Distribution</h3>
          <PaymentMethodStats methods={methodStats} />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">Revenue Trend (Last 12 Months)</h3>
        <RevenueChart />
      </div>
    </div>
  );
}

function RevenueCard({ label, value, change, trend, isPositive = true }: RevenueCardProps) {
  const TrendIcon = trend === "up" ? ChevronUp : ChevronDown;
  const trendColor = trend === "up"
    ? isPositive
      ? "text-green-600"
      : "text-red-600"
    : isPositive
      ? "text-red-600"
      : "text-green-600";

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      <div className={`mt-2 flex items-center gap-1 text-sm ${trendColor}`}>
        <TrendIcon className="h-4 w-4" />
        <span>{change}</span>
      </div>
    </div>
  );
}

function SubscriptionRow({ subscription }: SubscriptionRowProps) {
  const statusColors: Record<Subscription["status"], string> = {
    active: "bg-green-100 text-green-700",
    past_due: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-700",
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">{subscription.tenant}</p>
            <p className="text-xs text-gray-500">{subscription.id}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-medium text-gray-900">{subscription.plan}</p>
        <p className="text-xs text-gray-500">{subscription.modules} modules</p>
      </td>
      <td className="px-6 py-4">
        <p className="font-semibold text-gray-900">${subscription.amount.toLocaleString()}</p>
        {subscription.overages > 0 && (
          <p className="text-xs text-yellow-600">+${subscription.overages.toLocaleString()} overages</p>
        )}
        {subscription.pastDue && (
          <p className="text-xs text-red-600">${subscription.pastDue.toLocaleString()} past due</p>
        )}
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-gray-900">{subscription.billing}</p>
        <p className="text-xs text-gray-500">Next: {subscription.nextBill}</p>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-gray-900">{subscription.users} users</p>
        <p className="text-xs text-gray-500">{subscription.paymentMethod}</p>
      </td>
      <td className="px-6 py-4">
        <span className={`rounded-full px-2 py-1 text-xs capitalize ${statusColors[subscription.status]}`}>
          {subscription.status.replace("_", " ")}
        </span>
      </td>
      <td className="px-6 py-4">
        <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">Manage →</button>
      </td>
    </tr>
  );
}

function InvoiceCard({ invoice }: InvoiceCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-900">{invoice.id}</p>
          <p className="text-sm text-gray-600">{invoice.tenant}</p>
          <p className="mt-1 text-xs text-gray-500">Due: {invoice.dueDate}</p>
          <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-gray-500">
            {invoice.items.map((item) => (
              <span key={item} className="rounded-full bg-gray-100 px-2 py-0.5">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">${invoice.amount.toLocaleString()}</p>
          <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">Preview →</button>
        </div>
      </div>
    </div>
  );
}

type PaymentMethodStatsProps = {
  methods: PaymentMethodStat[];
};

function PaymentMethodStats({ methods }: PaymentMethodStatsProps) {
  return (
    <div className="space-y-3">
      {methods.map((method) => (
        <div key={method.type}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-gray-600">{method.type}</span>
            <span className="font-medium text-gray-900">
              {method.count} ({method.percentage}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div className="h-2 rounded-full bg-purple-500" style={{ width: `${method.percentage}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RevenueChart() {
  return (
    <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-center">
      <TrendingUp className="mb-3 h-10 w-10 text-gray-400" />
      <p className="text-sm text-gray-500">Revenue chart visualization placeholder</p>
    </div>
  );
}
