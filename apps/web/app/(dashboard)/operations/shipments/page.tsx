"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Box,
  Brain,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  Navigation,
  Package,
  Plus,
  QrCode,
  RefreshCw,
  Route,
  SatelliteDish,
  Search,
  ShieldCheck,
  Thermometer,
  Timer,
  Truck,
  Weight,
  Zap,
} from "lucide-react";
import {
  createLogisticsShipment,
  fetchLogisticsShipments,
  updateLogisticsShipmentStatus,
  type CreateShipmentPayload,
  type LogisticsShipment,
} from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type Shipment = LogisticsShipment;
type DocumentMeta = Shipment["documents"][number];
type TabKey = "planning" | "execution" | "tracking" | "documents";
type CreateShipmentDraft = Pick<CreateShipmentPayload, "shipmentNumber" | "type" | "scheduledDate"> & {
  carrier: Shipment["carrier"];
};

type TransportAnalytics = {
  total: number;
  planned: number;
  inTransit: number;
  delivered: number;
  freightCost: number;
  milesToday: number;
};

const STATUS_COLORS: Record<Shipment["status"], string> = {
  planned: "bg-slate-100 text-slate-700",
  loading: "bg-amber-100 text-amber-700",
  "in-transit": "bg-blue-100 text-blue-700",
  delivered: "bg-emerald-100 text-emerald-700",
  exception: "bg-rose-100 text-rose-700",
};

const TAB_CONFIG: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "planning", label: "Planning", icon: Calendar },
  { key: "execution", label: "Execution", icon: Box },
  { key: "tracking", label: "Tracking", icon: Navigation },
  { key: "documents", label: "Documents", icon: FileText },
];

