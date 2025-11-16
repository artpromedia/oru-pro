"use client";

import { TrendingUp, Shield, Package } from "lucide-react";

interface PredictionCardProps {
  title: string;
  prediction: string;
  confidence: number;
  recommendation: string;
  impact: string;
}

const cards: PredictionCardProps[] = [
  {
    title: "Stockout Risk",
    prediction: "3 materials at risk by Monday",
    confidence: 92,
    recommendation: "Create POs for RM-2847, PKG-1234, RM-3456",
    impact: "Prevent production delays"
  },
  {
    title: "Demand Forecast",
    prediction: "28% increase expected next week",
    confidence: 87,
    recommendation: "Increase production capacity Tuesday",
    impact: "Meet customer demand"
  },
  {
    title: "Quality Alert",
    prediction: "Temperature trending up in Cooler 3",
    confidence: 95,
    recommendation: "Schedule maintenance within 24 hours",
    impact: "Prevent product loss"
  }
];

export default function AIPredictions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <PredictionCard key={card.title} {...card} />
      ))}
    </div>
  );
}

function PredictionCard({ title, prediction, confidence, recommendation, impact }: PredictionCardProps) {
  const iconMap: Record<string, JSX.Element> = {
    "Stockout Risk": <Package className="w-5 h-5 text-orange-500" />,
    "Demand Forecast": <TrendingUp className="w-5 h-5 text-blue-500" />,
    "Quality Alert": <Shield className="w-5 h-5 text-red-500" />
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-gray-400">AI Prediction</p>
          <h4 className="font-semibold text-gray-900">{title}</h4>
        </div>
        {iconMap[title]}
      </div>
      <p className="text-sm text-gray-700">{prediction}</p>
      <div className="text-xs text-gray-500">Confidence: <span className="font-semibold text-gray-900">{confidence}%</span></div>
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <p className="font-medium text-gray-900">Recommended Action</p>
        <p className="text-gray-600">{recommendation}</p>
      </div>
      <p className="text-xs text-green-600">Impact: {impact}</p>
    </div>
  );
}
