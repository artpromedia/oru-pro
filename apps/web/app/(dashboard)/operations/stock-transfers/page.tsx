"use client";

import { useMemo, useState } from "react";
import { Building2, ArrowRight } from "lucide-react";

interface TransferItem {
  material: string;
  description: string;
  batch?: string;
  requestedQty: number;
  confirmedQty?: number;
  shippedQty?: number;
  receivedQty?: number;
  uom: string;
  value?: number;
}

interface TransferLogistics {
  carrier: string;
  vehicle: string;
  driver: string;
  departureTime: string;
  estimatedArrival: string;
  actualArrival: string | null;
  distance: string;
  temperature: string;
}

interface TransferDocuments {
  deliveryNote?: string;
  billOfLading?: string;
  proofOfDelivery?: string | null;
}

interface TransferFinancials {
  transferPrice: number;
  transportCost: number;
  intercompanyPosting: string;
}

interface StockTransfer {
  sto: string;
  type: string;
  priority: "urgent" | "normal" | "low";
  fromPlant: string;
  toPlant: string;
  fromCompany?: string;
  toCompany?: string;
  requestedBy?: string;
  requestDate?: string;
  requiredDate?: string;
  status: "draft" | "confirmed" | "picking" | "in_transit" | "delivered";
  shippingPoint?: string;
  items: TransferItem[];
  logistics?: TransferLogistics;
  documents?: TransferDocuments;
  financials?: TransferFinancials;
}

interface CompletedTransfer {
  sto: string;
  completedDate: string;
  fromPlant: string;
  toPlant: string;
  items: number;
  totalValue: number;
  onTimeDelivery: boolean;
}

interface StockTransfersData {
  active: StockTransfer[];
  completed: CompletedTransfer[];
}

interface PlantStockComparison {
  plant: string;
  material: string;
  systemQty: number;
  physicalQty: number;
  variance: number;
  lastCount: string;
}

interface ThirdPartyComparison {
  warehouse: string;
  material: string;
  sapQty: number;
  wmsQty: number;
  variance: number;
  lastSync: string;
}

interface StockComparisonData {
  locations: PlantStockComparison[];
  thirdParty: ThirdPartyComparison[];
}

interface ATPDay {
  date: string;
  available: number;
  incoming: number;
  outgoing: number;
  closing: number;
}

interface AvailableToPromiseData {
  material: string;
  description: string;
  atp: ATPDay[];
}

const stockTransfers: StockTransfersData = {
  active: [
    {
      sto: "STO-2025-1115-001",
      type: "Inter-Plant",
      priority: "urgent",
      fromPlant: "1000 - Chicago Main",
      toPlant: "2000 - Milwaukee DC",
      requestedBy: "Sarah Chen",
      requestDate: "2025-11-15",
      requiredDate: "2025-11-18",
      status: "in_transit",
      shippingPoint: "CHI-01",
      items: [
        {
          material: "FG-001",
          description: "Greek Yogurt 500g",
          batch: "B-2025-1115-001",
          requestedQty: 1000,
          confirmedQty: 1000,
          shippedQty: 1000,
          receivedQty: 0,
          uom: "EA",
          value: 4990
        },
        {
          material: "FG-002",
          description: "Vanilla Yogurt 500g",
          batch: "B-2025-1114-002",
          requestedQty: 500,
          confirmedQty: 500,
          shippedQty: 500,
          receivedQty: 0,
          uom: "EA",
          value: 2495
        }
      ],
      logistics: {
        carrier: "Internal Fleet",
        vehicle: "TRK-003",
        driver: "Mike Johnson",
        departureTime: "2025-11-15 14:00",
        estimatedArrival: "2025-11-15 18:00",
        actualArrival: null,
        distance: "92 miles",
        temperature: "Refrigerated (2-4°C)"
      },
      documents: {
        deliveryNote: "DN-2025-1115-234",
        billOfLading: "BOL-2025-1115-089",
        proofOfDelivery: null
      },
      financials: {
        transferPrice: 7485,
        transportCost: 245,
        intercompanyPosting: "Pending"
      }
    },
    {
      sto: "STO-2025-1115-002",
      type: "Inter-Company",
      priority: "normal",
      fromPlant: "3000 - Detroit Warehouse",
      toPlant: "4000 - Columbus DC",
  fromCompany: "OonruFoods US",
  toCompany: "OonruFoods Canada",
      status: "picking",
      items: [
        {
          material: "RM-2847",
          description: "Organic Milk",
          requestedQty: 5000,
          confirmedQty: 4500,
          uom: "L",
          value: 11250
        }
      ]
    }
  ],
  completed: [
    {
      sto: "STO-2025-1114-005",
      completedDate: "2025-11-14",
      fromPlant: "1000",
      toPlant: "2000",
      items: 3,
      totalValue: 12450,
      onTimeDelivery: true
    }
  ]
};

