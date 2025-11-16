"use client";

import { ArrowRightCircle, BarChart3, FileSpreadsheet, PackageCheck } from "lucide-react";

type OrderStatus = "in-transit" | "delivered";
type RequestStatus = "open" | "in-progress" | "resolved";
type QuoteStatus = "awaiting approval" | "accepted";

interface CustomerOrder {
  id: string;
  status: OrderStatus;
  eta: string;
  carrier: string;
  items: number;
  value: string;
}

interface CatalogItem {
  sku: string;
  name: string;
  leadTime: string;
  price: string;
  moq: string;
}

interface QuoteRequest {
  id: string;
  value: string;
  status: QuoteStatus;
  submitted: string;
}

interface ServiceRequest {
  id: string;
  topic: string;
  priority: "low" | "medium" | "high";
  status: RequestStatus;
  updated: string;
}

interface AnalyticsMetric {
  label: string;
  value: string;
  trend: string;
}

const orders: CustomerOrder[] = [
  {
    id: "ORD-10921",
    status: "in-transit",
    eta: "Nov 17, 14:30",
    carrier: "Oonru Logistics",
    items: 12,
    value: "$42,800",
  },
  {
    id: "ORD-10910",
    status: "delivered",
    eta: "Nov 12, 10:15",
    carrier: "Oonru Logistics",
    items: 8,
    value: "$28,400",
  },
];

const catalog: CatalogItem[] = [
  { sku: "SKU-XL-101", name: "Premium Resin A", leadTime: "5 days", price: "$4.80/kg", moq: "500 kg" },
  { sku: "SKU-XL-305", name: "Catalyst Blend C", leadTime: "7 days", price: "$9.10/kg", moq: "200 kg" },
  { sku: "SKU-XL-520", name: "Additive Pack Z", leadTime: "10 days", price: "$12.50/kg", moq: "100 kg" },
];

const quotes: QuoteRequest[] = [
  { id: "RFQ-8831", value: "$118,400", status: "awaiting approval", submitted: "Nov 15" },
  { id: "RFQ-8822", value: "$86,700", status: "accepted", submitted: "Nov 10" },
];

const serviceRequests: ServiceRequest[] = [
  { id: "SR-2201", topic: "Delivery discrepancy", priority: "high", status: "open", updated: "2h ago" },
  { id: "SR-2197", topic: "Forecast alignment", priority: "medium", status: "in-progress", updated: "Yesterday" },
];

const analytics: AnalyticsMetric[] = [
  { label: "Fill Rate", value: "98.4%", trend: "+0.6%" },
  { label: "Average Lead Time", value: "6.3 days", trend: "-0.2 days" },
  { label: "Spend YTD", value: "$4.6M", trend: "+8%" },
];

export default function CustomerPortalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Customer workspace</p>
            <h1 className="text-3xl font-bold text-gray-900">Customer Portal</h1>
            <p className="text-gray-500">
              Self-service for tracking orders, browsing catalog items, and collaborating on quotes.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700">
            <ArrowRightCircle className="h-4 w-4" /> Place New Order
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <section className="grid gap-6 lg:grid-cols-2">
          <OrderTracking />
          <CustomerAnalytics />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <ProductCatalog />
          <QuoteManagement />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <ServiceRequests />
          <CustomerSupportCTA />
        </section>
      </main>
    </div>
  );
}

function OrderTracking() {
  const statusBadge: Record<OrderStatus, string> = {
    delivered: "bg-green-100 text-green-700",
    "in-transit": "bg-blue-100 text-blue-700",
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Order Tracking</h2>
        <button className="text-sm font-medium text-indigo-600">View all</button>
      </div>
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{order.id}</p>
              <p className="text-xs text-gray-500">
                {order.items} line items • {order.carrier}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold text-gray-900">ETA {order.eta}</p>
              <p className="text-xs text-gray-500">Value {order.value}</p>
            </div>
            <span className={`rounded px-2 py-1 text-xs font-medium ${statusBadge[order.status]}`}>
              {order.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductCatalog() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Product Catalog</h2>
        <button className="text-sm font-medium text-indigo-600">Download price list</button>
      </div>
      <div className="space-y-3 text-sm">
        {catalog.map((item) => (
          <div key={item.sku} className="rounded border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">{item.name}</p>
              <span className="text-xs text-gray-500">{item.sku}</span>
            </div>
            <div className="mt-2 grid grid-cols-3 text-xs text-gray-600">
              <p>Lead time: <span className="font-medium text-gray-900">{item.leadTime}</span></p>
              <p>Price: <span className="font-medium text-gray-900">{item.price}</span></p>
              <p>MOQ: <span className="font-medium text-gray-900">{item.moq}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuoteManagement() {
  const badgeColors: Record<QuoteStatus, string> = {
    accepted: "text-green-600",
    "awaiting approval": "text-yellow-600",
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Quote Management</h2>
        <button className="text-sm font-medium text-indigo-600">Create RFQ</button>
      </div>
      <div className="space-y-3 text-sm">
        {quotes.map((quote) => (
          <div key={quote.id} className="flex items-center justify-between rounded border border-gray-200 p-3">
            <div>
              <p className="font-semibold text-gray-900">{quote.id}</p>
              <p className="text-xs text-gray-500">Submitted {quote.submitted}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{quote.value}</p>
              <p className={`text-xs ${badgeColors[quote.status]}`}>{quote.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceRequests() {
  const statusStyles: Record<RequestStatus, string> = {
    open: "text-red-600",
    "in-progress": "text-blue-600",
    resolved: "text-green-600",
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Service Requests</h2>
        <button className="text-sm font-medium text-indigo-600">Raise ticket</button>
      </div>
      <div className="space-y-3 text-sm">
        {serviceRequests.map((request) => (
          <div key={request.id} className="flex items-center justify-between rounded border border-gray-200 p-3">
            <div>
              <p className="font-semibold text-gray-900">{request.topic}</p>
              <p className="text-xs text-gray-500">
                {request.id} • Priority {request.priority}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xs font-semibold ${statusStyles[request.status]}`}>
                {request.status}
              </p>
              <p className="text-[11px] text-gray-400">Updated {request.updated}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomerAnalytics() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Customer Analytics</h2>
        <BarChart3 className="h-5 w-5 text-indigo-500" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {analytics.map((metric) => (
          <div key={metric.label} className="rounded border border-gray-200 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">{metric.label}</p>
            <p className="text-xl font-semibold text-gray-900">{metric.value}</p>
            <p className="text-xs text-green-600">{metric.trend}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomerSupportCTA() {
  return (
    <div className="rounded-xl bg-indigo-600 p-6 text-white shadow-sm">
      <h3 className="text-lg font-semibold">Need help?</h3>
      <p className="text-sm text-indigo-100">
        White-glove support team is available 24/7 for expedite requests, forecast changes, and technical clarifications.
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <button className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/20">
          <PackageCheck className="h-4 w-4" /> Schedule call
        </button>
        <button className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-indigo-700">
          <FileSpreadsheet className="h-4 w-4" /> Share forecast
        </button>
      </div>
    </div>
  );
}
