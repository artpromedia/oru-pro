"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Package,
  Truck,
  FileText,
  DollarSign,
  Calendar,
  User,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Copy,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Clock,
  MapPin,
  CreditCard,
  Download,
  Upload,
  Brain,
  Zap,
  ShieldCheck,
  Target,
  Activity,
  RefreshCcw,
  Layers,
  PieChart,
  Compass,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type OrderStatus =
  | 'draft'
  | 'confirmed'
  | 'in_production'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

interface SalesOrder {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    creditLimit: number;
    creditUsed: number;
    paymentTerms: string;
    accountExecutive?: string;
  };
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  marginRate: number;
  orderDate: string;
  requestedDate: string;
  promisedDate?: string;
  shippingAddress: Address;
  billingAddress: Address;
  deliveryNumber?: string;
  invoiceNumber?: string;
  trackingNumber?: string;
  segment: 'domestic' | 'export';
  channel: 'direct' | 'partner' | 'portal';
  priority: 'standard' | 'rush' | 'critical';
  riskLevel: 'low' | 'medium' | 'high';
  aiNextBestAction?: string;
}

interface OrderItem {
  id: string;
  materialNumber: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  availability: 'in_stock' | 'partial' | 'out_of_stock';
  promisedDate?: string;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface ShipmentEvent {
  timestamp: string;
  label: string;
  actor: string;
  status: 'complete' | 'in_progress' | 'pending';
}

interface Delivery {
  id: string;
  orderNumber: string;
  route: string;
  shippingPoint: string;
  carrier: string;
  stage: 'planning' | 'picking' | 'packing' | 'loading' | 'in_transit' | 'delayed' | 'delivered';
  pickProgress: number;
  packProgress: number;
  loadProgress: number;
  docsProgress: number;
  eta: string;
  risk: 'low' | 'medium' | 'high';
  alerts: string[];
  events: ShipmentEvent[];
}

interface BillingBatch {
  id: string;
  type: 'standard' | 'milestone' | 'proforma';
  amount: number;
  documents: number;
  failedMatches: number;
  dueDate: string;
  channel: 'EDI' | 'PDF' | 'Portal';
  status: 'pending' | 'processing' | 'released';
  autoMatchRate: number;
  currency: string;
}

interface InvoiceAging {
  bucket: string;
  amount: number;
  trend: 'up' | 'down';
}

interface AnalyticsCard {
  id: string;
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  accent: string;
}

interface PipelineStage {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  orders: number;
  value: number;
}

interface Playbook {
  id: string;
  title: string;
  description: string;
  impact: string;
  owner: string;
  icon: LucideIcon;
}

const currencyFormatters: Record<string, Intl.NumberFormat> = {};

function formatCurrency(value: number, currency = 'USD', maximumFractionDigits = 0) {
  if (!currencyFormatters[currency]) {
    currencyFormatters[currency] = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits
    });
  }

  return currencyFormatters[currency].format(value);
}

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1
});

const STAGE_META: Array<{ key: OrderStatus; label: string; description: string; icon: LucideIcon }> = [
  { key: 'draft', label: 'Quote / Draft (VA01)', description: 'Configuring ATP + pricing', icon: Layers },
  { key: 'confirmed', label: 'Confirmed (VA02)', description: 'Credit + ATP cleared', icon: ShieldCheck },
  { key: 'in_production', label: 'Prod Release (COOIS)', description: 'Linked to shop floor', icon: Package },
  { key: 'ready', label: 'Staging (VL10)', description: 'Wave + pick confirmed', icon: Truck },
  { key: 'shipped', label: 'In Transit (VL02N)', description: 'Carrier milestones', icon: Compass },
  { key: 'delivered', label: 'Delivered (POD)', description: 'Proof + invoicing', icon: CheckCircle }
];

