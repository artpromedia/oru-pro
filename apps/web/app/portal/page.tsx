"use client";

import { useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle,
  Download,
  FileText,
  Package,
  Truck,
  Upload,
  Clock,
} from "lucide-react";

type PartnerInfo = {
  name: string;
  id: string;
  type: "supplier" | "3pl";
  rating: number;
  status: string;
};

type SupplierDashboard = {
  activeOrders: number;
  pendingInvoices: number;
  totalRevenue: number;
  onTimeDelivery: number;
  qualityScore: number;
  nextDelivery: string;
  documentsRequired: number;
};

type ActiveOrder = {
  po: string;
  items: number;
  total: number;
  requestedDate: string;
  status: "confirmed" | "pending_confirmation" | "in_preparation";
  deliveryWindow: string;
  dock: string;
};

type Shipment = {
  id: string;
  po: string;
  status: "in_transit" | "delivered" | "pending";
  carrier: string;
  tracking: string;
  eta: string;
  temperature: string;
  location: string;
};

const partnerInfo: PartnerInfo = {
  name: "Green Valley Farms",
  id: "SUP-001",
  type: "supplier",
  rating: 4.8,
  status: "preferred",
};

const supplierDashboard: SupplierDashboard = {
  activeOrders: 12,
  pendingInvoices: 3,
  totalRevenue: 247_500,
  onTimeDelivery: 97,
  qualityScore: 98,
  nextDelivery: "2025-11-17",
  documentsRequired: 2,
};

const activeOrders: ActiveOrder[] = [
  {
    po: "PO-2025-11251",
    items: 8,
    total: 45_600,
    requestedDate: "2025-11-18",
    status: "confirmed",
    deliveryWindow: "08:00-12:00",
    dock: "DOCK-01",
  },
  {
    po: "PO-2025-11248",
    items: 5,
    total: 23_400,
    requestedDate: "2025-11-20",
    status: "pending_confirmation",
    deliveryWindow: "TBD",
    dock: "TBD",
  },
];

const shipments: Shipment[] = [
  {
    id: "SHP-2025-1847",
    po: "PO-2025-11245",
    status: "in_transit",
    carrier: "Partner Fleet",
    tracking: "GVF-982374",
    eta: "2025-11-16 10:30",
    temperature: "3.8°C",
    location: "En route - 45km away",
  },
];

