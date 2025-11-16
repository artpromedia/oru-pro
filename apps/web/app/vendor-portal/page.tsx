"use client";

import {
  ArrowUpRight,
  Download,
  FileText,
  Inbox,
  MessageCircle,
  ShieldCheck,
  Upload,
} from "lucide-react";

interface PurchaseOrder {
  id: string;
  customer: string;
  amount: string;
  dueDate: string;
  status: "pending" | "approved" | "shipped";
  items: number;
}

interface SupplierScorecard {
  metric: string;
  value: string;
  trend: string;
  status: "good" | "warning" | "risk";
}

const purchaseOrders: PurchaseOrder[] = [
  { id: "PO-2025-4570", customer: "Oonru Ops", amount: "$182,000", dueDate: "Nov 20, 2025", status: "pending", items: 24 },
  { id: "PO-2025-4568", customer: "Oonru Ops", amount: "$96,500", dueDate: "Nov 22, 2025", status: "approved", items: 14 },
  { id: "PO-2025-4562", customer: "Oonru Ops", amount: "$64,200", dueDate: "Nov 25, 2025", status: "shipped", items: 9 },
];

const scorecard: SupplierScorecard[] = [
  { metric: "On-Time Delivery", value: "97.2%", trend: "+1.1%", status: "good" },
  { metric: "Quality Acceptance", value: "99.1%", trend: "+0.4%", status: "good" },
  { metric: "ASN Accuracy", value: "94.5%", trend: "-0.8%", status: "warning" },
  { metric: "Response SLA", value: "2h 14m", trend: "-12m", status: "good" },
];

const documents = [
  { id: "COA-18392", type: "Certificate of Analysis", owner: "QA", status: "approved" },
  { id: "MSDS-82911", type: "Safety Datasheet", owner: "Compliance", status: "pending" },
  { id: "NDA-23019", type: "Contract", owner: "Legal", status: "approved" },
];

const invoices = [
  { id: "INV-30215", po: "PO-2025-4562", amount: "$64,200", status: "processing", submitted: "Nov 15" },
  { id: "INV-30210", po: "PO-2025-4550", amount: "$112,300", status: "approved", submitted: "Nov 10" },
];

const collaborationFeed = [
  { id: 1, actor: "Buyer Ops", action: "requested ASN update", time: "2h ago" },
  { id: 2, actor: "Vendor QA", action: "uploaded COA for PO-4568", time: "6h ago" },
  { id: 3, actor: "Logistics", action: "confirmed pickup slot", time: "Yesterday" },
];

export default function VendorPortalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <VendorHeader />
      <main className="space-y-8 p-6">
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <PurchaseOrderList />
            <DocumentExchange />
            <VendorCollaboration />
          </div>
          <div className="space-y-6">
            <VendorScorecard />
            <InvoiceManagement />
          </div>
        </section>
      </main>
    </div>
  );
}

function VendorHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Partner view</p>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Portal</h1>
          <p className="text-gray-500">Single workspace for purchase orders, docs, ASNs, and collaboration.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50">
            <Upload className="h-4 w-4" /> Upload Docs
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700">
            <Inbox className="h-4 w-4" /> Create ASN
          </button>
        </div>
      </div>
    </header>
  );
}

function PurchaseOrderList() {
  const badgeStyles: Record<PurchaseOrder["status"], string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-700",
    shipped: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Purchase Orders</h2>
        <button className="text-sm font-medium text-purple-600">View all</button>
      </div>
      <div className="space-y-3">
        {purchaseOrders.map((po) => (
          <div key={po.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {po.id} • {po.customer}
              </p>
              <p className="text-xs text-gray-500">
                {po.items} line items • Due {po.dueDate}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-gray-900">{po.amount}</span>
              <span className={`rounded px-2 py-1 text-xs font-medium ${badgeStyles[po.status]}`}>
                {po.status}
              </span>
              <button className="rounded border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                Acknowledge
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorScorecard() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Performance Scorecard</h2>
          <p className="text-xs text-gray-500">Rolling 90-day window</p>
        </div>
        <ShieldCheck className="h-5 w-5 text-purple-500" />
      </div>
      <div className="space-y-3">
        {scorecard.map((metric) => (
          <div key={metric.metric} className="flex items-center justify-between rounded border border-gray-100 p-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">{metric.metric}</p>
              <p className="text-lg font-semibold text-gray-900">{metric.value}</p>
            </div>
            <span
              className={`text-sm font-medium ${
                metric.status === "good"
                  ? "text-green-600"
                  : metric.status === "warning"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {metric.trend}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentExchange() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Document Exchange</h2>
          <p className="text-xs text-gray-500">COAs, MSDS, compliance packs</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
          <Download className="h-4 w-4" /> Download All
        </button>
      </div>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between rounded border border-gray-200 p-3 text-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-purple-500" />
              <div>
                <p className="font-semibold text-gray-900">{doc.type}</p>
                <p className="text-xs text-gray-500">{doc.id} • Owner: {doc.owner}</p>
              </div>
            </div>
            <span
              className={`text-xs font-medium ${
                doc.status === "approved" ? "text-green-600" : "text-yellow-600"
              }`}
            >
              {doc.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoiceManagement() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Invoice Management</h2>
        <button className="inline-flex items-center gap-2 rounded border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
          <ArrowUpRight className="h-4 w-4" /> Submit Invoice
        </button>
      </div>
      <div className="space-y-2">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="flex items-center justify-between rounded border border-gray-200 p-3 text-sm">
            <div>
              <p className="font-semibold text-gray-900">{invoice.id}</p>
              <p className="text-xs text-gray-500">
                {invoice.po} • Submitted {invoice.submitted}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{invoice.amount}</p>
              <p
                className={`text-xs ${
                  invoice.status === "approved"
                    ? "text-green-600"
                    : invoice.status === "processing"
                    ? "text-purple-600"
                    : "text-gray-500"
                }`}
              >
                {invoice.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorCollaboration() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Collaboration Feed</h2>
          <p className="text-xs text-gray-500">Messages, ASN updates, escalation threads</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
          <MessageCircle className="h-4 w-4" /> New message
        </button>
      </div>
      <div className="space-y-3">
        {collaborationFeed.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded border border-gray-200 p-3 text-sm">
            <div>
              <p className="font-semibold text-gray-900">{item.actor}</p>
              <p className="text-xs text-gray-500">{item.action}</p>
            </div>
            <span className="text-xs text-gray-400">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
