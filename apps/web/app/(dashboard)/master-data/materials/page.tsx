"use client";

import { useState } from "react";
import {
  Package,
  Layers,
  Users,
  Factory,
  GitBranch,
  Copy,
  History,
  Shield,
  CheckCircle,
  Edit,
  Search,
  type LucideIcon
} from "lucide-react";

interface MaterialView {
  created: boolean;
  createdBy?: string;
  date?: string;
  price?: number;
  taxClass?: string;
  lotSize?: number;
  safetyStock?: number;
  storageType?: string;
  pickingArea?: string;
  shelfLife?: number;
  inspectionType?: string;
}

interface BOMItem {
  component: string;
  description: string;
  quantity: number;
  uom: string;
}

interface Material {
  number: string;
  description: string;
  type: "FERT" | "VERT" | "ZROH";
  group: string;
  baseUOM: string;
  grossWeight: string;
  netWeight: string;
  status: "Active" | "Inactive";
  plants: string[];
  views: Record<string, MaterialView>;
  bom: {
    items: BOMItem[];
  };
  alternates: string[];
  changeHistory: { date: string; user: string; change: string }[];
}

interface VendorMaterial {
  material: string;
  description: string;
  price: number;
  uom: string;
}

interface Vendor {
  number: string;
  name: string;
  type: string;
  category: string;
  status: "Active" | "Inactive";
  generalData: {
    address: string;
    phone: string;
    email: string;
    taxId: string;
    currency: string;
  };
  purchasingData: {
    paymentTerms: string;
    incoterms: string;
    minimumOrder: number;
    leadTime: number;
    lastPurchase: string;
  };
  qualityData: {
    certified: boolean;
    certificates: string[];
    rating: number;
    lastAudit: string;
    nextAudit: string;
  };
  materials: VendorMaterial[];
}

interface WorkCenter {
  id: string;
  name: string;
  plant: string;
  category: string;
  capacity: {
    available: number;
    utilization: number;
    efficiency: number;
  };
  costCenter: string;
  resources: string[];
  operations: string[];
  scheduling: {
    setupTime: number;
    processingTime: number;
    teardownTime: number;
    queueTime: number;
  };
}

interface RoutingOperation {
  step: number;
  description: string;
  duration: number;
  resource: string;
}

interface Routing {
  id: string;
  material: string;
  version: string;
  validFrom: string;
  validTo: string;
  operations: RoutingOperation[];
}

interface BOMNode {
  level: number;
  item: string;
  description: string;
  quantity: number;
  uom: string;
  itemCategory?: string;
  backflush?: boolean;
  components?: BOMNode[];
}

const materials: Material[] = [
  {
    number: "FG-001",
    description: "Greek Yogurt 500g",
    type: "FERT",
    group: "Dairy Products",
    baseUOM: "EA",
    grossWeight: "0.52 KG",
    netWeight: "0.50 KG",
    status: "Active",
    plants: ["1000", "2000"],
    views: {
      basic: { created: true, createdBy: "JSMITH", date: "2025-01-15" },
      sales: { created: true, price: 4.99, taxClass: "FOOD" },
      purchasing: { created: false },
      mrp: { created: true, lotSize: 1000, safetyStock: 500 },
      warehouse: { created: true, storageType: "500", pickingArea: "COOL-01" },
      quality: { created: true, shelfLife: 21, inspectionType: "04" }
    },
    bom: {
      items: [
        { component: "RM-2847", description: "Organic Milk", quantity: 0.5, uom: "L" },
        { component: "RM-3456", description: "Culture", quantity: 0.01, uom: "KG" },
        { component: "PKG-1234", description: "Container 500g", quantity: 1, uom: "EA" }
      ]
    },
    alternates: ["FG-001-ALT1", "FG-001-ALT2"],
    changeHistory: [
      { date: "2025-11-10", user: "JDOE", change: "Updated shelf life from 14 to 21 days" },
      { date: "2025-10-15", user: "SCHEN", change: "Added alternate BOM for organic variant" }
    ]
  }
];

const vendors: Vendor[] = [
  {
    number: "V-10001",
    name: "Green Valley Farms",
    type: "Material",
    category: "Preferred",
    status: "Active",
    generalData: {
      address: "123 Farm Road, Wisconsin",
      phone: "+1-555-0123",
      email: "orders@greenvalley.com",
      taxId: "12-3456789",
      currency: "USD"
    },
    purchasingData: {
      paymentTerms: "Net 30",
      incoterms: "FOB",
      minimumOrder: 1000,
      leadTime: 3,
      lastPurchase: "2025-11-14"
    },
    qualityData: {
      certified: true,
      certificates: ["Organic", "ISO 9001", "HACCP"],
      rating: 4.8,
      lastAudit: "2025-10-01",
      nextAudit: "2026-04-01"
    },
    materials: [
      { material: "RM-2847", description: "Organic Milk", price: 2.5, uom: "L" },
      { material: "RM-1234", description: "Heavy Cream", price: 4, uom: "L" }
    ]
  }
];

