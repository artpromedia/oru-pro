"use client";

import { Brain, TrendingUp, RefreshCw, Database } from "lucide-react";

interface ModelInfo {
  name: string;
  version: string;
  accuracy: number;
  lastTrained: string;
  dataPoints: number;
  status: "deployed" | "training";
  predictions: number;
  improvements: string;
}

export default function AIModelManagement() {
  const models: ModelInfo[] = [
    {
      name: "Inventory Prediction Copilot",
      version: "v2.3.1",
      accuracy: 94.5,
      lastTrained: "2025-11-15",
      dataPoints: 1_234_567,
      status: "deployed",
      predictions: 4_567,
      improvements: "+3.2% this week",
    },
    {
      name: "Quality Anomaly Detection",
      version: "v1.8.0",
      accuracy: 97.2,
      lastTrained: "2025-11-14",
      dataPoints: 890_123,
      status: "training",
      predictions: 2_345,
      improvements: "+1.8% this week",
    },
    {
      name: "Demand Forecasting",
      version: "v3.1.0",
      accuracy: 89.3,
      lastTrained: "2025-11-13",
      dataPoints: 2_345_678,
      status: "deployed",
      predictions: 8_901,
      improvements: "+5.1% this week",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Oonru AI Fabrics
          </p>
          <h1 className="text-3xl font-bold text-gray-900">AI Model Management</h1>
          <p className="text-gray-500">Train, deploy, and monitor Oonru-native models.</p>
        </div>
        <button className="inline-flex items-center rounded-lg bg-purple-500 px-4 py-2 font-medium text-white shadow-sm hover:bg-purple-600">
          <TrendingUp className="mr-2 h-4 w-4" /> Deploy New Model
        </button>
      </header>

      <section className="grid gap-6">
        {models.map((model) => (
          <AIModelCard key={model.name} model={model} />
        ))}
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Active Training Pipeline</h2>
            <p className="text-sm text-gray-500">Realtime visibility across Oonru Labs.</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Database className="mr-2 h-3.5 w-3.5" /> 4.6M records streaming
          </span>
        </div>
        <TrainingPipelineView />
      </section>
    </div>
  );
}

function AIModelCard({ model }: { model: ModelInfo }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{model.name}</h3>
            <p className="text-sm text-gray-500">Version {model.version}</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm ${
            model.status === "deployed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {model.status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <Metric label="Accuracy" value={`${model.accuracy}%`} helper={model.improvements} helperTone="success" />
        <Metric
          label="Training Data"
          value={`${(model.dataPoints / 1_000_000).toFixed(1)}M`}
          helper="data points"
        />
        <Metric
          label="Predictions Today"
          value={model.predictions.toLocaleString()}
          helper="decisions made"
        />
        <Metric label="Last Trained" value={model.lastTrained} helper="" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">View Performance</button>
        <button className="px-3 py-1 bg-white border border-gray-200 rounded text-sm hover:bg-gray-50">A/B Test</button>
        <button className="px-3 py-1 bg-white border border-gray-200 rounded text-sm hover:bg-gray-50">Rollback</button>
      </div>
    </div>
  );
}

function Metric({ label, value, helper, helperTone }: { label: string; value: string; helper: string; helperTone?: "success" }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      {helper && (
        <p className={`text-xs ${helperTone === "success" ? "text-green-600" : "text-gray-500"}`}>{helper}</p>
      )}
    </div>
  );
}

function TrainingPipelineView() {
  const pipeline = [
    { stage: "Data Collection", status: "complete", records: "2.3M records" },
    { stage: "Preprocessing", status: "complete", records: "Cleaned & normalized" },
    { stage: "Feature Engineering", status: "running", records: "Extracting 147 features" },
    { stage: "Model Training", status: "pending", records: "Waiting" },
    { stage: "Validation", status: "pending", records: "Waiting" },
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {pipeline.map((stage, index) => (
        <div key={stage.stage} className="flex items-center">
          <div className="text-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                stage.status === "complete"
                  ? "bg-green-100 text-green-600"
                  : stage.status === "running"
                  ? "bg-yellow-100 text-yellow-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {stage.status === "running" ? <RefreshCw className="w-5 h-5 animate-spin" /> : index + 1}
            </div>
            <p className="text-xs font-medium mt-2">{stage.stage}</p>
            <p className="text-xs text-gray-500">{stage.records}</p>
          </div>
          {index < pipeline.length - 1 && (
            <div className={`w-12 h-0.5 ${stage.status === "complete" ? "bg-green-500" : "bg-gray-300"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
