import type { PharmaValidationResponse } from "./pharma-types";

export const mockPharmaValidation: PharmaValidationResponse = {
  readinessMetrics: [
    {
      id: "release-backlog",
      title: "Release Backlog",
      value: "18",
      sublabel: "lots awaiting QA",
      trend: "+3 vs target",
    },
    {
      id: "expedite",
      title: "Expedite Requests",
      value: "5",
      sublabel: "AI-approved fast lanes",
      trend: "2 flagged for review",
    },
    {
      id: "cold-chain",
      title: "Cold-chain Watchlist",
      value: "7",
      sublabel: "routes under telemetry",
      trend: "0 excursions in 24h",
    },
    {
      id: "deviation",
      title: "Deviation Severity",
      value: "0.42",
      sublabel: "weighted CAPA index",
      trend: "↓ 0.08 vs last week",
    },
  ],
  releaseQueue: [
    {
      lot: "B2024-119A",
      product: "Sterile Vial 5mL",
      stage: "QA Review",
      owner: "Dr. Yan",
      risks: "Label OCR",
      eta: "02:15",
      confidence: 92,
    },
    {
      lot: "B2024-120C",
      product: "Lyophilized Dose",
      stage: "Micro Tests",
      owner: "QA Cell 4",
      risks: "Bioburden drift",
      eta: "05:40",
      confidence: 84,
    },
    {
      lot: "B2024-121F",
      product: "IV Bag 250mL",
      stage: "Analytics",
      owner: "Dr. Perez",
      risks: "Assay variability",
      eta: "08:10",
      confidence: 76,
    },
    {
      lot: "B2024-117B",
      product: "Pre-filled Syringe",
      stage: "Release Sign-off",
      owner: "QA Council",
      risks: "None",
      eta: "00:45",
      confidence: 97,
    },
  ],
  validationGates: [
    { label: "Manufacturing Dossier", status: "complete", owner: "MES Sync", time: "-04h" },
    { label: "Microbiology", status: "in-progress", owner: "Lab Cell 7", time: "ETA 2h" },
    { label: "Sterility Hold", status: "blocked", owner: "QA Ops", time: "Need deviation" },
    { label: "Regulatory Attachment", status: "queued", owner: "RA Bot", time: "Next slot" },
    { label: "QA Sign-off", status: "up-next", owner: "Release Board", time: "08:00" },
  ],
  riskSegmentation: [
    { id: "sterility", value: 32, color: "#F97316" },
    { id: "labeling", value: 24, color: "#0EA5E9" },
    { id: "cold-chain", value: 18, color: "#8B5CF6" },
    { id: "documentation", value: 26, color: "#10B981" },
  ],
  coldChainLanes: [
    { lane: "ORD → PHX", temperature: "5.4°C", humidity: "41%", status: "stable" },
    { lane: "RDU → MIA", temperature: "2.1°C", humidity: "63%", status: "watch" },
    { lane: "SFO → SEA", temperature: "3.9°C", humidity: "50%", status: "stable" },
  ],
  copilotInsights: [
    {
      title: "Accelerate release board",
      detail: "Batch B2024-117B exceeds sterile control targets; auto-generate CFR-compliant memo.",
      impact: "16h sooner",
    },
    {
      title: "Re-route cold-chain",
      detail: "Sensors on lane ORD → PHX trending +3°C. Recommend diversion to Denver holding tunnel.",
      impact: "Avoids excursion write-up",
    },
    {
      title: "Autofill CAPA trail",
      detail: "Drafted CAPA for OCR anomaly citing Annex 11 template; pending QA edit.",
      impact: "Saves ~45 min",
    },
  ],
  auditTrail: [
    "Auto-attached Annex 11 validation log to B2024-117B",
    "Filed deviation DEV-882 on OCR mismatch with AI summary",
    "Synced clean-room sensor feed for batch B2024-120C",
  ],
  telemetry: {
    aiSignal: 0.87,
    documentationCompleteness: 0.96,
    sterilityDriftProbability: 0.06,
    labelOcrAccuracy: 0.993,
  },
};
