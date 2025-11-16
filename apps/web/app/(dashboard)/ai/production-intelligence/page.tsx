"use client";

interface ProductionLogic {
  orderTypeIntelligence: Record<string, string>;
  autoConfirmation: Record<string, string>;
}

const aiProductionLogic: ProductionLogic = {
  orderTypeIntelligence: {
    ZP01: "AI recognizes standard production",
    ZR01: "AI identifies rework and adjusts yields",
    ZC01: "AI blocks production time for cleaning",
    ZT01: "AI flags R&D trials and isolates data"
  },
  autoConfirmation: {
    backflush: "AI confirms consumption based on sensors",
    yield: "AI calculates actual vs theoretical",
    quality: "AI triggers inspections automatically",
    teco: "AI completes order when criteria met"
  }
};

export default function AIProductionIntelligence() {
  return <ProductionAIPanel logic={aiProductionLogic} />;
}

function ProductionAIPanel({ logic }: { logic: ProductionLogic }) {
  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Order Type Intelligence</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(logic.orderTypeIntelligence).map(([orderType, description]) => (
            <div key={orderType} className="border border-gray-100 rounded-lg p-4">
              <p className="text-xs uppercase text-purple-500">{orderType}</p>
              <p className="text-sm text-gray-700 mt-1">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Auto Confirmation</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(logic.autoConfirmation).map(([step, details]) => (
            <div key={step} className="border border-gray-100 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 capitalize">{step}</p>
              <p className="text-xs text-gray-600 mt-1">{details}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
