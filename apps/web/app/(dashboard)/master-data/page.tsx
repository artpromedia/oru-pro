"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BadgeCheck,
  Brain,
  Building,
  CheckCircle,
  ClipboardList,
  CreditCard,
  Database,
  Download,
  GitBranch,
  Globe,
  Layers,
  Link,
  Mail,
  Package,
  Phone,
  Search,
  Settings,
  Shield,
  Truck,
  Upload,
  Users,
  Zap
} from "lucide-react";

type EntityTab = "customer" | "vendor" | "material" | "bom";

type CustomerStatus = "active" | "credit-hold" | "blocked";

type Impact = "low" | "medium" | "high";

type VendorRisk = "low" | "medium" | "high";

type CustomerContact = {
  name: string;
  role: string;
  email: string;
  phone: string;
  primary?: boolean;
};

type CustomerSite = {
  code: string;
  city: string;
  country: string;
  incoterms: string;
  shippingStatus: string;
};

type CustomerIssue = {
  label: string;
  impact: Impact;
  owner: string;
  status: "open" | "in-review" | "mitigated";
};

type CustomerRecord = {
  id: string;
  name: string;
  segment: "Strategic" | "Core" | "Emerging";
  industry: string;
  region: string;
  status: CustomerStatus;
  creditLimit: number;
  paymentTerms: string;
  currency: string;
  taxId: string;
  revenueYTD: number;
  aiConfidence: number;
  duplicates: number;
  lastSynced: string;
  contacts: CustomerContact[];
  sites: CustomerSite[];
  issues: CustomerIssue[];
  recommendedLinks: string[];
};

type DuplicateCandidate = {
  id: string;
  primary: string;
  candidate: string;
  confidence: number;
  reason: string;
  sourceSystem: string;
  aging: string;
};

type VendorDocument = {
  name: string;
  status: "valid" | "expiring" | "missing";
  expiry?: string;
};

type VendorRecord = {
  id: string;
  name: string;
  category: string;
  spendMonthly: number;
  rating: number;
  risk: VendorRisk;
  paymentTerms: string;
  currency: string;
  countries: string[];
  onTimeDelivery: number;
  incoterms: string;
  sustainabilityScore: number;
  aiAlerts: string[];
  documents: VendorDocument[];
  contractsActive: number;
};

type MaterialView = {
  name: string;
  created: boolean;
  lastTouched: string;
};

type MaterialProfile = {
  number: string;
  description: string;
  type: string;
  owner: string;
  status: "Active" | "Draft" | "Blocked";
  qualityIndex: number;
  coverage: {
    plants: number;
    channels: number;
  };
  views: MaterialView[];
  lastChange: string;
  nextReview: string;
  compliance: string[];
  automationScore: number;
};

type BOMComponent = {
  code: string;
  description: string;
  qty: number;
  uom: string;
  stage: string;
  children?: BOMComponent[];
};

type QualityMetric = {
  label: string;
  value: number;
};

