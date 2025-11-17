export type InventorySignal = {
  id: string;
  sku: string;
  quantity: number;
  reorderPoint?: number | null;
  reorderQty?: number | null;
  unitCost?: number | null;
  organizationId: string;
  warehouseId?: string | null;
  facilityId?: string | null;
  preferredSupplierId?: string | null;
  expiryDate?: string | Date | null;
};

export type LowStockRecommendation = {
  recommendation: string;
  message: string;
  confidence: number;
  data: {
    safety_stock_gap: number;
    recommended_order_quantity: number;
    expedite: boolean;
    suggested_supplier: string;
  };
};

export type ExpiryActionRecommendation = {
  action: "markdown" | "transfer" | "donate" | "dispose" | "monitor";
  confidence: number;
  narrative: string;
  nextSteps: string[];
};

export type QAAnalysisResult = {
  recommendation: "approve" | "reject" | "hold";
  confidence: number;
  reasoning: string;
  highlightedFindings: Array<{ test: string; status: "pass" | "fail"; impact: string; }>;
};

export type DailyRecommendation = {
  focus: string;
  summary: string;
  actions: string[];
  impactScore: number;
};

function coerceNumber(value: number | string | null | undefined, fallback = 0): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

export class InventoryAgent {
  async handleLowStock(inventory: InventorySignal): Promise<LowStockRecommendation> {
    const reorderPoint = coerceNumber(inventory.reorderPoint, 50);
    const reorderQty = coerceNumber(inventory.reorderQty, reorderPoint * 2);
    const currentQty = coerceNumber(inventory.quantity);
    const safetyGap = Math.max(reorderPoint - currentQty, 0);
    const recommendedOrder = Math.max(reorderQty + safetyGap, reorderPoint * 1.5);
    const expedite = currentQty < reorderPoint * 0.4;

    return {
      recommendation: expedite ? "Reorder with expedite" : "Reorder",
      message: expedite
        ? `Inventory ${inventory.sku} is below 40% of the reorder threshold. Expedite replenishment.`
  : `Inventory ${inventory.sku} is nearing the reorder point. Plan replenishment now.`,
      confidence: expedite ? 92 : 86,
      data: {
        safety_stock_gap: safetyGap,
        recommended_order_quantity: Math.ceil(recommendedOrder),
        expedite,
        suggested_supplier: inventory.preferredSupplierId ?? "primary-supplier"
      }
    };
  }

  async getExpiryAction(inventory: InventorySignal): Promise<ExpiryActionRecommendation> {
    if (!inventory.expiryDate) {
      return {
        action: "monitor",
        confidence: 55,
        narrative: "No expiry tracking metadata available; continue monitoring consumption velocity.",
        nextSteps: ["Capture expiry metadata", "Validate cold-chain sensors"]
      };
    }

    const expiryDate = typeof inventory.expiryDate === "string"
      ? new Date(inventory.expiryDate)
      : inventory.expiryDate;
    const daysToExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    if (daysToExpiry <= 0) {
      return {
        action: "dispose",
        confidence: 96,
        narrative: `Batch ${inventory.sku} is expired. Dispose remaining stock per QA protocol.`,
        nextSteps: ["Trigger disposal workflow", "Capture lot traceability", "Notify QA and compliance"]
      };
    }

    if (daysToExpiry <= 7) {
      return {
        action: "markdown",
        confidence: 88,
        narrative: `Less than a week of shelf life remains for ${inventory.sku}. Apply markdowns to accelerate sell-through.`,
        nextSteps: ["Launch clearance promotion", "Prioritize high-velocity channels", "Confirm cold-chain integrity"]
      };
    }

    if (daysToExpiry <= 21) {
      return {
        action: "transfer",
        confidence: 82,
        narrative: `${inventory.sku} is inside the 21-day horizon. Transfer to facilities with higher demand to minimize write-offs.`,
        nextSteps: ["Identify demand hotspots", "Coordinate logistics capacity", "Update allocation plan"]
      };
    }

    return {
      action: "monitor",
      confidence: 70,
      narrative: `${inventory.sku} has sufficient shelf life. Continue monitoring while prioritizing FIFO compliance.`,
      nextSteps: ["Review demand forecast", "Validate QA sampling cadence"]
    };
  }

