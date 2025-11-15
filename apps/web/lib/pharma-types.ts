export type PharmaMetricStatus = "release-backlog" | "expedite" | "cold-chain" | "deviation" | string;

export interface PharmaReadinessMetric {
  id: PharmaMetricStatus;
  title: string;
  value: string;
  sublabel: string;
  trend: string;
}

export interface PharmaReleaseLot {
  lot: string;
  product: string;
  stage: string;
  owner: string;
  risks: string;
  eta: string;
  confidence: number;
}

export type PharmaGateStatus = "complete" | "in-progress" | "blocked" | "queued" | "up-next" | string;

export interface PharmaValidationGate {
  label: string;
  status: PharmaGateStatus;
  owner: string;
  time: string;
}

export interface PharmaRiskSlice {
  id: string;
  value: number;
  color?: string;
}

export interface PharmaColdChainLane {
  lane: string;
  temperature: string;
  humidity: string;
  status: "stable" | "watch" | string;
}

export interface PharmaCopilotInsight {
  title: string;
  detail: string;
  impact: string;
}

export interface PharmaTelemetry {
  aiSignal: number;
  documentationCompleteness: number;
  sterilityDriftProbability: number;
  labelOcrAccuracy: number;
}

export interface PharmaValidationResponse {
  readinessMetrics: PharmaReadinessMetric[];
  releaseQueue: PharmaReleaseLot[];
  validationGates: PharmaValidationGate[];
  riskSegmentation: PharmaRiskSlice[];
  coldChainLanes: PharmaColdChainLane[];
  copilotInsights: PharmaCopilotInsight[];
  auditTrail: string[];
  telemetry: PharmaTelemetry;
}
