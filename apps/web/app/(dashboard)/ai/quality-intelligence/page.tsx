"use client";

interface InspectionRule {
  trigger: string;
  aiAction: string;
}

interface QualityRules {
  inspectionMapping: Record<string, InspectionRule>;
  smartDecisions: Record<string, string>;
}

const aiQualityRules: QualityRules = {
  inspectionMapping: {
    "01/1000": {
      trigger: "goods_receipt",
      aiAction: "Hold for COA, sample if required, predict pass/fail"
    },
    "03/3000": {
      trigger: "in_process",
      aiAction: "Real-time monitoring, auto-adjust if deviation detected"
    },
    "04/4000": {
      trigger: "production_complete",
      aiAction: "Auto-sample, predict shelf life, generate COA"
    }
  },
  smartDecisions: {
    full_acceptance: "AI releases when all parameters pass",
    conditional_release: "AI allows with restrictions and monitors",
    rejection: "AI quarantines and suggests disposition"
  }
};

export default function AIQualityIntelligence() {
  return (
    <div className="p-6">
      <AIQualityDashboard rules={aiQualityRules} />
    </div>
  );
}

function AIQualityDashboard({ rules }: { rules: QualityRules }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Inspection Intelligence</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(rules.inspectionMapping).map(([code, rule]) => (
            <div key={code} className="border border-gray-100 rounded-lg p-4">
              <p className="text-xs uppercase text-purple-500">{code}</p>
              <p className="text-sm text-gray-500">Trigger: {rule.trigger.replace("_", " ")}</p>
              <p className="text-sm text-gray-900 mt-2">{rule.aiAction}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">AI Usage Decisions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(rules.smartDecisions).map(([decision, description]) => (
            <div key={decision} className="border border-gray-100 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 capitalize">{decision.replace("_", " ")}</p>
              <p className="text-xs text-gray-600 mt-1">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