const workCenters: WorkCenter[] = [
  {
    id: "WC-DAIRY-01",
    name: "Dairy Production Line 1",
    plant: "1000",
    category: "Production",
    capacity: {
      available: 8,
      utilization: 87,
      efficiency: 94
    },
    costCenter: "CC-1000",
    resources: ["Pasteurizer", "Homogenizer", "Filler", "Capper"],
    operations: ["Mixing", "Pasteurization", "Filling", "Packaging"],
    scheduling: {
      setupTime: 30,
      processingTime: 450,
      teardownTime: 30,
      queueTime: 15
    }
  }
];

const routings: Routing[] = [
  {
    id: "RT-DAIRY-001",
    material: "FG-001",
    version: "01",
    validFrom: "2025-01-01",
    validTo: "2025-12-31",
    operations: [
      { step: 10, description: "Mix Ingredients", duration: 45, resource: "WC-DAIRY-01" },
      { step: 20, description: "Pasteurize", duration: 60, resource: "WC-DAIRY-01" },
      { step: 30, description: "Fill & Package", duration: 120, resource: "WC-DAIRY-02" }
    ]
  }
];

const bomStructure = {
  parent: "FG-001",
  description: "Greek Yogurt 500g",
  quantity: 1000,
  validFrom: "2025-01-01",
  validTo: "2025-12-31",
  components: [
    {
      level: 1,
      item: "VERT-001",
      description: "Yogurt Base",
      quantity: 500,
      uom: "KG",
      components: [
        {
          level: 2,
          item: "RM-2847",
          description: "Organic Milk",
          quantity: 480,
          uom: "L",
          itemCategory: "L",
          backflush: true
        },
        {
          level: 2,
          item: "RM-3456",
          description: "Culture",
          quantity: 10,
          uom: "KG",
          itemCategory: "L",
          backflush: true
        }
      ]
    },
    {
      level: 1,
      item: "PKG-1234",
      description: "Container 500g",
      quantity: 1000,
      uom: "EA",
      itemCategory: "L",
      backflush: false
    }
  ]
};

export default function MasterDataManagement() {
  const [activeTab, setActiveTab] = useState("materials");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(materials[0]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Data Management</h1>
          <p className="text-gray-500 mt-1">Central repository for materials, vendors, and production data</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Copy className="w-4 h-4 inline mr-2" />
            Mass Change
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Create New</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm mb-6">
        <nav className="flex space-x-8 px-6">
          {[
            { id: "materials", name: "Materials", icon: Package, count: 2847 },
            { id: "vendors", name: "Vendors", icon: Users, count: 234 },
            { id: "bom", name: "Bill of Materials", icon: Layers, count: 892 },
            { id: "workcenter", name: "Work Centers", icon: Factory, count: 45 },
            { id: "routing", name: "Routings", icon: GitBranch, count: 156 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 text-sm font-medium border-b-2 transition-colors ${
                  isActive ? "text-blue-600 border-blue-600" : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
                <span className="text-xs text-gray-400">({tab.count})</span>
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === "materials" && (
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Material Master</h2>
              <button className="p-2 hover:bg-gray-100 rounded" aria-label="Search materials">
                <Search className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-2">
              {materials.map((material) => (
                <MaterialCard
                  key={material.number}
                  material={material}
                  selected={selectedMaterial?.number === material.number}
                  onClick={() => setSelectedMaterial(material)}
                />
              ))}
            </div>
          </div>

          {selectedMaterial && (
            <div className="col-span-2">
              <MaterialDetails material={selectedMaterial} />
            </div>
          )}
        </div>
      )}

      {activeTab === "bom" && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <BOMDisplay bom={bomStructure} />
        </div>
      )}

      {activeTab === "vendors" && (
        <div className="space-y-6">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.number} vendor={vendor} />
          ))}
        </div>
      )}

      {activeTab === "workcenter" && (
        <div className="space-y-4">
          {workCenters.map((center) => (
            <WorkCenterCard key={center.id} center={center} />
          ))}
        </div>
      )}

      {activeTab === "routing" && (
        <div className="space-y-4">
          {routings.map((routing) => (
            <RoutingCard key={routing.id} routing={routing} />
          ))}
        </div>
      )}
    </div>
  );
}

interface MaterialCardProps {
  material: Material;
  selected: boolean;
  onClick: () => void;
}

