"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Code,
  Download,
  FileCode,
  GitBranch,
  Globe,
  Package,
  Play,
  Puzzle,
  Settings,
  Star,
  Terminal,
  TrendingUp,
  Upload,
  Users,
  Zap,
} from "lucide-react";

const NAV_TABS = ["marketplace", "installed", "developer", "workflows"] as const;
const CATEGORY_FILTERS = [
  { id: "all", name: "All Apps", count: 247 },
  { id: "integration", name: "Integrations", count: 45 },
  { id: "warehouse", name: "Warehouse", count: 32 },
  { id: "planning", name: "Planning", count: 28 },
  { id: "compliance", name: "Compliance", count: 19 },
  { id: "analytics", name: "Analytics", count: 34 },
  { id: "industry", name: "Industry Specific", count: 41 },
] as const;

const FEATURED_APPS = [
  {
    id: "sap-connector",
    name: "SAP Integration Bridge",
    developer: "Oonru Official",
    category: "integration",
    description: "Seamless bi-directional sync with SAP ECC/S4HANA",
    version: "2.4.0",
    downloads: 4567,
    rating: 4.8,
    price: "Free",
    verified: true,
    compatibility: ["inventory", "finance", "production"],
    features: [
      "Real-time data sync",
      "RFC/BAPI support",
      "IDoc processing",
      "Change pointers",
      "Error recovery",
    ],
  },
  {
    id: "advanced-mrp",
    name: "Advanced MRP Engine",
    developer: "Supply Chain Labs",
    category: "planning",
    description: "AI-powered material requirements planning with multi-echelon optimization",
    version: "1.8.2",
    downloads: 2341,
    rating: 4.6,
    price: "$99/month",
    verified: true,
    compatibility: ["inventory", "production", "procurement"],
  },
  {
    id: "barcode-scanner",
    name: "Mobile Barcode Scanner",
    developer: "MobileWMS Inc",
    category: "warehouse",
    description: "Native mobile app for warehouse operations",
    version: "3.2.1",
    downloads: 8901,
    rating: 4.9,
    price: "$5/user/month",
    verified: true,
  },
  {
    id: "customs-compliance",
    name: "Global Trade Compliance",
    developer: "TradeCompliance Co",
    category: "compliance",
    description: "Automated customs documentation and compliance checking",
    version: "2.0.0",
    downloads: 1234,
    rating: 4.7,
    price: "$299/month",
  },
];

