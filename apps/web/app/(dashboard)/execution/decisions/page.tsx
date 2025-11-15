"use client";

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Brain,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  ChevronRight,
  Filter
} from 'lucide-react';
import { fetchDecisionRegistry } from '@/lib/api';
import { mockDecisionMetrics, mockDecisions } from '@/lib/execution-mock';
import type { Decision } from '@/lib/execution-types';

type DecisionFilter = 'pending' | 'in review' | 'completed' | 'all';

export default function DecisionRegistryPage() {
  const [activeFilter, setActiveFilter] = useState<DecisionFilter>('pending');
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['decision-registry'],
    queryFn: fetchDecisionRegistry,
    initialData: {
      decisions: mockDecisions,
      metrics: mockDecisionMetrics,
      updatedAt: new Date().toISOString(),
    },
  });

  const decisions = data?.decisions ?? mockDecisions;
  const decisionMetrics = data?.metrics ?? mockDecisionMetrics;

  useEffect(() => {
    if (!decisions.length) {
      setSelectedDecision(null);
      return;
    }

    if (!selectedDecision) {
      setSelectedDecision(decisions[0]);
      return;
    }

    const stillPresent = decisions.some((decision) => decision.id === selectedDecision.id);
    if (!stillPresent) {
      setSelectedDecision(decisions[0]);
    }
  }, [decisions, selectedDecision]);

  const filteredDecisions = useMemo(() => {
    if (activeFilter === 'all') return decisions;
    return decisions.filter((decision) => decision.status.toLowerCase() === activeFilter);
  }, [decisions, activeFilter]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Decision Registry</h1>
          <p className="text-gray-500 mt-1">
            Structured decision-making with noise reduction
            {isFetching && <span className="ml-2 text-xs text-blue-500">Syncing…</span>}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <FileText className="w-4 h-4" />
            <span>New Decision</span>
          </button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-7 gap-4 mb-6">
        <MetricCard
          label="Pending Decisions"
          value={decisionMetrics.pendingDecisions}
          subtext="Requires action"
          alert={decisionMetrics.pendingDecisions > 5}
        />
        <MetricCard
          label="Avg Decision Time"
          value={decisionMetrics.avgDecisionTime}
          subtext="This week"
        />
        <MetricCard
          label="Consistency Score"
          value={`${decisionMetrics.consistencyScore}%`}
          subtext="Cross-module"
          success
        />
        <MetricCard
          label="Noise Reduction"
          value={decisionMetrics.noiseReduction}
          subtext="vs last month"
          success
        />
        <MetricCard
          label="AI Acceptance"
          value={`${decisionMetrics.aiAcceptanceRate}%`}
          subtext="Recommendations"
        />
        <MetricCard
          label="Overdue"
          value={decisionMetrics.overdueDecisions}
          subtext="Past deadline"
          alert={decisionMetrics.overdueDecisions > 0}
        />
        <MetricCard
          label="Total (MTD)"
          value={decisionMetrics.totalDecisions}
          subtext="Decisions logged"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Decision List */}
        <div className="col-span-2">
          <div className="bg-white rounded-xl shadow-sm">
            {/* Filter Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {['pending', 'in review', 'completed', 'all'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter as DecisionFilter)}
                    className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeFilter === filter
                        ? 'text-blue-600 border-blue-600'
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                  >
                    {filter
                      .split(' ')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                    {filter === 'pending' && (
                      <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded-full">
                        {decisionMetrics.pendingDecisions}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Decision Cards */}
            <div className="p-6 space-y-4">
              {filteredDecisions.map((decision) => (
                <DecisionCard
                  key={decision.id}
                  decision={decision}
                  onSelect={() => setSelectedDecision(decision)}
                  isSelected={selectedDecision?.id === decision.id}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Decision Detail Panel */}
        <div className="col-span-1">
          {selectedDecision ? (
            <DecisionDetail decision={selectedDecision} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-center text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select a decision to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type DecisionCardProps = {
  decision: Decision;
  onSelect: () => void;
  isSelected: boolean;
};

function DecisionCard({ decision, onSelect, isSelected }: DecisionCardProps) {
  const stakesColors: Record<Decision['stakes'], string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700'
  };

  const timeRemaining = new Date(decision.deadline).getTime() - Date.now();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));

  const noiseFactors = Object.values(decision.noiseFactors);
  const detectedNoise = noiseFactors.filter((factor) => factor.detected);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onSelect}
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`text-xs px-2 py-1 rounded-full ${stakesColors[decision.stakes]}`}>
              {decision.stakes} stakes
            </span>
            <span className="text-xs text-gray-500">ID: {decision.id}</span>
            {decision.requester.includes('Agent') && (
              <div className="flex items-center space-x-1 text-xs text-blue-600">
                <Brain className="w-3 h-3" />
                <span>AI Generated</span>
              </div>
            )}
          </div>
          <h3 className="font-medium text-gray-900">{decision.title}</h3>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs text-gray-500 mb-3">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{hoursRemaining}h remaining</span>
        </div>
        <div className="flex items-center space-x-1">
          <Users className="w-3 h-3" />
          <span>{decision.stakeholders.length} stakeholders</span>
        </div>
        <div className="flex items-center space-x-1">
          <BarChart3 className="w-3 h-3" />
          <span>{decision.alternatives.length} options</span>
        </div>
      </div>

      {/* Noise Detection */}
      {detectedNoise.length > 0 && (
        <div className="p-2 bg-yellow-50 rounded flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-3 h-3 text-yellow-600" />
            <span className="text-xs text-yellow-700">
              Bias detected: {detectedNoise.length} factors
            </span>
          </div>
          <ChevronRight className="w-3 h-3 text-yellow-600" />
        </div>
      )}

      {/* AI Recommendation Preview */}
      <div className="mt-3 p-2 bg-blue-50 rounded">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-blue-900">AI Recommendation</span>
          <span className="text-xs text-blue-600">{decision.aiRecommendation.confidence}% confidence</span>
        </div>
        <p className="text-xs text-blue-700 mt-1 line-clamp-1">
          {decision.aiRecommendation.choice}
        </p>
      </div>
    </motion.div>
  );
}

