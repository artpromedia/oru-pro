"use client";

import { useMemo, useState } from "react";
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calendar,
  MapPin,
  TrendingUp,
  Printer,
  type LucideIcon
} from "lucide-react";

interface CountBin {
  bin: string;
  material: string;
  description: string;
  batch: string;
  bookQuantity: number;
  countQuantity: number | null;
  variance: number | null;
  status: "counted" | "pending" | "recount";
  countedBy?: string;
  countTime?: string;
  recountRequired?: boolean;
  recountReason?: string;
}

interface CountDocument {
  document: string;
  type: string;
  status: "counting" | "planned";
  warehouse: string;
  storageType: string;
  plannedDate: string;
  items: number;
  counted: number;
  variance?: number;
  assignedTo: string;
  bins?: CountBin[];
}

interface CompletedDocument {
  document: string;
  completedDate: string;
  items: number;
  totalVariance: number;
  accuracyRate: number;
}

interface InventoryDocuments {
  active: CountDocument[];
  completed: CompletedDocument[];
}

interface CycleCountStats {
  completed: number;
  scheduled: number;
  overdue: number;
  accuracy: number;
  avgVariance: number;
}

interface AnnualStats {
  progress: number;
  remainingDays: number;
  locations: number;
  completed: number;
}

interface VarianceReason {
  reason: string;
  count: number;
  value: number;
}

interface CountStatistics {
  cycleCount: CycleCountStats;
  annual: AnnualStats;
  variances: VarianceReason[];
}

interface ClearingDocument {
  id: string;
  type: string;
  material: string;
  bin?: string;
  location?: string;
  bookQty: number;
  countQty: number;
  variance: number;
  value: number;
  decision: "pending" | "approved";
  options?: string[];
  approvedBy?: string;
  glPosting?: string;
}

interface ScheduleItemData {
  date: string;
  type: string;
  location: string;
  items: number;
  assigned: string;
  status: "in-progress" | "scheduled" | "completed";
}

interface ABCCategoryData {
  category: "A" | "B" | "C";
  items: number;
  value: string;
  frequency: string;
  color: string;
}

const inventoryDocuments: InventoryDocuments = {
  active: [
    {
      document: "LI-2025-1115-001",
      type: "Cycle Count",
      status: "counting",
      warehouse: "WH01",
      storageType: "300",
      plannedDate: "2025-11-15",
      items: 47,
      counted: 23,
      variance: 3,
      assignedTo: "John Smith",
      bins: [
        {
          bin: "A-01-001",
          material: "FG-001",
          description: "Greek Yogurt 500g",
          batch: "B-2025-1110-001",
          bookQuantity: 500,
          countQuantity: 498,
          variance: -2,
          status: "counted",
          countedBy: "JSMITH",
          countTime: "09:45"
        },
        {
          bin: "A-01-002",
          material: "FG-002",
          description: "Vanilla Yogurt 500g",
          batch: "B-2025-1112-001",
          bookQuantity: 300,
          countQuantity: null,
          variance: null,
          status: "pending",
          recountRequired: false
        },
        {
          bin: "A-01-003",
          material: "RM-2847",
          description: "Organic Milk",
          batch: "RM-B-2025-1114-001",
          bookQuantity: 2500,
          countQuantity: 2650,
          variance: 150,
          status: "recount",
          countedBy: "MJOHNSON",
          countTime: "10:15",
          recountReason: "Variance > 5%"
        }
      ]
    },
    {
      document: "LI-2025-1115-002",
      type: "Annual Count",
      status: "planned",
      warehouse: "WH02",
      storageType: "500",
      plannedDate: "2025-11-16",
      items: 234,
      counted: 0,
      assignedTo: "Team B"
    }
  ],
  completed: [
    {
      document: "LI-2025-1114-003",
      completedDate: "2025-11-14",
      items: 89,
      totalVariance: 12450,
      accuracyRate: 96.7
    }
  ]
};

const countStatistics: CountStatistics = {
  cycleCount: {
    completed: 234,
    scheduled: 47,
    overdue: 8,
    accuracy: 97.2,
    avgVariance: 1.8
  },
  annual: {
    progress: 67,
    remainingDays: 45,
    locations: 12,
    completed: 8
  },
  variances: [
    { reason: "Counting Error", count: 23, value: 4500 },
    { reason: "Unrecorded Movement", count: 12, value: 8900 },
    { reason: "System Error", count: 5, value: 2300 },
    { reason: "Damage/Loss", count: 3, value: 1200 }
  ]
};

