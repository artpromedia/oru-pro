"use client";

const aiBinManagement = {
  intelligentPutaway: {
    temperature_sensitive: {
      sapBinTypes: ["500", "600"],
      aiLogic: "Find nearest appropriate temperature zone with space"
    },
    allergen_control: {
      sapBinType: "700",
      aiLogic: "Isolate and prevent cross-contamination automatically"
    },
    high_velocity: {
      aiLogic: "Place near shipping for FEFO optimization"
    }
  },
  unitManagement: {
    receiving: "AI creates SU and assigns optimal bin",
    production: "AI converts SU to HU after manufacturing",
    shipping: "AI consolidates HUs for efficient loading"
  }
};

const metrics = [
  {
    label: "Putaway Decisions",
    value: "234 today",
    optimization: "Space utilization increased 18%"
  },
  {
    label: "FEFO Compliance",
    value: "100%",
    optimization: "AI prevents expiration automatically"
  }
];

export default function AIWarehouseIntelligence() {
  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">AI Warehouse Optimization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((metric) => (
            <AIMetric key={metric.label} label={metric.label} value={metric.value} optimization={metric.optimization} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h4 className="font-semibold text-gray-900 mb-3">Intelligent Putaway</h4>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(aiBinManagement.intelligentPutaway).map(([key, data]) => (
            <div key={key} className="border border-gray-100 rounded-lg p-4">
              <p className="text-xs uppercase text-purple-500">{key.replace("_", " ")}</p>
              {"sapBinTypes" in data && data.sapBinTypes && (
                <p className="text-xs text-gray-500">SAP Types: {data.sapBinTypes.join(", ")}</p>
              )}
              {"sapBinType" in data && data.sapBinType && <p className="text-xs text-gray-500">SAP Type: {data.sapBinType}</p>}
              <p className="text-sm text-gray-700 mt-2">{data.aiLogic}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h4 className="font-semibold text-gray-900 mb-3">Handling Units & Shipping Units</h4>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(aiBinManagement.unitManagement).map(([phase, description]) => (
            <div key={phase} className="border border-gray-100 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 capitalize">{phase}</p>
              <p className="text-xs text-gray-600 mt-1">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIMetric({ label, value, optimization }: { label: string; value: string; optimization: string }) {
  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <p className="text-xs uppercase text-gray-400">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-2">{value}</p>
      <p className="text-xs text-green-600 mt-1">{optimization}</p>
    </div>
  );
}