type DecisionDetailProps = {
  decision: Decision;
};

function DecisionDetail({ decision }: DecisionDetailProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Decision Analysis</h3>

      {/* Alternatives Comparison */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Alternative Options</h4>
        <div className="space-y-2">
          {decision.alternatives.map((alt, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                alt.aiScore === Math.max(...decision.alternatives.map(a => a.aiScore))
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{alt.option}</span>
                <span className="text-sm font-bold text-blue-600">{alt.aiScore}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                {Object.entries(alt).filter(([k]) => k !== 'option' && k !== 'aiScore').map(([key, value]) => (
                  <div key={key}>
                    <span className="capitalize">{key}:</span> {value}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Noise Analysis */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Bias Detection</h4>
        <div className="space-y-2">
          {Object.entries(decision.noiseFactors).map(([factor, data]) => (
            <div key={factor} className="flex items-center justify-between">
              <span className="text-sm capitalize">{factor} Bias</span>
              {data.detected ? (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  data.severity === 'high' ? 'bg-red-100 text-red-700' :
                  data.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {data.severity}
                </span>
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Make Decision
        </button>
        <button className="w-full py-2 px-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          Request More Analysis
        </button>
      </div>
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string | number;
  subtext: string;
  alert?: boolean;
  success?: boolean;
};

function MetricCard({ label, value, subtext, alert = false, success = false }: MetricCardProps) {
  return (
    <div className={`bg-white rounded-lg p-4 border ${
      alert ? 'border-red-200' : success ? 'border-green-200' : 'border-gray-200'
    }`}>
      <div className={`text-2xl font-bold ${
        alert ? 'text-red-600' : success ? 'text-green-600' : 'text-gray-900'
      }`}>
        {value}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xs text-gray-400">{subtext}</div>
    </div>
  );
}