export default function SalesOrderManagement() {
  const [activeView, setActiveView] = useState<'orders' | 'deliveries' | 'invoices' | 'analytics'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [billingBatches, setBillingBatches] = useState<BillingBatch[]>([]);
  const [invoiceAging, setInvoiceAging] = useState<InvoiceAging[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    const seedOrders: SalesOrder[] = [
      {
        id: 'SO-001',
        orderNumber: 'SO-2025-001234',
        customer: {
          id: 'CUST-001',
          name: 'Acme Corporation',
          creditLimit: 500000,
          creditUsed: 234567,
          paymentTerms: 'Net 30',
          accountExecutive: 'Taylor Reed'
        },
        items: [
          {
            id: '1',
            materialNumber: 'MAT-001',
            description: 'Premium Widget A',
            quantity: 1000,
            unit: 'EA',
            unitPrice: 45.5,
            discount: 5,
            tax: 8.25,
            total: 43225,
            availability: 'in_stock',
            promisedDate: '2025-11-24'
          }
        ],
        status: 'confirmed',
        totalAmount: 43225,
        currency: 'USD',
        marginRate: 0.31,
        orderDate: '2025-11-18',
        requestedDate: '2025-11-25',
        promisedDate: '2025-11-24',
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'USA'
        },
        billingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'USA'
        },
        deliveryNumber: 'DL-8001',
        invoiceNumber: 'INV-55001',
        trackingNumber: '1Z234567',
        segment: 'domestic',
        channel: 'direct',
        priority: 'rush',
        riskLevel: 'medium',
        aiNextBestAction: 'Switch to Plant 2000 to pull-in production by 1 day'
      },
      {
        id: 'SO-002',
        orderNumber: 'SO-2025-001267',
        customer: {
          id: 'CUST-009',
          name: 'Global MedTech GmbH',
          creditLimit: 900000,
          creditUsed: 712300,
          paymentTerms: 'Net 45',
          accountExecutive: 'Jordan Beck'
        },
        items: [
          {
            id: '1',
            materialNumber: 'MAT-114',
            description: 'Surgical Polymer Kit',
            quantity: 420,
            unit: 'KIT',
            unitPrice: 1280,
            discount: 2,
            tax: 0,
            total: 537600,
            availability: 'partial',
            promisedDate: '2025-12-02'
          },
          {
            id: '2',
            materialNumber: 'MAT-207',
            description: 'Cold-chain Med Sensors',
            quantity: 420,
            unit: 'EA',
            unitPrice: 180,
            discount: 0,
            tax: 0,
            total: 75600,
            availability: 'in_stock'
          }
        ],
        status: 'in_production',
        totalAmount: 613200,
        currency: 'USD',
        marginRate: 0.27,
        orderDate: '2025-11-12',
        requestedDate: '2025-11-28',
        promisedDate: '2025-11-30',
        shippingAddress: {
          street: '45 Europa Strasse',
          city: 'Munich',
          state: 'BY',
          zip: '80331',
          country: 'Germany'
        },
        billingAddress: {
          street: '45 Europa Strasse',
          city: 'Munich',
          state: 'BY',
          zip: '80331',
          country: 'Germany'
        },
        deliveryNumber: 'DL-8007',
        invoiceNumber: undefined,
        trackingNumber: undefined,
        segment: 'export',
        channel: 'partner',
        priority: 'critical',
        riskLevel: 'high',
        aiNextBestAction: 'Consolidate two cold-chain trucks to free capacity'
      },
      {
        id: 'SO-003',
        orderNumber: 'SO-2025-001301',
        customer: {
          id: 'CUST-044',
          name: 'Northwind Retail',
          creditLimit: 250000,
          creditUsed: 158900,
          paymentTerms: 'Net 15',
          accountExecutive: 'Sky Patel'
        },
        items: [
          {
            id: '1',
            materialNumber: 'MAT-021',
            description: 'Consumer Gadget Starter Pack',
            quantity: 3200,
            unit: 'EA',
            unitPrice: 88,
            discount: 8,
            tax: 5.5,
            total: 309760,
            availability: 'in_stock',
            promisedDate: '2025-11-27'
          }
        ],
        status: 'ready',
        totalAmount: 309760,
        currency: 'USD',
        marginRate: 0.34,
        orderDate: '2025-11-10',
        requestedDate: '2025-11-22',
        promisedDate: '2025-11-21',
        shippingAddress: {
          street: '220 Fremont Ave',
          city: 'Dallas',
          state: 'TX',
          zip: '75201',
          country: 'USA'
        },
        billingAddress: {
          street: '220 Fremont Ave',
          city: 'Dallas',
          state: 'TX',
          zip: '75201',
          country: 'USA'
        },
        deliveryNumber: 'DL-8011',
        invoiceNumber: 'INV-55012',
        trackingNumber: '1Z457880',
        segment: 'domestic',
        channel: 'portal',
        priority: 'standard',
        riskLevel: 'low',
        aiNextBestAction: 'Offer bundled accessories for 8% upsell'
      }
    ];

    const deliverySeed: Delivery[] = [
      {
        id: 'DL-8001',
        orderNumber: 'SO-2025-001234',
        route: 'NYC ➜ DAL',
        shippingPoint: 'Warehouse NYC',
        carrier: 'DHL Freight',
        stage: 'picking',
        pickProgress: 82,
        packProgress: 44,
        loadProgress: 12,
        docsProgress: 65,
        eta: '2025-11-26 14:00',
        risk: 'medium',
        alerts: ['Cold-chain lane nearing capacity'],
        events: [
          { timestamp: '2025-11-18 08:00', label: 'Wave Released', actor: 'WMS', status: 'complete' },
          { timestamp: '2025-11-18 10:30', label: 'Picking', actor: 'NYC-01', status: 'in_progress' },
          { timestamp: '2025-11-18 14:45', label: 'QA Hold', actor: 'QA Bot', status: 'pending' }
        ]
      },
      {
        id: 'DL-8007',
        orderNumber: 'SO-2025-001267',
        route: 'FRA ➜ MUC ➜ DXB',
        shippingPoint: 'Plant 2000',
        carrier: 'Lufthansa Cargo',
        stage: 'in_transit',
        pickProgress: 100,
        packProgress: 100,
        loadProgress: 100,
        docsProgress: 92,
        eta: '2025-11-29 09:30',
        risk: 'high',
        alerts: ['Dry-ice replenishment required in 9h'],
        events: [
          { timestamp: '2025-11-16 04:00', label: 'Export Clearance', actor: 'Customs Copilot', status: 'complete' },
          { timestamp: '2025-11-17 07:45', label: 'Depart FRA', actor: 'Carrier Feed', status: 'complete' },
          { timestamp: '2025-11-18 06:05', label: 'DXB Hub', actor: 'Carrier Feed', status: 'in_progress' }
        ]
      },
      {
        id: 'DL-8011',
        orderNumber: 'SO-2025-001301',
        route: 'DFW ➜ SEA',
        shippingPoint: 'Distribution Center Dallas',
        carrier: 'XPO Logistics',
        stage: 'packing',
        pickProgress: 100,
        packProgress: 76,
        loadProgress: 18,
        docsProgress: 55,
        eta: '2025-11-23 18:20',
        risk: 'low',
        alerts: [],
        events: [
          { timestamp: '2025-11-17 12:00', label: 'Depart Production', actor: 'MES', status: 'complete' },
          { timestamp: '2025-11-18 09:30', label: 'Pack Wave', actor: 'Pack Bot', status: 'in_progress' },
          { timestamp: '2025-11-20 16:00', label: 'Carrier Appointment', actor: 'Transportation', status: 'pending' }
        ]
      }
    ];

    const billingSeed: BillingBatch[] = [
      {
        id: 'INV-55001',
        type: 'standard',
        amount: 43225,
        documents: 24,
        failedMatches: 0,
        dueDate: '2025-12-18',
        channel: 'EDI',
        status: 'released',
        autoMatchRate: 0.97,
        currency: 'USD'
      },
      {
        id: 'INV-55007',
        type: 'milestone',
        amount: 613200,
        documents: 58,
        failedMatches: 3,
        dueDate: '2025-12-30',
        channel: 'Portal',
        status: 'processing',
        autoMatchRate: 0.89,
        currency: 'USD'
      },
      {
        id: 'INV-55012',
        type: 'standard',
        amount: 309760,
        documents: 41,
        failedMatches: 1,
        dueDate: '2025-12-05',
        channel: 'PDF',
        status: 'pending',
        autoMatchRate: 0.93,
        currency: 'USD'
      }
    ];

    setOrders(seedOrders);
    setDeliveries(deliverySeed);
    setBillingBatches(billingSeed);
    setInvoiceAging([
      { bucket: '0-15 days', amount: 420000, trend: 'up' },
      { bucket: '16-30 days', amount: 265000, trend: 'down' },
      { bucket: '31-45 days', amount: 188000, trend: 'down' },
      { bucket: '46+ days', amount: 91000, trend: 'up' }
    ]);
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      const normalizedSearch = searchQuery.toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        order.orderNumber.toLowerCase().includes(normalizedSearch) ||
        order.customer.name.toLowerCase().includes(normalizedSearch) ||
        order.items.some((item) => item.description.toLowerCase().includes(normalizedSearch));

      return matchesStatus && matchesSearch;
    });
  }, [orders, searchQuery, filterStatus]);

  const pipelineValue = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    [filteredOrders]
  );

  const confirmedOrders = useMemo(
    () => filteredOrders.filter((order) => order.status !== 'draft' && order.status !== 'cancelled'),
    [filteredOrders]
  );

  const atpPassRate = useMemo(() => {
    const passedCount = confirmedOrders.filter((order) =>
      order.items.every((item) => item.availability === 'in_stock')
    ).length;
    return confirmedOrders.length ? passedCount / confirmedOrders.length : 0;
  }, [confirmedOrders]);

  const riskOrders = useMemo(
    () => filteredOrders.filter((order) => order.riskLevel !== 'low'),
    [filteredOrders]
  );

  const creditExposure = useMemo(() => {
    const limit = filteredOrders.reduce((sum, order) => sum + order.customer.creditLimit, 0);
    const used = filteredOrders.reduce((sum, order) => sum + order.customer.creditUsed, 0);

    return {
      limit,
      used,
      percent: limit ? (used / limit) * 100 : 0
    };
  }, [filteredOrders]);

  const headerCards = useMemo<AnalyticsCard[]>(() => {
    const onTimeDeliveries = deliveries.filter((delivery) => delivery.risk !== 'high');
    const onTimeRate = deliveries.length ? onTimeDeliveries.length / deliveries.length : 0;
    const autoInvoiceRate = billingBatches.length
      ? billingBatches.reduce((sum, batch) => sum + batch.autoMatchRate, 0) / billingBatches.length
      : 0;

    return [
      {
        id: 'pipeline',
        label: 'Global Pipeline',
        value: formatCurrency(pipelineValue),
        delta: '+14% vs last quarter',
        icon: BarChart3,
        accent: 'text-blue-700 bg-blue-50'
      },
      {
        id: 'onTime',
        label: 'Promise Accuracy',
        value: percentFormatter.format(onTimeRate),
        delta: '+3.4 pts',
        icon: Clock,
        accent: 'text-green-700 bg-green-50'
      },
      {
        id: 'atp',
        label: 'ATP Clearance',
        value: percentFormatter.format(atpPassRate),
        delta: `${confirmedOrders.length} confirmed`,
        icon: ShieldCheck,
        accent: 'text-indigo-700 bg-indigo-50'
      },
      {
        id: 'automation',
        label: 'Auto Invoicing',
        value: percentFormatter.format(autoInvoiceRate),
        delta: 'AI Match Confidence 92%',
        icon: Activity,
        accent: 'text-purple-700 bg-purple-50'
      }
    ];
  }, [atpPassRate, billingBatches, confirmedOrders.length, deliveries.length, pipelineValue]);

  const playbooks = useMemo<Playbook[]>(() => {
    return [
      {
        id: 'pb-1',
        title: 'Cold-chain capacity relief',
        description: 'Re-sequence two VL01N waves to free 18 pallets and keep pharma SLAs intact.',
        impact: 'Protects $9.4M QoQ revenue',
        owner: 'Logistics Copilot',
        icon: ShieldCheck
      },
      {
        id: 'pb-2',
        title: 'Auto-credit release',
        description: 'Use Decision Engine to auto-release VA02 orders < $100K with green payment rating.',
        impact: 'Cuts credit locks by 63%',
        owner: 'Finance Copilot',
        icon: DollarSign
      },
      {
        id: 'pb-3',
        title: 'Partner upsell motion',
        description: 'Route partner orders to AI cross-sell (Product Y) to lift run-rate.',
        impact: '+$1.2M incremental',
        owner: 'Revenue Copilot',
        icon: Target
      }
    ];
  }, []);

  const pipelineStages = useMemo<PipelineStage[]>(() => {
    return STAGE_META.map((meta) => {
      const stageOrders = filteredOrders.filter((order) => order.status === meta.key);
      return {
        id: meta.key,
        label: meta.label,
        description: meta.description,
        icon: meta.icon,
        orders: stageOrders.length,
        value: stageOrders.reduce((sum, order) => sum + order.totalAmount, 0)
      };
    });
  }, [filteredOrders]);

  const aiSignals = useMemo(() => {
    const lateRisk = deliveries.filter((delivery) => delivery.risk === 'high');
    const creditLocks = filteredOrders.filter((order) => order.customer.creditUsed / order.customer.creditLimit > 0.85);
    const invoiceDelays = billingBatches.filter((batch) => batch.failedMatches > 2);

    return [
      {
        id: 'signal-1',
        label: `${lateRisk.length} deliveries trending late`,
        detail: 'Notify customers + auto-propose alternate carriers.',
        action: 'Customer comms drafted',
        icon: Truck
      },
      {
        id: 'signal-2',
        label: `${creditLocks.length} orders need credit exception`,
        detail: 'Finance Copilot prepared risk-adjusted release notes.',
        action: 'Review 3 approvals',
        icon: CreditCard
      },
      {
        id: 'signal-3',
        label: `${invoiceDelays.length} invoices stuck in auto-match`,
        detail: 'AI suggests GL account fixes from last cycle.',
        action: 'Apply fixes',
        icon: TrendingUp
      }
    ];
  }, [billingBatches, deliveries, filteredOrders]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            AI Sales & Distribution Control Tower
          </h1>
          <p className="text-gray-500 mt-1">
            Replace SAP SD (VAxx/VLxx/VFxx) with one AI-native workspace for orders, logistics, and billing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Pipeline
          </button>
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Orders (EDI/XML)
          </button>
          <button
            onClick={() => setShowCreateOrder(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Order (VA01)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {headerCards.map((card) => (
          <div key={card.id} className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm`}>
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${card.accent}`}>
              <card.icon className="w-4 h-4" />
              {card.label}
            </div>
            <div className="mt-4 text-3xl font-bold text-gray-900">{card.value}</div>
            <div className="mt-1 text-sm text-gray-500">{card.delta}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl bg-white p-2 shadow-sm">
        {[
          { id: 'orders', label: 'Orders (VA02/03)', icon: ShoppingCart },
          { id: 'deliveries', label: 'Deliveries (VL01N/02N)', icon: Truck },
          { id: 'invoices', label: 'Billing (VF01/04)', icon: FileText },
          { id: 'analytics', label: 'Decision Analytics', icon: BarChart3 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as typeof activeView)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeView === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'orders' && (
          <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by order, customer, product, incoterm..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as OrderStatus | 'all')}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_production">In Production</option>
                      <option value="ready">Ready</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value as '7' | '30' | '90')}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
                    >
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                    </select>
                    <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600">
                      <Filter className="w-4 h-4" />
                      Advanced Filters
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>ATP clearance: {percentFormatter.format(atpPassRate)}</span>
                    <span>Confirmed orders: {confirmedOrders.length}</span>
                    <span>Credit utilization: {percentFormatter.format(creditExposure.percent / 100)}</span>
                  </div>
                </div>

                <div className="rounded-xl bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-4 py-3 text-left">Order</th>
                          <th className="px-4 py-3 text-left">Customer</th>
                          <th className="px-4 py-3 text-left">Dates</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-center">ATP</th>
                          <th className="px-4 py-3 text-center">Credit</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => {
                          const atpOk = order.items.every((item) => item.availability === 'in_stock');
                          return (
                            <tr key={order.id} className="border-b last:border-b-0 hover:bg-gray-50">
                              <td className="px-4 py-3 align-top">
                                <div className="font-semibold text-gray-900">{order.orderNumber}</div>
                                <div className="text-xs text-gray-500">{order.deliveryNumber || 'No delivery'}</div>
                                <div className="mt-1 inline-flex items-center gap-2 text-xs text-gray-500">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                                    <Package className="w-3 h-3" />
                                    {order.priority.toUpperCase()}
                                  </span>
                                  <span>{order.channel}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="font-medium text-gray-900">{order.customer.name}</div>
                                <div className="text-xs text-gray-500">{order.customer.paymentTerms}</div>
                                <div className="text-xs text-gray-400">AE: {order.customer.accountExecutive}</div>
                              </td>
                              <td className="px-4 py-3 align-top text-sm text-gray-600">
                                <div>Req: {order.requestedDate}</div>
                                <div>Promised: {order.promisedDate || 'TBD'}</div>
                              </td>
                              <td className="px-4 py-3 align-top text-right">
                                <div className="font-semibold text-gray-900">{formatCurrency(order.totalAmount, order.currency)}</div>
                                <div className="text-xs text-gray-500">Margin {percentFormatter.format(order.marginRate)}</div>
                              </td>
                              <td className="px-4 py-3 align-top text-center">
                                <StatusBadge status={order.status} />
                              </td>
                              <td className="px-4 py-3 align-top text-center">
                                <ATPIndicator available={atpOk} />
                              </td>
                              <td className="px-4 py-3 align-top text-center">
                                <CreditIndicator limit={order.customer.creditLimit} used={order.customer.creditUsed} />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="rounded p-1 hover:bg-gray-100"
                                    aria-label="View order"
                                  >
                                    <Eye className="h-4 w-4 text-gray-600" />
                                  </button>
                                  <button className="rounded p-1 hover:bg-gray-100" aria-label="Edit order">
                                    <Edit className="h-4 w-4 text-gray-600" />
                                  </button>
                                  <button className="rounded p-1 hover:bg-gray-100" aria-label="Copy order">
                                    <Copy className="h-4 w-4 text-gray-600" />
                                  </button>
                                  <button className="rounded p-1 hover:bg-gray-100" aria-label="Trigger delivery">
                                    <Truck className="h-4 w-4 text-blue-600" />
                                  </button>
                                  <button className="rounded p-1 hover:bg-gray-100" aria-label="Cancel order">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedOrder && (
                  <OrderDetailPanel order={selectedOrder} onClose={() => setSelectedOrder(null)} />
                )}
              </div>

              <div className="space-y-6">
                <OrdersAtRiskPanel orders={riskOrders} />
                <CreditExposureCard limit={creditExposure.limit} used={creditExposure.used} />
                <QuickPlaybooks playbooks={playbooks} />
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'deliveries' && (
          <motion.div key="deliveries" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <DeliveryManagement deliveries={deliveries} />
          </motion.div>
        )}

        {activeView === 'invoices' && (
          <motion.div key="invoices" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <BillingManagement batches={billingBatches} invoiceAging={invoiceAging} />
          </motion.div>
        )}

        {activeView === 'analytics' && (
          <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <AnalyticsView
              pipelineStages={pipelineStages}
              orders={orders}
              deliveries={deliveries}
              billingBatches={billingBatches}
              invoiceAging={invoiceAging}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AiInsightsPanel signals={aiSignals} />

      {showCreateOrder && <CreateOrderModal onClose={() => setShowCreateOrder(false)} />}
    </div>
  );
}

const statusStyles: Record<OrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_production: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-green-100 text-green-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700'
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusStyles[status]}`}>{status.replace('_', ' ')}</span>;
}

function ATPIndicator({ available }: { available: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
        available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {available ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {available ? 'Available' : 'Review' }
    </div>
  );
}

function CreditIndicator({ limit, used }: { limit: number; used: number }) {
  const percentage = limit ? (used / limit) * 100 : 0;
  const status = percentage >= 90 ? 'critical' : percentage >= 75 ? 'warning' : 'ok';
  const colors: Record<'ok' | 'warning' | 'critical', string> = {
    ok: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    critical: 'bg-red-100 text-red-700'
  };

  return (
    <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${colors[status]}`}>
      <CreditCard className="h-3 w-3" />
      {percentage.toFixed(0)}%
    </div>
  );
}