const clearingProcess: { documents: ClearingDocument[] } = {
  documents: [
    {
      id: "CLR-2025-1115-001",
      type: "WM Managed",
      material: "FG-001",
      bin: "A-01-001",
      bookQty: 500,
      countQty: 498,
      variance: -2,
      value: -89.5,
      decision: "pending",
      options: ["Accept Variance", "Recount", "Investigation"]
    },
    {
      id: "CLR-2025-1115-002",
      type: "IM Managed",
      material: "RM-2847",
      location: "RP01",
      bookQty: 10000,
      countQty: 10150,
      variance: 150,
      value: 375,
      decision: "approved",
      approvedBy: "SCHEN",
      glPosting: "4000001234"
    }
  ]
};

const countSchedule: ScheduleItemData[] = [
  { date: "Today", type: "Cycle Count", location: "WH01 - Zone A", items: 47, assigned: "John Smith", status: "in-progress" },
  { date: "Tomorrow", type: "Annual Count", location: "WH02 - Cooler", items: 234, assigned: "Team B", status: "scheduled" },
  { date: "Nov 18", type: "Cycle Count", location: "WH01 - Zone B", items: 89, assigned: "Sarah Davis", status: "scheduled" }
];

const abcCategories: ABCCategoryData[] = [
  { category: "A", items: 234, value: "$2.4M", frequency: "Weekly", color: "text-red-600" },
  { category: "B", items: 567, value: "$890K", frequency: "Monthly", color: "text-yellow-600" },
  { category: "C", items: 1234, value: "$234K", frequency: "Quarterly", color: "text-green-600" }
];