const stockComparison: StockComparisonData = {
  locations: [
    {
      plant: "1000 - Chicago",
      material: "FG-001",
      systemQty: 5000,
      physicalQty: 4998,
      variance: -2,
      lastCount: "2025-11-14"
    },
    {
      plant: "2000 - Milwaukee",
      material: "FG-001",
      systemQty: 2000,
      physicalQty: 2000,
      variance: 0,
      lastCount: "2025-11-15"
    }
  ],
  thirdParty: [
    {
      warehouse: "3PL-Chicago",
      material: "FG-001",
      sapQty: 10000,
      wmsQty: 9995,
      variance: -5,
      lastSync: "2025-11-15 08:00"
    }
  ]
};

const availableToPromise: AvailableToPromiseData = {
  material: "FG-001",
  description: "Greek Yogurt 500g",
  atp: [
    { date: "2025-11-15", available: 3000, incoming: 0, outgoing: 1000, closing: 2000 },
    { date: "2025-11-16", available: 2000, incoming: 5000, outgoing: 2000, closing: 5000 },
    { date: "2025-11-17", available: 5000, incoming: 0, outgoing: 1500, closing: 3500 },
    { date: "2025-11-18", available: 3500, incoming: 5000, outgoing: 3000, closing: 5500 }
  ]
};

type TabKey = "active" | "atp_check" | "stock_comparison" | "completed";

const tabMap: Record<string, TabKey> = {
  "Active Transfers": "active",
  "ATP Check": "atp_check",
  "Stock Comparison": "stock_comparison",
  Completed: "completed"
};

