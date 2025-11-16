"use client";

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { Package, Brain, Check } from "lucide-react";

import { TenantOnboardingData } from "../types";

interface ModuleSelectionProps {
  data: TenantOnboardingData;
  setData: Dispatch<SetStateAction<TenantOnboardingData>>;
}

const moduleCatalog = [
  { id: "inventory", name: "Inventory Management", category: "core", description: "Track stock across locations" },
  { id: "procurement", name: "Procurement", category: "core", description: "Purchase orders and vendors" },
  { id: "sales", name: "Sales & CRM", category: "core", description: "Orders and customer management" },
  { id: "finance", name: "Finance & Accounting", category: "core", description: "GL, AP, AR, and reporting" },
  { id: "pos", name: "Point of Sale", category: "core", description: "Omnichannel POS orchestration" },
  { id: "ecommerce", name: "Commerce Hub", category: "core", description: "Digital storefront and order capture" },
  { id: "customer", name: "Customer 360", category: "core", description: "Account, loyalty, and experience management" },
  { id: "production", name: "Production Planning", category: "production", description: "Manufacturing and scheduling" },
  { id: "quality", name: "Quality Management", category: "production", description: "Inspections and compliance" },
  { id: "maintenance", name: "Asset Maintenance", category: "production", description: "Equipment and preventive care" },
  { id: "warehouse", name: "Warehouse Management", category: "specialized", description: "Bin locations and picking" },
  { id: "transport", name: "Transportation", category: "specialized", description: "Fleet and delivery management" },
  { id: "routing", name: "Routing Optimization", category: "specialized", description: "Optimize multi-stop routes" },
  { id: "tracking", name: "In-Transit Tracking", category: "specialized", description: "IoT visibility for shipments" },
  { id: "customs", name: "Customs & Compliance", category: "specialized", description: "Global trade automation" },
  { id: "regulatory", name: "Regulatory Compliance", category: "specialized", description: "FDA, GxP, audit trails" },
  { id: "batch", name: "Batch & Traceability", category: "specialized", description: "Lot tracking and genealogy" },
  { id: "traceability", name: "Traceability Hub", category: "specialized", description: "Ingredient genealogy and recalls" },
  { id: "clinical", name: "Clinical Operations", category: "specialized", description: "Trial and study orchestration" },
  { id: "patient", name: "Patient Command", category: "specialized", description: "Care orchestration and outreach" },
  { id: "billing", name: "Billing & Revenue", category: "core", description: "Charge capture and reimbursements" },
  { id: "pharmacy", name: "Pharmacy Logistics", category: "specialized", description: "Dispensing and inventory controls" },
  { id: "scheduling", name: "Smart Scheduling", category: "specialized", description: "Staffing and appointment optimization" },
  { id: "analytics", name: "Advanced Analytics", category: "advanced", description: "AI-powered insights" },
  { id: "planning", name: "Demand Planning", category: "advanced", description: "Forecasting and MRP" },
  { id: "pricing", name: "Pricing Optimization", category: "advanced", description: "AI-driven dynamic pricing" },
  { id: "integration", name: "Integration Hub", category: "advanced", description: "Connect external systems" },
];

const categoryOrder = ["core", "production", "specialized", "advanced"] as const;

const industryRecommendations: Record<string, string[]> = {
  manufacturing: ["inventory", "production", "quality", "procurement", "maintenance"],
  food: ["inventory", "production", "quality", "traceability", "regulatory"],
  pharma: ["inventory", "quality", "regulatory", "clinical", "batch"],
  retail: ["inventory", "pos", "ecommerce", "pricing", "customer"],
  healthcare: ["patient", "clinical", "billing", "pharmacy", "scheduling"],
  logistics: ["warehouse", "transport", "routing", "tracking", "customs"],
};

export function ModuleSelectionStep({ data, setData }: ModuleSelectionProps) {
  const recommended = useMemo(() => industryRecommendations[data.industry] || [], [data.industry]);
  const [selectedModules, setSelectedModules] = useState<string[]>(recommended);

  useEffect(() => {
    setSelectedModules(recommended);
    setData((prev) => ({ ...prev, modules: recommended }));
  }, [recommended, setData]);

  const toggleModule = (moduleId: string) => {
    setSelectedModules((prev) => {
      const exists = prev.includes(moduleId);
      const updated = exists ? prev.filter((m) => m !== moduleId) : [...prev, moduleId];
      setData((prevData) => ({ ...prevData, modules: updated }));
      return updated;
    });
  };

  const modulesByCategory = useMemo(() => {
    return categoryOrder.map((category) => ({
      category,
      modules: moduleCatalog.filter((module) => module.category === category),
    }));
  }, []);

  const estimatedMonthly = selectedModules.length * 499;

  return (
    <div>
      <div className="text-center mb-8">
        <Package className="w-16 h-16 text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Select Your Modules</h2>
        <p className="text-gray-600 mt-2">AI has recommended modules based on your industry</p>
      </div>

      {recommended.length > 0 && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Brain className="w-5 h-5 text-purple-600 mt-1" />
            <div>
              <p className="font-medium text-purple-900">AI Recommendations</p>
              <p className="text-sm text-purple-700 mt-1">
                Based on your {data.industry || "selected"} operations, we recommend these modules for optimal performance
              </p>
            </div>
          </div>
        </div>
      )}

      {modulesByCategory.map(({ category, modules }) => (
        <div key={category} className="mb-8">
          <h3 className="text-sm font-medium text-gray-700 uppercase mb-3">{category} Modules</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {modules.map((module) => {
              const isSelected = selectedModules.includes(module.id);
              const isRecommended = recommended.includes(module.id);
              return (
                <button
                  key={module.id}
                  onClick={() => toggleModule(module.id)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    isSelected ? "border-purple-500 bg-purple-50" : "border-gray-300 hover:border-gray-400"
                  }`}
                  type="button"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{module.name}</p>
                      <p className="text-xs text-gray-600 mt-1">{module.description}</p>
                    </div>
                    <div className="ml-3 text-right">
                      {isSelected && <Check className="w-5 h-5 text-purple-600" />}
                      {isRecommended && !isSelected && (
                        <span className="text-xs text-purple-600">Recommended</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-medium">Selected Modules: {selectedModules.length}</p>
            <p className="text-sm text-gray-600">Each module includes dedicated AI models</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Estimated monthly</p>
            <p className="text-2xl font-bold text-gray-900">${estimatedMonthly.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
