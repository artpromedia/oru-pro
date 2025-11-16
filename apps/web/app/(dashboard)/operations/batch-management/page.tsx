"use client";

import { useMemo, useState } from "react";
import {
  Package,
  GitBranch,
  Search,
  CheckCircle,
  Clock,
  Truck,
  Factory,
  ChevronRight,
  ChevronDown,
  Shield,
  type LucideIcon
} from "lucide-react";

interface BatchCharacteristic {
  ph: number;
  fat: number;
  protein: number;
  viscosity: number;
}

interface BatchParentComponent {
  batch: string;
  material: string;
  description: string;
  quantity: number;
  uom: string;
  vendor: string;
  vendorBatch: string;
}

interface BatchChildUsage {
  document: string;
  type: string;
  customer: string;
  quantity: number;
  date: string;
}

interface BatchMovement {
  date: string;
  type: "GR" | "GI" | "Transfer";
  movementType: string;
  description: string;
  quantity: number;
  location?: string;
  from?: string;
  to?: string;
  user?: string;
  reference?: string;
}

interface BatchDetails {
  material: string;
  description: string;
  quantity: number;
  uom: string;
  status: string;
  manufactureDate: string;
  expirationDate: string;
  shelfLife: number;
  plant: string;
  productionOrder: string;
  qualityStatus: string;
  characteristics: BatchCharacteristic;
  genealogy: {
    parents: BatchParentComponent[];
    children: BatchChildUsage[];
  };
  movements: BatchMovement[];
}

interface WhereUsedChild {
  level: number;
  document: string;
  type: string;
  customer: string;
  quantity: number;
}

interface WhereUsedNode {
  level: number;
  batch: string;
  material: string;
  quantity: number;
  date: string;
  children?: WhereUsedChild[];
}

interface WhereUsedData {
  batch: string;
  material: string;
  usedIn: WhereUsedNode[];
}

const batchData: Record<string, BatchDetails> = {
  "B-2025-1115-001": {
    material: "FG-001",
    description: "Greek Yogurt 500g",
    quantity: 5000,
    uom: "EA",
    status: "Released",
    manufactureDate: "2025-11-15",
    expirationDate: "2025-12-06",
    shelfLife: 21,
    plant: "1000",
    productionOrder: "PRD-2025-1115-001",
    qualityStatus: "Released",
    characteristics: {
      ph: 4.6,
      fat: 2.5,
      protein: 5.3,
      viscosity: 850
    },
    genealogy: {
      parents: [
        {
          batch: "RM-B-2025-1114-001",
          material: "RM-2847",
          description: "Organic Milk",
          quantity: 2500,
          uom: "L",
          vendor: "Green Valley Farms",
          vendorBatch: "GVF-2025-1114"
        },
        {
          batch: "RM-B-2025-1110-002",
          material: "RM-3456",
          description: "Culture",
          quantity: 25,
          uom: "KG",
          vendor: "BioSupplies Inc",
          vendorBatch: "BS-2025-1110"
        }
      ],
      children: [
        {
          document: "DEL-2025-1116-001",
          type: "Delivery",
          customer: "Whole Foods #234",
          quantity: 500,
          date: "2025-11-16"
        },
        {
          document: "DEL-2025-1116-002",
          type: "Delivery",
          customer: "Target #567",
          quantity: 1000,
          date: "2025-11-16"
        }
      ]
    },
    movements: [
      {
        date: "2025-11-15 14:00",
        type: "GR",
        movementType: "101",
        description: "Goods Receipt from Production",
        quantity: 5000,
        location: "FG01",
        user: "PROD_USER"
      },
      {
        date: "2025-11-15 15:30",
        type: "Transfer",
        movementType: "311",
        description: "Transfer to Warehouse",
        quantity: 5000,
        from: "FG01",
        to: "WH01",
        user: "WH_USER"
      },
      {
        date: "2025-11-16 08:00",
        type: "GI",
        movementType: "601",
        description: "Goods Issue for Delivery",
        quantity: 500,
        location: "WH01",
        reference: "DEL-2025-1116-001"
      }
    ]
  }
};

