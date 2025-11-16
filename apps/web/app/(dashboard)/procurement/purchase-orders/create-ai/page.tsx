"use client";

import { useState } from "react";
import { Brain, Sparkles, CheckCircle, Loader2 } from "lucide-react";

interface AISuggestion {
  vendor: string;
  material: string;
  quantity: number;
  deliveryDate: string;
  price: number;
  shippingPoint: string;
  confidence: number;
  reasoning: string;
}

export default function AIPurchaseOrderCreation() {
  const [context, setContext] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleContextInput = async (input: string) => {
    setContext(input);
    setIsProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 600));

    if (input.toLowerCase().includes("urgent") || input.toLowerCase().includes("milk")) {
      setAiSuggestions({
        vendor: "Green Valley Farms",
        material: "RM-2847 - Organic Milk",
        quantity: 5000,
        deliveryDate: "2025-11-18",
        price: 12500,
        shippingPoint: "CHI-01",
        confidence: 94,
        reasoning:
          "Based on current stock levels (500L) and daily consumption (450L), you'll need 5000L by Monday. Green Valley Farms has the best lead time for urgent orders."
      });
      setAutoFilled(true);
    } else {
      setAiSuggestions(null);
      setAutoFilled(false);
    }

    setIsProcessing(false);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Brain className="w-6 h-6 text-purple-600 mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-900">AI Purchase Order Assistant</h2>
                {isProcessing && <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />}
              </div>
              <textarea
                value={context}
                onChange={(e) => handleContextInput(e.target.value)}
                placeholder="Describe what you need (e.g., 'We're running low on organic milk and need urgent delivery for Monday's production run')"
                className="w-full p-3 border border-purple-200 rounded-lg"
                rows={3}
              />
            </div>
          </div>
        </div>

        {aiSuggestions && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-6 h-6 text-green-600 mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">AI Auto-filled Order (Confidence: {aiSuggestions.confidence}%)</h3>
                  {autoFilled && (
                    <span className="flex items-center text-xs text-green-700">
                      <CheckCircle className="w-4 h-4 mr-1" /> Auto-filled
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">{aiSuggestions.reasoning}</p>

                <div className="grid grid-cols-2 gap-4">
                  <AIField label="Vendor (AI Selected)" value={aiSuggestions.vendor} />
                  <AIField label="Material" value={aiSuggestions.material} />
                  <AIField label="Quantity (AI Calculated)" value={`${aiSuggestions.quantity.toLocaleString()} L`} />
                  <AIField label="Target Delivery" value={aiSuggestions.deliveryDate} />
                  <AIField label="Expected Price" value={`$${aiSuggestions.price.toLocaleString()}`} />
                  <AIField label="Ship From" value={aiSuggestions.shippingPoint} />
                </div>

                <div className="flex space-x-3 mt-4">
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Approve & Create PO</button>
                  <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Modify Suggestions</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AIField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <input value={value} readOnly className="w-full p-2 border rounded bg-white" />
    </div>
  );
}