export default function StockTransferOrders() {
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const completedTransfers = useMemo(() => stockTransfers.completed, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Transfer Orders</h1>
          <p className="text-gray-500 mt-1">Inter-plant and inter-company transfers</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Stock Comparison</button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Create STO</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <nav className="flex space-x-8 px-6">
          {Object.keys(tabMap).map((tabLabel) => (
            <button
              key={tabLabel}
              onClick={() => setActiveTab(tabMap[tabLabel])}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tabMap[tabLabel]
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              {tabLabel}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "active" && (
        <div className="space-y-6">
          {stockTransfers.active.map((transfer) => (
            <STOCard key={transfer.sto} transfer={transfer} />
          ))}
        </div>
      )}

      {activeTab === "atp_check" && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <ATPDisplay atp={availableToPromise} />
        </div>
      )}

      {activeTab === "stock_comparison" && <StockComparisonDisplay comparison={stockComparison} />}

      {activeTab === "completed" && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed Transfers</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 border-b">
                <tr>
                  <th className="text-left py-2">STO</th>
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">From</th>
                  <th className="text-left py-2">To</th>
                  <th className="text-right py-2">Items</th>
                  <th className="text-right py-2">Value</th>
                  <th className="text-center py-2">On Time</th>
                </tr>
              </thead>
              <tbody>
                {completedTransfers.map((transfer) => (
                  <tr key={transfer.sto} className="border-b">
                    <td className="py-2 font-medium">{transfer.sto}</td>
                    <td>{transfer.completedDate}</td>
                    <td>{transfer.fromPlant}</td>
                    <td>{transfer.toPlant}</td>
                    <td className="text-right">{transfer.items}</td>
                    <td className="text-right">${transfer.totalValue.toLocaleString()}</td>
                    <td className="text-center">
                      {transfer.onTimeDelivery ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Yes</span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function STOCard({ transfer }: { transfer: StockTransfer }) {
  const statusColors: Record<StockTransfer["status"], string> = {
    draft: "bg-gray-100 text-gray-700",
    confirmed: "bg-blue-100 text-blue-700",
    picking: "bg-yellow-100 text-yellow-700",
    in_transit: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700"
  };

  const priorityColors: Record<StockTransfer["priority"], string> = {
    urgent: "border-red-500",
    normal: "border-gray-300",
    low: "border-gray-200"
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${priorityColors[transfer.priority]}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">{transfer.sto}</h3>
            <span className={`px-2 py-1 text-xs rounded ${statusColors[transfer.status]}`}>
              {transfer.status.replace("_", " ")}
            </span>
            {transfer.priority === "urgent" && (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Urgent</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{transfer.type} Transfer</p>
        </div>
        {transfer.requiredDate && (
          <div className="text-right">
            <p className="text-sm text-gray-500">Required Date</p>
            <p className="font-medium">{transfer.requiredDate}</p>
          </div>
        )}
      </div>

      <div className="flex items-center flex-wrap gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <TransferEndpoint label="From" value={transfer.fromPlant} company={transfer.fromCompany} />
        <ArrowRight className="w-5 h-5 text-gray-400" />
        <TransferEndpoint label="To" value={transfer.toPlant} company={transfer.toCompany} />
        {transfer.logistics && (
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div>
              <p className="text-xs text-gray-500">Carrier</p>
              <p className="font-medium">{transfer.logistics.carrier}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Vehicle</p>
              <p className="font-medium">{transfer.logistics.vehicle}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">ETA</p>
              <p className="font-medium">{transfer.logistics.estimatedArrival}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Transfer Items</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 border-b">
              <tr>
                <th className="text-left py-2">Material</th>
                <th className="text-right py-2">Requested</th>
                <th className="text-right py-2">Confirmed</th>
                <th className="text-right py-2">Shipped</th>
                <th className="text-right py-2">Received</th>
                <th className="text-right py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {transfer.items.map((item) => (
                <tr key={`${transfer.sto}-${item.material}`} className="border-b">
                  <td className="py-2">
                    <p className="font-medium">{item.material}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </td>
                  <td className="text-right">
                    {item.requestedQty} {item.uom}
                  </td>
                  <td className="text-right">{item.confirmedQty ?? "-"}</td>
                  <td className="text-right">{item.shippedQty ?? "-"}</td>
                  <td className="text-right">{item.receivedQty ?? "-"}</td>
                  <td className="text-right font-medium">{item.value ? `$${item.value.toLocaleString()}` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm">
        {transfer.documents && (
          <div className="flex space-x-2">
            {transfer.documents.deliveryNote && (
              <button className="text-blue-600 hover:text-blue-700">View Delivery Note</button>
            )}
            {transfer.documents.billOfLading && (
              <button className="text-blue-600 hover:text-blue-700">Print BOL</button>
            )}
          </div>
        )}
        <div className="flex space-x-2">
          {transfer.status === "in_transit" && (
            <button className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">Confirm Receipt</button>
          )}
          {transfer.status === "picking" && (
            <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">Post Goods Issue</button>
          )}
        </div>
      </div>
    </div>
  );
}

function TransferEndpoint({ label, value, company }: { label: string; value: string; company?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <Building2 className="w-4 h-4 text-gray-500" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium">{value}</p>
        {company && <p className="text-xs text-gray-500">{company}</p>}
      </div>
    </div>
  );
}

function ATPDisplay({ atp }: { atp: AvailableToPromiseData }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{atp.material}</h2>
          <p className="text-sm text-gray-600">{atp.description}</p>
        </div>
        <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">Run ATP Check</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 border-b">
            <tr>
              <th className="text-left py-3">Date</th>
              <th className="text-right py-3">Opening</th>
              <th className="text-right py-3">Incoming</th>
              <th className="text-right py-3">Outgoing</th>
              <th className="text-right py-3">Available</th>
              <th className="text-center py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {atp.atp.map((day) => (
              <tr key={day.date} className="border-b">
                <td className="py-3 font-medium">{day.date}</td>
                <td className="text-right">{day.available.toLocaleString()}</td>
                <td className="text-right text-green-600">{day.incoming > 0 ? `+${day.incoming.toLocaleString()}` : "-"}</td>
                <td className="text-right text-red-600">{day.outgoing > 0 ? `-${day.outgoing.toLocaleString()}` : "-"}</td>
                <td className="text-right font-bold">{day.closing.toLocaleString()}</td>
                <td className="text-center">
                  {day.closing > 0 ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Available</span>
                  ) : (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Shortage</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockComparisonDisplay({ comparison }: { comparison: StockComparisonData }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plant Stock Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 border-b">
              <tr>
                <th className="text-left py-2">Plant</th>
                <th className="text-left py-2">Material</th>
                <th className="text-right py-2">System Qty</th>
                <th className="text-right py-2">Physical Qty</th>
                <th className="text-right py-2">Variance</th>
                <th className="text-left py-2">Last Count</th>
                <th className="text-center py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {comparison.locations.map((loc) => (
                <tr key={`${loc.plant}-${loc.material}`} className="border-b">
                  <td className="py-2">{loc.plant}</td>
                  <td className="py-2">{loc.material}</td>
                  <td className="text-right">{loc.systemQty.toLocaleString()}</td>
                  <td className="text-right">{loc.physicalQty.toLocaleString()}</td>
                  <td className={`text-right font-medium ${loc.variance === 0 ? "text-green-600" : "text-red-600"}`}>
                    {loc.variance > 0 ? "+" : ""}
                    {loc.variance}
                  </td>
                  <td>{loc.lastCount}</td>
                  <td className="text-center">
                    {loc.variance !== 0 && <button className="text-xs text-blue-600 hover:text-blue-700">Adjust</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">3PL Stock Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 border-b">
              <tr>
                <th className="text-left py-2">Warehouse</th>
                <th className="text-left py-2">Material</th>
                <th className="text-right py-2">SAP Qty</th>
                <th className="text-right py-2">WMS Qty</th>
                <th className="text-right py-2">Variance</th>
                <th className="text-left py-2">Last Sync</th>
                <th className="text-center py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {comparison.thirdParty.map((warehouse) => (
                <tr key={`${warehouse.warehouse}-${warehouse.material}`} className="border-b">
                  <td className="py-2">{warehouse.warehouse}</td>
                  <td className="py-2">{warehouse.material}</td>
                  <td className="text-right">{warehouse.sapQty.toLocaleString()}</td>
                  <td className="text-right">{warehouse.wmsQty.toLocaleString()}</td>
                  <td className={`text-right font-medium ${warehouse.variance === 0 ? "text-green-600" : "text-red-600"}`}>
                    {warehouse.variance > 0 ? "+" : ""}
                    {warehouse.variance}
                  </td>
                  <td>{warehouse.lastSync}</td>
                  <td className="text-center">
                    <button className="text-xs text-blue-600 hover:text-blue-700">Sync Now</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