const whereUsedResults: WhereUsedData = {
  batch: "RM-B-2025-1114-001",
  material: "Organic Milk",
  usedIn: [
    {
      level: 1,
      batch: "B-2025-1115-001",
      material: "Greek Yogurt 500g",
      quantity: 2500,
      date: "2025-11-15",
      children: [
        {
          level: 2,
          document: "DEL-2025-1116-001",
          type: "Customer Delivery",
          customer: "Whole Foods #234",
          quantity: 50
        }
      ]
    },
    {
      level: 1,
      batch: "B-2025-1115-002",
      material: "Vanilla Yogurt 500g",
      quantity: 2000,
      date: "2025-11-15"
    }
  ]
};

export default function BatchManagement() {
  const [selectedBatch] = useState<keyof typeof batchData>("B-2025-1115-001");
  const [traceDirection, setTraceDirection] = useState<"both" | "forward" | "backward">("both");

  const currentBatch = useMemo(() => batchData[selectedBatch], [selectedBatch]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Management & Traceability</h1>
          <p className="text-gray-500 mt-1">Complete batch genealogy and movement tracking</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={traceDirection}
            onChange={(e) => setTraceDirection(e.target.value as typeof traceDirection)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg"
          >
            <option value="both">Bidirectional Trace</option>
            <option value="forward">Forward Trace</option>
            <option value="backward">Backward Trace</option>
          </select>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <Search className="w-4 h-4 inline mr-2" />
            Batch Search
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Batch: {selectedBatch}</h2>
                <p className="text-gray-600">{currentBatch.description}</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">{currentBatch.status}</span>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <InfoTile label="Quantity" value={`${currentBatch.quantity} ${currentBatch.uom}`} icon={Package} />
              <InfoTile label="Manufacture Date" value={currentBatch.manufactureDate} icon={Factory} />
              <InfoTile label="Expiration" value={currentBatch.expirationDate} icon={Clock} />
              <InfoTile label="Shelf Life" value={`${currentBatch.shelfLife} days`} icon={Shield} highlight="18 days (86%)" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Batch Genealogy</h3>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Components Used (Backward Trace)</h4>
              <div className="space-y-2">
                {currentBatch.genealogy.parents.map((parent) => (
                  <BatchComponentCard key={parent.batch} component={parent} />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Where Used (Forward Trace)</h4>
              <div className="space-y-2">
                {currentBatch.genealogy.children.map((child) => (
                  <BatchUsageCard key={child.document} usage={child} />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Movement History</h3>
            <div className="space-y-3">
              {currentBatch.movements.map((movement, index) => (
                <MovementCard key={`${movement.date}-${index}`} movement={movement} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quality Status</h3>
            <div className="space-y-3">
              <QualityRow label="Inspection Status" value="Released" badgeColor="green" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">COA</span>
                <button className="text-blue-600 hover:text-blue-700 text-sm">View COA →</button>
              </div>
              <QualityRow label="Inspection Lot" value="3000000847" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Batch Characteristics</h3>
            <div className="space-y-3">
              {Object.entries(currentBatch.characteristics).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{key}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Recall Readiness</h3>
            <div className="space-y-3">
              <RecallMetric label="Traceability" value="100%" status="complete" />
              <RecallMetric label="Documentation" value="100%" status="complete" />
              <RecallMetric label="Customer Tracking" value="100%" status="complete" />
              <RecallMetric label="Recall Time" value="< 2 hrs" status="ready" />
            </div>
            <button className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
              Initiate Mock Recall
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Where-Used Analysis</h3>
        <WhereUsedTree data={whereUsedResults} />
      </div>
    </div>
  );
}

function BatchComponentCard({ component }: { component: BatchParentComponent }) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex items-center space-x-3">
        <Package className="w-5 h-5 text-gray-400" />
        <div>
          <p className="font-medium">{component.batch}</p>
          <p className="text-sm text-gray-600">{component.description}</p>
          <p className="text-xs text-gray-500">
            Vendor: {component.vendor} • Batch: {component.vendorBatch}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium">
          {component.quantity} {component.uom}
        </p>
      </div>
    </div>
  );
}

function BatchUsageCard({ usage }: { usage: BatchChildUsage }) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex items-center space-x-3">
        <Truck className="w-5 h-5 text-gray-400" />
        <div>
          <p className="font-medium">{usage.document}</p>
          <p className="text-sm text-gray-600">{usage.customer}</p>
          <p className="text-xs text-gray-500">
            {usage.type} • {usage.date}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium">{usage.quantity} EA</p>
      </div>
    </div>
  );
}

function MovementCard({ movement }: { movement: BatchMovement }) {
  const iconMap: Record<BatchMovement["type"], LucideIcon> = {
    GR: CheckCircle,
    GI: Truck,
    Transfer: GitBranch
  };
  const Icon = iconMap[movement.type];

  return (
    <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
      <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm">{movement.description}</p>
          <span className="text-xs text-gray-500">{movement.date}</span>
        </div>
        <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-600">
          <span>Type: {movement.movementType}</span>
          <span>Qty: {movement.quantity}</span>
          {movement.from && movement.to && <span>{movement.from} → {movement.to}</span>}
          {movement.location && <span>Location: {movement.location}</span>}
          {movement.user && <span>User: {movement.user}</span>}
        </div>
        {movement.reference && <p className="text-xs text-blue-600 mt-1">Ref: {movement.reference}</p>}
      </div>
    </div>
  );
}

function WhereUsedTree({ data }: { data: WhereUsedData }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div>
      <div className="p-3 bg-gray-50 rounded-lg mb-3">
        <p className="font-medium">
          {data.batch} - {data.material}
        </p>
      </div>
      <div className="space-y-2">
        {data.usedIn.map((usage) => (
          <div key={usage.batch}>
            <button
              type="button"
              className="flex w-full items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              onClick={() => toggle(usage.batch)}
            >
              {usage.children ? (
                expanded[usage.batch] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
              ) : (
                <div className="w-4" />
              )}
              <div className="flex-1 text-left">
                <p className="font-medium">{usage.batch}</p>
                <p className="text-sm text-gray-600">
                  {usage.material} • {usage.quantity} L • {usage.date}
                </p>
              </div>
            </button>
            {expanded[usage.batch] && usage.children && (
              <div className="ml-8 mt-2 space-y-2">
                {usage.children.map((child) => (
                  <div key={child.document} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-sm font-medium">{child.document}</p>
                    <p className="text-xs text-gray-600">
                      {child.type} • {child.customer}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RecallMetric({ label, value, status }: { label: string; value: string; status: "complete" | "ready" | "warning" }) {
  const statusColors: Record<"complete" | "ready" | "warning", string> = {
    complete: "text-green-600",
    ready: "text-blue-600",
    warning: "text-yellow-600"
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`font-medium ${statusColors[status]}`}>{value}</span>
    </div>
  );
}

function QualityRow({ label, value, badgeColor }: { label: string; value: string; badgeColor?: "green" | "yellow" | "red" }) {
  const badgeStyles: Record<string, string> = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700"
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      {badgeColor ? (
        <span className={`px-2 py-1 rounded text-xs ${badgeStyles[badgeColor]}`}>{value}</span>
      ) : (
        <span className="text-sm font-medium">{value}</span>
      )}
    </div>
  );
}

function InfoTile({
  label,
  value,
  icon: Icon,
  highlight
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  highlight?: string;
}) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
      {highlight && <p className="text-xs text-green-600">{highlight}</p>}
    </div>
  );
}