const customers: CustomerRecord[] = [
  {
    id: "CUST-500231",
    name: "Acme Fresh Foods",
    segment: "Strategic",
    industry: "CPG",
    region: "North America",
    status: "active",
    creditLimit: 850_000,
    paymentTerms: "Net 30",
    currency: "USD",
    taxId: "US94-221187",
    revenueYTD: 4_200_000,
    aiConfidence: 96,
    duplicates: 2,
    lastSynced: "2025-11-18T04:15:00Z",
    contacts: [
      {
        name: "Nora Patel",
        role: "Head of Procurement",
        email: "n.patel@acme.com",
        phone: "+1 415 555 1822",
        primary: true
      },
      {
        name: "Jonas Reed",
        role: "AP Manager",
        email: "jonas.reed@acme.com",
        phone: "+1 312 555 9912"
      }
    ],
    sites: [
      { code: "DC01", city: "Chicago", country: "US", incoterms: "FOB", shippingStatus: "Compliant" },
      { code: "DC03", city: "Toronto", country: "CA", incoterms: "DAP", shippingStatus: "Cold-chain flagged" }
    ],
    issues: [
      { label: "Missing DUNS on site DC03", impact: "medium", owner: "Data Stewardship", status: "open" },
      { label: "Credit limit review due", impact: "low", owner: "Treasury", status: "in-review" }
    ],
    recommendedLinks: ["Salesforce • ACME-23", "ServiceNow • INC-88211", "Coupa • C-3321"]
  },
  {
    id: "CUST-502118",
    name: "Helios Distribution GmbH",
    segment: "Core",
    industry: "Wholesale",
    region: "DACH",
    status: "credit-hold",
    creditLimit: 420_000,
    paymentTerms: "Net 45",
    currency: "EUR",
    taxId: "DE287771912",
    revenueYTD: 1_280_000,
    aiConfidence: 91,
    duplicates: 1,
    lastSynced: "2025-11-18T02:01:00Z",
    contacts: [
      {
        name: "Lena Baum",
        role: "Master Data Lead",
        email: "l.baum@helios.eu",
        phone: "+49 30 555 01822",
        primary: true
      }
    ],
    sites: [
      { code: "BER-01", city: "Berlin", country: "DE", incoterms: "CIF", shippingStatus: "Docs pending" }
    ],
    issues: [
      { label: "VAT validation failed", impact: "high", owner: "Tax", status: "open" },
      { label: "Duplicate candidate with Helios GmbH", impact: "high", owner: "MDM", status: "in-review" }
    ],
    recommendedLinks: ["S/4 Sales Org 2000", "SAP Credit • FD32", "D&B Investigation"]
  },
  {
    id: "CUST-509004",
    name: "Latitude Pharmacies",
    segment: "Emerging",
    industry: "Healthcare",
    region: "APAC",
    status: "active",
    creditLimit: 150_000,
    paymentTerms: "Net 15",
    currency: "USD",
    taxId: "SG2018823D",
    revenueYTD: 640_000,
    aiConfidence: 88,
    duplicates: 0,
    lastSynced: "2025-11-17T22:43:00Z",
    contacts: [
      {
        name: "Wei Tan",
        role: "Finance Director",
        email: "wei.tan@latitude.sg",
        phone: "+65 8123 9981",
        primary: true
      }
    ],
    sites: [
      { code: "SG-02", city: "Singapore", country: "SG", incoterms: "EXW", shippingStatus: "Ready" }
    ],
    issues: [
      { label: "Bank mandate document expiring", impact: "medium", owner: "Legal", status: "open" }
    ],
    recommendedLinks: ["Netsuite Legacy", "Zendesk Org LAT-44"]
  }
];

const duplicateQueue: DuplicateCandidate[] = [
  {
    id: "DUP-9820",
    primary: "Acme Fresh Foods",
    candidate: "Acme Foods Ltd",
    confidence: 0.91,
    reason: "Matching tax ID + address",
    sourceSystem: "SAP ECC",
    aging: "2h"
  },
  {
    id: "DUP-9823",
    primary: "Helios Distribution GmbH",
    candidate: "Helios Intl GmbH",
    confidence: 0.88,
    reason: "Bank account + VAT overlap",
    sourceSystem: "Salesforce",
    aging: "4h"
  },
  {
    id: "DUP-9830",
    primary: "Latitude Pharmacies",
    candidate: "Latitude Retail",
    confidence: 0.76,
    reason: "Phone + domain match",
    sourceSystem: "Legacy CRM",
    aging: "9h"
  }
];

const customerQuality: QualityMetric[] = [
  { label: "Completeness", value: 97 },
  { label: "Accuracy", value: 94 },
  { label: "Uniqueness", value: 98 },
  { label: "Compliance", value: 92 }
];

