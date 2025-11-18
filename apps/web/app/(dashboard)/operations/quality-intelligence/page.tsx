"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Brain,
  Camera,
  CheckCircle,
  Download,
  FileCheck,
  History,
  Microscope,
  Shield,
  Target,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";

const QualityTrendChart = dynamic(() => import("@/components/charts/QualityTrend"), { ssr: false });
const DefectHeatmap = dynamic(() => import("@/components/charts/DefectHeatmap"), { ssr: false });
const SixSigmaChart = dynamic(() => import("@/components/charts/SixSigma"), { ssr: false });

interface QualityInspection {
  id: string;
  batchNumber: string;
  product: string;
  inspectionType: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  aiScore: number;
  humanScore?: number;
  deviations: number;
  criticalDefects: number;
  imageAnalysis?: {
    defectsDetected: number;
    confidence: number;
    imageUrl: string;
  };
}

type DashboardTab = "inspections" | "analytics" | "compliance" | "training";
type AIMode = "assisted" | "autonomous";

type CardColor = "green" | "blue" | "red" | "orange" | "yellow" | "purple";

type InspectionStatus = QualityInspection["status"];

const qualityMetrics = {
  overallQuality: 98.7,
  sixSigmaLevel: 4.2,
  defectRate: 0.13,
  firstPassYield: 97.8,
  customerComplaints: 2,
  inspectionBacklog: 12,
  aiAccuracy: 96.5,
  costOfQuality: 125_000,
};

const pendingInspections: QualityInspection[] = [
  {
    id: "QI-001",
    batchNumber: "BAT-20241118-001",
    product: "Premium Cookies",
    inspectionType: "Final Product",
    status: "pending",
    aiScore: 0,
    deviations: 0,
    criticalDefects: 0,
  },
  {
    id: "QI-002",
    batchNumber: "BAT-20241118-002",
    product: "Organic Flour",
    inspectionType: "Receiving",
    status: "in_progress",
    aiScore: 94,
    deviations: 1,
    criticalDefects: 0,
    imageAnalysis: {
      defectsDetected: 1,
      confidence: 92,
      imageUrl: "/sample-inspection.jpg",
    },
  },
];

const cardColors: Record<CardColor, { container: string; icon: string }> = {
  green: { container: "bg-emerald-100", icon: "text-emerald-600" },
  blue: { container: "bg-blue-100", icon: "text-blue-600" },
  red: { container: "bg-rose-100", icon: "text-rose-600" },
  orange: { container: "bg-orange-100", icon: "text-orange-600" },
  yellow: { container: "bg-amber-100", icon: "text-amber-600" },
  purple: { container: "bg-purple-100", icon: "text-purple-600" },
};

const statusTokens: Record<InspectionStatus, { badge: string }> = {
  pending: { badge: "bg-gray-100 text-gray-700" },
  in_progress: { badge: "bg-blue-100 text-blue-700" },
  completed: { badge: "bg-emerald-100 text-emerald-700" },
  failed: { badge: "bg-rose-100 text-rose-700" },
};

function getTrendColor(trend: string) {
  if (trend.startsWith("+") || trend.startsWith("-$")) return "text-emerald-600";
  if (trend.startsWith("-")) return "text-rose-600";
  return "text-slate-500";
}

