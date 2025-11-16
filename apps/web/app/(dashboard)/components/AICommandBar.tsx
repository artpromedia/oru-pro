"use client";

import { useState, useMemo } from "react";
import { Sparkles, Mic, Send, Loader, History, Wand2 } from "lucide-react";

interface AICommandBarProps {
  onSubmit?: (command: string) => Promise<void> | void;
  anchored?: boolean;
}

const aiCommands = [
  "Create a purchase order for 5000L organic milk from Green Valley Farms",
  "Show me inventory levels below reorder point",
  "Schedule production of Greek Yogurt for next week",
  "What's the status of delivery DEL-2025-1847?",
  "Run MRP for all materials with 30-day horizon",
  "Compare stock levels across all warehouses",
  "Initiate cycle count for warehouse zone A"
];

export default function AICommandBar({ onSubmit, anchored = true }: AICommandBarProps) {
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const filteredSuggestions = useMemo(() => {
    if (!command) {
      return aiCommands.slice(0, 4);
    }
    return aiCommands.filter((cmd) => cmd.toLowerCase().includes(command.toLowerCase())).slice(0, 4);
  }, [command]);

  const handleAICommand = async () => {
    if (!command.trim()) return;
    setIsProcessing(true);
    setHistory((prev) => [command, ...prev].slice(0, 5));

    try {
      if (onSubmit) {
        await onSubmit(command);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    } finally {
      setIsProcessing(false);
      setCommand("");
    }
  };

  return (
    <div className={`${anchored ? "fixed bottom-6 left-1/2 -translate-x-1/2" : ""} w-full max-w-3xl px-6 z-40`}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Tell Oonru what you need... (e.g., 'Create PO for urgent milk delivery')"
            className="flex-1 outline-none text-gray-700"
            onKeyDown={(e) => e.key === "Enter" && handleAICommand()}
            aria-label="AI command input"
          />
          <button className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Start voice input">
            <Mic className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={handleAICommand}
            className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            aria-label="Submit AI command"
          >
            {isProcessing ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setCommand(suggestion)}
              className="px-3 py-1 text-xs bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100"
            >
              <Wand2 className="w-3 h-3 inline mr-1 text-purple-500" />
              {suggestion}
            </button>
          ))}
        </div>

        {history.length > 0 && (
          <div className="border-t pt-3 text-sm text-gray-500 space-y-1">
            <div className="flex items-center text-xs uppercase tracking-wide text-gray-400">
              <History className="w-3 h-3 mr-1" /> Recent
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map((item) => (
                <button
                  key={item}
                  onClick={() => setCommand(item)}
                  className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-full hover:bg-gray-50"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
