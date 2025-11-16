"use client";

interface FlowComparison {
  sapFlow: string[];
  aiFlow: string;
  sapManual?: string;
  aiAutomatic?: string;
}

const reimaginedFlows: Record<string, FlowComparison> = {
  receiving: {
    sapFlow: ["Create PO", "Receive goods", "Print labels", "Quality hold", "COA upload", "Inspection", "Usage decision", "Release"],
    aiFlow: "Tell AI: 'Milk delivery arrived' - Everything happens automatically"
  },
  production: {
    sapFlow: ["Release order", "Print paperwork", "Pull materials", "BTB transfer", "Confirm production", "Quality inspection", "TECO"],
    aiFlow: "AI orchestrates based on schedule, operators just produce"
  },
  scaling: {
    sapFlow: ["Multiple BTB transfers", "Label printing", "Bin assignments"],
    aiFlow: "AI tracks via sensors, auto-prints labels, assigns bins",
    sapManual: "Multiple BTB transfers, label printing, bin assignments",
    aiAutomatic: "AI tracks via sensors, auto-prints labels, assigns bins"
  }
};

export default function AIWorkflowAutomation() {
  return <WorkflowComparisonView flows={reimaginedFlows} />;
}

function WorkflowComparisonView({ flows }: { flows: Record<string, FlowComparison> }) {
  return (
    <div className="p-6 space-y-6">
      {Object.entries(flows).map(([flowName, data]) => (
        <div key={flowName} className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 capitalize">{flowName}</h3>
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div>
              <p className="text-xs uppercase text-gray-400">Traditional SAP Flow</p>
              <ol className="mt-2 space-y-1 text-sm text-gray-700 list-decimal list-inside">
                {data.sapFlow.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
            <div>
              <p className="text-xs uppercase text-purple-500">AI-Native Flow</p>
              <p className="mt-2 text-sm text-gray-800">{data.aiFlow}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
