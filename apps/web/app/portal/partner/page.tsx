import type { Metadata } from "next";
import Link from "next/link";
import { Card, Button } from "@oru/ui";

export const metadata: Metadata = {
  title: "Partner Portal | Oru",
  description: "Collaborate with 3PLs, suppliers, and enterprise buyers in one operations-first workspace"
};

const carriers = [
  { name: "Polar Cold Chain", status: "In Transit", temperature: "-18°C", lane: "Chicago ➜ Dallas", alert: false },
  { name: "FreshFlow 3PL", status: "Arrived", temperature: "3°C", lane: "LA ➜ Phoenix", alert: true }
];

const supplierRequests = [
  {
    supplier: "Verdant Greens Co.",
    item: "Baby Kale (2.5kg)",
    eta: "2025-11-18",
    actions: ["Confirm", "Update"],
    scenario: "Ingredient supplier covering wellness launch"
  },
  {
    supplier: "Artisan Dairy Guild",
    item: "Buffalo Mozzarella",
    eta: "2025-11-21",
    actions: ["Approve", "Chat"],
    scenario: "High-moisture cheese for Neapolitan program"
  }
];

const customerOrders = [
  { customer: "Gather Hospitality", status: "Awaiting docs", reference: "ORD-98312", temperature: "Chilled" },
  { customer: "Campus Kitchen", status: "In transit", reference: "ORD-98290", temperature: "Frozen" }
];

const documents = [
  { title: "Packing list", type: "PACKING_LIST", lastUpdated: "2h ago" },
  { title: "Bill of Lading", type: "BOL", lastUpdated: "2h ago" },
  { title: "Health certificate", type: "HEALTH_CERT", lastUpdated: "1h ago" }
];

const temperatureFeeds = [
  { shipment: "SHP-24051", provider: "GlacierCorp", current: "-20°C", threshold: "-18°C", location: "Kansas City" },
  { shipment: "SHP-24064", provider: "CoolSphere", current: "4°C", threshold: "5°C", location: "Atlanta" }
];

const collaborativeForecasts = [
  {
    partner: "Coastal Cold Storage",
    focus: "Holiday frozen desserts",
    signal: "+12%",
    narrative: "Retailers requesting more pint packs ahead of December promotions"
  },
  {
    partner: "Verdant Greens Co.",
    focus: "Leafy greens",
    signal: "-6%",
    narrative: "School districts pausing salad bars during winter break"
  }
];

export default function PartnerPortalPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="uppercase text-xs tracking-wide text-emerald-600">Phase 1 Partner Portal</p>
        <h1 className="text-3xl font-semibold text-slate-900">Operations network</h1>
        <p className="text-slate-600">
          Provide visibility and control for 3PL carriers, ingredient suppliers, and enterprise customers with real-time cold chain telemetry
          and collaborative forecasting.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {carriers.map((carrier) => (
          <Card key={carrier.name} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-900">{carrier.name}</h2>
              <span className={`text-xs font-semibold ${carrier.alert ? "text-rose-600" : "text-emerald-600"}`}>
                {carrier.status}
              </span>
            </div>
            <p className="text-sm text-slate-500">Lane: {carrier.lane}</p>
            <p className="text-sm text-slate-500">Temp: {carrier.temperature}</p>
            <Button variant={carrier.alert ? "danger" : "secondary"} className="w-full">
              {carrier.alert ? "Open temperature alert" : "View telemetry"}
            </Button>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {supplierRequests.map((request) => (
          <Card key={request.item} className="space-y-3">
            <div>
              <p className="text-sm text-slate-500">{request.scenario}</p>
              <h3 className="text-lg font-semibold text-slate-900">{request.supplier}</h3>
              <p className="text-sm text-slate-600">{request.item}</p>
            </div>
            <div className="text-xs text-slate-500">ETA {request.eta}</div>
            <div className="flex gap-2">
              {request.actions.map((action) => (
                <Button key={action} variant="secondary" className="flex-1">
                  {action}
                </Button>
              ))}
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Customer order tracking</h2>
              <p className="text-sm text-slate-500">Provide temperature chain and document status to hospitality buyers.</p>
            </div>
            <Button variant="secondary">Share tracking link</Button>
          </div>
          <div className="divide-y divide-slate-100">
            {customerOrders.map((order) => (
              <div key={order.reference} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900">{order.customer}</p>
                  <p className="text-sm text-slate-500">{order.reference}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600">{order.status}</p>
                  <p className="text-xs text-slate-500">{order.temperature}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Document exchange</h2>
              <p className="text-sm text-slate-500">Give 3PL and FDA/USDA inspectors instant access to required forms.</p>
            </div>
            <Button variant="secondary">Upload</Button>
          </div>
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li key={doc.type} className="flex items-center justify-between text-sm text-slate-600">
                <span>{doc.title}</span>
                <span className="text-xs text-slate-400">Updated {doc.lastUpdated}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Temperature monitoring</h2>
            <Link href="#" className="text-sm font-medium text-emerald-600">
              View all feeds
            </Link>
          </div>
          <div className="space-y-3">
            {temperatureFeeds.map((feed) => (
              <div key={feed.shipment} className="rounded-lg border border-slate-100 p-3">
                <p className="text-sm font-semibold text-slate-900">{feed.shipment}</p>
                <p className="text-xs text-slate-500">{feed.provider} • {feed.location}</p>
                <p className="text-sm text-slate-600">
                  Current {feed.current} (threshold {feed.threshold})
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Collaborative forecasting</h2>
            <Button variant="secondary">Invite partner</Button>
          </div>
          <div className="space-y-3">
            {collaborativeForecasts.map((forecast) => (
              <div key={forecast.partner} className="rounded-lg border border-slate-100 p-3">
                <p className="text-sm font-semibold text-slate-900">{forecast.partner}</p>
                <p className="text-xs text-slate-500">{forecast.focus}</p>
                <p className="text-sm text-emerald-600">Signal {forecast.signal}</p>
                <p className="text-sm text-slate-600">{forecast.narrative}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
