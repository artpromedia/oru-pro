"use client";

import { useState } from "react";
import { Brain, Search, Loader2 } from "lucide-react";

interface AISearchProps {
  placeholder?: string;
  onQuery?: (query: string) => Promise<void> | void;
}

export default function AISearch({ placeholder = "Ask anything: 'Show me overdue deliveries' or 'What needs my attention?'", onQuery }: AISearchProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const runQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      if (onQuery) {
        await onQuery(query);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Brain className="absolute left-3 top-2.5 w-4 h-4 text-purple-500" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && runQuery()}
        placeholder={placeholder}
        className="w-full px-4 py-2 pl-10 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
      />
      <button
        onClick={runQuery}
        className="absolute right-2 top-1.5 px-3 py-1 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center space-x-1"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        <span className="hidden sm:inline">Ask</span>
      </button>
    </div>
  );
}
