"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Package,
  ArrowRightLeft,
  Truck,
  Factory,
  CheckCircle,
  FileText,
  Barcode,
  Printer,
  QrCode,
  MapPin,
  Brain,
  Zap,
  Upload,
  Search,
  Filter,
  Plus,
  Eye,
  RefreshCw,
  Archive,
  Layers,
  Grid3x3,
  ThermometerSnowflake,
  ShieldCheck,
  Activity,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GoodsMovement {
  id: string;
  documentNumber: string;
  movementType: string;
  movementTypeDesc: string;
  material: {
    number: string;
    description: string;
    type: "FERT" | "VERT" | "ZROH";
  };
  quantity: number;
  unit: string;
  batch: string;
  fromLocation: {
    plant: string;
    storageLocation: string;
    bin?: string;
  };
  toLocation: {
    plant: string;
    storageLocation: string;
    bin?: string;
  };
  handlingUnit?: string;
  storageUnit?: string;
  postingDate: string;
  documentDate: string;
  reference?: string;
  status: "draft" | "posted" | "reversed";
  createdBy: string;
  reversalDoc?: string;
  temperatureRisk?: "cold-chain" | "allergen" | "ambient";
  qualityChecks?: string[];
  statusHistory?: MovementAuditEvent[];
}

interface TransferOrder {
  id: string;
  orderNumber: string;
  type: "bin-to-bin" | "plant-to-plant" | "storage-location";
  priority: "urgent" | "normal" | "low";
  materials: TransferItem[];
  status: "open" | "in-progress" | "confirmed" | "cancelled";
  createdDate: string;
  confirmedDate?: string;
  wave?: string;
}

interface TransferItem {
  material: string;
  description: string;
  quantity: number;
  fromBin: string;
  toBin: string;
  pickedQty?: number;
  confirmedQty?: number;
}

interface LabelJob {
  id: string;
  handlingUnit: string;
  labelType: "HU" | "SU" | "ASN";
  printer: string;
  owner: string;
  status: "queued" | "printing" | "completed" | "error";
  createdAt: string;
}

interface InventorySnapshot {
  location: string;
  description: string;
  available: number;
  qualityHold: number;
  blocked: number;
  temperatureZone: string;
  utilization: number;
}

interface MovementInsight {
  id: string;
  category: "risk" | "optimization" | "compliance";
  message: string;
  severity: "info" | "warning" | "critical";
}

interface MovementAuditEvent {
  timestamp: string;
  actor: string;
  action: string;
  detail?: string;
}

const MOVEMENT_TYPES: Record<string, string> = {
  "101": "GR for Purchase Order",
  "103": "GR for PO into GR blocked",
  "105": "GR from blocked stock",
  "201": "GI for cost center",
  "221": "GI for project",
  "261": "GI for production order",
  "301": "Transfer plant to plant (one-step)",
  "303": "Transfer plant to plant (removal)",
  "305": "Transfer plant to plant (placement)",
  "309": "Transfer material to material",
  "311": "Transfer storage location to storage location",
  "313": "Transfer storage location (removal)",
  "315": "Transfer storage location (placement)",
  "411": "Transfer to consignment",
  "451": "Returns from customer",
  "601": "GI for delivery",
  "641": "GI for sales order",
  "701": "Inventory differences",
  "702": "Physical inventory adjustments",
  "711": "Inventory recount",
};

const STORAGE_LOCATIONS: Record<string, string> = {
  FG01: "Finished Goods",
  RP01: "Raw Materials & Packaging",
  BB01: "Bargain Basement (Liquidation)",
  RW01: "Rework",
  PA01: "Production Storage",
};

const BIN_TYPES: Record<string, string> = {
  "100": "Production Consumption",
  "201": "Interim Receiving/Returns",
  "300": "Ambient Storage",
  "301": "Ambient Partials",
  "350": "Ambient Bulk (Silos)",
  "500": "Temperature Controlled (Cool)",
  "550": "Cool Bulk",
  "600": "Frozen Storage",
  "650": "Frozen Bulk",
  "700": "Allergen Storage",
  "901": "GR Finished Goods",
  "999": "Production Damage",
};

