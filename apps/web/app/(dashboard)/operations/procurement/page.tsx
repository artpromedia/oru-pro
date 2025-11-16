"use client";

import { useState } from "react";
import {
  AlertCircle,
  Award,
  BarChart3,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";

type PurchaseOrder = {
  id: string;
  supplier: string;
  items: number;
  total: number;
  status: "pending_approval" | "approved" | "in_transit" | "delivered" | "cancelled";
  priority: "high" | "medium" | "low";
  requestedBy: string;
  deliveryDate: string;
  category: string;
  approvalLevel?: string;
  savings?: number;
  compliance?: boolean;
  trackingNumber?: string;
  estimatedArrival?: string;
  carrier?: string;
  currentLocation?: string;
};

type Supplier = {
  id: string;
  name: string;
  category: string;
  rating: number;
  performance: number;
  orders: number;
  onTimeDelivery: number;
  qualityScore: number;
  spend: number;
  status: "preferred" | "approved" | "under_review" | "suspended";
  certificates: string[];
  lastAudit: string;
  riskScore: "low" | "medium" | "high";
  issues?: string[];
};

const purchaseOrders: PurchaseOrder[] = [
  {
    id: "PO-2025-11251",
    supplier: "Green Valley Farms",
    items: 8,
    total: 45600,
    status: "pending_approval",
    priority: "high",
    requestedBy: "Inventory Agent",
    deliveryDate: "2025-11-18",
    category: "Raw Materials",
    approvalLevel: "Manager",
    savings: 2300,
    compliance: true,
  },
  {
    id: "PO-2025-11250",
    supplier: "PackagingPro Inc",
    items: 3,
    total: 12500,
    status: "approved",
    priority: "medium",
    requestedBy: "Production Planning",
    deliveryDate: "2025-11-20",
    category: "Packaging",
    trackingNumber: "TRK-982374",
    estimatedArrival: "2025-11-19 14:00",
  },
  {
    id: "PO-2025-11249",
    supplier: "ChemSupply Co",
    items: 5,
    total: 8900,
    status: "in_transit",
    priority: "low",
    requestedBy: "QA Department",
    deliveryDate: "2025-11-17",
    category: "Lab Supplies",
    carrier: "FedEx",
    currentLocation: "Distribution Center",
  },
];

const suppliers: Supplier[] = [
  {
    id: "SUP-001",
    name: "Green Valley Farms",
    category: "Dairy Products",
    rating: 4.8,
    performance: 94,
    orders: 234,
    onTimeDelivery: 97,
    qualityScore: 98,
    spend: 2_847_000,
    status: "preferred",
    certificates: ["Organic", "ISO 9001", "HACCP"],
    lastAudit: "2025-10-15",
    riskScore: "low",
  },
  {
    id: "SUP-002",
    name: "Miller Farms",
    category: "Grains & Flour",
    rating: 4.5,
    performance: 88,
    orders: 156,
    onTimeDelivery: 92,
    qualityScore: 95,
    spend: 1_563_000,
    status: "approved",
    certificates: ["ISO 9001", "Non-GMO"],
    lastAudit: "2025-09-20",
    riskScore: "low",
  },
  {
    id: "SUP-003",
    name: "Fresh Produce Direct",
    category: "Fruits & Vegetables",
    rating: 4.2,
    performance: 82,
    orders: 89,
    onTimeDelivery: 85,
    qualityScore: 90,
    spend: 567_000,
    status: "under_review",
    certificates: ["Organic"],
    lastAudit: "2025-08-10",
    riskScore: "medium",
    issues: ["2 quality incidents", "Payment terms negotiation"],
  },
];

const procurementMetrics = {
  totalSpend: 4_977_000,
  activeOrders: 47,
  pendingApprovals: 12,
  savings: 234_500,
  supplierCount: 87,
  avgLeadTime: 3.2,
  contractCompliance: 94,
  maverick: 6,
};

const insights = [
  {
    type: "savings" as const,
    title: "Cost Saving Opportunity",
    description: "Bundle orders from 3 suppliers to save $12,400",
    action: "View Details",
  },
  {
    type: "risk" as const,
    title: "Supplier Risk Alert",
    description: "Fresh Produce Direct showing delivery delays",
    action: "Find Alternative",
  },
  {
    type: "optimization" as const,
    title: "Contract Optimization",
    description: "5 contracts up for renewal with better terms available",
    action: "Review Contracts",
  },
  {
    type: "forecast" as const,
    title: "Demand Forecast",
    description: "Increase dairy orders by 20% for holiday season",
    action: "Adjust Orders",
  },
];

export default function ProcurementDashboard() {
  const [activeView, setActiveView] = useState("orders");

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Procurement Management</h1>
          <p className="text-sm text-gray-500">Purchase orders and supplier management</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Supplier Portal
          </button>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
            Create PO
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <MetricCard icon={DollarSign} label="Total Spend" value={`$${(procurementMetrics.totalSpend / 1_000_000).toFixed(1)}M`} />
        <MetricCard icon={ShoppingCart} label="Active POs" value={procurementMetrics.activeOrders.toString()} />
        <MetricCard icon={Clock} label="Pending" value={procurementMetrics.pendingApprovals.toString()} alert />
        <MetricCard icon={TrendingUp} label="Savings YTD" value={`$${(procurementMetrics.savings / 1_000).toFixed(0)}K`} success />
        <MetricCard icon={Users} label="Suppliers" value={procurementMetrics.supplierCount.toString()} />
        <MetricCard icon={Calendar} label="Avg Lead Time" value={`${procurementMetrics.avgLeadTime} days`} />
        <MetricCard icon={CheckCircle} label="Compliance" value={`${procurementMetrics.contractCompliance}%`} />
        <MetricCard icon={AlertCircle} label="Maverick" value={`${procurementMetrics.maverick}%`} warning />
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6">
          <nav className="flex flex-wrap gap-4 text-sm font-medium text-gray-500">
            {["Orders", "Suppliers", "Contracts", "Approvals"].map((tab) => {
              const value = tab.toLowerCase();
              const isActive = activeView === value;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveView(value)}
                  className={`border-b-2 py-4 transition ${
                    isActive ? "border-blue-600 text-blue-600" : "border-transparent hover:text-gray-700"
                  }`}
                >
                  {tab}
                  {tab === "Approvals" && procurementMetrics.pendingApprovals > 0 && (
                    <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">
                      {procurementMetrics.pendingApprovals}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="p-6">
          {activeView === "orders" && (
            <div className="space-y-4">
              {purchaseOrders.map((order) => (
                <PurchaseOrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
          {activeView === "suppliers" && (
            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <SupplierCard key={supplier.id} supplier={supplier} />
              ))}
            </div>
          )}
          {activeView === "approvals" && <ApprovalQueue orders={purchaseOrders.filter((order) => order.status === "pending_approval")} />}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Procurement Intelligence</h2>
            <p className="text-sm text-gray-500">Autonomous agents surfacing savings, risk, and forecast actions</p>
          </div>
          <Brain className="h-5 w-5 text-blue-500" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {insights.map((insight) => (
            <AIInsight key={insight.title} {...insight} />
          ))}
        </div>
      </section>
    </div>
  );
}

type MetricCardProps = {
  icon: typeof DollarSign;
  label: string;
  value: string;
  alert?: boolean;
  success?: boolean;
  warning?: boolean;
};

function MetricCard({ icon: Icon, label, value, alert, success, warning }: MetricCardProps) {
  const color = alert ? "text-red-600" : success ? "text-green-600" : warning ? "text-yellow-600" : "text-gray-900";

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <Icon className={`h-4 w-4 ${alert ? "text-red-500" : success ? "text-green-500" : warning ? "text-yellow-500" : "text-gray-500"}`} />
      <p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  );
}

type PurchaseOrderCardProps = {
  order: PurchaseOrder;
};

function PurchaseOrderCard({ order }: PurchaseOrderCardProps) {
  const statusColors: Record<PurchaseOrder["status"], string> = {
    pending_approval: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    in_transit: "bg-blue-100 text-blue-700",
    delivered: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">{order.id}</h3>
            <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusColors[order.status]}`}>
              {order.status.replace("_", " ")}
            </span>
            {order.priority === "high" && <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">High Priority</span>}
          </div>
          <p className="text-sm text-gray-600">{order.supplier}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">${order.total.toLocaleString()}</p>
          <p className="text-xs text-gray-500">{order.items} items</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div>
          <p className="text-xs text-gray-500">Requested By</p>
          <p className="font-medium text-gray-900">{order.requestedBy}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Category</p>
          <p className="font-medium text-gray-900">{order.category}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Delivery</p>
          <p className="font-medium text-gray-900">{order.deliveryDate}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Compliance</p>
          <p className="font-medium text-gray-900">{order.compliance ? "✓ Compliant" : "Review Required"}</p>
        </div>
      </div>
      {order.status === "pending_approval" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="flex-1 rounded-md bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600">Approve</button>
          <button className="flex-1 rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50">Request Info</button>
          <button className="flex-1 rounded-md bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600">Reject</button>
        </div>
      )}
      {order.trackingNumber && (
        <div className="mt-3 rounded-lg bg-blue-50 p-2 text-xs text-blue-700">
          Tracking {order.trackingNumber} · ETA {order.estimatedArrival}
        </div>
      )}
    </div>
  );
}

type SupplierCardProps = {
  supplier: Supplier;
};

function SupplierCard({ supplier }: SupplierCardProps) {
  const statusColors: Record<Supplier["status"], string> = {
    preferred: "bg-green-100 text-green-700",
    approved: "bg-blue-100 text-blue-700",
    under_review: "bg-yellow-100 text-yellow-700",
    suspended: "bg-red-100 text-red-700",
  };

  const riskColors: Record<Supplier["riskScore"], string> = {
    low: "text-green-600",
    medium: "text-yellow-600",
    high: "text-red-600",
  };

  return (
    <div className="rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">{supplier.name}</h3>
            <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusColors[supplier.status]}`}>
              {supplier.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-sm text-gray-600">{supplier.category}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Award className="h-4 w-4 text-yellow-500" />
            <span className="text-xl font-semibold text-gray-900">{supplier.rating.toFixed(1)}</span>
          </div>
          <p className={`text-xs font-semibold ${riskColors[supplier.riskScore]}`}>Risk {supplier.riskScore}</p>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div>
          <p className="text-xs text-gray-500">Performance</p>
          <p className="font-semibold text-gray-900">{supplier.performance}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">On-Time</p>
          <p className="font-semibold text-gray-900">{supplier.onTimeDelivery}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Quality</p>
          <p className="font-semibold text-gray-900">{supplier.qualityScore}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total Spend</p>
          <p className="font-semibold text-gray-900">${(supplier.spend / 1_000_000).toFixed(1)}M</p>
        </div>
      </div>
      <div className="mb-2 flex flex-wrap gap-1 text-xs text-gray-600">
        {supplier.certificates.map((certificate) => (
          <span key={certificate} className="rounded-full bg-gray-100 px-2 py-1">
            {certificate}
          </span>
        ))}
      </div>
      {supplier.issues && (
        <div className="rounded-lg bg-orange-50 p-2 text-xs text-orange-700">
          {supplier.issues.join(" • ")}
        </div>
      )}
    </div>
  );
}

type ApprovalQueueProps = {
  orders: PurchaseOrder[];
};

function ApprovalQueue({ orders }: ApprovalQueueProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
        <div className="flex items-center gap-2 text-orange-900">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-semibold">{orders.length} purchase orders pending approval</p>
        </div>
      </div>
      {orders.map((order) => (
        <div key={order.id} className="rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {order.id} · {order.supplier}
              </p>
              <p className="text-xs text-gray-500">
                ${order.total.toLocaleString()} · {order.items} items · Due {order.deliveryDate}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-md bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600">Approve</button>
              <button className="rounded-md bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600">Reject</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

type AIInsightProps = {
  type: "savings" | "risk" | "optimization" | "forecast";
  title: string;
  description: string;
  action: string;
};

function AIInsight({ type, title, description, action }: AIInsightProps) {
  const iconMap: Record<AIInsightProps["type"], typeof DollarSign> = {
    savings: DollarSign,
    risk: AlertCircle,
    optimization: TrendingUp,
    forecast: BarChart3,
  };
  const Icon = iconMap[type];

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
      <div className="mb-2 flex items-start gap-2">
        <Icon className="h-4 w-4 text-blue-600" />
        <div>
          <p className="text-sm font-semibold text-blue-900">{title}</p>
          <p className="text-xs text-blue-700">{description}</p>
        </div>
      </div>
      <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">{action} →</button>
    </div>
  );
}