function MaterialCard({ material, selected, onClick }: MaterialCardProps) {
  const typeColors: Record<Material["type"], string> = {
    FERT: "bg-green-100 text-green-700",
    VERT: "bg-blue-100 text-blue-700",
    ZROH: "bg-gray-100 text-gray-700"
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{material.number}</p>
          <p className="text-sm text-gray-600">{material.description}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${typeColors[material.type]}`}>{material.type}</span>
      </div>
      <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
        <span>{material.baseUOM}</span>
        <span>•</span>
        <span>{material.group}</span>
      </div>
    </button>
  );
}

interface MaterialDetailsProps {
  material: Material;
}

function MaterialDetails({ material }: MaterialDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Material: {material.number}</h2>
          <div className="flex items-center space-x-2">
            <IconButton icon={Edit} label="Edit" />
            <IconButton icon={Copy} label="Copy" />
            <IconButton icon={History} label="History" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <InfoField label="Description" value={material.description} />
          <InfoField label="Material Type" value={material.type} />
          <InfoField label="Base Unit" value={material.baseUOM} />
          <InfoField label="Material Group" value={material.group} />
          <InfoField label="Gross Weight" value={material.grossWeight} />
          <InfoField label="Net Weight" value={material.netWeight} />
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-3">Material Views</h3>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(material.views).map(([view, data]) => (
              <div
                key={view}
                className={`p-3 border rounded-lg ${data.created ? "border-green-200 bg-green-50" : "border-gray-200"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium capitalize">{view}</span>
                  {data.created ? <CheckCircle className="w-4 h-4 text-green-500" /> : <span className="text-xs text-gray-400">Not created</span>}
                </div>
                {data.created && data.createdBy && data.date && (
                  <p className="text-xs text-gray-600">
                    By {data.createdBy} on {data.date}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Bill of Materials</h3>
        <div className="space-y-2">
          {material.bom.items.map((item) => (
            <div key={item.component} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium">{item.component}</p>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {item.quantity} {item.uom}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface BOMDisplayProps {
  bom: {
    parent: string;
    description: string;
    quantity: number;
    validFrom: string;
    validTo: string;
    components: BOMNode[];
  };
}

function BOMDisplay({ bom }: BOMDisplayProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-semibold text-gray-900">
            {bom.parent} - {bom.description}
          </h2>
          <p className="text-sm text-gray-500">
            Valid: {bom.validFrom} to {bom.validTo}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Base Quantity</p>
          <p className="text-xl font-bold">{bom.quantity} EA</p>
        </div>
      </div>

      <div className="space-y-1">{renderBOMLevel(bom.components, 0)}</div>
    </div>
  );
}

function renderBOMLevel(components: BOMNode[], level: number): JSX.Element[] {
  return components.map((component) => (
    <div key={component.item}>
      <div
        className={`flex items-center justify-between p-3 hover:bg-gray-50 rounded ${level === 0 ? "border-l-4 border-blue-500" : ""}`}
        style={{ marginLeft: `${level * 40}px` }}
      >
        <div className="flex items-center space-x-3">
          <Layers className="w-4 h-4 text-gray-400" />
          <div>
            <p className="font-medium">{component.item}</p>
            <p className="text-sm text-gray-600">{component.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm">
            {component.quantity} {component.uom}
          </span>
          {component.backflush && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Backflush</span>}
        </div>
      </div>
      {component.components && renderBOMLevel(component.components, level + 1)}
    </div>
  ));
}

interface VendorCardProps {
  vendor: Vendor;
}

function VendorCard({ vendor }: VendorCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
          <p className="text-sm text-gray-600">
            Vendor: {vendor.number} • {vendor.category}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {vendor.qualityData.certified && <Shield className="w-5 h-5 text-green-500" />}
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{vendor.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <InfoField label="Payment Terms" value={vendor.purchasingData.paymentTerms} small />
        <InfoField label="Lead Time" value={`${vendor.purchasingData.leadTime} days`} small />
        <InfoField label="Quality Rating" value={`${vendor.qualityData.rating}/5.0`} small />
      </div>

      <div className="border-t pt-4">
        <p className="text-sm font-medium text-gray-900 mb-2">Supplied Materials</p>
        <div className="grid grid-cols-2 gap-2">
          {vendor.materials.map((mat) => (
            <div key={mat.material} className="text-sm">
              <span className="font-medium">{mat.material}</span> - {mat.description}
              <span className="text-gray-500">
                {` ($${mat.price}/${mat.uom})`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IconButton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button className="p-2 hover:bg-gray-100 rounded" aria-label={label}>
      <Icon className="w-4 h-4 text-gray-500" />
    </button>
  );
}

function InfoField({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <p className={`font-medium ${small ? "text-sm" : ""}`}>{value}</p>
    </div>
  );
}

function WorkCenterCard({ center }: { center: WorkCenter }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{center.name}</h3>
          <p className="text-sm text-gray-600">
            {center.id} • Plant {center.plant}
          </p>
        </div>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{center.category}</span>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <InfoField label="Available" value={`${center.capacity.available}h`} small />
        <InfoField label="Utilization" value={`${center.capacity.utilization}%`} small />
        <InfoField label="Efficiency" value={`${center.capacity.efficiency}%`} small />
      </div>
      <div className="text-sm text-gray-600">
        <p className="font-medium text-gray-900 mb-2">Resources</p>
        <p>{center.resources.join(", ")}</p>
      </div>
    </div>
  );
}

function RoutingCard({ routing }: { routing: Routing }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">Routing {routing.id}</h3>
          <p className="text-sm text-gray-600">
            {routing.material} • Version {routing.version}
          </p>
        </div>
        <span className="text-xs text-gray-500">
          Valid {routing.validFrom} → {routing.validTo}
        </span>
      </div>
      <div className="space-y-2">
        {routing.operations.map((operation) => (
          <div key={operation.step} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium">Step {operation.step}</p>
              <p className="text-sm text-gray-600">{operation.description}</p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p>{operation.duration} mins</p>
              <p>{operation.resource}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