const vendors: VendorRecord[] = [
  {
    id: "VEND-1201",
    name: "Nordic Packaging Alliance",
    category: "Packaging",
    spendMonthly: 320_000,
    rating: 4.7,
    risk: "low",
    paymentTerms: "Net 45",
    currency: "EUR",
    countries: ["DE", "PL"],
    onTimeDelivery: 0.97,
    incoterms: "DAP",
    sustainabilityScore: 89,
    aiAlerts: ["Insurance policy expiring in 18 days"],
    documents: [
      { name: "ISO 9001", status: "valid", expiry: "2026-01-01" },
      { name: "Insurance Rider", status: "expiring", expiry: "2025-12-05" }
    ],
    contractsActive: 3
  },
  {
    id: "VEND-1244",
    name: "Global Botanicals",
    category: "Raw Materials",
    spendMonthly: 210_000,
    rating: 4.2,
    risk: "medium",
    paymentTerms: "Net 30",
    currency: "USD",
    countries: ["BR", "US"],
    onTimeDelivery: 0.89,
    incoterms: "FOB",
    sustainabilityScore: 74,
    aiAlerts: ["Temperature excursion event on lane MIA → ORD"],
    documents: [
      { name: "Organic Certificate", status: "valid", expiry: "2026-03-01" },
      { name: "HACCP Plan", status: "missing" }
    ],
    contractsActive: 2
  },
  {
    id: "VEND-1288",
    name: "Pacific Logistics 3PL",
    category: "Logistics",
    spendMonthly: 140_000,
    rating: 4.1,
    risk: "medium",
    paymentTerms: "Net 30",
    currency: "USD",
    countries: ["US", "MX"],
    onTimeDelivery: 0.93,
    incoterms: "CIP",
    sustainabilityScore: 68,
    aiAlerts: ["Driver capacity shortage flagged for Black Friday"],
    documents: [
      { name: "FMCSA Authority", status: "valid", expiry: "2026-06-30" },
      { name: "Cyber Insurance", status: "missing" }
    ],
    contractsActive: 4
  }
];

const materials: MaterialProfile[] = [
  {
    number: "FG-4012",
    description: "Cold Brew 12oz",
    type: "FERT",
    owner: "Ops/MDM",
    status: "Active",
    qualityIndex: 94,
    coverage: { plants: 4, channels: 6 },
    views: [
      { name: "Basic", created: true, lastTouched: "2025-11-16" },
      { name: "Sales", created: true, lastTouched: "2025-11-10" },
      { name: "MRP", created: true, lastTouched: "2025-11-04" },
      { name: "Warehouse", created: false, lastTouched: "--" }
    ],
    lastChange: "Shelf-life extended to 90 days",
    nextReview: "2025-12-01",
    compliance: ["FDA", "EU 1169"],
    automationScore: 82
  },
  {
    number: "FG-4021",
    description: "Plant Protein Shake",
    type: "FERT",
    owner: "Innovation",
    status: "Draft",
    qualityIndex: 81,
    coverage: { plants: 2, channels: 3 },
    views: [
      { name: "Basic", created: true, lastTouched: "2025-11-11" },
      { name: "Sales", created: false, lastTouched: "--" },
      { name: "Quality", created: true, lastTouched: "2025-11-12" }
    ],
    lastChange: "Nutritional facts pending QA",
    nextReview: "2025-11-21",
    compliance: ["USDA"],
    automationScore: 71
  },
  {
    number: "RM-8820",
    description: "Organic Arabica Beans",
    type: "ROH",
    owner: "Procurement",
    status: "Active",
    qualityIndex: 91,
    coverage: { plants: 5, channels: 0 },
    views: [
      { name: "Basic", created: true, lastTouched: "2025-11-14" },
      { name: "Purchasing", created: true, lastTouched: "2025-11-15" },
      { name: "Quality", created: true, lastTouched: "2025-11-10" }
    ],
    lastChange: "Supplier price update",
    nextReview: "2025-12-05",
    compliance: ["Fair Trade", "Rainforest"],
    automationScore: 77
  }
];

type BomGraph = {
  parent: string;
  material: string;
  revision: string;
  components: BOMComponent[];
};

const bomGraph: BomGraph = {
  parent: "BOM-CR12",
  material: "FG-4012 Cold Brew 12oz",
  revision: "Rev 7",
  components: [
    {
      code: "RM-8820",
      description: "Organic Arabica Beans",
      qty: 4.8,
      uom: "KG",
      stage: "Roasting",
      children: [
        { code: "IB-1100", description: "Inbound Lot QA", qty: 1, uom: "EA", stage: "Quality" }
      ]
    },
    {
      code: "PKG-5001",
      description: "Aluminum Can 12oz",
      qty: 1,
      uom: "EA",
      stage: "Packaging",
      children: [
        { code: "LBL-2210", description: "Regulatory Label", qty: 1, uom: "EA", stage: "Labeling" }
      ]
    },
    {
      code: "ADD-9901",
      description: "Nitrogen Flush",
      qty: 0.02,
      uom: "KG",
      stage: "Finishing"
    }
  ]
};

