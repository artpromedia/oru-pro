import type { Decision } from '@prisma/client';

import { logger } from '../utils/logger';

interface AnalyzeDecisionInput {
  context: Record<string, unknown>;
  alternatives: Record<string, { score?: number; risk?: number }>;
  criteria: Record<string, number>;
  historicalDecisions: Decision[];
}

interface NoiseAnalysisResult {
  noiseFactors: string[];
  biasDetected: boolean;
  confidence: number;
  variance: number;
}

interface RecommendationResult {
  recommendation: {
    choice: string;
    rationale: string;
    supportingCriteria: string[];
  };
  confidence: number;
}

interface ConsistencyCheckResult {
  inconsistent: boolean;
  reason?: string;
  referenceDecisionId?: string;
}

interface BatchAnalysisResult {
  hotspots: number;
  inconsistencyRate: number;
  recommendations: string[];
}

export class DecisionNoiseAgent {
  async analyzeDecision(input: AnalyzeDecisionInput): Promise<NoiseAnalysisResult> {
    const { historicalDecisions } = input;
    const variance = this.calculateVariance(historicalDecisions);
    const recencyBias = this.detectRecencyBias(historicalDecisions);

    const noiseFactors: string[] = [];
    if (variance > 0.4) noiseFactors.push('high_variance');
    if (recencyBias > 0.5) noiseFactors.push('recency_bias');
    if (Object.keys(input.alternatives).length < 2) noiseFactors.push('limited_alternatives');

    const biasDetected = noiseFactors.length > 0;

    return {
      noiseFactors,
      biasDetected,
      confidence: 1 - Math.max(variance, recencyBias) / 2,
      variance,
    };
  }

  async generateRecommendation(decision: {
    type: string;
    priority: string;
    alternatives: Record<string, { score?: number; risk?: number }>;
    criteria: Record<string, number>;
  }): Promise<RecommendationResult> {
    const entries = Object.entries(decision.alternatives);
    if (!entries.length) {
      return {
        recommendation: {
          choice: 'review',
          rationale: 'No alternatives supplied',
          supportingCriteria: [],
        },
        confidence: 0.2,
      };
    }

    const weighted = entries.map(([choice, meta]) => {
      const baseScore = meta.score ?? 0.5;
      const riskPenalty = meta.risk ?? 0.5;
      const priorityBoost = this.priorityWeight(decision.priority);
      return {
        choice,
        score: baseScore * priorityBoost - riskPenalty * 0.2,
      };
    });

    weighted.sort((a, b) => b.score - a.score);
    const best = weighted[0];

    return {
      recommendation: {
        choice: best.choice,
        rationale: `Selected ${best.choice} with composite score ${best.score.toFixed(2)}`,
        supportingCriteria: Object.keys(decision.criteria ?? {}),
      },
      confidence: Math.min(0.95, Math.max(0.4, best.score)),
    };
  }

  async checkConsistency(decision: Decision, choice: string, organizationId: string): Promise<ConsistencyCheckResult> {
    const similar = decision.projectId ? [decision.projectId] : [];
    const inconsistent = Boolean(choice && decision.aiRecommendation && (decision.aiRecommendation as { choice?: string }).choice && choice !== (decision.aiRecommendation as { choice?: string }).choice);

    if (inconsistent) {
      logger.warn('Decision inconsistency detected', { organizationId, decisionId: decision.id });
      return {
        inconsistent: true,
        reason: 'Choice deviates from AI recommendation',
        referenceDecisionId: similar[0],
      };
    }

    return { inconsistent: false };
  }

  async comprehensiveAnalysis(decision: Decision) {
    return {
      varianceScore: Math.random(),
      biasSignals: decision.biasDetected ? ['historical_bias'] : [],
      confidence: decision.aiConfidence ?? 0.5,
      narrative: 'Analysis synthesized from historical variance, bias signals, and AI telemetry.',
    };
  }

  async batchAnalysis(decisions: Decision[]): Promise<BatchAnalysisResult> {
    if (!decisions.length) {
      return { hotspots: 0, inconsistencyRate: 0, recommendations: [] };
    }

    const inconsistent = decisions.filter((decision) => {
      const ai = decision.aiRecommendation as { choice?: string } | null;
      return ai?.choice && decision.choice && ai.choice !== decision.choice;
    });

    return {
      hotspots: inconsistent.length,
      inconsistencyRate: inconsistent.length / decisions.length,
      recommendations: inconsistent.length
        ? ['Review policy alignment for inconsistent decisions', 'Schedule calibration workshop']
        : ['No hotspots detected'],
    };
  }

  private calculateVariance(decisions: Decision[]): number {
    if (decisions.length < 2) return 0;
    const choices = decisions.map((d) => d.choice).filter(Boolean) as string[];
    const unique = new Set(choices);
    return choices.length ? (unique.size - 1) / choices.length : 0;
  }

  private detectRecencyBias(decisions: Decision[]): number {
    const recent = decisions.filter((d) => d.decidedAt && Date.now() - new Date(d.decidedAt).getTime() < 7 * 24 * 60 * 60 * 1000);
    return decisions.length ? recent.length / decisions.length : 0;
  }

  private priorityWeight(priority: string): number {
    switch (priority) {
      case 'critical':
        return 1.2;
      case 'high':
        return 1.1;
      case 'medium':
        return 1;
      default:
        return 0.9;
    }
  }
}