export default function QualityIntelligenceDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("inspections");
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);
  const [aiMode, setAIMode] = useState<AIMode>("assisted");
  const [isProcessing, setIsProcessing] = useState(false);

  const performAIInspection = async (inspection: QualityInspection) => {
    setIsProcessing(true);
    setSelectedInspection(inspection);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const aiResult: QualityInspection = {
      ...inspection,
      status: "completed",
      aiScore: 95 + Math.random() * 5,
      deviations: Math.floor(Math.random() * 3),
      criticalDefects: Math.random() > 0.9 ? 1 : 0,
      imageAnalysis: {
        defectsDetected: Math.floor(Math.random() * 5),
        confidence: 85 + Math.random() * 15,
        imageUrl: "/ai-analysis.jpg",
      },
    };

    setSelectedInspection(aiResult);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <header className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
              <Shield className="h-8 w-8 text-blue-600" /> Quality Intelligence Center
            </h1>
            <p className="mt-2 text-gray-500">AI-powered quality management with predictive defect prevention</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm">
              <Brain className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-xs text-gray-500">AI Mode</p>
                <select
                  value={aiMode}
                  onChange={(event) => setAIMode(event.target.value as AIMode)}
                  className="bg-transparent text-sm font-semibold text-gray-900 focus:outline-none"
                >
                  <option value="assisted">Assisted</option>
                  <option value="autonomous">Autonomous</option>
                </select>
              </div>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Camera className="h-4 w-4" /> Image Inspection
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Download className="h-4 w-4" /> Export COA
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700">
              <FileCheck className="h-4 w-4" /> Batch Release
            </button>
          </div>
        </div>
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-4 lg:grid-cols-8">
        <QualityMetricCard icon={Target} label="Overall Quality" value={`${qualityMetrics.overallQuality}%`} trend="+0.5%" color="green" />
        <QualityMetricCard icon={Activity} label="Six Sigma" value={`${qualityMetrics.sixSigmaLevel}σ`} trend="Stable" color="blue" />
        <QualityMetricCard icon={XCircle} label="Defect Rate" value={`${qualityMetrics.defectRate}%`} trend="-0.02%" color="red" />
        <QualityMetricCard icon={CheckCircle} label="First Pass Yield" value={`${qualityMetrics.firstPassYield}%`} trend="+1.2%" color="green" />
        <QualityMetricCard icon={AlertTriangle} label="Complaints" value={qualityMetrics.customerComplaints.toString()} trend="-1" color="orange" />
        <QualityMetricCard icon={History} label="Backlog" value={qualityMetrics.inspectionBacklog.toString()} trend="3 urgent" color="yellow" />
        <QualityMetricCard icon={Brain} label="AI Accuracy" value={`${qualityMetrics.aiAccuracy}%`} trend="+2.3%" color="purple" />
        <QualityMetricCard icon={TrendingUp} label="CoQ" value={`$${(qualityMetrics.costOfQuality / 1000).toFixed(0)}K`} trend="-$15K" color="green" />
      </section>

      <div className="mb-6 flex flex-wrap gap-2">
        {["inspections", "analytics", "compliance", "training"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as DashboardTab)}
            className={`rounded-lg px-4 py-2 capitalize transition-colors ${
              activeTab === tab ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "inspections" && (
          <motion.div
            key="inspections"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-6 lg:grid-cols-12"
          >
            <div className="lg:col-span-4 rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Inspection Queue</h2>
                <span className="rounded-full bg-rose-100 px-2 py-1 text-sm text-rose-700">{qualityMetrics.inspectionBacklog} pending</span>
              </div>
              <div className="space-y-3">
                {pendingInspections.map((inspection) => (
                  <InspectionCard
                    key={inspection.id}
                    inspection={inspection}
                    onSelect={() => performAIInspection(inspection)}
                    isSelected={selectedInspection?.id === inspection.id}
                  />
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 rounded-xl bg-white p-6 shadow-sm">
              {selectedInspection ? (
                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">AI Inspection Analysis</h2>
                    {isProcessing && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600" />
                        <span className="text-sm">AI Processing...</span>
                      </div>
                    )}
                  </div>
                  <div className="mb-6 grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="mb-3 text-sm font-medium text-gray-500">Batch Information</h3>
                      <InfoRow label="Batch Number" value={selectedInspection.batchNumber} />
                      <InfoRow label="Product" value={selectedInspection.product} />
                      <InfoRow label="Type" value={selectedInspection.inspectionType} />
                    </div>
                    <div>
                      <h3 className="mb-3 text-sm font-medium text-gray-500">AI Analysis Results</h3>
                      <InfoRow
                        label="Quality Score"
                        value={`${selectedInspection.aiScore.toFixed(1)}%`}
                        valueClassName={
                          selectedInspection.aiScore >= 95
                            ? "text-emerald-600"
                            : selectedInspection.aiScore >= 90
                            ? "text-amber-600"
                            : "text-rose-600"
                        }
                      />
                      <InfoRow label="Deviations" value={selectedInspection.deviations.toString()} />
                      <InfoRow
                        label="Critical Defects"
                        value={selectedInspection.criticalDefects.toString()}
                        valueClassName={selectedInspection.criticalDefects > 0 ? "text-rose-600" : "text-emerald-600"}
                      />
                    </div>
                  </div>
                  {selectedInspection.imageAnalysis && (
                    <div className="mb-6">
                      <h3 className="mb-3 text-sm font-medium text-gray-500">Visual Inspection</h3>
                      <div className="rounded-lg bg-gray-100 p-4">
                        <div className="mb-3 flex aspect-video items-center justify-center rounded-lg bg-gray-200">
                          <Microscope className="h-12 w-12 text-gray-400" />
                        </div>
                        <div className="grid gap-2 text-sm md:grid-cols-3">
                          <VisualStat label="Defects Found" value={selectedInspection.imageAnalysis.defectsDetected.toString()} />
                          <VisualStat label="Confidence" value={`${selectedInspection.imageAnalysis.confidence.toFixed(1)}%`} />
                          <VisualStat label="Model" value="Vision v2.3" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                    <div className="flex flex-wrap gap-2">
                      <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                        <ThumbsUp className="h-4 w-4" /> Approve
                      </button>
                      <button className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                        <ThumbsDown className="h-4 w-4" /> Reject
                      </button>
                      <button className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
                        Hold for Review
                      </button>
                    </div>
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Request Human Override →</button>
                  </div>
                </div>
              ) : (
                <div className="flex h-96 flex-col items-center justify-center text-gray-400">
                  <Microscope className="mb-3 h-12 w-12" />
                  <p className="text-sm">Select an inspection to begin AI analysis</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "analytics" && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-6 lg:grid-cols-2"
          >
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Quality Trend Analysis</h3>
              <div className="h-80">
                <QualityTrendChart />
              </div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Defect Heatmap</h3>
              <div className="h-80">
                <DefectHeatmap />
              </div>
            </div>
            <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Six Sigma Control Chart</h3>
              <div className="h-80">
                <SixSigmaChart />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6"
      >
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <Zap className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="mb-2 font-semibold text-gray-900">AI Quality Intelligence</h3>
            <div className="grid gap-4 text-sm text-gray-600 md:grid-cols-2">
              <div>
                <p>✓ Predictive model detected 3 batches at risk - preventive action taken</p>
                <p>✓ Image recognition accuracy improved 5% with latest training</p>
                <p>✓ Supplier quality trending up - reduce inspection frequency by 20%</p>
              </div>
              <div>
                <p>⚠️ Temperature excursion predicted for Cooler C2 - maintenance scheduled</p>
                <p>💡 Implementing SPC on Line 3 could reduce defects by 45%</p>
                <p>🎯 FDA audit preparation: 100% compliant, all documentation ready</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function QualityMetricCard({ icon: Icon, label, value, trend, color }: { icon: LucideIcon; label: string; value: string; trend: string; color: CardColor }) {
  const palette = cardColors[color];
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className={`${palette.container} ${palette.icon} mb-2 inline-flex rounded-lg p-2`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className={`mt-1 text-xs ${getTrendColor(trend)}`}>{trend}</p>
    </div>
  );
}

function InspectionCard({ inspection, onSelect, isSelected }: { inspection: QualityInspection; onSelect: () => void; isSelected: boolean }) {
  const badge = statusTokens[inspection.status];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">{inspection.id}</span>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badge.badge}`}>{inspection.status.replace("_", " ")}</span>
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        <p>Batch: {inspection.batchNumber}</p>
        <p>Product: {inspection.product}</p>
        <p>Type: {inspection.inspectionType}</p>
      </div>
      {inspection.aiScore > 0 && (
        <div className="mt-2 border-t border-gray-100 pt-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">AI Score:</span>
            <span
              className={`font-bold ${
                inspection.aiScore >= 95 ? "text-emerald-600" : inspection.aiScore >= 90 ? "text-amber-600" : "text-rose-600"
              }`}
            >
              {inspection.aiScore.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </button>
  );
}

function InfoRow({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-gray-100 py-2 text-sm">
      <span className="text-gray-600">{label}:</span>
      <span className={`font-medium text-gray-900 ${valueClassName ?? ""}`}>{value}</span>
    </div>
  );
}

function VisualStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