const aiHighlights = [
  "Automatic deduplication removed 47 conflicting records in the last 24 hours",
  "Tax ID validation queue cleared for all APAC vendors",
  "Address standardization powered by Maps API reached 99% geocode precision",
  "AI detected opportunity to consolidate three retail subsidiaries into one global account"
];

const currency = Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function MasterDataManagement() {
  const [activeEntity, setActiveEntity] = useState<EntityTab>("customer");
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord>(customers[0]);
  const [selectedVendor, setSelectedVendor] = useState<VendorRecord>(vendors[0]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialProfile>(materials[0]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(customerQuery.toLowerCase()) ||
      customer.id.toLowerCase().includes(customerQuery.toLowerCase()) ||
      customer.taxId.toLowerCase().includes(customerQuery.toLowerCase())
    );
  }, [customerQuery]);

  const summaryStats = useMemo(
    () => [
      {
        label: "Golden Records",
        value: "1,248",
        trend: "+14",
        description: "Records certified in the last sync"
      },
      {
        label: "Duplicate Alerts",
        value: duplicateQueue.length.toString(),
        trend: "-5",
        description: "open merges since yesterday"
      },
      {
        label: "Data Quality",
        value: "94%",
        trend: "+1.2%",
        description: "weighted score across entities"
      },
      {
        label: "AI Cleansed",
        value: "782",
        trend: "+62",
        description: "records auto-corrected this week"
      }
    ],
    []
  );

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase text-purple-600">
            <Database className="h-5 w-5" />
            Prompt 3 • MDM Cockpit
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Master Data Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Replacing SAP XD/XK/MM01 with AI-driven golden records, deduplication, and governance automations.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
            <Upload className="h-4 w-4" />
            Mass Upload (IDoc)
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
            <Download className="h-4 w-4" />
            Export Golden Records
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700">
            <Brain className="h-4 w-4" />
            Run AI Cleansing
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">{stat.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
              <span className="text-xs font-semibold text-emerald-600">{stat.trend}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{stat.description}</p>
          </div>
        ))}
      </section>

      <div className="rounded-2xl bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "customer", label: "Customers", icon: Users, caption: "XD01/02/03" },
            { id: "vendor", label: "Vendors", icon: Building, caption: "XK01/02/03" },
            { id: "material", label: "Materials", icon: Package, caption: "MM01/02/03" },
            { id: "bom", label: "BOMs", icon: GitBranch, caption: "CS01/02/03" }
          ].map((tab) => {
            const isActive = activeEntity === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveEntity(tab.id as EntityTab)}
                className={`flex flex-1 items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  isActive ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </span>
                <span className={`text-xs ${isActive ? "text-purple-100" : "text-gray-400"}`}>{tab.caption}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeEntity === "customer" && (
        <CustomerWorkspace
          customers={filteredCustomers}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          query={customerQuery}
          onQueryChange={setCustomerQuery}
        />
      )}

      {activeEntity === "vendor" && (
        <VendorWorkspace vendors={vendors} selectedVendor={selectedVendor} onSelectVendor={setSelectedVendor} />
      )}

      {activeEntity === "material" && (
        <MaterialWorkspace materials={materials} selectedMaterial={selectedMaterial} onSelectMaterial={setSelectedMaterial} />
      )}

      {activeEntity === "bom" && <BOMWorkspace />}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-6"
      >
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <Zap className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">AI Master Data Intelligence</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-gray-600">
              {aiHighlights.map((highlight) => (
                <p key={highlight} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-500" />
                  {highlight}
                </p>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CustomerWorkspace({
  customers,
  selectedCustomer,
  setSelectedCustomer,
  query,
  onQueryChange
}: {
  customers: CustomerRecord[];
  selectedCustomer?: CustomerRecord;
  setSelectedCustomer: (customer: CustomerRecord) => void;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search customers by name, ID, or tax number"
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div className="mt-4 space-y-3">
            {customers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className={`w-full rounded-2xl border p-4 text-left transition hover:border-purple-300 ${
                  selectedCustomer?.id === customer.id ? "border-purple-500 bg-purple-50" : "border-gray-100 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">
                      {customer.id} • {customer.segment}
                    </p>
                  </div>
                  <StatusBadge status={customer.status} />
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                  <span>{customer.industry}</span>
                  <span>•</span>
                  <span>{customer.region}</span>
                  <span>•</span>
                  <span>{customer.paymentTerms}</span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <MetricPill label="Credit" value={currency.format(customer.creditLimit)} />
                  <MetricPill label="AI confidence" value={`${customer.aiConfidence}%`} />
                  <MetricPill label="Duplicates" value={customer.duplicates} intent={customer.duplicates ? "warning" : "default"} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DedupQueue duplicates={duplicateQueue} />
          <DataQualityPanel metrics={customerQuality} />
        </div>
      </div>

      <div className="space-y-4">
        {selectedCustomer ? (
          <CustomerProfile customer={selectedCustomer} />
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
            Select a customer to view the golden record
          </div>
        )}
        <GoldenRecordCard />
        <IntegrationCard systems={selectedCustomer?.recommendedLinks ?? []} />
      </div>
    </section>
  );
}

function VendorWorkspace({
  vendors,
  selectedVendor,
  onSelectVendor
}: {
  vendors: VendorRecord[];
  selectedVendor: VendorRecord;
  onSelectVendor: (vendor: VendorRecord) => void;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="grid gap-4 md:grid-cols-4">
          <VendorMetric label="Active Vendors" value="234" icon={Building} />
          <VendorMetric label="Countries" value="12" icon={Globe} />
          <VendorMetric label="Monthly Spend" value="$2.3M" icon={CreditCard} />
          <VendorMetric label="On-Time Delivery" value="96%" icon={Truck} />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Spend</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3 text-center">Risk</th>
                <th className="px-4 py-3 text-right">Payment Terms</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr
                  key={vendor.id}
                  className={`cursor-pointer border-t text-gray-700 transition hover:bg-gray-50 ${
                    vendor.id === selectedVendor.id ? "bg-purple-50" : "bg-white"
                  }`}
                  onClick={() => onSelectVendor(vendor)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{vendor.name}</div>
                    <div className="text-xs text-gray-500">{vendor.id}</div>
                  </td>
                  <td className="px-4 py-3">{vendor.category}</td>
                  <td className="px-4 py-3">{currency.format(vendor.spendMonthly)}</td>
                  <td className="px-4 py-3">{vendor.rating.toFixed(1)}</td>
                  <td className="px-4 py-3 text-center">
                    <VendorRiskBadge risk={vendor.risk} />
                  </td>
                  <td className="px-4 py-3 text-right">{vendor.paymentTerms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <VendorProfile vendor={selectedVendor} />
        <DocumentChecklist documents={selectedVendor.documents} />
      </div>
    </section>
  );
}

function MaterialWorkspace({
  materials,
  selectedMaterial,
  onSelectMaterial
}: {
  materials: MaterialProfile[];
  selectedMaterial: MaterialProfile;
  onSelectMaterial: (material: MaterialProfile) => void;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {materials.map((material) => (
          <button
            key={material.number}
            onClick={() => onSelectMaterial(material)}
            className={`w-full rounded-2xl border p-4 text-left transition hover:border-purple-300 ${
              material.number === selectedMaterial.number ? "border-purple-500 bg-purple-50" : "border-gray-100 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{material.description}</p>
                <p className="text-xs text-gray-500">{material.number} • Owner {material.owner}</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {material.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600">
              <MetricPill label="Quality" value={`${material.qualityIndex}%`} />
              <MetricPill label="Plants" value={material.coverage.plants} />
              <MetricPill label="Channels" value={material.coverage.channels} />
              <MetricPill label="Automation" value={`${material.automationScore}%`} />
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">Material Views</h3>
        <div className="mt-4 space-y-3">
          {selectedMaterial.views.map((view) => (
            <div key={view.name} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">{view.name}</p>
                <p className="text-xs text-gray-500">{view.created ? `Updated ${view.lastTouched}` : "Not generated"}</p>
              </div>
              {view.created ? (
                <BadgeCheck className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-900">Lifecycle</p>
          <p>Last change: {selectedMaterial.lastChange}</p>
          <p>Next review: {selectedMaterial.nextReview}</p>
          <p className="mt-2 flex flex-wrap gap-2 text-xs">
            {selectedMaterial.compliance.map((tag) => (
              <span key={tag} className="rounded-full bg-white px-3 py-1 font-semibold text-purple-700">
                {tag}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}

function BOMWorkspace() {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bill of Materials • {bomGraph.material}</h3>
          <p className="text-sm text-gray-500">{bomGraph.parent} • {bomGraph.revision} • multi-level genealogy</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <Layers className="h-4 w-4" />
          Export as GraphML
        </button>
      </div>
      <div className="mt-6">
        {bomGraph.components.map((component) => (
          <BOMNode key={component.code} component={component} depth={0} />
        ))}
      </div>
    </section>
  );
}

function BOMNode({ component, depth }: { component: BOMComponent; depth: number }) {
  return (
    <div className={`border-l-2 border-dashed border-gray-200 pl-4 ${depth > 0 ? "ml-4" : "ml-0"}`}>
      <div className="mb-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="font-semibold text-gray-900">{component.description}</p>
            <p className="text-xs text-gray-500">{component.code}</p>
          </div>
          <div className="text-xs text-gray-600">
            {component.qty} {component.uom} • {component.stage}
          </div>
        </div>
      </div>
      {component.children?.map((child) => (
        <BOMNode key={child.code} component={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function CustomerProfile({ customer }: { customer: CustomerRecord }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
          <p className="text-xs text-gray-500">{customer.id} • Tax {customer.taxId}</p>
        </div>
        <Settings className="h-5 w-5 text-gray-400" />
      </div>
      <div className="mt-4 grid gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Credit Limit</span>
          <span className="font-semibold text-gray-900">{currency.format(customer.creditLimit)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Payment Terms</span>
          <span className="font-semibold text-gray-900">{customer.paymentTerms}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">AI Confidence</span>
          <span className="font-semibold text-gray-900">{customer.aiConfidence}%</span>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500">Contacts</p>
          <div className="mt-2 space-y-2 text-sm">
            {customer.contacts.map((contact) => (
              <div key={contact.email} className="rounded-xl border border-gray-100 p-3">
                <p className="font-semibold text-gray-900">{contact.name}</p>
                <p className="text-xs text-gray-500">{contact.role}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {contact.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {contact.phone}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500">Sites</p>
          <div className="mt-2 space-y-2">
            {customer.sites.map((site) => (
              <div key={site.code} className="flex items-center justify-between rounded-xl border border-gray-100 p-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-900">{site.code}</p>
                  <p className="text-xs text-gray-500">
                    {site.city}, {site.country}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>{site.incoterms}</p>
                  <p>{site.shippingStatus}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500">Open Issues</p>
          <div className="mt-2 space-y-2">
            {customer.issues.map((issue) => (
              <div key={issue.label} className="rounded-xl border border-gray-100 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{issue.label}</span>
                  <IssueBadge impact={issue.impact} />
                </div>
                <p className="text-xs text-gray-500">
                  Owner {issue.owner} • Status {issue.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DedupQueue({ duplicates }: { duplicates: DuplicateCandidate[] }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Deduplication Queue</p>
          <p className="text-xs text-gray-500">AI flagged candidates for merge</p>
        </div>
        <button className="text-xs font-semibold text-purple-600">Auto Merge</button>
      </div>
      <div className="mt-3 space-y-3">
        {duplicates.map((dup) => (
          <div key={dup.id} className="rounded-2xl border border-gray-100 p-3 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">{dup.primary}</p>
              <span className="text-xs font-semibold text-purple-600">{Math.round(dup.confidence * 100)}%</span>
            </div>
            <p className="text-xs text-gray-500">vs {dup.candidate}</p>
            <p className="mt-1 text-xs text-gray-500">{dup.reason}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>{dup.sourceSystem}</span>
              <span>{dup.aging} old</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataQualityPanel({ metrics }: { metrics: QualityMetric[] }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Data Quality Scorecard</p>
          <p className="text-xs text-gray-500">Live telemetry across XD object views</p>
        </div>
        <Shield className="h-4 w-4 text-purple-600" />
      </div>
      <div className="mt-4 space-y-3">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{metric.label}</span>
              <span className="font-semibold text-gray-900">{metric.value}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-purple-500"
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoldenRecordCard() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-gray-900">Golden Record Coverage</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="text-4xl font-bold text-purple-600">98%</div>
        <div className="text-xs text-gray-500">
          Legal, finance, tax, and partner views certified with automated stewardship workflows.
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-xs">
        {["KNA1", "KNB1", "KNVV", "ADR6"].map((table) => (
          <div key={table} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
            <span className="font-semibold text-gray-700">{table}</span>
            <span className="text-emerald-600">Synced</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntegrationCard({ systems }: { systems: string[] }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Link className="h-4 w-4 text-purple-600" />
        Connected Systems
      </div>
      <p className="mt-2 text-xs text-gray-500">Consolidated view across CRM, ERP, AP, and support stacks.</p>
      <div className="mt-3 space-y-2 text-xs">
        {systems.length === 0 && <p className="text-gray-500">No linked systems for this record yet.</p>}
        {systems.map((system) => (
          <div key={system} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
            <span className="font-semibold text-gray-700">{system}</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorProfile({ vendor }: { vendor: VendorRecord }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
          <p className="text-xs text-gray-500">{vendor.id} • {vendor.category}</p>
        </div>
        <Settings className="h-5 w-5 text-gray-400" />
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <InfoRow label="Monthly Spend" value={currency.format(vendor.spendMonthly)} />
        <InfoRow label="On-Time Delivery" value={`${Math.round(vendor.onTimeDelivery * 100)}%`} />
        <InfoRow label="Incoterms" value={vendor.incoterms} />
        <InfoRow label="Countries" value={vendor.countries.join(", ")} />
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase text-gray-500">AI Alerts</p>
        <div className="mt-2 space-y-2 text-xs text-gray-600">
          {vendor.aiAlerts.map((alert) => (
            <div key={alert} className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5" />
              {alert}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentChecklist({ documents }: { documents: VendorDocument[] }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <ClipboardList className="h-4 w-4 text-purple-600" />
        Document Compliance
      </div>
      <div className="mt-4 space-y-3 text-sm">
        {documents.map((doc) => (
          <div key={doc.name} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
            <div>
              <p className="font-semibold text-gray-900">{doc.name}</p>
              <p className="text-xs text-gray-500">{doc.expiry ? `Expires ${doc.expiry}` : "No expiry"}</p>
            </div>
            {doc.status === "valid" && <BadgeCheck className="h-4 w-4 text-emerald-500" />}
            {doc.status === "expiring" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            {doc.status === "missing" && <AlertTriangle className="h-4 w-4 text-rose-500" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorMetric({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-purple-50 p-3">
          <Icon className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function VendorRiskBadge({ risk }: { risk: VendorRisk }) {
  const styles: Record<VendorRisk, string> = {
    low: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-rose-100 text-rose-700"
  };
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${styles[risk]}`}>{risk}</span>
  );
}

function MetricPill({ label, value, intent = "default" }: { label: string; value: string | number; intent?: "default" | "warning" }) {
  const styles = intent === "warning" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-700";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>
      {label}: {value}
    </span>
  );
}

function StatusBadge({ status }: { status: CustomerStatus }) {
  const map: Record<CustomerStatus, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-emerald-100 text-emerald-700" },
    "credit-hold": { label: "Credit Hold", className: "bg-amber-100 text-amber-700" },
    blocked: { label: "Blocked", className: "bg-rose-100 text-rose-700" }
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status].className}`}>{map[status].label}</span>;
}

function IssueBadge({ impact }: { impact: Impact }) {
  const map: Record<Impact, { label: string; className: string }> = {
    low: { label: "Low", className: "bg-gray-100 text-gray-600" },
    medium: { label: "Medium", className: "bg-amber-100 text-amber-700" },
    high: { label: "High", className: "bg-rose-100 text-rose-700" }
  };
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${map[impact].className}`}>{map[impact].label}</span>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