export default function ShipmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>("planning");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showCreateShipment, setShowCreateShipment] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Shipment["status"] | "all">("all");

  const shipmentsQuery = useQuery<Shipment[], Error>({
    queryKey: ["logistics-shipments", user.tenantId],
    queryFn: () => fetchLogisticsShipments(user.tenantId),
    enabled: Boolean(user?.tenantId),
    refetchInterval: 60_000,
  });

  const shipments = shipmentsQuery.data ?? [];
  const isLoadingShipments = shipmentsQuery.isLoading;
  const isRefreshingShipments = shipmentsQuery.isFetching && !shipmentsQuery.isLoading;
  const shipmentsError = shipmentsQuery.error ?? null;
  const errorMessage = shipmentsError?.message ?? "Something went wrong while loading live logistics data.";

  const filteredShipments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return shipments.filter((shipment) => {
      const matchesStatus = statusFilter === "all" || shipment.status === statusFilter;
      if (!matchesStatus) {
        return false;
      }

      if (!term) {
        return true;
      }

      const haystack = [
        shipment.shipmentNumber,
        shipment.carrier?.name,
        shipment.route?.origin?.name,
        shipment.route?.destination?.name,
      ]
        .filter(Boolean)
        .map((value) => value!.toLowerCase());

      return haystack.some((value) => value.includes(term));
    });
  }, [shipments, search, statusFilter]);

  const planningShipments = useMemo(
    () => filteredShipments.filter((shipment) => shipment.status === "planned" || shipment.status === "loading"),
    [filteredShipments],
  );

  const executionShipments = useMemo(
    () => filteredShipments.filter((shipment) => ["loading", "in-transit", "delivered", "exception"].includes(shipment.status)),
    [filteredShipments],
  );

  const trackingShipments = useMemo(
    () => filteredShipments.filter((shipment) => ["loading", "in-transit", "exception"].includes(shipment.status)),
    [filteredShipments],
  );

  const documents = useMemo(
    () =>
      filteredShipments
        .flatMap((shipment) => (shipment.documents ?? []).map((doc) => ({ ...doc, shipment })))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 12),
    [filteredShipments],
  );

  const analytics = useMemo<TransportAnalytics>(() => {
    const base: TransportAnalytics = {
      total: filteredShipments.length,
      planned: 0,
      inTransit: 0,
      delivered: 0,
      freightCost: 0,
      milesToday: 0,
    };

    filteredShipments.forEach((shipment) => {
      if (shipment.status === "planned") base.planned += 1;
      if (shipment.status === "in-transit" || shipment.status === "loading") base.inTransit += 1;
      if (shipment.status === "delivered") base.delivered += 1;

      base.freightCost += shipment.costs?.total ?? 0;
      base.milesToday += shipment.route?.distance ?? 0;
    });

    return base;
  }, [filteredShipments]);

  const createShipmentMutation = useMutation<Shipment, Error, CreateShipmentDraft>({
    mutationFn: (draft) =>
      createLogisticsShipment({
        tenantId: user.tenantId,
        shipmentNumber: draft.shipmentNumber,
        type: draft.type,
        carrier: draft.carrier,
        scheduledDate: draft.scheduledDate,
      }),
    onSuccess: (shipment) => {
      queryClient.setQueryData<Shipment[]>(["logistics-shipments", user.tenantId], (previous = []) => [shipment, ...previous]);
      toast({
        title: "Shipment scheduled",
        description: `${shipment.shipmentNumber} departs ${new Date(shipment.scheduledDate).toLocaleDateString()}`,
        variant: "success",
      });
      setShowCreateShipment(false);
    },
    onError: (error) => {
      toast({
        title: "Unable to create shipment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateShipmentStatusMutation = useMutation<Shipment, Error, { shipmentNumber: string; status: Shipment["status"] }>({
    mutationFn: ({ shipmentNumber, status }) =>
      updateLogisticsShipmentStatus(shipmentNumber, {
        tenantId: user.tenantId,
        status,
      }),
    onSuccess: (shipment) => {
      queryClient.setQueryData<Shipment[]>(["logistics-shipments", user.tenantId], (previous = []) =>
        previous.map((existing) => (existing.id === shipment.id ? shipment : existing)),
      );
      toast({
        title: "Status updated",
        description: `${shipment.shipmentNumber} is now ${shipment.status}`,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to update shipment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateShipment = (draft: CreateShipmentDraft) => {
    if (!draft.shipmentNumber?.trim()) {
      toast({
        title: "Shipment number required",
        description: "Add an identifier before saving the load.",
        variant: "destructive",
      });
      return;
    }

    createShipmentMutation.mutate(draft);
  };

  const handleStatusUpdate = (shipment: Shipment, status: Shipment["status"]) => {
    updateShipmentStatusMutation.mutate({ shipmentNumber: shipment.shipmentNumber, status });
  };

  const refreshShipments = () => {
    void queryClient.invalidateQueries({ queryKey: ["logistics-shipments", user.tenantId] });
  };

  const sensorSource = trackingShipments.length ? trackingShipments : filteredShipments;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Truck className="h-8 w-8 text-emerald-600" />
            Shipment & Transport Management
          </h1>
          <p className="text-slate-500 mt-2 max-w-2xl">
            Unified VT01N/VT02N/VT03N/VT11 replacement with AI routing, carrier scorecards, sensor telemetry, and automated paperwork orchestration.
          </p>
        </div>
        <div className="flex flex-col gap-2 lg:items-end">
          {isRefreshingShipments && !isLoadingShipments && (
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <RefreshCw className="h-3 w-3 animate-spin" /> Syncing telemetry
            </span>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowCreateShipment(true)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-white flex items-center gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Create Shipment (VT01N)
            </button>
            <button
              onClick={() =>
                toast({
                  title: "Carriers assigned",
                  description: "AI matched priority loads based on temp control + cost tiers.",
                  variant: "success",
                })
              }
              className="rounded-lg border border-slate-200 px-4 py-2 text-slate-700 flex items-center gap-2"
            >
              <Brain className="h-4 w-4 text-purple-600" /> AI Assign Carriers
            </button>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by shipment, carrier, or destination"
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value === "all" ? "all" : (event.target.value as Shipment["status"]))
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All statuses</option>
            <option value="planned">Planned</option>
            <option value="loading">Loading</option>
            <option value="in-transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="exception">Exceptions</option>
          </select>
          <button
            onClick={refreshShipments}
            disabled={isRefreshingShipments}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshingShipments ? "animate-spin" : ""}`} /> Sync now
          </button>
        </div>
      </div>

      {isLoadingShipments && (
        <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
          Loading live logistics telemetry…
        </div>
      )}

      {shipmentsError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-semibold">Failed to load shipments</p>
            <p className="text-xs text-rose-600">{errorMessage}</p>
          </div>
        </div>
      )}

      <TransportKpis analytics={analytics} />

      <nav className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              activeTab === tab.key ? "bg-emerald-600 text-white" : "text-slate-600"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        {activeTab === "planning" && (
          <motion.section
            key="planning"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid gap-6 lg:grid-cols-5"
          >
            <div className="lg:col-span-3 space-y-4">
              <PlanningColumn shipments={planningShipments} onClickShipment={setSelectedShipment} />
              <AIPlannerCard />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <LoadConsolidation shipments={planningShipments} />
              <CarrierPerformance shipments={filteredShipments} />
            </div>
          </motion.section>
        )}

        {activeTab === "execution" && (
          <motion.section
            key="execution"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            <ExecutionBoard
              shipments={executionShipments}
              onUpdateStatus={handleStatusUpdate}
              onSelect={setSelectedShipment}
              isUpdating={updateShipmentStatusMutation.isPending}
            />
            <DockSchedule />
          </motion.section>
        )}

        {activeTab === "tracking" && (
          <motion.section
            key="tracking"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            <TrackingOverview shipments={trackingShipments.length ? trackingShipments : filteredShipments} onSelect={setSelectedShipment} />
            <SensorDashboard shipments={sensorSource} />
          </motion.section>
        )}

        {activeTab === "documents" && (
          <motion.section
            key="documents"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <DocumentsTable documents={documents} />
          </motion.section>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200 p-6"
      >
        <div className="flex gap-4">
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <Zap className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-2">AI Transport Intelligence</h3>
            <div className="grid gap-4 md:grid-cols-2 text-sm text-slate-600">
              <ul className="space-y-1">
                <li>✓ Route optimization saved 120 miles today</li>
                <li>✓ Carrier performance: DHL 98% on-time this month</li>
                <li>✓ Dock scheduling balanced across all bays</li>
              </ul>
              <ul className="space-y-1">
                <li>⚠️ Weather delay expected for Northeast shipments</li>
                <li>💡 Switch to rail for bulk freight &gt; 500 miles</li>
                <li>🎯 Consolidation opportunities worth $12K savings</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      <CreateShipmentModal
        open={showCreateShipment}
        isSubmitting={createShipmentMutation.isPending}
        onClose={() => setShowCreateShipment(false)}
        onCreate={handleCreateShipment}
      />

      <ShipmentDetailDrawer shipment={selectedShipment} onClose={() => setSelectedShipment(null)} />
    </div>
  );
}

function PlanningColumn({ shipments, onClickShipment }: { shipments: Shipment[]; onClickShipment: (shipment: Shipment) => void }) {
  const grouped = useMemo(() => {
    return {
      today: shipments.filter((shipment) => shipment.status === "loading"),
      backlog: shipments.filter((shipment) => shipment.status === "planned"),
    };
  }, [shipments]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            Today's Loads
          </h2>
          <span className="text-sm text-slate-500">{grouped.today.length} shipments</span>
        </div>
        <div className="space-y-3">
          {grouped.today.map((shipment) => (
            <ShipmentRow key={shipment.id} shipment={shipment} onSelect={onClickShipment} />
          ))}
          {grouped.today.length === 0 && <EmptyState message="No live loads" />}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" />
            Backlog & Wave Planning
          </h2>
          <span className="text-sm text-slate-500">{grouped.backlog.length} upcoming</span>
        </div>
        <div className="space-y-3">
          {grouped.backlog.map((shipment) => (
            <ShipmentRow key={shipment.id} shipment={shipment} onSelect={onClickShipment} />
          ))}
          {grouped.backlog.length === 0 && <EmptyState message="No planned shipments" />}
        </div>
      </div>
    </div>
  );
}

function ShipmentRow({ shipment, onSelect }: { shipment: Shipment; onSelect: (shipment: Shipment) => void }) {
  const deliveries = shipment.deliveries?.length ?? 0;
  const origin = shipment.route?.origin?.name ?? "Origin";
  const destination = shipment.route?.destination?.name ?? "Destination";
  const duration = shipment.route?.duration ?? 0;
  const carrierName = shipment.carrier?.name ?? "Unassigned";

  return (
    <button
      onClick={() => onSelect(shipment)}
      className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left hover:border-emerald-200 hover:bg-white"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-900">{shipment.shipmentNumber}</p>
          <p className="text-sm text-slate-500">
            {carrierName} • {deliveries} deliveries
          </p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[shipment.status]}`}>{shipment.status}</span>
      </div>
      <div className="mt-2 flex items-center text-xs text-slate-500 gap-4">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {origin} → {destination}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {duration}h
        </span>
      </div>
    </button>
  );
}

function AIPlannerCard() {
  return (
    <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
      <div className="flex gap-3">
        <Brain className="h-6 w-6 text-yellow-600" />
        <div>
          <p className="font-semibold text-yellow-900">AI Load Consolidation Opportunity</p>
          <p className="text-sm text-yellow-700 mt-1">
            Combine DL-789 + DL-790 onto SH-2024-004 to save $450 and free one dock door for the afternoon wave.
          </p>
          <button className="mt-3 text-sm font-medium text-yellow-700">Consolidate Now →</button>
        </div>
      </div>
    </div>
  );
}

function LoadConsolidation({ shipments }: { shipments: Shipment[] }) {
  const loadFactor = useMemo(() => {
    const totals = shipments.reduce(
      (acc, shipment) => {
        acc.capacity += shipment.vehicle?.capacity ?? 0;
        acc.booked += (shipment.deliveries?.length ?? 0) * 2500;
        return acc;
      },
      { capacity: 0, booked: 0 },
    );
    return totals.capacity ? Math.round((totals.booked / totals.capacity) * 100) : 0;
  }, [shipments]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Package className="h-4 w-4 text-purple-600" /> Load Factor & Consolidation
      </h3>
      <p className="text-4xl font-bold text-slate-900">{loadFactor}%</p>
      <p className="text-sm text-slate-500">Average cube utilization across planned shipments</p>
      <div className="mt-4 grid gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-600">
            <Weight className="h-4 w-4 text-slate-500" /> Available Cube
          </span>
          <strong>92,400 lbs</strong>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-600">
            <Box className="h-4 w-4 text-slate-500" /> Suggested Combos
          </span>
          <strong>5 shipments</strong>
        </div>
      </div>
    </div>
  );
}

function CarrierPerformance({ shipments }: { shipments: Shipment[] }) {
  const topCarriers = useMemo(() => {
    const map = new Map<string, { carrier: Shipment["carrier"]; onTime: number; total: number }>();
    shipments.forEach((shipment) => {
      if (!shipment.carrier) return;
      const record = map.get(shipment.carrier.id) || { carrier: shipment.carrier, onTime: 0, total: 0 };
      record.total += 1;
      if (shipment.status === "delivered") record.onTime += 1;
      map.set(shipment.carrier.id, record);
    });
    return Array.from(map.values())
      .map((record) => ({
        ...record,
        onTimeRate: record.total ? Math.round((record.onTime / record.total) * 100) : 0,
      }))
      .sort((a, b) => b.onTimeRate - a.onTimeRate)
      .slice(0, 3);
  }, [shipments]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-600" /> Carrier Performance
      </h3>
      <div className="space-y-3">
        {topCarriers.map((record) => (
          <div key={record.carrier.id} className="rounded-xl border border-slate-100 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{record.carrier.name}</p>
                <p className="text-xs text-slate-500">Rating {record.carrier.rating}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">{record.onTimeRate}%</p>
                <p className="text-xs text-slate-500">On-time</p>
              </div>
            </div>
          </div>
        ))}
        {topCarriers.length === 0 && <EmptyState message="No carrier stats yet" />}
      </div>
    </div>
  );
}

function ExecutionBoard({
  shipments,
  onUpdateStatus,
  onSelect,
  isUpdating,
}: {
  shipments: Shipment[];
  onUpdateStatus: (shipment: Shipment, status: Shipment["status"]) => void;
  onSelect: (shipment: Shipment) => void;
  isUpdating: boolean;
}) {
  const columns: { status: Shipment["status"]; label: string }[] = [
    { status: "loading", label: "Dock & Loading" },
    { status: "in-transit", label: "Linehaul" },
    { status: "delivered", label: "Delivered" },
    { status: "exception", label: "Exceptions" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {columns.map((column) => (
        <div key={column.status} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">{column.label}</h3>
            <span className="text-xs text-slate-500">
              {shipments.filter((shipment) => shipment.status === column.status).length} loads
            </span>
          </div>
          <div className="space-y-3">
            {shipments
              .filter((shipment) => shipment.status === column.status)
              .map((shipment) => {
                const destination = shipment.route?.destination?.name ?? "Destination";
                const eta = shipment.route?.duration ?? 0;
                const carrierName = shipment.carrier?.name ?? "Unassigned";

                return (
                  <div key={shipment.id} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{shipment.shipmentNumber}</p>
                        <p className="text-xs text-slate-500">{carrierName}</p>
                      </div>
                      <button onClick={() => onSelect(shipment)} className="text-xs text-emerald-600">
                        View
                      </button>
                    </div>
                    <div className="mt-2 flex items-center text-xs text-slate-500 gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {destination}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> ETA {eta}h
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {column.status !== "loading" && column.status !== "planned" && (
                        <button
                          onClick={() => onUpdateStatus(shipment, "delivered")}
                          disabled={isUpdating}
                          className="flex-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 disabled:opacity-60"
                        >
                          Mark Delivered
                        </button>
                      )}
                      {column.status !== "exception" && (
                        <button
                          onClick={() => onUpdateStatus(shipment, "exception")}
                          disabled={isUpdating}
                          className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 disabled:opacity-60"
                        >
                          Flag Issue
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            {shipments.filter((shipment) => shipment.status === column.status).length === 0 && (
              <EmptyState message="No shipments" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DockSchedule() {
  const slots = [
    { dock: "Door 3", carrier: "DHL", status: "loading", time: "10:15", commodity: "Frozen" },
    { dock: "Door 7", carrier: "FedEx", status: "arrived", time: "10:45", commodity: "Ambient" },
    { dock: "Door 2", carrier: "XPO", status: "scheduled", time: "11:00", commodity: "Chemicals" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Route className="h-4 w-4 text-blue-600" /> Dock Schedule
        </h3>
        <span className="text-xs text-slate-500">Auto-balanced</span>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {slots.map((slot) => (
          <div key={slot.dock} className="rounded-xl border border-slate-100 p-4">
            <p className="text-sm font-semibold text-slate-900">{slot.dock}</p>
            <p className="text-xs text-slate-500">{slot.carrier}</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{slot.time}</p>
            <p className="text-xs text-slate-500">{slot.commodity}</p>
            <span
              className={`mt-3 inline-flex items-center rounded-full px-2 py-1 text-[10px] uppercase tracking-wide ${
                slot.status === "loading"
                  ? "bg-amber-100 text-amber-700"
                  : slot.status === "arrived"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {slot.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrackingOverview({ shipments, onSelect }: { shipments: Shipment[]; onSelect: (shipment: Shipment) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Navigation className="h-4 w-4 text-indigo-600" /> Real-time Tracking
        </h3>
        <button className="text-xs text-slate-500 flex items-center gap-1">
          <RefreshCw className="h-3 w-3" /> Refresh GPS
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {shipments.map((shipment) => (
          <div key={shipment.id} className="rounded-xl border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{shipment.shipmentNumber}</p>
                <p className="text-xs text-slate-500">{shipment.carrier?.name ?? "Unassigned"}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[shipment.status]}`}>{shipment.status}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
              <div>
                <p className="font-medium text-slate-900">{shipment.route?.origin?.name ?? "Origin"}</p>
                <p>Departed 06:40</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">{shipment.route?.destination?.name ?? "Destination"}</p>
                <p>ETA {shipment.route?.duration ?? "--"}:00</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <SatelliteDish className="h-3 w-3" /> {shipment.tracking || "GPS pending"}
            </div>
            <button onClick={() => onSelect(shipment)} className="mt-3 text-xs font-medium text-emerald-600">
              View timeline →
            </button>
          </div>
        ))}
        {shipments.length === 0 && <EmptyState message="No active shipments" />}
      </div>
    </div>
  );
}

function SensorDashboard({ shipments }: { shipments: Shipment[] }) {
  const readings = shipments.flatMap((shipment) => (shipment.sensors ?? []).map((sensor) => ({ ...sensor, shipment }))).slice(0, 6);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-cyan-600" /> Cold Chain & Telemetry
        </h3>
        <span className="text-xs text-slate-500">Live sensor streaming</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {readings.map((sensor) => (
          <div key={sensor.id} className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs text-slate-500">{sensor.shipment.shipmentNumber}</p>
            <p className="text-lg font-semibold text-slate-900">
              {sensor.value}
              <span className="text-xs text-slate-500 ml-1">{sensor.unit}</span>
            </p>
            <p className="text-sm text-slate-500 capitalize">{sensor.type}</p>
            <span
              className={`mt-3 inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-wide ${
                sensor.status === "ok"
                  ? "bg-emerald-100 text-emerald-700"
                  : sensor.status === "warning"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-600"
              }`}
            >
              {sensor.status}
            </span>
          </div>
        ))}
        {readings.length === 0 && <EmptyState message="No sensor data" />}
      </div>
    </div>
  );
}

function DocumentsTable({ documents }: { documents: (DocumentMeta & { shipment: Shipment })[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-600" /> Shipment Documents
        </h3>
        <button className="text-xs text-slate-500 flex items-center gap-1">
          <QrCode className="h-3 w-3" /> Scan to Share
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-2">Shipment</th>
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2">Owner</th>
            <th className="px-4 py-2">Updated</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={`${doc.shipment.id}-${doc.id}`} className="border-b border-slate-50">
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-900">{doc.shipment.shipmentNumber}</p>
                <p className="text-xs text-slate-500">{doc.shipment.carrier.name}</p>
              </td>
              <td className="px-4 py-3">{doc.type}</td>
              <td className="px-4 py-3">{doc.owner}</td>
              <td className="px-4 py-3">{doc.updatedAt}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    doc.status === "ready"
                      ? "bg-blue-100 text-blue-700"
                      : doc.status === "signed"
                        ? "bg-emerald-100 text-emerald-700"
                        : doc.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {doc.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button className="text-xs font-medium text-emerald-600">Download</button>
              </td>
            </tr>
          ))}
          {documents.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                No documents available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TransportKpis({
  analytics,
}: {
  analytics: { total: number; planned: number; inTransit: number; delivered: number; freightCost: number; milesToday: number };
}) {
  const cards = [
    { label: "Shipments Today", value: analytics.total, icon: Truck, accent: "text-emerald-600" },
    { label: "In Transit", value: analytics.inTransit, icon: Navigation, accent: "text-blue-600" },
    { label: "Delivered", value: analytics.delivered, icon: CheckCircle, accent: "text-emerald-600" },
    { label: "Freight Spend", value: `$${analytics.freightCost.toLocaleString()}`, icon: DollarSign, accent: "text-slate-600" },
    { label: "Miles Optimized", value: analytics.milesToday, icon: Route, accent: "text-purple-600" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase">{card.label}</p>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            </div>
            <card.icon className={`h-6 w-6 ${card.accent}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">{message}</p>;
}

function ShipmentDetailDrawer({ shipment, onClose }: { shipment: Shipment | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {shipment && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="w-full max-w-5xl rounded-3xl bg-white p-8 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase">Shipment</p>
                <h2 className="text-2xl font-bold text-slate-900">{shipment.shipmentNumber}</h2>
                <p className="text-sm text-slate-500">{shipment.carrier.name}</p>
              </div>
              <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Route</p>
                <p className="text-sm font-semibold text-slate-900">
                  {shipment.route?.origin?.name ?? "Origin"} → {shipment.route?.destination?.name ?? "Destination"}
                </p>
                <p className="text-xs text-slate-500">
                  {(shipment.route?.distance ?? 0).toLocaleString()} mi • {shipment.route?.duration ?? 0}h
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Vehicle</p>
                <p className="text-sm font-semibold text-slate-900">{shipment.vehicle?.type ?? "Pending assignment"}</p>
                <p className="text-xs text-slate-500">{shipment.vehicle?.licensePlate ?? "—"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Costs</p>
                <p className="text-sm font-semibold text-slate-900">${(shipment.costs?.total ?? 0).toLocaleString()}</p>
                <p className="text-xs text-slate-500">
                  Freight ${shipment.costs?.freight ?? 0} / Fuel ${shipment.costs?.fuel ?? 0}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Timer className="h-4 w-4 text-blue-600" /> Timeline
                </h3>
                <div className="space-y-3">
                  {(shipment.events ?? []).map((event) => (
                    <div key={event.id} className="border-l-2 border-blue-200 pl-3">
                      <p className="text-sm font-semibold text-slate-900">{event.detail}</p>
                      <p className="text-xs text-slate-500">{event.location}</p>
                      <p className="text-[11px] text-slate-400">{new Date(event.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                  {(!shipment.events || shipment.events.length === 0) && (
                    <p className="text-xs text-slate-400">No milestone events yet.</p>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-emerald-600" /> Documents
                </h3>
                <div className="space-y-3">
                  {(shipment.documents ?? []).map((doc) => (
                    <div key={doc.id} className="rounded-xl bg-slate-50 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{doc.type}</p>
                        <p className="text-xs text-slate-500">{doc.owner}</p>
                      </div>
                      <span className="text-xs text-slate-500">{doc.status}</span>
                    </div>
                  ))}
                  {(!shipment.documents || shipment.documents.length === 0) && (
                    <p className="text-xs text-slate-400">No paperwork attached.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CreateShipmentModal({
  open,
  onClose,
  onCreate,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (draft: CreateShipmentDraft) => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState({
    shipmentNumber: "",
    type: "outbound" as Shipment["type"],
    carrier: "DHL Express",
    scheduledDate: new Date().toISOString().slice(0, 10),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Create Shipment (VT01N)</h2>
            <p className="text-sm text-slate-500">Auto-assign carrier, route, and paperwork</p>
          </div>
          <button onClick={onClose} className="text-2xl text-slate-400">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Shipment Number
              <input
                value={form.shipmentNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, shipmentNumber: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                placeholder="SH-2024-010"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Type
              <select
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as Shipment["type"] }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
              >
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
                <option value="transfer">Plant Transfer</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Carrier
              <input
                value={form.carrier}
                onChange={(event) => setForm((prev) => ({ ...prev, carrier: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Scheduled Date
              <input
                type="date"
                value={form.scheduledDate}
                onChange={(event) => setForm((prev) => ({ ...prev, scheduledDate: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
              />
            </label>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900 mb-1">AI Recommendations</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Route via Indianapolis cross-dock to avoid Chicago congestion</li>
              <li>Use 53' reefer from fleet 12 (last maintenance 11 days ago)</li>
              <li>Auto-create BOL + POD + temp chain of custody docs</li>
            </ul>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-6">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600">
            Cancel
          </button>
          <button
            onClick={() =>
              onCreate({
                shipmentNumber: form.shipmentNumber,
                type: form.type,
                carrier: { name: form.carrier, id: form.carrier.toLowerCase().replace(/\s+/g, "-"), rating: 4.6 },
                scheduledDate: form.scheduledDate,
              })
            }
            disabled={isSubmitting}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {isSubmitting ? "Creating…" : "Create Shipment"}
          </button>
        </div>
      </div>
    </div>
  );
}

