"use client";

import { useMemo, useState } from "react";
import {
  CreditCard,
  Package,
  Repeat,
  ShoppingCart,
  Tag,
  Users,
  CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type TransactionKey =
  | "omnichannel_order"
  | "pos_transaction"
  | "inventory_transfer"
  | "returns_exchange"
  | "price_markdown"
  | "customer_service";

type TransactionConfig<TWorkflow extends WorkflowVariant> = {
  name: string;
  icon: LucideIcon;
  aiDriven?: boolean;
  workflows: TWorkflow[];
};

type OmnichannelWorkflow = {
  id: string;
  type: string;
  customer: {
    id: string;
    name: string;
    tier: string;
    lifetime_value: number;
    orders: number;
    preferredStore: string;
  };
  order: {
    channel: string;
    timestamp: string;
    items: Array<{ sku: string; name: string; size: string; color: string; quantity: number; price: number }>;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  fulfillment: {
    type: string;
    store: string;
    pickupTime: string;
    status: string;
    preparation: Record<
      string,
      { status: string; time?: string; associate?: string; location?: string }
    >;
  };
  inventory: {
    reservations: Array<{ sku: string; location: string; quantity: number; status: string }>;
    crossDocking: { required: boolean; from: string; to: string; eta: string };
  };
  notifications: Array<{ type: string; channel: string; sent?: string; scheduled?: string }>;
};

type POSTransactionWorkflow = {
  id: string;
  register: string;
  store: string;
  associate: string;
  customer: {
    identified: boolean;
    loyaltyNumber: string;
    email: string;
    previousPurchases: number;
  };
  basket: {
    items: Array<{
      sku: string;
      name: string;
      price: number;
      quantity?: number;
      discount?: { type: string; amount: number; code: string };
      finalPrice: number;
    }>;
    promotions: Array<{ code: string; description: string; applied?: boolean; eligible?: boolean }>;
    loyaltyPoints: { earned: number; redeemed: number; balance: number };
  };
  payment: {
    methods: Array<{ type: string; amount: number; last4?: string; auth?: string; number?: string; balance?: number }>;
    total: number;
    change: number;
  };
  upsell: {
    suggested: string[];
    accepted: string[];
    declined: string[];
  };
};

type InventoryTransferWorkflow = {
  id: string;
  type: string;
  reason: string;
  from: { location: string; inventory: { sku: string; available: number; allocated: number } };
  to: { location: string; demand: { current: number; forecast: number; safetyStock: number } };
  items: Array<{ sku: string; name: string; quantity: number; value: number }>;
  logistics: {
    method: string;
    driver: string;
    departTime: string;
    estimatedArrival: string;
    distance: string;
    status: string;
  };
  financials: {
    transferCost: number;
    opportunityCost: number;
    justification: string;
  };
};

type ReturnsWorkflow = {
  id: string;
  type: string;
  originalOrder: string;
  purchaseDate: string;
  returnDate: string;
  withinPolicy: boolean;
  customer: {
    id: string;
    returnHistory: { count: number; rate: string; flagged: boolean };
  };
  items: Array<{
    sku: string;
    reason: string;
    condition: string;
    originalPrice: number;
    currentPrice: number;
    refundAmount: number;
    restockable: boolean;
  }>;
  resolution: {
    type: string;
    newItem: { sku: string; size: string; price: number };
    priceDifference: number;
    processedBy: string;
    satisfactionScore: number;
  };
  inventory: {
    returnToStock: boolean;
    location: string;
    qualityCheck: string;
    markdown: boolean;
  };
};

type PriceMarkdownWorkflow = {
  id: string;
  type: string;
  category: string;
  trigger: string;
  analysis: {
    currentInventory: number;
    sellThrough: string;
    weeksOfSupply: number;
    competitorPricing: { avg: number; min: number; max: number };
  };
  recommendations: Array<{
    sku: string;
    currentPrice: number;
    recommendedPrice: number;
    discount: string;
    projectedLift: string;
    marginImpact: number;
    confidence: number;
  }>;
  implementation: {
    channels: string[];
    startDate: string;
    endDate: string;
    signage: string;
    emailCampaign: string;
  };
};

type CustomerServiceWorkflow = {
  id: string;
  type: string;
  channel: string;
  customer: { id: string; sentiment: string; clv: number; priority: string };
  issue: {
    category: string;
    description: string;
    orderNumber: string;
    investigation: {
      warehouse: { packed: number; weight: string; photo: string };
      carrier: { delivered: number; packages: number; weight: string };
      conclusion: string;
    };
  };
  resolution: {
    immediate: { action: string; cost: number; eta: string };
    compensation: { type: string; amount: number; reason: string };
    followUp: { scheduled: string; method: string; assignedTo: string };
  };
  metrics: {
    firstResponseTime: string;
    resolutionTime: string;
    customerSatisfaction: number;
    agentPerformance: string;
  };
};

type WorkflowVariant =
  | OmnichannelWorkflow
  | POSTransactionWorkflow
  | InventoryTransferWorkflow
  | ReturnsWorkflow
  | PriceMarkdownWorkflow
  | CustomerServiceWorkflow;

const transactionTypes: Record<TransactionKey, TransactionConfig<WorkflowVariant>> = {
  omnichannel_order: {
    name: "Omnichannel Order Fulfillment",
    icon: ShoppingCart,
    workflows: [
      {
        id: "ORD-RT-2025-1115-001",
        type: "buy_online_pickup_store",
        customer: {
          id: "CUST-98234",
          name: "Jennifer Smith",
          tier: "Gold",
          lifetime_value: 4567.89,
          orders: 47,
          preferredStore: "Store #234",
        },
        order: {
          channel: "Mobile App",
          timestamp: "2025-11-15 14:23:45",
          items: [
            { sku: "APP-001", name: "Designer Jacket", size: "M", color: "Navy", quantity: 1, price: 299.99 },
            { sku: "ACC-045", name: "Leather Belt", size: "32", color: "Brown", quantity: 1, price: 79.99 },
            { sku: "SHO-123", name: "Sneakers", size: "9", color: "White", quantity: 1, price: 149.99 },
          ],
          subtotal: 529.97,
          tax: 42.4,
          shipping: 0,
          total: 572.37,
        },
        fulfillment: {
          type: "BOPIS",
          store: "Store #234",
          pickupTime: "2025-11-15 18:00",
          status: "ready_for_pickup",
          preparation: {
            picking: { status: "completed", time: "14:45", associate: "Mike R." },
            packing: { status: "completed", time: "14:52", associate: "Sarah L." },
            quality: { status: "completed", time: "14:55", associate: "Sarah L." },
            staging: { status: "completed", location: "Counter A", time: "14:58" },
          },
        },
        inventory: {
          reservations: [
            { sku: "APP-001", location: "Store #234", quantity: 1, status: "reserved" },
            { sku: "ACC-045", location: "Store #234", quantity: 1, status: "reserved" },
            { sku: "SHO-123", location: "DC-West", quantity: 1, status: "shipped_to_store" },
          ],
          crossDocking: {
            required: true,
            from: "DC-West",
            to: "Store #234",
            eta: "2025-11-15 17:30",
          },
        },
        notifications: [
          { type: "order_confirmed", channel: "email", sent: "14:23:50" },
          { type: "order_ready", channel: "sms", sent: "14:58:00" },
          { type: "pickup_reminder", channel: "push", scheduled: "17:00:00" },
        ],
      },
    ],
  },
  pos_transaction: {
    name: "Point of Sale Transaction",
    icon: CreditCard,
    workflows: [
      {
        id: "POS-RT-2025-1115-847",
        register: "REG-003",
        store: "Store #234",
        associate: "Emma Wilson",
        customer: {
          identified: true,
          loyaltyNumber: "LYT-982374",
          email: "john.doe@email.com",
          previousPurchases: 23,
        },
        basket: {
          items: [
            {
              sku: "JNS-001",
              name: "Premium Denim",
              price: 89.99,
              discount: { type: "promotion", amount: 18.0, code: "FALL20" },
              finalPrice: 71.99,
            },
            {
              sku: "TSH-045",
              name: "Graphic Tee",
              price: 29.99,
              quantity: 2,
              finalPrice: 59.98,
            },
          ],
          promotions: [
            { code: "FALL20", description: "20% off Denim", applied: true },
            { code: "BOGO50", description: "Buy 2 Get 50% off", eligible: false },
          ],
          loyaltyPoints: { earned: 132, redeemed: 0, balance: 2847 },
        },
        payment: {
          methods: [
            { type: "credit_card", amount: 100.0, last4: "4242", auth: "APR-98234" },
            { type: "gift_card", amount: 31.97, number: "GC-2025-1115", balance: 18.03 },
          ],
          total: 131.97,
          change: 0,
        },
        upsell: {
          suggested: ["Matching Belt - $39.99", "Care Kit - $12.99"],
          accepted: [],
          declined: ["Matching Belt"],
        },
      },
    ],
  },
  inventory_transfer: {
    name: "Store-to-Store Transfer",
    icon: Package,
    workflows: [
      {
        id: "TRF-RT-2025-1115-023",
        type: "urgent_replenishment",
        reason: "Stockout coverage",
        from: {
          location: "Store #235",
          inventory: { sku: "BAG-789", available: 8, allocated: 3 },
        },
        to: {
          location: "Store #234",
          demand: { current: 0, forecast: 5, safetyStock: 2 },
        },
        items: [{ sku: "BAG-789", name: "Leather Handbag", quantity: 3, value: 899.97 }],
        logistics: {
          method: "Store Associate",
          driver: "Mark Thompson",
          departTime: "2025-11-15 15:30",
          estimatedArrival: "2025-11-15 16:15",
          distance: "12.5 miles",
          status: "in_transit",
        },
        financials: {
          transferCost: 15.0,
          opportunityCost: 89.99,
          justification: "Customer waiting - sale secured",
        },
      },
    ],
  },
  returns_exchange: {
    name: "Returns & Exchanges",
    icon: Repeat,
    workflows: [
      {
        id: "RET-RT-2025-1115-156",
        type: "online_return_instore",
        originalOrder: "ORD-2025-1098",
        purchaseDate: "2025-11-01",
        returnDate: "2025-11-15",
        withinPolicy: true,
        customer: {
          id: "CUST-45678",
          returnHistory: { count: 3, rate: "6%", flagged: false },
        },
        items: [
          {
            sku: "DRS-123",
            reason: "Size too small",
            condition: "New with tags",
            originalPrice: 149.99,
            currentPrice: 119.99,
            refundAmount: 149.99,
            restockable: true,
          },
        ],
        resolution: {
          type: "exchange",
          newItem: { sku: "DRS-124", size: "L", price: 149.99 },
          priceDifference: 0,
          processedBy: "Lisa Chen",
          satisfactionScore: 5,
        },
        inventory: {
          returnToStock: true,
          location: "Store #234",
          qualityCheck: "Passed",
          markdown: false,
        },
      },
    ],
  },
  price_markdown: {
    name: "Dynamic Pricing & Markdowns",
    icon: Tag,
    aiDriven: true,
    workflows: [
      {
        id: "MD-RT-2025-1115-089",
        type: "seasonal_markdown",
        category: "Fall Apparel",
        trigger: "Inventory aging > 60 days",
        analysis: {
          currentInventory: 2847,
          sellThrough: "45%",
          weeksOfSupply: 8.5,
          competitorPricing: { avg: 67.99, min: 54.99, max: 89.99 },
        },
        recommendations: [
          {
            sku: "SWT-001",
            currentPrice: 89.99,
            recommendedPrice: 62.99,
            discount: "30%",
            projectedLift: "180%",
            marginImpact: -12,
            confidence: 87,
          },
          {
            sku: "JKT-045",
            currentPrice: 199.99,
            recommendedPrice: 139.99,
            discount: "30%",
            projectedLift: "150%",
            marginImpact: -18,
            confidence: 82,
          },
        ],
        implementation: {
          channels: ["Online", "Stores", "App"],
          startDate: "2025-11-16 00:00",
          endDate: "2025-11-30 23:59",
          signage: "Generated",
          emailCampaign: "Scheduled",
        },
      },
    ],
  },
  customer_service: {
    name: "Customer Service Case",
    icon: Users,
    workflows: [
      {
        id: "CS-RT-2025-1115-432",
        type: "order_issue",
        channel: "Live Chat",
        customer: {
          id: "CUST-78234",
          sentiment: "frustrated",
          clv: 2345.67,
          priority: "high",
        },
        issue: {
          category: "Missing Item",
          description: "Customer received only 2 of 3 ordered items",
          orderNumber: "ORD-2025-1892",
          investigation: {
            warehouse: { packed: 3, weight: "2.3kg", photo: "IMG_1892.jpg" },
            carrier: { delivered: 1, packages: 1, weight: "1.8kg" },
            conclusion: "Item not packed - warehouse error",
          },
        },
        resolution: {
          immediate: {
            action: "Ship missing item expedited",
            cost: 24.99,
            eta: "2025-11-17",
          },
          compensation: {
            type: "Account credit",
            amount: 50.0,
            reason: "Service recovery",
          },
          followUp: {
            scheduled: "2025-11-18",
            method: "Email",
            assignedTo: "CS Team Lead",
          },
        },
        metrics: {
          firstResponseTime: "45 seconds",
          resolutionTime: "12 minutes",
          customerSatisfaction: 4,
          agentPerformance: "Exceeds",
        },
      },
    ],
  },
};

export default function RetailTransactions() {
  const [activeTransaction, setActiveTransaction] = useState<TransactionKey>("omnichannel_order");
  const transactionEntries = useMemo(() => Object.entries(transactionTypes) as Array<[TransactionKey, TransactionConfig<WorkflowVariant>]>, []);

  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">Prompt 4 · Retail & Commerce</p>
        <h1 className="text-3xl font-bold text-gray-900">Retail & E-commerce Transactions</h1>
        <p className="text-sm text-gray-500">Omnichannel operations and customer experience</p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {transactionEntries.map(([key, config]) => {
          const Icon = config.icon;
          const isActive = key === activeTransaction;
          return (
            <button
              key={key}
              onClick={() => setActiveTransaction(key)}
              className={`rounded-xl border-2 p-4 text-left transition ${
                isActive ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <Icon className={`mb-2 h-6 w-6 ${config.aiDriven ? "text-purple-500" : "text-gray-600"}`} />
              <p className="text-xs font-semibold text-gray-900">{config.name}</p>
            </button>
          );
        })}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <RetailWorkflow type={activeTransaction} data={transactionTypes[activeTransaction]} />
      </section>
    </div>
  );
}

function RetailWorkflow({ type, data }: { type: TransactionKey; data: TransactionConfig<WorkflowVariant> }) {
  const workflow = data.workflows[0];
  switch (type) {
    case "omnichannel_order":
      return <OmnichannelOrderWorkflowView workflow={workflow as OmnichannelWorkflow} />;
    case "pos_transaction":
      return <POSTransactionWorkflowView workflow={workflow as POSTransactionWorkflow} />;
    case "inventory_transfer":
      return <InventoryTransferWorkflowView workflow={workflow as InventoryTransferWorkflow} />;
    case "returns_exchange":
      return <ReturnsWorkflowView workflow={workflow as ReturnsWorkflow} />;
    case "price_markdown":
      return <PriceMarkdownWorkflowView workflow={workflow as PriceMarkdownWorkflow} />;
    case "customer_service":
      return <CustomerServiceWorkflowView workflow={workflow as CustomerServiceWorkflow} />;
    default:
      return null;
  }
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{typeof value === "number" ? value.toLocaleString() : value}</span>
    </div>
  );
}

function OmnichannelOrderWorkflowView({ workflow }: { workflow: OmnichannelWorkflow }) {
  const statusLabel = workflow.fulfillment.status.replace(/_/g, " ");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Buy Online, Pickup In Store (BOPIS)</h2>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">{statusLabel}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900">Customer</h3>
          <div className="mt-3 space-y-2">
            <InfoRow label="Name" value={workflow.customer.name} />
            <InfoRow label="Tier" value={workflow.customer.tier} />
            <InfoRow label="CLV" value={`$${workflow.customer.lifetime_value.toFixed(2)}`} />
            <InfoRow label="Orders" value={workflow.customer.orders} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900">Order Summary</h3>
          <div className="mt-3 space-y-2">
            <InfoRow label="Channel" value={workflow.order.channel} />
            <InfoRow label="Items" value={workflow.order.items.length} />
            <InfoRow label="Subtotal" value={`$${workflow.order.subtotal.toFixed(2)}`} />
            <InfoRow label="Total" value={`$${workflow.order.total.toFixed(2)}`} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900">Fulfillment</h3>
          <div className="mt-3 space-y-2">
            <InfoRow label="Store" value={workflow.fulfillment.store} />
            <InfoRow label="Pickup" value={workflow.fulfillment.pickupTime} />
            <InfoRow label="Type" value={workflow.fulfillment.type} />
            <InfoRow label="Staging" value={workflow.fulfillment.preparation.staging.location ?? "—"} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-medium text-gray-900">Order Items</h3>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-left">SKU</th>
                <th className="px-3 py-2 text-center">Size</th>
                <th className="px-3 py-2 text-center">Color</th>
                <th className="px-3 py-2 text-center">Qty</th>
                <th className="px-3 py-2 text-right">Price</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {workflow.order.items.map((item) => (
                <tr key={item.sku} className="border-t">
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2">{item.sku}</td>
                  <td className="px-3 py-2 text-center">{item.size}</td>
                  <td className="px-3 py-2 text-center">{item.color}</td>
                  <td className="px-3 py-2 text-center">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">${item.price.toFixed(2)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Ready</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-medium text-gray-900">Preparation Timeline</h3>
        <div className="flex flex-wrap items-center gap-4">
          {Object.entries(workflow.fulfillment.preparation).map(([step, details], index, array) => (
            <div key={step} className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  details.status === "completed" ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className="mt-1 text-xs capitalize text-gray-600">{step}</span>
                <span className="text-xs text-gray-400">{details.time ?? "—"}</span>
              </div>
              {index < array.length - 1 && <div className="h-0.5 w-16 bg-emerald-200" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">Mark as Picked Up</button>
        <button className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">Send Reminder</button>
        <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Print Pickup Slip</button>
      </div>
    </div>
  );
}

function POSTransactionWorkflowView({ workflow }: { workflow: POSTransactionWorkflow }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <InfoRow label="Store" value={workflow.store} />
        <InfoRow label="Register" value={workflow.register} />
        <InfoRow label="Associate" value={workflow.associate} />
        <InfoRow label="Loyalty" value={workflow.customer.loyaltyNumber} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900">Basket</h3>
          <table className="mt-3 w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-2 py-1 text-left">Item</th>
                <th className="px-2 py-1 text-right">Price</th>
                <th className="px-2 py-1 text-right">Final</th>
              </tr>
            </thead>
            <tbody>
              {workflow.basket.items.map((item) => (
                <tr key={item.sku} className="border-t">
                  <td className="px-2 py-2">
                    <p className="font-semibold">{item.name}</p>
                    {item.discount && (
                      <p className="text-xs text-gray-500">{item.discount.code} · -${item.discount.amount.toFixed(2)}</p>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right">${item.price.toFixed(2)}</td>
                  <td className="px-2 py-2 text-right font-semibold">${item.finalPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900">Payments</h3>
          <div className="mt-3 space-y-2 text-sm">
            {workflow.payment.methods.map((method, index) => (
              <div key={`${method.type}-${index}`} className="flex items-center justify-between">
                <span className="capitalize text-gray-600">{method.type.replace("_", " ")}</span>
                <span className="font-semibold text-gray-900">${method.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2">
              <InfoRow label="Total" value={`$${workflow.payment.total.toFixed(2)}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900">Upsell & Loyalty</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
          <div>
            <p className="text-xs uppercase text-gray-500">Suggested</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {workflow.upsell.suggested.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Loyalty Points</p>
            <InfoRow label="Earned" value={workflow.basket.loyaltyPoints.earned} />
            <InfoRow label="Balance" value={workflow.basket.loyaltyPoints.balance} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InventoryTransferWorkflowView({ workflow }: { workflow: InventoryTransferWorkflow }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoRow label="From" value={workflow.from.location} />
        <InfoRow label="To" value={workflow.to.location} />
        <InfoRow label="Driver" value={workflow.logistics.driver} />
      </div>
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900">Logistics</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
          <InfoRow label="Depart" value={workflow.logistics.departTime} />
          <InfoRow label="ETA" value={workflow.logistics.estimatedArrival} />
          <InfoRow label="Distance" value={workflow.logistics.distance} />
        </div>
        <p className="mt-3 text-xs text-gray-500">Status: {workflow.logistics.status}</p>
      </div>
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900">Financials</h3>
        <InfoRow label="Transfer Cost" value={`$${workflow.financials.transferCost.toFixed(2)}`} />
        <InfoRow label="Opportunity Cost" value={`$${workflow.financials.opportunityCost.toFixed(2)}`} />
        <p className="mt-2 text-sm text-gray-600">Justification: {workflow.financials.justification}</p>
      </div>
    </div>
  );
}

function ReturnsWorkflowView({ workflow }: { workflow: ReturnsWorkflow }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <InfoRow label="Order" value={workflow.originalOrder} />
        <InfoRow label="Return Date" value={workflow.returnDate} />
        <InfoRow label="Within Policy" value={workflow.withinPolicy ? "Yes" : "No"} />
        <InfoRow label="Customer" value={workflow.customer.id} />
      </div>
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900">Items</h3>
        {workflow.items.map((item) => (
          <div key={item.sku} className="mt-3 rounded-lg border border-gray-100 p-3 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">{item.sku}</p>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {item.restockable ? "Restock" : "Inspect"}
              </span>
            </div>
            <p className="text-gray-600">Reason: {item.reason}</p>
            <p className="text-xs text-gray-500">Refund ${item.refundAmount.toFixed(2)}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900">Resolution</h3>
        <p className="text-sm text-gray-600">Exchange for {workflow.resolution.newItem.sku} · Satisfaction {workflow.resolution.satisfactionScore}/5</p>
      </div>
    </div>
  );
}

function PriceMarkdownWorkflowView({ workflow }: { workflow: PriceMarkdownWorkflow }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <InfoRow label="Category" value={workflow.category} />
        <InfoRow label="Trigger" value={workflow.trigger} />
        <InfoRow label="Inventory" value={workflow.analysis.currentInventory} />
        <InfoRow label="Sell Through" value={workflow.analysis.sellThrough} />
      </div>
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900">Recommendations</h3>
        <div className="mt-3 space-y-3 text-sm">
          {workflow.recommendations.map((rec) => (
            <div key={rec.sku} className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">{rec.sku}</p>
                <span className="text-xs text-gray-500">Confidence {rec.confidence}%</span>
              </div>
              <p className="text-xs text-gray-500">From ${rec.currentPrice.toFixed(2)} → ${rec.recommendedPrice.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Projected lift {rec.projectedLift} · Margin {rec.marginImpact}%</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900">Implementation Plan</h3>
        <p className="text-sm text-gray-600">Channels: {workflow.implementation.channels.join(", ")}</p>
        <p className="text-sm text-gray-600">{workflow.implementation.startDate} → {workflow.implementation.endDate}</p>
        <p className="text-xs text-gray-500">Signage: {workflow.implementation.signage} · Email: {workflow.implementation.emailCampaign}</p>
      </div>
    </div>
  );
}

function CustomerServiceWorkflowView({ workflow }: { workflow: CustomerServiceWorkflow }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <InfoRow label="Channel" value={workflow.channel} />
        <InfoRow label="Sentiment" value={workflow.customer.sentiment} />
        <InfoRow label="CLV" value={`$${workflow.customer.clv.toFixed(2)}`} />
        <InfoRow label="Priority" value={workflow.customer.priority} />
      </div>
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900">Issue Summary</h3>
        <p className="text-sm text-gray-600">{workflow.issue.description}</p>
        <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
          <InfoRow label="Warehouse" value={`${workflow.issue.investigation.warehouse.packed} items`} />
          <InfoRow label="Carrier" value={`${workflow.issue.investigation.carrier.weight}`} />
          <InfoRow label="Conclusion" value={workflow.issue.investigation.conclusion} />
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900">Resolution</h3>
        <p className="text-sm text-gray-600">Immediate: {workflow.resolution.immediate.action} · ETA {workflow.resolution.immediate.eta}</p>
        <p className="text-sm text-gray-600">Compensation: {workflow.resolution.compensation.type} ${workflow.resolution.compensation.amount.toFixed(2)}</p>
        <p className="text-xs text-gray-500">Follow up {workflow.resolution.followUp.scheduled} via {workflow.resolution.followUp.method}</p>
      </div>
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900">Metrics</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
          <InfoRow label="First Response" value={workflow.metrics.firstResponseTime} />
          <InfoRow label="Resolution" value={workflow.metrics.resolutionTime} />
          <InfoRow label="CSAT" value={`${workflow.metrics.customerSatisfaction}/5`} />
          <InfoRow label="Agent" value={workflow.metrics.agentPerformance} />
        </div>
      </div>
    </div>
  );
}