export default function PhysicalInventory() {
  const [activeCount, setActiveCount] = useState(inventoryDocuments.active[0]?.document ?? "");
  const [countType, setCountType] = useState("cycle");

  const activeDocument = useMemo(() => {
    return inventoryDocuments.active.find((doc) => doc.document === activeCount) ?? inventoryDocuments.active[0];
  }, [activeCount]);

  if (!activeDocument) {
    return null;
  }

  const progressPercentage = activeDocument.items
    ? Math.round((activeDocument.counted / activeDocument.items) * 100)
    : 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Physical Inventory Management</h1>
          <p className="text-gray-500 mt-1">Cycle counting and inventory adjustments</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg"
            value={countType}
            onChange={(e) => setCountType(e.target.value)}
          >
            <option value="cycle">Cycle Count</option>
            <option value="annual">Annual Count</option>
            <option value="special">Special Count</option>
          </select>
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Printer className="w-4 h-4 inline mr-2" />
            Print Count Sheet
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Create Count Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <InventoryKPI icon={ClipboardList} label="Documents Active" value={inventoryDocuments.active.length} subvalue="47 items pending" />
        <InventoryKPI icon={CheckCircle} label="Count Accuracy" value={`${countStatistics.cycleCount.accuracy}%`} status="success" />
        <InventoryKPI icon={AlertTriangle} label="Variances" value={43} subvalue="$16,900 total" status="warning" />
        <InventoryKPI icon={TrendingUp} label="Avg Variance" value={`${countStatistics.cycleCount.avgVariance}%`} />
        <InventoryKPI icon={Calendar} label="Annual Progress" value={`${countStatistics.annual.progress}%`} subvalue="45 days left" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Active Count Document: {activeDocument.document}</h2>
              {inventoryDocuments.active.length > 1 && (
                <select
                  className="px-3 py-1 text-sm border border-gray-200 rounded"
                  value={activeCount}
                  onChange={(e) => setActiveCount(e.target.value)}
                >
                  {inventoryDocuments.active.map((doc) => (
                    <option key={doc.document} value={doc.document}>
                      {doc.document}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>
                  Progress: {activeDocument.counted}/{activeDocument.items} items
                </span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progressPercentage}%` }} />
              </div>
            </div>

            <div className="space-y-3">
              {activeDocument.bins?.map((bin) => <CountItemCard key={bin.bin} item={bin} />)}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Save Progress</button>
              <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Submit for Review</button>
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Post Count Results</button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Variance Clearing Process</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700">Refresh <RefreshCw className="w-4 h-4 inline ml-1" /></button>
            </div>
            <div className="space-y-3">
              {clearingProcess.documents.map((doc) => (
                <VarianceClearingCard key={doc.id} document={doc} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Count Schedule</h3>
            <div className="space-y-3">
              {countSchedule.map((schedule) => (
                <ScheduleItem key={`${schedule.date}-${schedule.location}`} data={schedule} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Variance Analysis</h3>
            <div className="space-y-3">
              {countStatistics.variances.map((variance) => (
                <div key={variance.reason} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{variance.reason}</p>
                    <p className="text-xs text-gray-500">{variance.count} occurrences</p>
                  </div>
                  <span className="text-sm font-medium">${variance.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Variance</span>
                <span className="font-bold text-lg">$16,900</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">ABC Classification</h3>
            <div className="space-y-2">
              {abcCategories.map((category) => (
                <ABCCategory key={category.category} category={category} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InventoryKPI({
  icon: Icon,
  label,
  value,
  subvalue,
  status
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subvalue?: string;
  status?: "success" | "warning";
}) {
  const iconColor = status === "success" ? "text-green-500" : status === "warning" ? "text-yellow-500" : "text-gray-500";
  const valueColor = status === "success" ? "text-green-600" : status === "warning" ? "text-yellow-600" : "text-gray-900";

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {subvalue && <div className="text-xs text-gray-400 mt-1">{subvalue}</div>}
    </div>
  );
}

function CountItemCard({ item }: { item: CountBin }) {
  const statusColors: Record<CountBin["status"], string> = {
    counted: "bg-green-100 text-green-700",
    pending: "bg-gray-100 text-gray-700",
    recount: "bg-yellow-100 text-yellow-700"
  };

  const hasVariance = typeof item.variance === "number" && item.variance !== 0;
  const variancePercent = item.bookQuantity && item.variance !== null ? Math.abs((item.variance / item.bookQuantity) * 100) : 0;

  return (
    <div className={`border rounded-lg p-4 ${item.status === "recount" ? "border-yellow-200 bg-yellow-50" : "border-gray-200"}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{item.bin}</span>
            <span className={`px-2 py-1 text-xs rounded ${statusColors[item.status]}`}>{item.status}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {item.material} - {item.description}
          </p>
          <p className="text-xs text-gray-500">Batch: {item.batch}</p>
        </div>
        {item.status === "recount" && item.recountReason && (
          <div className="text-xs text-yellow-600 text-right">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            <p>{item.recountReason}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <InfoField label="Book Qty" value={item.bookQuantity} />
        <div>
          <p className="text-xs text-gray-500">Count Qty</p>
          {item.status === "pending" ? (
            <input type="number" className="w-full px-2 py-1 border rounded text-sm" placeholder="Enter" />
          ) : (
            <p className="font-medium">{item.countQuantity}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500">Variance</p>
          <p
            className={`font-medium ${
              hasVariance && item.variance && item.variance > 0
                ? "text-red-600"
                : hasVariance && item.variance && item.variance < 0
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {item.variance !== null ? (
              <>
                {item.variance > 0 ? "+" : ""}
                {item.variance}
                {variancePercent > 5 && <span className="text-xs"> ({variancePercent.toFixed(1)}%)</span>}
              </>
            ) : (
              "-"
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Counted By</p>
          <p className="text-sm">{item.countedBy ?? "-"}</p>
          {item.countTime && <p className="text-xs text-gray-400">{item.countTime}</p>}
        </div>
      </div>

      {item.status === "pending" && (
        <div className="flex justify-end mt-3 space-x-2">
          <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">Submit Count</button>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function VarianceClearingCard({ document }: { document: ClearingDocument }) {
  const varianceColor = document.variance >= 0 ? "text-red-600" : "text-yellow-600";

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium">{document.id}</p>
          <p className="text-sm text-gray-600">
            {document.material} - {document.type}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs ${
            document.decision === "approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {document.decision === "approved" ? "Approved" : "Pending"}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3 text-sm mb-3">
        <InfoField label="Book" value={document.bookQty} />
        <InfoField label="Count" value={document.countQty} />
        <div>
          <p className="text-xs text-gray-500">Variance</p>
          <p className={`font-medium ${varianceColor}`}>
            {document.variance > 0 ? "+" : ""}
            {document.variance}
          </p>
        </div>
        <InfoField label="Value" value={`$${document.value.toFixed(2)}`} />
      </div>

      {document.decision === "pending" && document.options && (
        <div className="flex space-x-2">
          {document.options.map((option) => (
            <button key={option} className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50">
              {option}
            </button>
          ))}
        </div>
      )}

      {document.decision === "approved" && document.approvedBy && document.glPosting && (
        <div className="text-xs text-gray-500">
          Approved by {document.approvedBy} • GL: {document.glPosting}
        </div>
      )}
    </div>
  );
}

function ScheduleItem({ data }: { data: ScheduleItemData }) {
  const statusStyles: Record<ScheduleItemData["status"], string> = {
    "in-progress": "text-blue-600",
    scheduled: "text-gray-500",
    completed: "text-green-600"
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-900">{data.date}</span>
        <span className={`text-xs ${statusStyles[data.status]}`}>{data.status.replace("-", " ")}</span>
      </div>
      <p className="text-sm text-gray-600">{data.type}</p>
      <p className="text-xs text-gray-500">{data.location}</p>
      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
        <span>{data.items} items</span>
        <span>{data.assigned}</span>
      </div>
    </div>
  );
}

function ABCCategory({ category }: { category: ABCCategoryData }) {
  return (
    <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <span className={`text-lg font-semibold ${category.color}`}>{category.category}</span>
        <div>
          <p className="text-sm font-medium text-gray-900">{category.items} items</p>
          <p className="text-xs text-gray-500">Value {category.value}</p>
        </div>
      </div>
      <span className="text-xs text-gray-500">{category.frequency}</span>
    </div>
  );
}