  async analyzeQATests(tests: unknown): Promise<QAAnalysisResult> {
    if (!Array.isArray(tests) || tests.length === 0) {
      return {
        recommendation: "hold",
        confidence: 60,
        reasoning: "No QA tests supplied; defaulting to manual review.",
        highlightedFindings: []
      };
    }

    type ParsedTest = {
      name?: string;
      result?: string;
      metric?: number;
      threshold?: number;
    };

    const parsedTests: ParsedTest[] = tests as ParsedTest[];
    const failures = parsedTests.filter((test) => (test.result ?? "").toLowerCase() === "fail");
    const borderline = parsedTests.filter((test) => {
      if (typeof test.metric !== "number" || typeof test.threshold !== "number") return false;
      const ratio = test.metric / test.threshold;
      return ratio > 0.9 && ratio < 1;
    });

    const highlightedFindings = parsedTests.map((test) => ({
      test: test.name ?? "Unnamed Test",
      status: (test.result ?? "pass").toLowerCase() === "fail" ? "fail" : "pass",
      impact: failures.includes(test)
        ? "Critical deviation detected"
        : borderline.includes(test)
          ? "Metric trending toward limit"
          : "Within control limits"
    }));

    if (failures.length === 0 && borderline.length <= 1) {
      return {
        recommendation: "approve",
        confidence: 96,
        reasoning: "All QA checkpoints passed or remained comfortably within control limits.",
        highlightedFindings
      };
    }

    if (failures.length > 0) {
      return {
        recommendation: "reject",
        confidence: 91,
        reasoning: `${failures.length} QA tests failed. Immediate rejection recommended pending rework.`,
        highlightedFindings
      };
    }

    return {
      recommendation: "hold",
      confidence: 78,
      reasoning: "QA metrics are near thresholds; manual review advised before release.",
      highlightedFindings
    };
  }

  async generateDailyRecommendations(alerts: Array<{ type: string; severity: string }>): Promise<DailyRecommendation[]> {
    if (!alerts.length) {
      return [
        {
          focus: "stability",
          summary: "No active alerts. Maintain cadence and focus on preventive QA checks.",
          actions: ["Audit FIFO compliance", "Validate replenishment parameters"],
          impactScore: 35
        }
      ];
    }

    const criticals = alerts.filter((alert) => alert.severity === "critical");
    const expiries = alerts.filter((alert) => alert.type === "EXPIRY_WARNING");
    const lowStock = alerts.filter((alert) => alert.type === "LOW_STOCK");

    const recommendations: DailyRecommendation[] = [];

    if (criticals.length) {
      recommendations.push({
        focus: "critical-response",
  summary: `${criticals.length} critical alerts require immediate action across inventory and QA teams.`,
        actions: [
          "Validate replenishment ETA for all critical items",
          "Escalate QA owners for pending holds",
          "Update exec dashboard with mitigation ETA"
        ],
        impactScore: 95
      });
    }

    if (expiries.length) {
      recommendations.push({
        focus: "expiry-mitigation",
  summary: `${expiries.length} batches are approaching shelf-life limits. Plan markdown/transfer actions today.`,
        actions: ["Publish markdown offers", "Re-route to high-velocity locations", "Engage charity partners for donations"],
        impactScore: 82
      });
    }

    if (lowStock.length) {
      recommendations.push({
        focus: "replenishment",
  summary: `${lowStock.length} SKUs are below reorder thresholds. Align procurement and logistics for rapid replenishment.`,
        actions: ["Auto-create POs for critical gaps", "Consolidate transfers between facilities"],
        impactScore: 78
      });
    }

    return recommendations;
  }
}
