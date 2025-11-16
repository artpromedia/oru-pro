"use client";

import { useState } from "react";
import {
  Calculator,
  Package,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Target,
  type LucideIcon
} from "lucide-react";

interface SuggestedOrder {
  quantity: number;
  orderDate: string;
  deliveryDate: string;
  vendor: string;
  cost: number;
}

interface CriticalItem {
  material: string;
  description: string;
  currentStock: number;
  safetyStock: number;
  averageUsage: number;
  leadTime: number;
  shortage: number;
  requiredBy: string;
  suggestedOrder: SuggestedOrder;
}

interface PlannedOrderComponent {
  material: string;
  required: number;
  available: number;
  status: "critical" | "shortage" | "ok";
}

interface PlannedOrderBase {
  id: string;
  type: "Production" | "Purchase";
  material: string;
  description?: string;
  quantity: number;
  status: "Materials Missing" | "Ready to Convert";
}

interface ProductionOrder extends PlannedOrderBase {
  type: "Production";
  plannedStart: string;
  plannedEnd: string;
  resource: string;
  components: PlannedOrderComponent[];
}

interface PurchaseOrder extends PlannedOrderBase {
  type: "Purchase";
  vendor: string;
  orderDate: string;
  deliveryDate: string;
}

type PlannedOrder = ProductionOrder | PurchaseOrder;

interface CapacityConflict {
  date: string;
  overload: number;
  orders: string[];
}

interface CapacityResource {
  name: string;
  capacity: number;
  planned: number;
  available: number;
  utilization: number;
  bottleneck: boolean;
  conflicts?: CapacityConflict[];
}

interface StockRequirementPeriod {
  week: string;
  demand: number;
  supply: number;
  closing: number;
}

interface StockRequirementData {
  material: string;
  periods: StockRequirementPeriod[];
}

interface MRPResults {
  summary: {
    totalMaterials: number;
    criticalShortages: number;
    suggestedOrders: number;
    excessInventory: number;
    planningAccuracy: number;
  };
  criticalItems: CriticalItem[];
  plannedOrders: PlannedOrder[];
  capacityAnalysis: {
    resources: CapacityResource[];
  };
  stockRequirements: StockRequirementData[];
}

const mrpResults: MRPResults = {
  summary: {
    totalMaterials: 2847,
    criticalShortages: 12,
    suggestedOrders: 47,
    excessInventory: 23,
    planningAccuracy: 94.3
  },
  criticalItems: [
    {
      material: "RM-2847",
      description: "Organic Milk 2%",
      currentStock: 500,
      safetyStock: 2000,
      averageUsage: 450,
      leadTime: 3,
      shortage: -1500,
      requiredBy: "2025-11-18",
      suggestedOrder: {
        quantity: 5000,
        orderDate: "2025-11-15",
        deliveryDate: "2025-11-18",
        vendor: "Green Valley Farms",
        cost: 12500
      }
    },
    {
      material: "PKG-1234",
      description: "Yogurt Container 500g",
      currentStock: 2000,
      safetyStock: 10000,
      averageUsage: 3000,
      leadTime: 7,
      shortage: -8000,
      requiredBy: "2025-11-20",
      suggestedOrder: {
        quantity: 25000,
        orderDate: "2025-11-15",
        deliveryDate: "2025-11-22",
        vendor: "PackagingPro Inc",
        cost: 3750
      }
    }
  ],
  plannedOrders: [
    {
      id: "PLO-2025-1115-001",
      type: "Production",
      material: "FG-001",
      description: "Greek Yogurt 500g",
      quantity: 5000,
      plannedStart: "2025-11-18 06:00",
      plannedEnd: "2025-11-18 14:00",
      resource: "Line 1",
      components: [
        { material: "RM-2847", required: 2500, available: 500, status: "critical" },
        { material: "RM-3456", required: 50, available: 200, status: "ok" },
        { material: "PKG-1234", required: 5000, available: 2000, status: "shortage" }
      ],
      status: "Materials Missing"
    },
    {
      id: "PLO-2025-1115-002",
      type: "Purchase",
      material: "RM-2847",
      quantity: 5000,
      vendor: "Green Valley Farms",
      orderDate: "2025-11-15",
      deliveryDate: "2025-11-18",
      status: "Ready to Convert"
    }
  ],
  capacityAnalysis: {
    resources: [
      {
        name: "Line 1 - Dairy",
        capacity: 8,
        planned: 10,
        available: -2,
        utilization: 125,
        bottleneck: true,
        conflicts: [{ date: "2025-11-18", overload: 2, orders: ["PLO-001", "PLO-003"] }]
      },
      {
        name: "Line 2 - Packaging",
        capacity: 12,
        planned: 9,
        available: 3,
        utilization: 75,
        bottleneck: false
      }
    ]
  },
  stockRequirements: [
    {
      material: "FG-001",
      periods: [
        { week: "W46", demand: 5000, supply: 3000, closing: -2000 },
        { week: "W47", demand: 6000, supply: 5000, closing: -3000 },
        { week: "W48", demand: 4500, supply: 5000, closing: -2500 },
        { week: "W49", demand: 7000, supply: 7000, closing: -2500 }
      ]
    }
  ]
};

