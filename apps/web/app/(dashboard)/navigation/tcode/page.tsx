"use client";

import { useMemo, useState } from "react";
import { Search, Star, Clock, LayoutGrid, Filter, PlusCircle, Link2, ChevronRight, type LucideIcon } from "lucide-react";

type ModuleKey =
  | "Logistics"
  | "Manufacturing"
  | "Planning"
  | "Procurement"
  | "Sales"
  | "Finance"
  | "Maintenance"
  | "HCM";

interface TCodeEntry {
  code: string;
  description: string;
  module: ModuleKey;
  process: string;
  category: string;
  frequency: string;
  lastUsed: string;
  critical?: boolean;
}

interface RecentAccessEntry {
  code: string;
  user: string;
  location: string;
  accessedAt: string;
  outcome: "success" | "warning" | "blocked";
}

const tcodeCatalog: TCodeEntry[] = [
  {
    code: "MMBE",
    description: "Stock Overview",
    module: "Logistics",
    process: "Inventory",
    category: "Stock",
    frequency: "Daily",
    lastUsed: "2m ago",
    critical: true
  },
  {
    code: "LT10",
    description: "Create Transfer Order",
    module: "Logistics",
    process: "Warehouse",
    category: "WM",
    frequency: "Hourly",
    lastUsed: "15m ago"
  },
  {
    code: "COHV",
    description: "Production Order Processing",
    module: "Manufacturing",
    process: "Production",
    category: "Execution",
    frequency: "Daily",
    lastUsed: "1h ago"
  },
  {
    code: "MF60",
    description: "Planning Table",
    module: "Planning",
    process: "MRP",
    category: "Planning",
    frequency: "Weekly",
    lastUsed: "Yesterday"
  },
  {
    code: "ME21N",
    description: "Create Purchase Order",
    module: "Procurement",
    process: "Purchasing",
    category: "Procurement",
    frequency: "Daily",
    lastUsed: "Today"
  },
  {
    code: "VA01",
    description: "Create Sales Order",
    module: "Sales",
    process: "Order Mgmt",
    category: "Sales",
    frequency: "Daily",
    lastUsed: "3h ago"
  },
  {
    code: "FB50",
    description: "G/L Account Posting",
    module: "Finance",
    process: "Accounting",
    category: "Finance",
    frequency: "Weekly",
    lastUsed: "Nov 14"
  },
  {
    code: "IW38",
    description: "Maintenance Order List",
    module: "Maintenance",
    process: "EAM",
    category: "Maintenance",
    frequency: "Weekly",
    lastUsed: "Nov 13"
  },
  {
    code: "PA20",
    description: "Display HR Master Data",
    module: "HCM",
    process: "HR",
    category: "People",
    frequency: "Monthly",
    lastUsed: "Nov 01"
  }
];

const recentAccess: RecentAccessEntry[] = [
  { code: "LT10", user: "JSMITH", location: "WH01", accessedAt: "08:45", outcome: "success" },
  { code: "MMBE", user: "CPATEL", location: "Plant 1000", accessedAt: "08:32", outcome: "success" },
  { code: "COHV", user: "SCHEN", location: "Line 3", accessedAt: "08:05", outcome: "warning" },
  { code: "FB50", user: "KTURNER", location: "HQ", accessedAt: "Yesterday", outcome: "success" },
  { code: "VA01", user: "ASTONE", location: "Channel Ops", accessedAt: "Yesterday", outcome: "success" }
];

const moduleOptions: (ModuleKey | "All")[] = ["All", "Logistics", "Manufacturing", "Planning", "Procurement", "Sales", "Finance", "Maintenance", "HCM"];