export default function GoodsMovementSystem() {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<"movements" | "transfers" | "labels" | "inventory">("movements");
  const [selectedMovementType, setSelectedMovementType] = useState<string>("");
  const [filters, setFilters] = useState({ status: "all", search: "", dateRange: "7d" });
  const [movements, setMovements] = useState<GoodsMovement[]>([]);
  const [transferOrders, setTransferOrders] = useState<TransferOrder[]>([]);
  const [labelJobs, setLabelJobs] = useState<LabelJob[]>([]);
  const [inventoryLevels, setInventoryLevels] = useState<InventorySnapshot[]>([]);
  const [insights, setInsights] = useState<MovementInsight[]>([]);
  const [showCreateMovement, setShowCreateMovement] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<GoodsMovement | null>(null);

  useEffect(() => {
    loadGoodsMovements();
    loadTransferOrders();
    loadLabelJobs();
    loadInventorySnapshot();
    loadInsights();
  }, []);

  const reprintLabel = (job: LabelJob) => {
    setLabelJobs((prev) =>
      prev.map((label) => (label.id === job.id ? { ...label, status: "printing", createdAt: new Date().toISOString() } : label)),
    );
    toast({
      title: "Reprint queued",
      description: `${job.handlingUnit} sending to ${job.printer}`,
    });
  };

  const filteredMovements = useMemo(() => {
    return movements.filter((movement) => {
      const matchesType = selectedMovementType ? movement.movementType === selectedMovementType : true;
      const matchesStatus = filters.status === "all" ? true : movement.status === filters.status;
      const matchesSearch = filters.search
        ? `${movement.documentNumber} ${movement.material.number} ${movement.batch}`
            .toLowerCase()
            .includes(filters.search.toLowerCase())
        : true;
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [movements, selectedMovementType, filters]);

  const analytics = useMemo(() => {
    const totalToday = movements.length;
    const drafts = movements.filter((m) => m.status === "draft").length;
    const reversed = movements.filter((m) => m.status === "reversed").length;
    const coldChain = movements.filter((m) => m.temperatureRisk === "cold-chain").length;
    return {
      totalToday,
      drafts,
      reversed,
      coldChain,
      openTransfers: transferOrders.filter((order) => order.status !== "confirmed").length,
    };
  }, [movements, transferOrders]);

  const viewMaterialDocument = (docNumber: string) => {
    const movement = movements.find((m) => m.documentNumber === docNumber);
    setSelectedMovement(movement || null);
  };

  const loadGoodsMovements = async () => {
    setMovements([
      {
        id: "GM-001",
        documentNumber: "4900000001",
        movementType: "261",
        movementTypeDesc: "GI for production order",
        material: {
          number: "MAT-001",
          description: "Premium Flour",
          type: "ZROH",
        },
        quantity: 500,
        unit: "KG",
        batch: "B2024111801",
        fromLocation: {
          plant: "1000",
          storageLocation: "RP01",
          bin: "300-A-01",
        },
        toLocation: {
          plant: "1000",
          storageLocation: "PA01",
          bin: "100-PROD-01",
        },
        handlingUnit: "HU123456",
        postingDate: "2024-11-18",
        documentDate: "2024-11-18",
        reference: "PO-2024-001",
        status: "posted",
        createdBy: "SYSTEM",
        temperatureRisk: "ambient",
        qualityChecks: ["Backflush synced", "Batch verified"],
        statusHistory: [
          {
            timestamp: "2024-11-18T08:12:00Z",
            actor: "AI Supervisor",
            action: "validated",
            detail: "Production order components confirmed",
          },
          {
            timestamp: "2024-11-18T08:15:00Z",
            actor: "SYSTEM",
            action: "posted",
            detail: "GI 261 executed",
          },
        ],
      },
      {
        id: "GM-002",
        documentNumber: "4900000002",
        movementType: "101",
        movementTypeDesc: "GR for Purchase Order",
        material: {
          number: "MAT-452",
          description: "Frozen Berries",
          type: "FERT",
        },
        quantity: 240,
        unit: "CS",
        batch: "B2024111802",
        fromLocation: {
          plant: "2000",
          storageLocation: "BB01",
          bin: "201-REC-02",
        },
        toLocation: {
          plant: "2000",
          storageLocation: "FG01",
          bin: "600-F-12",
        },
        handlingUnit: "HU654321",
        postingDate: "2024-11-18",
        documentDate: "2024-11-18",
        reference: "Inbound ASN 7781",
        status: "posted",
        createdBy: "SYSTEM",
        temperatureRisk: "cold-chain",
        qualityChecks: ["Temp logger attached"],
        statusHistory: [
          {
            timestamp: "2024-11-18T07:45:00Z",
            actor: "Receiving Agent",
            action: "scanned",
            detail: "HU654321 verified via barcode",
          },
          {
            timestamp: "2024-11-18T07:50:00Z",
            actor: "SYSTEM",
            action: "posted",
            detail: "GR 101 executed",
          },
        ],
      },
      {
        id: "GM-003",
        documentNumber: "4900000003",
        movementType: "311",
        movementTypeDesc: "Transfer storage location to storage location",
        material: {
          number: "MAT-910",
          description: "Allergen Spice Mix",
          type: "FERT",
        },
        quantity: 90,
        unit: "KG",
        batch: "B2024111803",
        fromLocation: {
          plant: "1000",
          storageLocation: "PA01",
          bin: "700-A-04",
        },
        toLocation: {
          plant: "1000",
          storageLocation: "FG01",
          bin: "700-A-07",
        },
        postingDate: "2024-11-18",
        documentDate: "2024-11-18",
        reference: "Re-slot project",
        status: "draft",
        createdBy: "Planner",
        temperatureRisk: "allergen",
        qualityChecks: ["Segregation enforced"],
      },
    ]);
  };

  const loadTransferOrders = async () => {
    setTransferOrders([
      {
        id: "TO-9001",
        orderNumber: "TO9001",
        type: "bin-to-bin",
        priority: "urgent",
        materials: [
          {
            material: "MAT-001",
            description: "Premium Flour",
            quantity: 100,
            fromBin: "300-A-01",
            toBin: "100-PROD-02",
          },
        ],
        status: "open",
        createdDate: "2024-11-18T06:30:00Z",
        wave: "Wave 12",
      },
      {
        id: "TO-9002",
        orderNumber: "TO9002",
        type: "plant-to-plant",
        priority: "normal",
        materials: [
          {
            material: "MAT-452",
            description: "Frozen Berries",
            quantity: 80,
            fromBin: "201-REC-01",
            toBin: "600-F-08",
          },
        ],
        status: "in-progress",
        createdDate: "2024-11-17T14:20:00Z",
      },
      {
        id: "TO-9003",
        orderNumber: "TO9003",
        type: "storage-location",
        priority: "low",
        materials: [
          {
            material: "MAT-910",
            description: "Allergen Spice Mix",
            quantity: 45,
            fromBin: "700-A-04",
            toBin: "700-A-08",
          },
        ],
        status: "confirmed",
        createdDate: "2024-11-16T09:00:00Z",
        confirmedDate: "2024-11-16T11:15:00Z",
      },
    ]);
  };

  const loadLabelJobs = () => {
    setLabelJobs([
      {
        id: "LBL-1001",
        handlingUnit: "HU123456",
        labelType: "HU",
        printer: "North Dock Zebra",
        owner: "Receiving Bot",
        status: "completed",
        createdAt: "2024-11-18T07:40:00Z",
      },
      {
        id: "LBL-1002",
        handlingUnit: "HU654321",
        labelType: "HU",
        printer: "Freezer Line Printer",
        owner: "Cold Chain Copilot",
        status: "printing",
        createdAt: "2024-11-18T07:55:00Z",
      },
      {
        id: "LBL-1003",
        handlingUnit: "SU778899",
        labelType: "SU",
        printer: "QA Zebra",
        owner: "User",
        status: "queued",
        createdAt: "2024-11-18T08:05:00Z",
      },
    ]);
  };

  const loadInventorySnapshot = () => {
    setInventoryLevels([
      {
        location: "FG01",
        description: "Finished Goods",
        available: 12456,
        qualityHold: 156,
        blocked: 23,
        temperatureZone: "Ambient",
        utilization: 82,
      },
      {
        location: "RP01",
        description: "Raw Materials & Packaging",
        available: 9843,
        qualityHold: 45,
        blocked: 10,
        temperatureZone: "Ambient",
        utilization: 74,
      },
      {
        location: "BB01",
        description: "Bargain Basement",
        available: 1850,
        qualityHold: 0,
        blocked: 5,
        temperatureZone: "Ambient",
        utilization: 58,
      },
      {
        location: "PA01",
        description: "Production Storage",
        available: 6421,
        qualityHold: 89,
        blocked: 12,
        temperatureZone: "Staging",
        utilization: 91,
      },
      {
        location: "RW01",
        description: "Rework",
        available: 312,
        qualityHold: 60,
        blocked: 8,
        temperatureZone: "Controlled",
        utilization: 48,
      },
    ]);
  };

  const loadInsights = () => {
    setInsights([
      {
        id: "INS-1",
        category: "risk",
        message: "Temperature excursion risk detected on HU654321 (bin 600-F-12).",
        severity: "warning",
      },
      {
        id: "INS-2",
        category: "optimization",
        message: "Consolidate three plant transfers into single wave to free forklift capacity.",
        severity: "info",
      },
      {
        id: "INS-3",
        category: "compliance",
        message: "AI recommends FEFO batch swap for MAT-001 to maintain shelf-life compliance.",
        severity: "critical",
      },
    ]);
  };

  const postGoodsMovement = async (movement: Partial<GoodsMovement>) => {
    try {
      const validation = await validateMovement(movement);
      if (!validation.isValid) {
        toast({
          title: "Validation Failed",
          description: validation.errors.join(", "),
          variant: "destructive",
        });
        return;
      }

      const docNumber = `490${Date.now().toString().slice(-7)}`;
      const today = new Date().toISOString();
      const materialFallback =
        movement.material ||
        ({
          number: "MAT-NEW",
          description: "User Selected",
          type: "FERT",
        } as GoodsMovement["material"]);

      const newMovement: GoodsMovement = {
        id: docNumber,
        documentNumber: docNumber,
        movementType: movement.movementType || "101",
        movementTypeDesc: MOVEMENT_TYPES[movement.movementType || "101"] || "Custom Movement",
        material: materialFallback,
        quantity: movement.quantity || 0,
        unit: movement.unit || "EA",
        batch: movement.batch || `B${today.slice(0, 10).replace(/-/g, "")}`,
        fromLocation:
          movement.fromLocation || (
            {
              plant: "1000",
              storageLocation: "RP01",
            } as GoodsMovement["fromLocation"]
          ),
        toLocation:
          movement.toLocation || (
            {
              plant: "1000",
              storageLocation: "FG01",
            } as GoodsMovement["toLocation"]
          ),
        handlingUnit: movement.handlingUnit,
        storageUnit: movement.storageUnit,
        postingDate: movement.postingDate || today.slice(0, 10),
        documentDate: movement.documentDate || today.slice(0, 10),
        reference: movement.reference || "Cockpit Entry",
        status: "posted",
        createdBy: "USER",
        temperatureRisk: movement.temperatureRisk,
        qualityChecks: ["AI validated", ...(movement.qualityChecks || [])],
        statusHistory: [
          {
            timestamp: today,
            actor: "USER",
            action: "posted",
            detail: "Movement created through Goods Movement System",
          },
        ],
      };

      setMovements((prev) => [newMovement, ...prev]);

      if (newMovement.movementType.startsWith("1")) {
        await printLabels(newMovement);
      }

      toast({
        title: "Movement Posted",
        description: `Document ${docNumber} created successfully`,
      });

      return docNumber;
    } catch (error) {
      console.error(error);
      toast({
        title: "Posting Failed",
        description: "Error posting goods movement",
        variant: "destructive",
      });
    }
  };

  const validateMovement = async (movement: Partial<GoodsMovement>) => {
    const validation = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      suggestions: [] as string[],
    };

    if (movement.movementType?.startsWith("2")) {
      const availableStock = 1000;
      if ((movement.quantity || 0) > availableStock) {
        validation.isValid = false;
        validation.errors.push(`Insufficient stock. Available: ${availableStock}`);
      }
    }

    if (movement.material?.type === "FERT") {
      validation.suggestions.push("AI: Use batch B2024111501 for FEFO compliance");
    }

    if (movement.toLocation?.bin?.startsWith("600")) {
      validation.warnings.push("Ensure cold chain maintained during transfer");
    }

    return validation;
  };

  const createTransferOrder = async (fromBin: string, toBin: string, quantity: number) => {
    const orderNumber = `TO${Date.now().toString().slice(-8)}`;
    const newTO: TransferOrder = {
      id: orderNumber,
      orderNumber,
      type: "bin-to-bin",
      priority: "normal",
      materials: [
        {
          material: "MAT-001",
          description: "Premium Flour",
          quantity,
          fromBin,
          toBin,
        },
      ],
      status: "open",
      createdDate: new Date().toISOString(),
    };

    setTransferOrders((prev) => [newTO, ...prev]);
    toast({
      title: "Transfer Order Created",
      description: `TO ${orderNumber} created for ${quantity} units`,
    });
  };

  const confirmTransferOrder = (orderId: string) => {
    setTransferOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "confirmed",
              confirmedDate: new Date().toISOString(),
            }
          : order,
      ),
    );
    toast({ title: "Transfer Confirmed", description: `Order ${orderId} confirmed` });
  };

  const cancelTransferOrder = (orderId: string) => {
    setTransferOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: "cancelled" } : order)));
    toast({
      title: "Transfer Cancelled",
      description: `Order ${orderId} moved to cancelled state`,
      variant: "destructive",
    });
  };

  const reverseGoodsMovement = (movementId: string) => {
    setMovements((prev) =>
      prev.map((movement) =>
        movement.id === movementId
          ? {
              ...movement,
              status: "reversed",
              reversalDoc: `102${Date.now().toString().slice(-7)}`,
              statusHistory: [
                ...(movement.statusHistory || []),
                {
                  timestamp: new Date().toISOString(),
                  actor: "USER",
                  action: "reversed",
                  detail: "Reversal executed from cockpit",
                },
              ],
            }
          : movement,
      ),
    );
    toast({ title: "Movement Reversed", description: `Reversal document created.` });
  };

  const printLabels = async (movement: GoodsMovement) => {
    const labelType = movement.movementType.startsWith("1") ? "HU" : "SU";
    setLabelJobs((prev) => [
      {
        id: `LBL-${Date.now()}`,
        handlingUnit: movement.handlingUnit || "New HU",
        labelType,
        printer: "Auto-selected",
        owner: movement.createdBy,
        status: "queued",
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    toast({
      title: "Labels Printing",
      description: `Printing ${labelType} labels for ${movement.handlingUnit || "new unit"}`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            Goods Movement Control Tower
          </h1>
          <p className="text-gray-500 mt-2 max-w-2xl">
            Unified cockpit covering MIGO, MB03/51/52, LT01/10, and label orchestration with AI validation, FEFO guardrails, and cold-chain telemetry.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setScanMode(!scanMode)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm ${
              scanMode ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700"
            }`}
          >
            <Barcode className="w-4 h-4" />
            {scanMode ? "Scanning Enabled" : "Scan Mode"}
          </button>
          <button
            onClick={() => setShowCreateMovement(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Post Movement (MIGO)
          </button>
        </div>
      </div>

      <MovementAnalytics analytics={analytics} />

      <div className="flex gap-2 mb-2 bg-white rounded-lg p-1 shadow-sm">
        {[
          {
            key: "movements" as const,
            label: "Goods Movements (MB51)",
            icon: ArrowRightLeft,
          },
          {
            key: "transfers" as const,
            label: "Transfer Orders (LT01/10)",
            icon: Grid3x3,
          },
          {
            key: "labels" as const,
            label: "Labels & Printing",
            icon: Printer,
          },
          {
            key: "inventory" as const,
            label: "Stock Overview (MMBE)",
            icon: Layers,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              activeView === tab.key ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <MovementInsights insights={insights} />

      <AnimatePresence mode="wait">
        {activeView === "movements" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Filter className="w-4 h-4" /> Filters
              </div>
              <div className="flex gap-2">
                {["101", "261", "311", "701"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedMovementType(type)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedMovementType === type ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {type} - {MOVEMENT_TYPES[type]}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedMovementType("")}
                  className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                >
                  Clear
                </button>
              </div>
              <select
                value={filters.status}
                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="posted">Posted</option>
                <option value="draft">Draft</option>
                <option value="reversed">Reversed</option>
              </select>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                  placeholder="Search document, material, batch..."
                  className="pl-9 pr-3 py-1 border border-gray-200 rounded-lg text-sm w-full"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-xs text-gray-500">
                    <th className="text-left py-3 px-4">Document</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Material</th>
                    <th className="text-center py-3 px-4">Quantity</th>
                    <th className="text-left py-3 px-4">Batch/HU</th>
                    <th className="text-left py-3 px-4">From → To</th>
                    <th className="text-center py-3 px-4">Date</th>
                    <th className="text-center py-3 px-4">Status</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map((movement) => (
                    <tr key={movement.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {movement.documentNumber}
                          {movement.temperatureRisk === "cold-chain" && (
                            <ThermometerSnowflake className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{movement.reference}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium">{movement.movementType}</div>
                        <div className="text-xs text-gray-500">{movement.movementTypeDesc}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-900">{movement.material.number}</div>
                        <div className="text-xs text-gray-500">{movement.material.description}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-medium">{movement.quantity}</div>
                        <div className="text-xs text-gray-500">{movement.unit}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">{movement.batch}</div>
                        {movement.handlingUnit && (
                          <div className="text-xs text-blue-600">{movement.handlingUnit}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div>
                          <span className="font-medium">{movement.fromLocation.storageLocation}</span>
                          {movement.fromLocation.bin && `/${movement.fromLocation.bin}`}
                        </div>
                        <div className="text-gray-400">↓</div>
                        <div>
                          <span className="font-medium">{movement.toLocation.storageLocation}</span>
                          {movement.toLocation.bin && `/${movement.toLocation.bin}`}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-600">{movement.postingDate}</td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={movement.status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => viewMaterialDocument(movement.documentNumber)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          <button onClick={() => printLabels(movement)} className="p-1 hover:bg-gray-100 rounded">
                            <Printer className="w-4 h-4 text-gray-600" />
                          </button>
                          {movement.status === "posted" && !movement.reversalDoc && (
                            <button
                              onClick={() => reverseGoodsMovement(movement.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <RefreshCw className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeView === "transfers" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <TransferOrderManagement
              orders={transferOrders}
              onCreate={createTransferOrder}
              onConfirm={confirmTransferOrder}
              onCancel={cancelTransferOrder}
            />
          </motion.div>
        )}

        {activeView === "labels" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <LabelCenter jobs={labelJobs} onReprint={reprintLabel} />
          </motion.div>
        )}

        {activeView === "inventory" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <StockOverview inventory={inventoryLevels} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <Brain className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Decision Copilot Journal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p>✓ Auto-selected bin 300-A-03 based on FEFO rules</p>
                <p>✓ Backflush posting automated for 12 production orders</p>
                <p>✓ Cross-docking opportunity: Skip put-away for PO-2024-789</p>
              </div>
              <div>
                <p>⚠️ Temperature excursion risk in transfer to bin 600-F-12</p>
                <p>💡 Consolidate 3 transfers to save 45 minutes of forklift time</p>
                <p>🎯 Allergen segregation enforced for bin 700-A series</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {showCreateMovement && (
        <CreateMovementModal
          onClose={() => setShowCreateMovement(false)}
          onPost={postGoodsMovement}
          movementTypes={MOVEMENT_TYPES}
          storageLocations={STORAGE_LOCATIONS}
          binTypes={BIN_TYPES}
        />
      )}

      <MovementDetailDrawer movement={selectedMovement} onClose={() => setSelectedMovement(null)} />
    </div>
  );
}

function StatusBadge({ status }: { status: GoodsMovement["status"] }) {
  const colors: Record<GoodsMovement["status"], string> = {
    draft: "bg-gray-100 text-gray-700",
    posted: "bg-green-100 text-green-700",
    reversed: "bg-red-100 text-red-700",
  };
  return <span className={`px-2 py-1 text-xs rounded-full capitalize ${colors[status]}`}>{status}</span>;
}

function TransferStatusBadge({ status }: { status: TransferOrder["status"] }) {
  const palette: Record<TransferOrder["status"], string> = {
    open: "bg-blue-100 text-blue-700",
    "in-progress": "bg-amber-100 text-amber-700",
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return <span className={`px-2 py-1 text-xs rounded-full capitalize ${palette[status]}`}>{status}</span>;
}

function MovementAnalytics({
  analytics,
}: {
  analytics: {
    totalToday: number;
    drafts: number;
    reversed: number;
    coldChain: number;
    openTransfers: number;
  };
}) {
  const cards = [
    {
      title: "Docs Today",
      value: analytics.totalToday,
      subtext: "MB51 stream",
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Draft Movements",
      value: analytics.drafts,
      subtext: "Awaiting MIGO",
      icon: Upload,
      color: "text-amber-600",
    },
    {
      title: "Reversals",
      value: analytics.reversed,
      subtext: "MBST triggers",
      icon: RefreshCw,
      color: "text-red-600",
    },
    {
      title: "Cold Chain",
      value: analytics.coldChain,
      subtext: "Temp monitored",
      icon: ThermometerSnowflake,
      color: "text-cyan-600",
    },
    {
      title: "Open Transfers",
      value: analytics.openTransfers,
      subtext: "LT01 queue",
      icon: Truck,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-400">{card.subtext}</p>
            </div>
            <card.icon className={`w-8 h-8 ${card.color}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MovementInsights({ insights }: { insights: MovementInsight[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-800 font-semibold">
          <Sparkles className="w-4 h-4 text-purple-600" />
          Movement Intelligence Feed
        </div>
        <span className="text-xs text-gray-500">AI guardrails active</span>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`border rounded-lg p-4 text-sm ${
              insight.severity === "critical"
                ? "border-red-200 bg-red-50"
                : insight.severity === "warning"
                  ? "border-amber-200 bg-amber-50"
                  : "border-blue-200 bg-blue-50"
            }`}
          >
            <p className="font-medium text-gray-900 mb-1 capitalize">{insight.category}</p>
            <p className="text-gray-700">{insight.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransferOrderManagement({
  orders,
  onCreate,
  onConfirm,
  onCancel,
}: {
  orders: TransferOrder[];
  onCreate: (fromBin: string, toBin: string, quantity: number) => void;
  onConfirm: (orderId: string) => void;
  onCancel: (orderId: string) => void;
}) {
  const boardColumns: { key: TransferOrder["status"]; label: string; color: string }[] = [
    { key: "open", label: "Open", color: "border-blue-200" },
    { key: "in-progress", label: "In Progress", color: "border-amber-200" },
    { key: "confirmed", label: "Confirmed", color: "border-green-200" },
    { key: "cancelled", label: "Cancelled", color: "border-red-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Transfer Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onCreate("300-A-01", "100-PROD-01", 100)}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <Grid3x3 className="w-8 h-8 text-blue-600 mb-2" />
            <div className="font-medium">Bin to Bin (LT01)</div>
            <div className="text-sm text-gray-500">Move targeted quantity with scanner guidance</div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <Archive className="w-8 h-8 text-green-600 mb-2" />
            <div className="font-medium">Move Entire Bin (LT10)</div>
            <div className="text-sm text-gray-500">Relocate contents with HU consolidation</div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <Factory className="w-8 h-8 text-purple-600 mb-2" />
            <div className="font-medium">Plant Transfer</div>
            <div className="text-sm text-gray-500">Cross-plant staging & carrier sync</div>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {boardColumns.map((column) => (
          <div key={column.key} className={`bg-white rounded-xl p-4 border ${column.color} min-h-[260px]`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">{column.label}</h3>
              <span className="text-xs text-gray-500">
                {orders.filter((order) => order.status === column.key).length} orders
              </span>
            </div>
            <div className="space-y-3">
              {orders
                .filter((order) => order.status === column.key)
                .map((order) => (
                  <div key={order.id} className="border border-dashed rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">
                          {order.materials.length} items • {order.priority} priority
                        </p>
                      </div>
                      <TransferStatusBadge status={order.status} />
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {order.materials[0].fromBin} → {order.materials[0].toBin}
                    </div>
                    <div className="flex gap-2 mt-3">
                      {column.key !== "confirmed" && (
                        <button
                          onClick={() => onConfirm(order.id)}
                          className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-lg"
                        >
                          Confirm
                        </button>
                      )}
                      {column.key !== "cancelled" && (
                        <button
                          onClick={() => onCancel(order.id)}
                          className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              {orders.filter((order) => order.status === column.key).length === 0 && (
                <div className="text-center text-xs text-gray-400 border border-dashed rounded-lg p-6">
                  No orders in this lane
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LabelCenter({ jobs, onReprint }: { jobs: LabelJob[]; onReprint: (job: LabelJob) => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Printer className="w-5 h-5 text-blue-600" /> Label Workbench
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-100 p-4">
            <p className="text-xs text-gray-500 uppercase">Queued</p>
            <p className="text-2xl font-bold text-gray-900">{jobs.filter((j) => j.status === "queued").length}</p>
          </div>
          <div className="rounded-lg border border-gray-100 p-4">
            <p className="text-xs text-gray-500 uppercase">Printing</p>
            <p className="text-2xl font-bold text-gray-900">{jobs.filter((j) => j.status === "printing").length}</p>
          </div>
          <div className="rounded-lg border border-gray-100 p-4">
            <p className="text-xs text-gray-500 uppercase">Completed</p>
            <p className="text-2xl font-bold text-gray-900">{jobs.filter((j) => j.status === "completed").length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="py-3 px-4 text-left">Handling Unit</th>
              <th className="py-3 px-4 text-left">Type</th>
              <th className="py-3 px-4 text-left">Printer</th>
              <th className="py-3 px-4 text-left">Owner</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Created</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b">
                <td className="py-3 px-4 font-medium text-gray-900">{job.handlingUnit}</td>
                <td className="py-3 px-4">{job.labelType}</td>
                <td className="py-3 px-4">{job.printer}</td>
                <td className="py-3 px-4">{job.owner}</td>
                <td className="py-3 px-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      job.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : job.status === "printing"
                          ? "bg-blue-100 text-blue-700"
                          : job.status === "queued"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                    }`}
                  >
                    {job.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">{new Date(job.createdAt).toLocaleTimeString()}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onReprint(job)}
                    className="text-xs px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    Reprint
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockOverview({ inventory }: { inventory: InventorySnapshot[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" /> Stock Overview (MMBE Replacement)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">Total SKUs</p>
            <p className="text-2xl font-bold text-blue-900">24,567</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-xs text-green-700">In Stock Rate</p>
            <p className="text-2xl font-bold text-green-900">98.5%</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-700">Quality Hold</p>
            <p className="text-2xl font-bold text-amber-900">156</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-xs text-red-700">Blocked Stock</p>
            <p className="text-2xl font-bold text-red-900">23</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-medium text-gray-700 mb-3">Stock by Storage Location</h3>
          <div className="space-y-3">
            {inventory.map((snap) => (
              <div key={snap.location} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">
                    {snap.location} <span className="text-sm text-gray-500">{snap.description}</span>
                  </p>
                  <p className="text-xs text-gray-500">Temp zone: {snap.temperatureZone}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{snap.available.toLocaleString()} units</p>
                  <p className="text-xs text-gray-500">Utilization {snap.utilization}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-medium text-gray-700 mb-3">Quality & Risk</h3>
          <div className="space-y-3">
            {inventory.map((snap) => (
              <div key={`${snap.location}-risk`} className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-900">{snap.location}</p>
                    <p className="text-xs text-gray-500">QA Hold {snap.qualityHold} • Blocked {snap.blocked}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">{snap.temperatureZone}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MovementDetailDrawer({ movement, onClose }: { movement: GoodsMovement | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {movement && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="bg-white rounded-2xl w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto p-8"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Material Document</p>
                <h2 className="text-2xl font-bold text-gray-900">{movement.documentNumber}</h2>
                <p className="text-sm text-gray-500">{movement.movementType} • {movement.movementTypeDesc}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Material</p>
                <p className="font-semibold text-gray-900">{movement.material.number}</p>
                <p className="text-sm text-gray-500">{movement.material.description}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Quantity</p>
                <p className="font-semibold text-gray-900">
                  {movement.quantity} {movement.unit}
                </p>
                <p className="text-sm text-gray-500">Batch {movement.batch}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Dates</p>
                <p className="font-semibold text-gray-900">Posting {movement.postingDate}</p>
                <p className="text-sm text-gray-500">Document {movement.documentDate}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Location Trail</h3>
                </div>
                <div className="text-sm text-gray-700">
                  <p>
                    From <strong>{movement.fromLocation.storageLocation}</strong> {movement.fromLocation.bin && `(${movement.fromLocation.bin})`}
                  </p>
                  <p className="text-gray-400 my-2">↓</p>
                  <p>
                    To <strong>{movement.toLocation.storageLocation}</strong> {movement.toLocation.bin && `(${movement.toLocation.bin})`}
                  </p>
                </div>
              </div>
              <div className="border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Status Timeline</h3>
                </div>
                <div className="space-y-2 text-sm">
                  {(movement.statusHistory || []).map((event) => (
                    <div key={event.timestamp} className="border-l-2 border-purple-200 pl-3">
                      <p className="text-gray-900 font-medium">{event.action}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleString()} • {event.actor}
                      </p>
                      <p className="text-xs text-gray-500">{event.detail}</p>
                    </div>
                  ))}
                  {(!movement.statusHistory || movement.statusHistory.length === 0) && (
                    <p className="text-xs text-gray-400">No audit events captured.</p>
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

function CreateMovementModal({
  onClose,
  onPost,
  movementTypes,
  storageLocations,
  binTypes,
}: {
  onClose: () => void;
  onPost: (movement: Partial<GoodsMovement>) => void;
  movementTypes: Record<string, string>;
  storageLocations: Record<string, string>;
  binTypes: Record<string, string>;
}) {
  const [movement, setMovement] = useState<Partial<GoodsMovement>>({
    movementType: "101",
    quantity: 0,
    unit: "EA",
    fromLocation: { plant: "1000", storageLocation: "RP01" },
    toLocation: { plant: "1000", storageLocation: "FG01" },
    postingDate: new Date().toISOString().slice(0, 10),
    documentDate: new Date().toISOString().slice(0, 10),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" /> Post Goods Movement (MIGO)
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Movement Type</label>
            <select
              value={movement.movementType}
              onChange={(event) => setMovement((prev) => ({ ...prev, movementType: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            >
              {Object.entries(movementTypes).map(([code, desc]) => (
                <option key={code} value={code}>
                  {code} - {desc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Material (AI-Assisted Search)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter material number or scan barcode..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                onBlur={(event) =>
                  setMovement((prev) => ({
                    ...prev,
                    material: {
                      number: event.target.value || "MAT-NEW",
                      description: "AI Suggested Item",
                      type: "FERT",
                    },
                  }))
                }
              />
              <QrCode className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <input
                type="number"
                value={movement.quantity}
                onChange={(event) => setMovement((prev) => ({ ...prev, quantity: Number(event.target.value) }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
              <select
                value={movement.unit}
                onChange={(event) => setMovement((prev) => ({ ...prev, unit: event.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              >
                <option value="EA">EA</option>
                <option value="KG">KG</option>
                <option value="LB">LB</option>
                <option value="CS">CS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
              <input
                type="text"
                value={movement.batch || ""}
                onChange={(event) => setMovement((prev) => ({ ...prev, batch: event.target.value }))}
                placeholder="Auto-generate"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Location</label>
              <select
                value={movement.fromLocation?.storageLocation}
                onChange={(event) =>
                  setMovement((prev) => ({
                    ...prev,
                    fromLocation: { ...(prev.fromLocation || { plant: "1000" }), storageLocation: event.target.value },
                  }))
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              >
                {Object.entries(storageLocations).map(([code, desc]) => (
                  <option key={code} value={code}>
                    {code} - {desc}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Bin"
                value={movement.fromLocation?.bin || ""}
                onChange={(event) =>
                  setMovement((prev) => ({
                    ...prev,
                    fromLocation: {
                      plant: prev.fromLocation?.plant ?? "1000",
                      storageLocation: prev.fromLocation?.storageLocation ?? "RP01",
                      bin: event.target.value,
                    },
                  }))
                }
                className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Location</label>
              <select
                value={movement.toLocation?.storageLocation}
                onChange={(event) =>
                  setMovement((prev) => ({
                    ...prev,
                    toLocation: { ...(prev.toLocation || { plant: "1000" }), storageLocation: event.target.value },
                  }))
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              >
                {Object.entries(storageLocations).map(([code, desc]) => (
                  <option key={code} value={code}>
                    {code} - {desc}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Bin (AI will suggest)"
                value={movement.toLocation?.bin || ""}
                onChange={(event) =>
                  setMovement((prev) => ({
                    ...prev,
                    toLocation: {
                      plant: prev.toLocation?.plant ?? "1000",
                      storageLocation: prev.toLocation?.storageLocation ?? "FG01",
                      bin: event.target.value,
                    },
                  }))
                }
                className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">AI Bin Classification</label>
            <select
              defaultValue=""
              onChange={(event) =>
                setMovement((prev) => ({
                  ...prev,
                  toLocation: {
                    plant: prev.toLocation?.plant ?? "1000",
                    storageLocation: prev.toLocation?.storageLocation ?? "FG01",
                    bin: event.target.value ? `${event.target.value}-AI` : prev.toLocation?.bin,
                  },
                }))
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            >
              <option value="">Select bin type</option>
              {Object.entries(binTypes).map(([code, desc]) => (
                <option key={code} value={code}>
                  {code} - {desc}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">AI will pre-fill the bin using FEFO and ABC rules.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Posting Date</label>
              <input
                type="date"
                value={movement.postingDate}
                onChange={(event) => setMovement((prev) => ({ ...prev, postingDate: event.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Date</label>
              <input
                type="date"
                value={movement.documentDate}
                onChange={(event) => setMovement((prev) => ({ ...prev, documentDate: event.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-purple-600 mt-1" />
              <div className="text-sm text-purple-800">
                <p className="font-semibold mb-1">AI Recommendations</p>
                <ul className="space-y-1">
                  <li>• Suggested bin 300-A-15 based on ABC classification</li>
                  <li>• FEFO: Use batch B2024111501 (expires in 10 days)</li>
                  <li>• Temperature zone match confirmed for cold chain compliance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg">
            Cancel
          </button>
          <button
            onClick={() => {
              onPost(movement);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> Post Movement
          </button>
        </div>
      </div>
    </div>
  );
}