export default function MRPDashboard() {
  const [planningHorizon, setPlanningHorizon] = useState("30");

  const stockRequirement = mrpResults.stockRequirements[0];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Material Requirements Planning</h1>
          <p className="text-gray-500 mt-1">MRP calculation results and capacity planning</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={planningHorizon}
            onChange={(e) => setPlanningHorizon(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg"
          >
            <option value="7">7 Days</option>
            <option value="14">14 Days</option>
            <option value="30">30 Days</option>
            <option value="90">90 Days</option>
          </select>
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Run MRP
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Convert to Orders
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <MRPMetric icon={Package} label="Materials Analyzed" value={mrpResults.summary.totalMaterials} />
        <MRPMetric icon={AlertTriangle} label="Critical Shortages" value={mrpResults.summary.criticalShortages} alert />
        <MRPMetric icon={Calculator} label="Suggested Orders" value={mrpResults.summary.suggestedOrders} />
        <MRPMetric icon={TrendingUp} label="Excess Inventory" value={mrpResults.summary.excessInventory} warning />
        <MRPMetric icon={Target} label="Planning Accuracy" value={`${mrpResults.summary.planningAccuracy}%`} success />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Critical Material Shortages</h2>
          <div className="space-y-4">
            {mrpResults.criticalItems.map((item) => (
              <CriticalShortageCard key={item.material} item={item} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Capacity Analysis</h2>
          <div className="space-y-4">
            {mrpResults.capacityAnalysis.resources.map((resource) => (
              <CapacityResourceCard key={resource.name} resource={resource} />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Planned Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 border-b">
              <tr>
                <th className="text-left py-3">Order ID</th>
                <th className="text-left py-3">Type</th>
                <th className="text-left py-3">Material</th>
                <th className="text-right py-3">Quantity</th>
                <th className="text-left py-3">Date</th>
                <th className="text-left py-3">Resource/Vendor</th>
                <th className="text-center py-3">Status</th>
                <th className="text-center py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {mrpResults.plannedOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-medium">{order.id}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        order.type === "Production" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                      }`}
                    >
                      {order.type}
                    </span>
                  </td>
                  <td className="py-3">
                    <div>
                      <p className="font-medium">{order.material}</p>
                      {"description" in order && order.description && (
                        <p className="text-xs text-gray-500">{order.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="text-right py-3">{order.quantity.toLocaleString()}</td>
                  <td className="py-3 text-xs">{"plannedStart" in order ? order.plannedStart : order.orderDate}</td>
                  <td className="py-3">{"resource" in order ? order.resource : order.vendor}</td>
                  <td className="text-center py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        order.status === "Ready to Convert" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="text-center py-3">
                    <button className="text-blue-600 hover:text-blue-700 text-xs">Convert →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {stockRequirement && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock Requirements List</h2>
          <StockRequirementsList data={stockRequirement} />
        </div>
      )}
    </div>
  );
}

interface CriticalShortageCardProps {
  item: CriticalItem;
}

function CriticalShortageCard({ item }: CriticalShortageCardProps) {
  return (
    <div className="border border-red-200 bg-red-50 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{item.material}</h3>
          <p className="text-sm text-gray-600">{item.description}</p>
        </div>
        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Shortage: {item.shortage}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <DataPoint label="Current Stock" value={item.currentStock} />
        <DataPoint label="Safety Stock" value={item.safetyStock} />
        <DataPoint label="Lead Time" value={`${item.leadTime} days`} />
        <div>
          <p className="text-gray-500">Required By</p>
          <p className="font-medium text-red-600">{item.requiredBy}</p>
        </div>
      </div>

      <div className="p-3 bg-white rounded border border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-2">Suggested Purchase Order</p>
        <div className="flex items-center justify-between text-sm">
          <span>Qty: {item.suggestedOrder.quantity.toLocaleString()}</span>
          <span>${item.suggestedOrder.cost.toLocaleString()}</span>
          <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">Create PO →</button>
        </div>
      </div>
    </div>
  );
}

function DataPoint({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

interface CapacityResourceCardProps {
  resource: CapacityResource;
}

function CapacityResourceCard({ resource }: CapacityResourceCardProps) {
  const utilizationColor =
    resource.utilization > 100
      ? "text-red-600"
      : resource.utilization > 80
      ? "text-yellow-600"
      : "text-green-600";

  const utilizationBar =
    resource.utilization > 100
      ? "bg-red-500"
      : resource.utilization > 80
      ? "bg-yellow-500"
      : "bg-green-500";

  return (
    <div className={`border rounded-lg p-4 ${resource.bottleneck ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">{resource.name}</h3>
        {resource.bottleneck && (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Bottleneck</span>
        )}
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Utilization</span>
          <span className={`font-medium ${utilizationColor}`}>{resource.utilization}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className={`h-2 rounded-full ${utilizationBar}`} style={{ width: `${Math.min(resource.utilization, 100)}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <DataPoint label="Capacity" value={`${resource.capacity}h`} />
        <DataPoint label="Planned" value={`${resource.planned}h`} />
        <div>
          <p className="text-gray-500">Available</p>
          <p className={`font-medium ${resource.available < 0 ? "text-red-600" : "text-green-600"}`}>
            {resource.available}h
          </p>
        </div>
      </div>

      {resource.conflicts && resource.conflicts.length > 0 && (
        <div className="mt-3 p-2 bg-white rounded border border-red-200">
          <p className="text-xs font-medium text-red-700">Capacity Conflicts</p>
          {resource.conflicts.map((conflict) => (
            <p key={conflict.date} className="text-xs text-gray-600">
              {conflict.date}: {conflict.overload}h overload
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

interface StockRequirementsListProps {
  data: StockRequirementData;
}

function StockRequirementsList({ data }: StockRequirementsListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">{data.material} - Greek Yogurt 500g</h3>
        <span className="text-sm text-gray-500">Weekly View</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 border-b">
            <tr>
              <th className="text-left py-2">Period</th>
              <th className="text-right py-2">Opening Stock</th>
              <th className="text-right py-2">Demand</th>
              <th className="text-right py-2">Supply</th>
              <th className="text-right py-2">Closing Stock</th>
              <th className="text-center py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.periods.map((period, index) => {
              const opening = index === 0 ? 0 : data.periods[index - 1].closing;
              return (
                <tr key={period.week} className="border-b">
                  <td className="py-2 font-medium">{period.week}</td>
                  <td className="text-right">{opening.toLocaleString()}</td>
                  <td className="text-right">{period.demand.toLocaleString()}</td>
                  <td className="text-right">{period.supply.toLocaleString()}</td>
                  <td className={`text-right font-medium ${period.closing < 0 ? "text-red-600" : ""}`}>
                    {period.closing.toLocaleString()}
                  </td>
                  <td className="text-center">
                    {period.closing < 0 ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Shortage</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">OK</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface MRPMetricProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  alert?: boolean;
  warning?: boolean;
  success?: boolean;
}

function MRPMetric({ icon: Icon, label, value, alert, warning, success }: MRPMetricProps) {
  const iconColor = alert ? "text-red-500" : warning ? "text-yellow-500" : success ? "text-green-500" : "text-gray-500";
  const valueColor = alert ? "text-red-600" : warning ? "text-yellow-600" : success ? "text-green-600" : "text-gray-900";

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