export default function TCodeNavigator() {
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState<ModuleKey | "All">("All");
  const [favorites, setFavorites] = useState<string[]>(["MMBE", "LT10", "COHV"]);

  const filteredCatalog = useMemo(() => {
    return tcodeCatalog.filter((entry) => {
      const matchesModule = moduleFilter === "All" || entry.module === moduleFilter;
      const matchesSearch = `${entry.code} ${entry.description} ${entry.process}`.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesModule && matchesSearch;
    });
  }, [moduleFilter, searchTerm]);

  const favoriteEntries = favorites.map((code) => tcodeCatalog.find((entry) => entry.code === code)).filter(Boolean) as TCodeEntry[];

  const moduleStats = useMemo(() => {
    return moduleOptions
      .filter((module): module is ModuleKey => module !== "All")
      .map((module) => {
        const entries = tcodeCatalog.filter((entry) => entry.module === module);
        return {
          module,
          count: entries.length,
          critical: entries.filter((entry) => entry.critical).length
        };
      });
  }, []);

  const toggleFavorite = (code: string) => {
    setFavorites((prev) => (prev.includes(code) ? prev.filter((fav) => fav !== code) : [...prev, code]));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">T-Code Launchpad</h1>
          <p className="text-gray-500 mt-1">Quick navigation across SAP logistics, planning, and finance workstreams</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <PlusCircle className="w-4 h-4 inline mr-2" />
            New Shortcut
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Launch SAP Gui
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <QuickStat label="Favorites" value={favorites.length} trend="+2 this week" />
        <QuickStat label="Recent" value={recentAccess.length} trend="Auto-synced" />
        <QuickStat label="Critical" value={tcodeCatalog.filter((entry) => entry.critical).length} status="warning" />
        <QuickStat label="Modules" value={moduleOptions.length - 1} trend="Full coverage" />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
            <Search className="w-4 h-4 text-gray-500 mr-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by T-code, process, or description"
              className="bg-transparent flex-1 text-sm outline-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            {moduleOptions.map((module) => (
              <button
                key={module}
                onClick={() => setModuleFilter(module)}
                className={`px-3 py-1 text-sm rounded-full border ${
                  moduleFilter === module ? "bg-blue-50 text-blue-600 border-blue-200" : "text-gray-600 border-gray-200"
                }`}
              >
                {module}
              </button>
            ))}
          </div>
          <button className="px-3 py-2 bg-gray-100 text-sm rounded-lg flex items-center border border-gray-200">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-6">
          <section className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Pinned Favorites</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700">Manage Library</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {favoriteEntries.map((entry) => (
                <FavoriteCard key={entry.code} entry={entry} onToggle={toggleFavorite} />
              ))}
              {favoriteEntries.length === 0 && <p className="text-sm text-gray-500 col-span-3">No favorites yet. Pin T-codes for quick launch.</p>}
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Catalog Results</h2>
              <span className="text-sm text-gray-500">{filteredCatalog.length} matching T-codes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 border-b">
                  <tr>
                    <th className="py-3 text-left">Code</th>
                    <th className="py-3 text-left">Description</th>
                    <th className="py-3 text-left">Process</th>
                    <th className="py-3 text-left">Module</th>
                    <th className="py-3 text-left">Frequency</th>
                    <th className="py-3 text-left">Last Used</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalog.map((entry) => (
                    <CatalogRow key={entry.code} entry={entry} isFavorite={favorites.includes(entry.code)} onToggleFavorite={toggleFavorite} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="col-span-4 space-y-6">
          <section className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Access</h2>
              <button className="text-sm text-blue-600">View History</button>
            </div>
            <div className="space-y-3">
              {recentAccess.map((entry) => (
                <RecentEntry key={`${entry.code}-${entry.accessedAt}`} entry={entry} />
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Module Directory</h2>
              <LayoutGrid className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-3">
              {moduleStats.map((stat) => (
                <div key={stat.module} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{stat.module}</p>
                    <p className="text-xs text-gray-500">{stat.count} T-codes • {stat.critical} critical</p>
                  </div>
                  <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center">
                    Open <ChevronRight className="w-3 h-3 ml-1" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow Shortcuts</h2>
            <div className="space-y-3">
              <ShortcutCard title="Launch EWM Console" subtitle="/operations/logistics" icon={Link2} />
              <ShortcutCard title="Plan MRP Run" subtitle="/planning/mrp" icon={PlusCircle} />
              <ShortcutCard title="Trigger STO" subtitle="/operations/stock-transfers" icon={Link2} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value, trend, status }: { label: string; value: number; trend?: string; status?: "warning" }) {
  const valueColor = status === "warning" ? "text-red-600" : "text-gray-900";
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${valueColor}`}>{value}</p>
      {trend && <p className="text-xs text-gray-400">{trend}</p>}
    </div>
  );
}

function FavoriteCard({ entry, onToggle }: { entry: TCodeEntry; onToggle: (code: string) => void }) {
  return (
    <div className="border border-gray-100 rounded-lg p-4 hover:border-blue-200">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-900">{entry.code}</p>
        <button onClick={() => onToggle(entry.code)} className="text-yellow-500">
          <Star className="w-4 h-4 fill-current" />
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-2">{entry.description}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{entry.module}</span>
        <span>Last used {entry.lastUsed}</span>
      </div>
      <button className="mt-3 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg w-full">Launch</button>
    </div>
  );
}

function CatalogRow({ entry, isFavorite, onToggleFavorite }: { entry: TCodeEntry; isFavorite: boolean; onToggleFavorite: (code: string) => void }) {
  return (
    <tr className="border-b">
      <td className="py-3 font-semibold text-gray-900">{entry.code}</td>
      <td className="py-3 text-gray-700">{entry.description}</td>
      <td className="py-3 text-gray-600">{entry.process}</td>
      <td className="py-3 text-gray-600">{entry.module}</td>
      <td className="py-3 text-gray-600">{entry.frequency}</td>
      <td className="py-3 text-gray-600">{entry.lastUsed}</td>
      <td className="py-3 text-right">
        <div className="flex justify-end space-x-2">
          <button onClick={() => onToggleFavorite(entry.code)} className={`p-2 rounded-full border ${isFavorite ? "text-yellow-500 border-yellow-200" : "text-gray-400 border-gray-200"}`}>
            <Star className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
          </button>
          <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600">Launch</button>
        </div>
      </td>
    </tr>
  );
}

function RecentEntry({ entry }: { entry: RecentAccessEntry }) {
  const badgeColor = entry.outcome === "success" ? "bg-green-100 text-green-700" : entry.outcome === "warning" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  return (
    <div className="border border-gray-100 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{entry.code}</p>
          <p className="text-xs text-gray-500">{entry.location}</p>
        </div>
        <Clock className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
        <span>{entry.user}</span>
        <span>{entry.accessedAt}</span>
      </div>
      <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${badgeColor}`}>{entry.outcome}</span>
    </div>
  );
}

function ShortcutCard({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: LucideIcon }) {
  return (
    <div className="border border-gray-100 rounded-lg p-3 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4 text-gray-500" />
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}