export default function OonruForge() {
  const [activeTab, setActiveTab] = useState<(typeof NAV_TABS)[number]>("marketplace");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
        <div className="px-6 py-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Puzzle className="w-12 h-12" />
              <div>
                <h1 className="text-3xl font-bold">Oonru Forge</h1>
                <p className="text-purple-200 mt-1">Extend your platform with apps and integrations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition">
                <Upload className="inline w-4 h-4 mr-2" /> Publish App
              </button>
              <button className="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition">
                <Code className="inline w-4 h-4 mr-2" /> Developer Portal
              </button>
            </div>
          </div>
          <nav className="flex items-center gap-8 border-t border-purple-800 pt-4">
            {NAV_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 text-sm font-medium border-b-2 capitalize transition-colors ${
                  activeTab === tab ? "border-white text-white" : "border-transparent text-purple-200 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="p-6">
        {activeTab === "marketplace" && <ForgeMarketplace />}
        {activeTab === "installed" && <ForgeInstalled />}
        {activeTab === "developer" && <ForgeDeveloper />}
        {activeTab === "workflows" && <ForgeWorkflows />}
      </main>
    </div>
  );
}

function ForgeMarketplace() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredApps = FEATURED_APPS.filter((app) => {
    const matchesCategory = selectedCategory === "all" || app.category === selectedCategory;
    const matchesSearch =
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="grid grid-cols-12 gap-6">
      <aside className="col-span-12 lg:col-span-3 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-4">Categories</h3>
          <div className="space-y-2">
            {CATEGORY_FILTERS.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full px-3 py-2 text-left rounded-lg transition ${
                  selectedCategory === category.id ? "bg-purple-100 text-purple-800" : "hover:bg-gray-100"
                }`}
              >
                <span className="font-medium">{category.name}</span>
                <span className="float-right text-sm text-gray-500">{category.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-4">Highlights</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> Verified Developers
            </li>
            <li className="flex items-center gap-2">
              <ShieldBadge /> Enterprise Security
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" /> AI-Ready Apps
            </li>
          </ul>
        </div>
      </aside>

      <section className="col-span-12 lg:col-span-9 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search apps..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <select className="px-4 py-2 border rounded-lg">
            <option>Most Popular</option>
            <option>Newest</option>
            <option>Top Rated</option>
            <option>Price: Low to High</option>
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {filteredApps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ShieldBadge() {
  return (
    <div className="flex items-center gap-2">
      <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l8 4v6c0 5.25-3.42 10.74-8 12-4.58-1.26-8-6.75-8-12V6l8-4z" />
      </svg>
      <span>Secure Reviews</span>
    </div>
  );
}

function AppCard({
  app,
}: {
  app: (typeof FEATURED_APPS)[number];
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold flex items-center gap-1">
              {app.name}
              {app.verified && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
            </h3>
            <p className="text-sm text-gray-500">{app.developer}</p>
          </div>
        </div>
        <span className="px-2 py-1 text-sm bg-purple-100 text-purple-700 rounded">{app.price}</span>
      </div>
      <p className="text-sm text-gray-600 mb-4">{app.description}</p>
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500" /> {app.rating}
        </span>
        <span className="flex items-center gap-1">
          <Download className="w-4 h-4" /> {app.downloads.toLocaleString()}
        </span>
        <span>v{app.version}</span>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg">Install</button>
        <button className="px-4 py-2 border rounded-lg">Details</button>
      </div>
    </div>
  );
}

function ForgeInstalled() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Installed Extensions</h2>
          <p className="text-sm text-gray-500">Manage tenant deployments and rollouts</p>
        </div>
        <button className="text-sm text-purple-600 hover:underline">View audit history</button>
      </div>

      <div className="space-y-4">
        {["SAP Integration Bridge", "Advanced MRP Engine", "Warehouse Mobile"]?.map((item) => (
          <div key={item} className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{item}</p>
              <p className="text-sm text-gray-500">Tenant: Global Manufacturing HQ</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-4 h-4" /> Healthy
              </span>
              <button className="px-3 py-1 border rounded">Open</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ForgeDeveloper() {
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Developer SDK</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <SDKCard title="Node.js SDK" version="2.3.0" command="pnpm add @oonru/sdk" icon={FileCode} />
          <SDKCard title="Python SDK" version="2.3.0" command="pip install oonru-sdk" icon={FileCode} />
          <SDKCard title="REST API" version="v2" command="https://api.oonru.ai/v2" icon={Globe} />
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">App Builder</h2>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-sm bg-green-500 text-white rounded">
              <Play className="inline w-3 h-3 mr-1" /> Test
            </button>
            <button className="px-3 py-1 text-sm bg-purple-600 text-white rounded">Deploy</button>
          </div>
        </div>
        <ForgeCodeEditor />
      </section>
    </div>
  );
}

function SDKCard({
  title,
  version,
  command,
  icon: Icon,
}: {
  title: string;
  version: string;
  command: string;
  icon: typeof FileCode;
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <Icon className="w-5 h-5 text-purple-600" />
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-gray-500">Version {version}</p>
        </div>
      </div>
      <code className="block bg-gray-50 rounded px-3 py-2 text-sm text-gray-700">{command}</code>
    </div>
  );
}

function ForgeCodeEditor() {
  const [code, setCode] = useState(`// Oonru Forge App Template
import { OonruApp, Context } from '@oonru/sdk';

export default class CustomApp extends OonruApp {
  async onInstall(context: Context) {
    await context.db.createTable({
      name: 'custom_settings',
      schema: this.settingsSchema,
    });
  }

  async onInventoryUpdate(context: Context, data: any) {
    const analysis = await context.ai.analyze(data);
    if (analysis.requiresAction) {
      await context.notify({
        type: 'alert',
        message: analysis.recommendation,
      });
    }
  }

  async onUninstall(context: Context) {
    await context.db.dropTable('custom_settings');
  }
}`);

  return (
    <div className="border rounded-lg">
      <div className="bg-gray-50 border-b px-4 py-2 flex items-center gap-2 text-sm">
        <Terminal className="w-4 h-4 text-gray-500" /> app.ts
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full h-80 font-mono text-sm bg-gray-900 text-gray-100 p-4"
      />
    </div>
  );
}

function ForgeWorkflows() {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {[1, 2, 3].map((workflow) => (
        <div key={workflow} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <GitBranch className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-semibold">Deployment Flow #{workflow}</p>
              <p className="text-xs text-gray-500">5 stages · Guarded</p>
            </div>
          </div>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-center gap-2">
              <Settings className="w-4 h-4" /> Build artifacts
            </li>
            <li className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Assign reviewers
            </li>
            <li className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Canary rollout
            </li>
          </ul>
          <button className="w-full py-2 border rounded-lg">Open Workflow</button>
        </div>
      ))}
    </div>
  );
}