function OrdersAtRiskPanel({ orders }: { orders: SalesOrder[] }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <AlertTriangle className="h-4 w-4 text-amber-500" /> Orders at Risk
      </div>
      {orders.length === 0 ? (
        <p className="text-sm text-gray-500">No orders are breaching SLA right now.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-amber-100 bg-amber-50 p-3">
              <div className="flex items-center justify-between text-sm font-semibold text-amber-800">
                {order.orderNumber}
                <span className="text-xs uppercase">{order.priority}</span>
              </div>
              <div className="mt-1 text-xs text-amber-700">{order.customer.name}</div>
              <div className="mt-2 flex items-center justify-between text-xs text-amber-800">
                <span>Next Action:</span>
                <span className="font-medium">{order.aiNextBestAction}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreditExposureCard({ limit, used }: { limit: number; used: number }) {
  const percent = limit ? (used / limit) * 100 : 0;
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <ShieldCheck className="h-4 w-4 text-blue-600" /> Credit Shield
      </div>
      <div className="mt-4 text-3xl font-bold text-gray-900">{formatCurrency(used)}</div>
      <p className="text-sm text-gray-500">of {formatCurrency(limit)} exposure utilized</p>
      <div className="mt-4 h-2 rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <div className="mt-2 text-xs text-gray-500">{percent.toFixed(1)}% utilization</div>
    </div>
  );
}

function QuickPlaybooks({ playbooks }: { playbooks: Playbook[] }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Zap className="h-4 w-4 text-purple-600" /> AI Playbooks
        </div>
        <button className="text-xs font-semibold text-purple-600">View all →</button>
      </div>
      <div className="space-y-3">
        {playbooks.map((playbook) => (
          <div key={playbook.id} className="rounded-xl border border-purple-100 bg-purple-50 p-3">
            <div className="flex items-center justify-between text-sm font-semibold text-purple-900">
              <div className="flex items-center gap-2">
                <playbook.icon className="h-4 w-4" />
                {playbook.title}
              </div>
              <ChevronRight className="h-4 w-4" />
            </div>
            <p className="mt-1 text-xs text-purple-800">{playbook.description}</p>
            <div className="mt-2 text-xs font-semibold text-purple-900">{playbook.impact}</div>
            <div className="text-[11px] text-purple-700">Owner: {playbook.owner}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderDetailPanel({ order, onClose }: { order: SalesOrder; onClose: () => void }) {
  return (
    <motion.div
      layout
      className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{order.orderNumber}</h2>
          <p className="text-sm text-gray-500">Full orchestration blueprint replacing VA03 + VL03N</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <button className="rounded-lg border border-gray-200 px-3 py-1">Open in t-code mode</button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">Close</button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-100 p-4">
          <div className="text-xs uppercase text-gray-500">Customer</div>
          <div className="mt-1 text-sm font-semibold text-gray-900">{order.customer.name}</div>
          <p className="text-xs text-gray-500">{order.billingAddress.city}, {order.billingAddress.country}</p>
          <p className="text-xs text-gray-500">Payment: {order.customer.paymentTerms}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <User className="h-3.5 w-3.5 text-gray-400" />
            AE: {order.customer.accountExecutive || 'Unassigned'}
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 p-4">
          <div className="text-xs uppercase text-gray-500">Logistics</div>
          <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <MapPin className="h-4 w-4 text-blue-600" /> {order.shippingAddress.city}
          </div>
          <p className="text-xs text-gray-500">Route: {order.trackingNumber || 'To be assigned'}</p>
          <p className="text-xs text-gray-500">Delivery: {order.deliveryNumber || 'Draft'}</p>
        </div>
        <div className="rounded-xl border border-gray-100 p-4">
          <div className="text-xs uppercase text-gray-500">Financial guardrails</div>
          <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
          <p className="text-xs text-gray-500">Margin {percentFormatter.format(order.marginRate)}</p>
          <p className="text-xs text-gray-500">Credit used {order.customer.creditUsed.toLocaleString()} / {order.customer.creditLimit.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-100 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Layers className="h-4 w-4 text-blue-600" /> Line Items + ATP
          </div>
          <div className="space-y-3 text-sm">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-xl bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{item.description}</div>
                    <div className="text-xs text-gray-500">{item.materialNumber}</div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    Qty {item.quantity} {item.unit}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-600">
                    <ShieldCheck className="h-3 w-3 text-green-600" /> {item.availability === 'in_stock' ? 'ATP ok' : 'Review'}
                  </span>
                  <span className="font-semibold text-gray-900">{formatCurrency(item.total, order.currency)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Compass className="h-4 w-4 text-emerald-600" /> Execution Timeline
          </div>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Credit & ATP Cleared', date: order.orderDate, status: 'complete' },
              { label: 'Production Release', date: order.promisedDate || 'TBD', status: 'in_progress' },
              { label: 'Delivery Wave', date: order.requestedDate, status: 'pending' }
            ].map((event) => (
              <div key={event.label} className="flex items-center gap-3">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    event.status === 'complete'
                      ? 'bg-green-500'
                      : event.status === 'in_progress'
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                  }`}
                />
                <div>
                  <div className="font-medium text-gray-900">{event.label}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    {event.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {order.aiNextBestAction && (
            <div className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
              <div className="flex items-center gap-2 font-semibold">
                <Brain className="h-4 w-4" /> Copilot Recommendation
              </div>
              <p className="mt-1 text-xs">{order.aiNextBestAction}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DeliveryManagement({ deliveries }: { deliveries: Delivery[] }) {
  const highRisk = deliveries.filter((delivery) => delivery.risk === 'high');
  const onTimeRate = deliveries.length
    ? deliveries.filter((delivery) => delivery.stage === 'in_transit' || delivery.stage === 'delivered').length / deliveries.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Delivery Management (VL01N/VL02N)</h2>
            <p className="text-sm text-gray-500">Unify pick-pack-ship orchestration with live IoT/Carrier telemetry.</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm">Generate Wave</button>
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Create Delivery</button>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <SummaryTile icon={Truck} label="Active Deliveries" value={deliveries.length.toString()} trend="+5 vs yesterday" color="text-blue-600" />
          <SummaryTile icon={ShieldCheck} label="On-Time" value={percentFormatter.format(onTimeRate)} trend="Goal 98%" color="text-green-600" />
          <SummaryTile icon={AlertTriangle} label="At Risk" value={highRisk.length.toString()} trend="Needs escalation" color="text-amber-600" />
          <SummaryTile icon={RefreshCcw} label="Auto-Replanned" value="7" trend="AI optimized" color="text-purple-600" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {deliveries.map((delivery) => (
          <div key={delivery.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
              <span>
                {delivery.id} · {delivery.orderNumber}
              </span>
              <span className="text-xs uppercase text-gray-500">{delivery.stage}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="h-3 w-3" /> {delivery.route}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <ProgressPill label="Pick" value={delivery.pickProgress} />
              <ProgressPill label="Pack" value={delivery.packProgress} />
              <ProgressPill label="Load" value={delivery.loadProgress} />
              <ProgressPill label="Docs" value={delivery.docsProgress} />
            </div>
            {delivery.alerts.length > 0 && (
              <div className="mt-2 rounded-xl bg-amber-50 p-2 text-xs text-amber-800">
                {delivery.alerts[0]}
              </div>
            )}
            <div className="mt-3 space-y-2 text-xs text-gray-600">
              {delivery.events.map((event) => (
                <div key={event.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        event.status === 'complete'
                          ? 'bg-green-500'
                          : event.status === 'in_progress'
                          ? 'bg-blue-500'
                          : 'bg-gray-300'
                      }`}
                    />
                    {event.label}
                  </span>
                  <span>{event.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BillingManagement({ batches, invoiceAging }: { batches: BillingBatch[]; invoiceAging: InvoiceAging[] }) {
  const totalPending = batches.filter((batch) => batch.status !== 'released').reduce((sum, batch) => sum + batch.amount, 0);
  const avgMatch = batches.length
    ? batches.reduce((sum, batch) => sum + batch.autoMatchRate, 0) / batches.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Billing & Invoicing (VF01/VF04)</h2>
            <p className="text-sm text-gray-500">Touchless billing runs, dispute queues, and AI reconciliation.</p>
          </div>
          <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white">Run Billing Due List</button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <SummaryTile icon={DollarSign} label="Pending" value={formatCurrency(totalPending)} trend="Across {batches.length} docs" color="text-green-600" />
          <SummaryTile icon={Clock} label="Avg Collection" value="28 days" trend="Goal 25d" color="text-blue-600" />
          <SummaryTile icon={Activity} label="Auto-Match" value={percentFormatter.format(avgMatch)} trend="+4 pts" color="text-purple-600" />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">Invoice Aging Buckets</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          {invoiceAging.map((bucket) => (
            <div key={bucket.bucket} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-xs text-gray-500">{bucket.bucket}</div>
              <div className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(bucket.amount)}</div>
              <div className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                {bucket.trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3 text-red-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-green-500" />
                )}
                {bucket.trend === 'up' ? 'Rising balance' : 'Improving'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Billing Queue</h3>
          <button className="text-xs font-semibold text-blue-600">Configure rules</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Batch</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Channel</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Auto-Match</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id} className="border-t text-gray-700">
                  <td className="px-4 py-2 font-semibold">{batch.id}</td>
                  <td className="px-4 py-2 text-xs uppercase">{batch.type}</td>
                  <td className="px-4 py-2">{batch.channel}</td>
                  <td className="px-4 py-2">{formatCurrency(batch.amount, batch.currency)}</td>
                  <td className="px-4 py-2">{percentFormatter.format(batch.autoMatchRate)}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${batch.status === 'released' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {batch.status}
                    </span>
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

function AnalyticsView({
  pipelineStages,
  orders,
  deliveries,
  billingBatches,
  invoiceAging
}: {
  pipelineStages: PipelineStage[];
  orders: SalesOrder[];
  deliveries: Delivery[];
  billingBatches: BillingBatch[];
  invoiceAging: InvoiceAging[];
}) {
  const conversionRate = orders.length ? orders.filter((order) => order.status !== 'draft').length / orders.length : 0;
  const fulfillmentLead = orders.length ? orders.reduce((sum, order) => sum + (new Date(order.requestedDate).getTime() - new Date(order.orderDate).getTime()), 0) / orders.length : 0;
  const fulfillmentDays = Math.max(Math.round(fulfillmentLead / (1000 * 60 * 60 * 24)), 1);
  const overdueAging = invoiceAging.reduce((sum, bucket, idx) => (idx > 1 ? sum + bucket.amount : sum), 0);
  const billingExceptions = billingBatches.filter((batch) => batch.failedMatches > 0).length;
  const revenueMix = useMemo(() => {
    const totals = orders.reduce(
      (acc, order) => {
        acc.total += order.totalAmount;
        acc.segment[order.segment] = (acc.segment[order.segment] || 0) + order.totalAmount;
        acc.channel[order.channel] = (acc.channel[order.channel] || 0) + order.totalAmount;
        return acc;
      },
      { total: 0, segment: {} as Record<string, number>, channel: {} as Record<string, number> }
    );
    return totals;
  }, [orders]);

  const topCustomers = useMemo(() => {
    return [...orders]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 3)
      .map((order) => ({
        customer: order.customer.name,
        amount: order.totalAmount,
        risk: order.riskLevel,
        status: order.status
      }));
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Decision Analytics</h2>
            <p className="text-sm text-gray-500">Pipeline velocity, fulfillment heatmaps, and working-capital telemetry.</p>
          </div>
          <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm">Download executive pack</button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <SummaryTile icon={PieChart} label="Conversion" value={percentFormatter.format(conversionRate)} trend="Quote ➜ Cash" color="text-blue-600" />
          <SummaryTile icon={Target} label="Avg Fulfillment" value={`${fulfillmentDays} days`} trend="Lead time" color="text-green-600" />
          <SummaryTile icon={Truck} label="Logistics Alerts" value={deliveries.filter((d) => d.risk !== 'low').length.toString()} trend="AI triaged" color="text-amber-600" />
          <SummaryTile icon={DollarSign} label="Past Due" value={formatCurrency(overdueAging)} trend=">30 day exposure" color="text-red-600" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900">Order-to-Cash Pipeline</h3>
          <div className="mt-4 space-y-4">
            {pipelineStages.map((stage) => (
              <div key={stage.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between text-sm text-gray-900">
                  <div className="flex items-center gap-2 font-semibold">
                    <stage.icon className="h-4 w-4 text-blue-600" /> {stage.label}
                  </div>
                  <div className="text-xs text-gray-500">{stage.description}</div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900">{stage.orders} orders</div>
                  <div className="text-sm text-gray-500">{formatCurrency(stage.value)}</div>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(stage.orders * 25, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Working Capital Radar</h3>
            <p className="mt-2 text-xs text-gray-500">Auto-focus CFO attention on buckets impacting cash.</p>
            <div className="mt-3 space-y-3 text-sm">
              {invoiceAging.map((bucket) => (
                <div key={bucket.bucket} className="flex items-center justify-between">
                  <div>{bucket.bucket}</div>
                  <div className="font-semibold text-gray-900">{formatCurrency(bucket.amount)}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-gray-500">{billingExceptions} billing docs need AI remediation.</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">AI Recommendations</h3>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex items-start gap-2 text-gray-600">
                <Send className="mt-1 h-4 w-4 text-blue-600" /> Consolidate 3 portal orders into one VL10 wave to save $4.5K freight.
              </li>
              <li className="flex items-start gap-2 text-gray-600">
                <Brain className="mt-1 h-4 w-4 text-purple-600" /> Predictive ATP flagged polymer shortage week 48 – auto-switch to Austin plant.
              </li>
              <li className="flex items-start gap-2 text-gray-600">
                <FileText className="mt-1 h-4 w-4 text-amber-600" /> Resolve {billingExceptions} invoices stuck in auto-match via GL fix pack.
              </li>
              <li className="flex items-start gap-2 text-gray-600">
                <Target className="mt-1 h-4 w-4 text-green-600" /> Cross-sell accessories to Northwind to lift order by 12%.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Revenue Mix (Realized)</h3>
            <div className="mt-3 space-y-4">
              <div>
                <p className="text-xs uppercase text-gray-500">By customer segment</p>
                {Object.entries(revenueMix.segment).map(([segment, value]) => (
                  <RevenueSplitRow key={segment} label={segment} value={value} total={revenueMix.total} />
                ))}
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">By channel</p>
                {Object.entries(revenueMix.channel).map(([channel, value]) => (
                  <RevenueSplitRow key={channel} label={channel} value={value} total={revenueMix.total} />
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Top Customers</h3>
            <div className="mt-3 space-y-3">
              {topCustomers.map((entry) => (
                <div key={entry.customer} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{entry.customer}</span>
                    <span className="text-xs uppercase text-gray-500">{entry.status}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">Risk: {entry.risk}</div>
                  <div className="text-lg font-semibold text-gray-900">{formatCurrency(entry.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueSplitRow({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = total ? (value / total) * 100 : 0;
  return (
    <div className="mt-2 text-xs text-gray-600">
      <div className="flex items-center justify-between">
        <span className="capitalize">{label}</span>
        <span className="font-semibold text-gray-900">
          {formatCurrency(value)} ({percentFormatter.format(percent / 100)})
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-gray-100">
        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}

function SummaryTile({ icon: Icon, label, value, trend, color }: { icon: LucideIcon; label: string; value: string; trend: string; color: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`flex items-center gap-2 text-xs font-semibold ${color}`}>
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{trend}</div>
    </div>
  );
}

function ProgressPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-white">
        <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function AiInsightsPanel({
  signals
}: {
  signals: { id: string; label: string; detail: string; action: string; icon: LucideIcon }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 p-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <Brain className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Decision Copilot Intelligence</h3>
          <p className="text-sm text-gray-600">Autonomous agents monitor ATP, credit, logistics, and billing 24/7.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {signals.map((signal) => (
          <div key={signal.id} className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <signal.icon className="h-4 w-4 text-blue-600" />
              {signal.label}
            </div>
            <p className="mt-2 text-xs text-gray-600">{signal.detail}</p>
            <button className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
              {signal.action}
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function CreateOrderModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white">
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Create Sales Order (AI VA01)</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">Close</button>
          </div>
          <p className="text-sm text-gray-500">Guided capture: customer, pricing, ATP, logistics, compliance.</p>
        </div>

        <div className="space-y-6 p-6">
          <section>
            <label className="text-sm font-semibold text-gray-900">Customer</label>
            <div className="mt-2 rounded-xl border border-gray-200 p-4">
              <div className="relative">
                <input className="w-full rounded-lg border border-gray-200 px-4 py-2" placeholder="Search customer / sold-to / ship-to" />
                <Brain className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-purple-600" />
              </div>
              <p className="mt-2 text-xs text-gray-500">AI: Acme Corp typically orders Mondays with 45-day lead time.</p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-gray-900">Delivery Date</label>
              <input type="date" className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-900">Shipping Point</label>
              <select className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2">
                <option>Warehouse NYC</option>
                <option>Plant 2000 (EU)</option>
                <option>Austin Advanced</option>
              </select>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Line Items (Real-time ATP)</h3>
              <button className="text-xs font-semibold text-blue-600">+ Add Item</button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-2 py-2 text-left">Material</th>
                    <th className="px-2 py-2">Qty</th>
                    <th className="px-2 py-2">ATP</th>
                    <th className="px-2 py-2 text-right">Price</th>
                    <th className="px-2 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-2 py-2">
                      <input className="w-full rounded border border-gray-200 px-2 py-1" placeholder="Search material" />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input type="number" className="w-20 rounded border border-gray-200 px-2 py-1 text-center" />
                    </td>
                    <td className="px-2 py-2 text-center text-green-600">✓ In Stock</td>
                    <td className="px-2 py-2 text-right">$45.50</td>
                    <td className="px-2 py-2 text-right font-semibold">$0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900">Logistics Preferences</h3>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300" />
                  Consolidate with open deliveries
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300" />
                  Require cold-chain lane
                </label>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900">Financial Controls</h3>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Credit Check</span>
                  <span className="font-semibold text-green-600">Auto</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pricing Variant</span>
                  <span className="font-semibold">ZPR1</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <Zap className="h-5 w-5" />
              <div>
                <p className="font-semibold">AI Recommendations</p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Offer Product B bundle (85% attach rate).</li>
                  <li>• Shift requested delivery by 2 days to share truckload.</li>
                  <li>• Early payment discount of 2% expires in 3 days.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2">Cancel</button>
          <div className="flex gap-2">
            <button className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800">Save Draft</button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white">
              <CheckCircle className="h-4 w-4" />
              Create & Run ATP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
