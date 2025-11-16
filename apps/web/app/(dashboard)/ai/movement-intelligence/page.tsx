"use client";

interface MovementRule {
  pattern: string;
  sapEquivalent: string;
  aiAction: string;
}

interface MovementIntelligenceConfig {
  rules: Record<string, MovementRule>;
  stockCategories: Record<string, string>;
}

const aiMovementLogic: MovementIntelligenceConfig = {
  rules: {
    receiving: {
      pattern: "incoming + purchase_order",
      sapEquivalent: "101",
      aiAction: "Auto-receive and quality hold"
    },
    production_consumption: {
      pattern: "production + backflush",
      sapEquivalent: "261",
      aiAction: "Auto-consume based on BOM"
    },
    quality_release: {
      pattern: "inspection_passed + release",
      sapEquivalent: "321",
      aiAction: "Auto-release from QI to unrestricted"
    }
  },
  stockCategories: {
    unrestricted: "AI determines automatically available",
    quality_inspection: "AI holds pending COA upload",
    blocked: "AI flags based on rules"
  }
};

const aiExamples = [
  { text: "Receive milk delivery", result: "AI applies GR, quality hold, COA request" },
  { text: "Use materials for production", result: "AI backflushes based on recipe" },
  { text: "Transfer to Milwaukee", result: "AI creates STO with proper accounting" }
];

export default function AIMovementIntelligence() {
  return (
    <div className="p-6 space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-2 text-purple-900">AI Movement Intelligence</h2>
        <p className="text-sm text-gray-600">
          No need to remember movement types. Describe the intent and the AI agent applies the correct SAP logic.
        </p>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          {Object.entries(aiMovementLogic.rules).map(([key, rule]) => (
            <RuleCard key={key} title={key.replace("_", " ")} rule={rule} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Stock Categories (AI Managed)</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(aiMovementLogic.stockCategories).map(([category, description]) => (
            <div key={category} className="border border-gray-100 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 capitalize">{category.replace("_", " ")}</p>
              <p className="text-xs text-gray-600 mt-2">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
  <h3 className="font-semibold text-gray-900 mb-3">Tell Oonru what you need</h3>
        <div className="space-y-3">
          {aiExamples.map((example) => (
            <AIExample key={example.text} text={example.text} result={example.result} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RuleCard({ title, rule }: { title: string; rule: MovementRule }) {
  return (
    <div className="bg-white border border-purple-100 rounded-lg p-4 shadow-sm">
      <p className="text-xs uppercase text-purple-500">{rule.sapEquivalent}</p>
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <p className="text-xs text-gray-500 mt-2">Pattern: {rule.pattern}</p>
      <p className="text-sm text-gray-700 mt-3">{rule.aiAction}</p>
    </div>
  );
}

function AIExample({ text, result }: { text: string; result: string }) {
  return (
    <div className="flex items-start justify-between border border-gray-100 rounded-lg p-4">
      <div>
        <p className="text-sm font-medium text-gray-900">“{text}”</p>
        <p className="text-xs text-gray-500">User intent</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-purple-700">{result}</p>
        <p className="text-xs text-gray-400">AI action</p>
      </div>
    </div>
  );
}
