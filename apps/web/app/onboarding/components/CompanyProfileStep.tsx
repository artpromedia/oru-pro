"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Building2, Users, Factory, Coffee, Pill, ShoppingCart, Heart, Truck } from "lucide-react";

import { TenantLocation, TenantOnboardingData } from "../types";

interface StepProps {
  data: TenantOnboardingData;
  setData: Dispatch<SetStateAction<TenantOnboardingData>>;
}

export function CompanyProfileStep({ data, setData }: StepProps) {
  const sizeOptions = ["1-50", "51-200", "201-1000", "1000+"];
  const revenueOptions = ["<1M", "1-10M", "10-50M", "50-100M", "100M+"];

  return (
    <div>
      <div className="text-center mb-8">
        <Building2 className="w-16 h-16 text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Tell us about your company</h2>
        <p className="text-gray-600 mt-2">This helps Oru's AI create your personalized instance</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
          <input
            type="text"
            value={data.company}
            onChange={(e) => setData((prev) => ({ ...prev, company: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="Enter your company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sizeOptions.map((size) => (
              <button
                key={size}
                onClick={() => setData((prev) => ({ ...prev, size }))}
                className={`p-3 border rounded-lg transition-all ${
                  data.size === size ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-300 hover:border-gray-400"
                }`}
                type="button"
              >
                <Users className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">{size}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Annual Revenue</label>
          <select
            value={data.revenue}
            onChange={(e) => setData((prev) => ({ ...prev, revenue: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          >
            <option value="">Select revenue range</option>
            {revenueOptions.map((option) => (
              <option key={option} value={option}>
                {option === "<1M" ? "Less than $1M" : option === "100M+" ? "$100M+" : `$${option} USD`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export function IndustryOperationsStep({ data, setData }: StepProps) {
  const industries = [
    { id: "manufacturing", name: "Manufacturing", icon: Factory, aiModels: ["production", "quality", "supply"] },
    { id: "food", name: "Food & Beverage", icon: Coffee, aiModels: ["freshness", "compliance", "traceability"] },
    { id: "pharma", name: "Pharmaceutical", icon: Pill, aiModels: ["gxp", "clinical", "regulatory"] },
    { id: "retail", name: "Retail", icon: ShoppingCart, aiModels: ["demand", "pricing", "inventory"] },
    { id: "healthcare", name: "Healthcare", icon: Heart, aiModels: ["patient", "clinical", "billing"] },
    { id: "logistics", name: "Logistics", icon: Truck, aiModels: ["routing", "warehouse", "delivery"] },
  ];

  const defaultLocations: TenantLocation[] = [{ type: "headquarters", name: "", address: "" }];
  const [locations, setLocations] = useState<TenantLocation[]>(data.locations.length ? data.locations : defaultLocations);

  useEffect(() => {
    if (!data.locations.length) {
      setData((prev) => ({ ...prev, locations: defaultLocations }));
    }
  }, [data.locations.length, setData]);

  const handleLocationChange = (index: number, updated: TenantLocation) => {
    const newLocations = [...locations];
    newLocations[index] = updated;
    setLocations(newLocations);
    setData((prev) => ({ ...prev, locations: newLocations }));
  };

  const addLocation = () => {
    const newLocations = [...locations, { type: "", name: "", address: "" }];
    setLocations(newLocations);
    setData((prev) => ({ ...prev, locations: newLocations }));
  };

  return (
    <div>
      <div className="text-center mb-8">
        <Factory className="w-16 h-16 text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Industry &amp; Operations</h2>
        <p className="text-gray-600 mt-2">We'll pre-configure AI models for your industry</p>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">Select Your Primary Industry</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {industries.map((industry) => {
            const Icon = industry.icon;
            const isActive = data.industry === industry.id;
            return (
              <button
                key={industry.id}
                onClick={() =>
                  setData((prev) => ({
                    ...prev,
                    industry: industry.id,
                    industryModels: industry.aiModels,
                  }))
                }
                className={`p-4 border rounded-lg transition-all text-left ${
                  isActive ? "border-purple-500 bg-purple-50" : "border-gray-300 hover:border-gray-400"
                }`}
                type="button"
              >
                <Icon className="w-8 h-8 mb-2 text-gray-600" />
                <p className="font-medium text-sm">{industry.name}</p>
                {isActive && (
                  <div className="mt-2 space-y-1">
                    {industry.aiModels.map((model) => (
                      <span key={model} className="block text-xs text-purple-600">
                        • {model} AI
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Business Locations</label>
        <div className="space-y-3">
          {locations.map((location, index) => (
            <LocationInput key={index} location={location} onChange={(updated) => handleLocationChange(index, updated)} />
          ))}
        </div>
        <button onClick={addLocation} className="mt-3 text-sm text-purple-600 hover:text-purple-700" type="button">
          + Add Location
        </button>
      </div>
    </div>
  );
}

interface LocationInputProps {
  location: TenantLocation;
  onChange: (location: TenantLocation) => void;
}

function LocationInput({ location, onChange }: LocationInputProps) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg grid gap-3 md:grid-cols-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
        <input
          type="text"
          value={location.type}
          onChange={(e) => onChange({ ...location, type: e.target.value })}
          placeholder="Headquarters"
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
        <input
          type="text"
          value={location.name}
          onChange={(e) => onChange({ ...location, name: e.target.value })}
          placeholder="Chicago Plant"
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
        <input
          type="text"
          value={location.address}
          onChange={(e) => onChange({ ...location, address: e.target.value })}
          placeholder="123 Industrial Way"
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
    </div>
  );
}