export default function PartnerPortal() {
  const [partnerType, setPartnerType] = useState<PartnerInfo["type"]>(partnerInfo.type);
  const [activeView, setActiveView] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Partner Experience</p>
              <h1 className="text-2xl font-bold text-gray-900">Partner Portal</h1>
              <p className="text-sm text-gray-500">
                {partnerInfo.name} · {partnerInfo.id} · {partnerType === "supplier" ? "Supplier" : "3PL"}
              </p>
              <div className="mt-2 inline-flex rounded-full border border-gray-200 bg-gray-50 text-xs text-gray-600">
                {(["supplier", "3pl"] as PartnerInfo["type"][]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setPartnerType(type)}
                    className={`px-3 py-1 capitalize ${
                      partnerType === type ? "bg-white font-semibold text-blue-600 shadow-sm" : ""
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-lg p-2 hover:bg-gray-50">
                <Bell className="h-5 w-5 text-gray-500" />
              </button>
              <div className="flex items-center gap-2 rounded-full bg-green-500 px-3 py-1 text-sm font-semibold text-white">
                GV
              </div>
            </div>
          </div>
        </div>
        <div className="px-6">
          <nav className="flex flex-wrap gap-6 text-sm font-medium text-gray-500">
            {["Dashboard", "Orders", "Shipments", "Documents", "Analytics"].map((tab) => {
              const tabKey = tab.toLowerCase();
              const isActive = activeView === tabKey;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveView(tabKey)}
                  className={`border-b-2 py-4 transition ${
                    isActive ? "border-blue-600 text-blue-600" : "border-transparent hover:text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="p-6">
        {activeView === "dashboard" && (
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <PortalMetricCard icon={Package} label="Active Orders" value={supplierDashboard.activeOrders.toString()} />
              <PortalMetricCard
                icon={FileText}
                label="Pending Invoices"
                value={supplierDashboard.pendingInvoices.toString()}
                alert
              />
              <PortalMetricCard
                icon={CheckCircle}
                label="On-Time Delivery"
                value={`${supplierDashboard.onTimeDelivery}%`}
                success
              />
              <PortalMetricCard
                icon={BarChart3}
                label="Quality Score"
                value={`${supplierDashboard.qualityScore}%`}
                success
              />
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Active Orders</h2>
                  <p className="text-sm text-gray-500">Dock assignments and last-mile confirmations</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="h-3 w-3" /> Next delivery {supplierDashboard.nextDelivery}
                </span>
              </div>
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <PartnerOrderCard key={order.po} order={order} />
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Shipments in Transit</h2>
                <span className="text-xs text-gray-400">Cold-chain + telematics monitoring</span>
              </div>
              <div className="space-y-4">
                {shipments.map((shipment) => (
                  <ShipmentTrackingCard key={shipment.id} shipment={shipment} />
                ))}
              </div>
            </section>
          </div>
        )}

        {activeView === "documents" && <DocumentManagement partnerId={partnerInfo.id} />}

        {activeView !== "dashboard" && activeView !== "documents" && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/80 p-12 text-center text-sm text-gray-500">
            View "{activeView}" is coming soon for partner self-service.
          </div>
        )}
      </main>
    </div>
  );
}

type PortalMetricCardProps = {
  icon: typeof Package;
  label: string;
  value: string;
  alert?: boolean;
  success?: boolean;
};

function PortalMetricCard({ icon: Icon, label, value, alert, success }: PortalMetricCardProps) {
  const palette = alert ? "text-orange-600" : success ? "text-green-600" : "text-gray-900";

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <Icon className={`h-5 w-5 ${alert ? "text-orange-500" : success ? "text-green-500" : "text-gray-400"}`} />
        {alert && (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
            <AlertCircle className="h-3 w-3" /> Action
          </span>
        )}
      </div>
      <p className={`mt-3 text-2xl font-bold ${palette}`}>{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

type PartnerOrderCardProps = {
  order: ActiveOrder;
};

function PartnerOrderCard({ order }: PartnerOrderCardProps) {
  const statusColors: Record<ActiveOrder["status"], string> = {
    confirmed: "bg-green-100 text-green-700",
    pending_confirmation: "bg-yellow-100 text-yellow-700",
    in_preparation: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">{order.po}</h3>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${statusColors[order.status]}`}>
              {order.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {order.items} items · ${order.total.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Requested</p>
          <p className="text-sm font-semibold text-gray-900">{order.requestedDate}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-2">
        <div>
          <p className="text-xs text-gray-500">Delivery Window</p>
          <p className="font-semibold text-gray-900">{order.deliveryWindow}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Dock</p>
          <p className="font-semibold text-gray-900">{order.dock}</p>
        </div>
      </div>
      {order.status === "pending_confirmation" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="flex-1 rounded-md bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600">
            Confirm Order
          </button>
          <button className="flex-1 rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50">
            Propose Changes
          </button>
        </div>
      )}
    </div>
  );
}

type ShipmentTrackingCardProps = {
  shipment: Shipment;
};

function ShipmentTrackingCard({ shipment }: ShipmentTrackingCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{shipment.id}</h3>
          <p className="text-sm text-gray-600">PO {shipment.po}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
          <Truck className="h-3 w-3" />
          {shipment.status.replace("_", " ")}
        </span>
      </div>
      <div className="mb-3 grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-3">
        <div>
          <p className="text-xs text-gray-500">Tracking</p>
          <p className="font-semibold text-gray-900">{shipment.tracking}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">ETA</p>
          <p className="font-semibold text-gray-900">{shipment.eta}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Temperature</p>
          <p className="font-semibold text-green-600">{shipment.temperature}</p>
        </div>
      </div>
      <div className="rounded-lg bg-blue-50 p-2 text-xs text-blue-700">{shipment.location}</div>
    </div>
  );
}

type DocumentManagementProps = {
  partnerId: string;
};

type Document = {
  name: string;
  type: string;
  expiry: string | null;
  status: "valid" | "expiring" | "expired";
};

function DocumentManagement({ partnerId }: DocumentManagementProps) {
  const documents: Document[] = [
    { name: "Organic Certificate 2025", type: "Certificate", expiry: "2025-12-31", status: "valid" },
    { name: "Insurance Policy", type: "Insurance", expiry: "2025-06-30", status: "expiring" },
    { name: "FDA Registration", type: "Compliance", expiry: "2026-03-15", status: "valid" },
    { name: "W-9 Form", type: "Tax", expiry: null, status: "valid" },
  ];

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Document Management</h2>
          <p className="text-sm text-gray-500">Partner ID: {partnerId}</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
          <Upload className="h-4 w-4" />
          Upload Document
        </button>
      </div>
      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.name} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
                <p className="text-xs text-gray-500">{doc.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {doc.expiry ? (
                <div className="text-right text-xs text-gray-500">
                  <p>Expires</p>
                  <p className="text-sm font-semibold text-gray-900">{doc.expiry}</p>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" /> Ongoing
                </div>
              )}
              <StatusBadge status={doc.status} />
              <button className="rounded-md p-2 hover:bg-gray-50">
                <Download className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type StatusBadgeProps = {
  status: Document["status"];
};

function StatusBadge({ status }: StatusBadgeProps) {
  const colors: Record<Document["status"], string> = {
    valid: "bg-green-100 text-green-700",
    expiring: "bg-yellow-100 text-yellow-700",
    expired: "bg-red-100 text-red-700",
  };

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${colors[status]}`}>{status}</span>;
}
