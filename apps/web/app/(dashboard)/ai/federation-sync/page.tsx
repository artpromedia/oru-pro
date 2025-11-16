"use client";

interface FederationLogic {
  multiEntity: {
    plantMapping: Record<string, { system: string; ai: string }>;
    intercompany: {
      posting: string;
      reconciliation: string;
      consolidation: string;
    };
  };
  stockSync: {
    internal: string;
    thirdParty: string;
    blockchain: string;
  };
}

const federationLogic: FederationLogic = {
  multiEntity: {
    plantMapping: {
  "1000": { system: "Chicago-Oonru", ai: "Auto-route based on geography" },
  "2000": { system: "Milwaukee-Oonru", ai: "Federated but synchronized" }
    },
    intercompany: {
      posting: "AI handles transfer pricing automatically",
      reconciliation: "AI reconciles across federated nodes",
      consolidation: "AI aggregates for reporting"
    }
  },
  stockSync: {
  internal: "Real-time sync across Oonru nodes",
    thirdParty: "AI reconciles with 3PL WMS systems",
    blockchain: "Immutable record across federation"
  }
};

export default function AIFederationSync() {
  return <FederationDashboard logic={federationLogic} />;
}

function FederationDashboard({ logic }: { logic: FederationLogic }) {
  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Plant & Company Mapping</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(logic.multiEntity.plantMapping).map(([plant, info]) => (
            <div key={plant} className="border border-gray-100 rounded-lg p-4">
              <p className="text-xs uppercase text-gray-400">Plant {plant}</p>
              <p className="text-sm font-semibold text-gray-900">{info.system}</p>
              <p className="text-xs text-purple-600 mt-1">{info.ai}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Intercompany Automation</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(logic.multiEntity.intercompany).map(([key, value]) => (
            <div key={key} className="border border-gray-100 rounded-lg p-4">
              <p className="text-xs uppercase text-gray-400">{key}</p>
              <p className="text-sm text-gray-700 mt-1">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Stock Synchronization</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(logic.stockSync).map(([key, description]) => (
            <div key={key} className="border border-gray-100 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 capitalize">{key}</p>
              <p className="text-xs text-gray-600 mt-1">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
