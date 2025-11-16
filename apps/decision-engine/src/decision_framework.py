from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any, Dict, List

import numpy as np


@dataclass(slots=True)
class Alternative:
    name: str
    impact: Dict[str, Any]


@dataclass(slots=True)
class Criterion:
    name: str
    weight: float
    description: str


@dataclass(slots=True)
class NoiseFactor:
    label: str
    severity: float
    driver: str


@dataclass(slots=True)
class OonruDecision:
    id: str
    module: str
    title: str
    stakes: float
    alternatives: List[Alternative]
    criteria: List[Criterion]
    noise_factors: List[NoiseFactor]


class DecisionIncompleteError(Exception):
    def __init__(self, missing_fields: List[str]):
        fields = ", ".join(missing_fields)
        message = f"Decision missing required fields: {fields}"
        super().__init__(message)
        self.missing_fields = missing_fields


class BaseDecisionTemplate:
    def required_fields(self) -> List[str]:
        raise NotImplementedError

    def check_requirements(self, decision: Dict[str, Any]) -> List[str]:
        return [req for req in self.required_fields() if req not in decision]

    def extract_alternatives(
        self, decision: Dict[str, Any]
    ) -> List[Alternative]:
        raise NotImplementedError

    def define_criteria(
        self, decision: Dict[str, Any]
    ) -> List[Criterion]:
        raise NotImplementedError


class QAApprovalTemplate(BaseDecisionTemplate):
    def required_fields(self) -> List[str]:
        return [
            "test_results",
            "batch_info",
            "supplier_history",
            "compliance_certificates",
            "risk_assessment",
        ]

    def extract_alternatives(
        self, decision: Dict[str, Any]
    ) -> List[Alternative]:
        return [
            Alternative("approve", {"impact": "release"}),
            Alternative("reject", {"impact": "scrap"}),
            Alternative("conditional_approve", {"impact": "monitor"}),
            Alternative("retest", {"impact": "delay"}),
        ]

    def define_criteria(
        self, decision: Dict[str, Any]
    ) -> List[Criterion]:
        return [
            Criterion("safety", 0.4, "Food safety compliance"),
            Criterion("cost", 0.2, "Scrap or rework cost"),
            Criterion("service", 0.3, "Impact to OTIF"),
            Criterion("brand", 0.1, "Reputation risk"),
        ]


class InventoryTransferTemplate(BaseDecisionTemplate):
    def required_fields(self) -> List[str]:
        return ["source", "destination", "inventory_snapshot", "demand"]

    def extract_alternatives(
        self, decision: Dict[str, Any]
    ) -> List[Alternative]:
        return [
            Alternative("transfer_now", {"cost": 450, "lead_time_days": 2}),
            Alternative("delay", {"risk": "stockout"}),
            Alternative("source_locally", {"cost": 520, "lead_time_days": 1}),
        ]

    def define_criteria(
        self, decision: Dict[str, Any]
    ) -> List[Criterion]:
        return [
            Criterion("service", 0.4, "Fulfill downstream orders"),
            Criterion("cost", 0.3, "Freight and handling"),
            Criterion("shrink", 0.2, "Temperature risk"),
            Criterion("labor", 0.1, "Warehouse strain"),
        ]


class ProductionScheduleTemplate(BaseDecisionTemplate):
    def required_fields(self) -> List[str]:
        return ["orders", "capacity", "line_constraints"]

    def extract_alternatives(
        self, decision: Dict[str, Any]
    ) -> List[Alternative]:
        return [
            Alternative("run_weekend", {"overtime_hours": 10}),
            Alternative("sequence_change", {"changeovers": 2}),
            Alternative("outsourced", {"cost_pct": 1.12}),
        ]

    def define_criteria(
        self, decision: Dict[str, Any]
    ) -> List[Criterion]:
        return [
            Criterion("service", 0.5, "Meet order promise"),
            Criterion("labor", 0.2, "Crew availability"),
            Criterion("yield", 0.2, "Golden batch adherence"),
            Criterion("cost", 0.1, "Incremental spend"),
        ]


class SupplierSelectionTemplate(BaseDecisionTemplate):
    def required_fields(self) -> List[str]:
        return ["suppliers", "quality_scores", "commercial_terms"]

    def extract_alternatives(
        self, decision: Dict[str, Any]
    ) -> List[Alternative]:
        return [
            Alternative("incumbent", {"cost_index": 1.0}),
            Alternative("challenger", {"cost_index": 0.96}),
            Alternative("dual_source", {"resilience": "high"}),
        ]

    def define_criteria(
        self, decision: Dict[str, Any]
    ) -> List[Criterion]:
        return [
            Criterion("quality", 0.35, "FSMA + sensory scoring"),
            Criterion("cost", 0.25, "Delivered cost"),
            Criterion("resilience", 0.25, "Multi-source coverage"),
            Criterion("sustainability", 0.15, "Scope 3 impact"),
        ]


class BudgetAllocationTemplate(BaseDecisionTemplate):
    def required_fields(self) -> List[str]:
        return ["budget_ceiling", "initiatives", "roi_models"]

    def extract_alternatives(
        self, decision: Dict[str, Any]
    ) -> List[Alternative]:
        return [
            Alternative(
                "status_quo",
                {"spend": decision.get("current_spend", 0)},
            ),
            Alternative(
                "aggressive",
                {"spend": decision.get("budget_ceiling", 0)},
            ),
            Alternative(
                "focused",
                {"spend": 0.65 * decision.get("budget_ceiling", 0)},
            ),
        ]

    def define_criteria(
        self, decision: Dict[str, Any]
    ) -> List[Criterion]:
        return [
            Criterion("growth", 0.4, "Revenue unlock"),
            Criterion("profitability", 0.3, "Margin impact"),
            Criterion("risk", 0.2, "Downside protection"),
            Criterion("speed", 0.1, "Time to benefit"),
        ]


class HiringDecisionTemplate(BaseDecisionTemplate):
    def required_fields(self) -> List[str]:
        return ["candidates", "scorecards", "headcount_plan"]

    def extract_alternatives(
        self, decision: Dict[str, Any]
    ) -> List[Alternative]:
        return [
            Alternative(
                "hire_now",
                {"start_date": decision.get("target_date")},
            ),
            Alternative("defer", {"impact": "capacity_gap"}),
            Alternative("contractor", {"duration_weeks": 12}),
        ]

    def define_criteria(
        self, decision: Dict[str, Any]
    ) -> List[Criterion]:
        return [
            Criterion("capability", 0.4, "Skill alignment"),
            Criterion("cost", 0.2, "Cash impact"),
            Criterion("speed", 0.2, "Ramp time"),
            Criterion("culture", 0.2, "Team fit"),
        ]


class DecisionIntelligenceEngine:
    def __init__(self) -> None:
        self.templates: Dict[str, BaseDecisionTemplate] = {
            "qa_approval": QAApprovalTemplate(),
            "inventory_transfer": InventoryTransferTemplate(),
            "production_scheduling": ProductionScheduleTemplate(),
            "supplier_selection": SupplierSelectionTemplate(),
            "budget_allocation": BudgetAllocationTemplate(),
            "hiring_decision": HiringDecisionTemplate(),
        }
        self.history: List[OonruDecision] = []
        self.review_flags: List[Dict[str, Any]] = []

    def enforce_decision_hygiene(
        self, raw_decision: Dict[str, Any]
    ) -> OonruDecision:
        template = self.select_template(raw_decision)
        missing = template.check_requirements(raw_decision)
        if missing:
            raise DecisionIncompleteError(missing)
        biases = self.detect_biases(raw_decision)
        self.calculate_noise_score(raw_decision, biases)
        decision = OonruDecision(
            id=self.generate_id(),
            module=raw_decision.get("module", "unknown"),
            title=raw_decision.get("title", "Untitled Decision"),
            stakes=self.calculate_stakes(raw_decision),
            alternatives=template.extract_alternatives(raw_decision),
            criteria=template.define_criteria(raw_decision),
            noise_factors=self.identify_noise_factors(biases),
        )
        self.history.append(decision)
        return decision

    def cross_module_consistency(self, decision: OonruDecision) -> float:
        similar = self.find_similar_decisions(decision)
        consistency = self.calculate_consistency(decision, similar)
        if consistency < 0.7:
            self.flag_for_review(decision, similar)
        return consistency

    def select_template(
        self, raw_decision: Dict[str, Any]
    ) -> BaseDecisionTemplate:
        key = (
            raw_decision.get("template")
            or raw_decision.get("type")
            or f"{raw_decision.get('module', '')}_decision"
        )
        return self.templates.get(key, QAApprovalTemplate())

    def detect_biases(self, raw_decision: Dict[str, Any]) -> List[str]:
        biases: List[str] = []
        if raw_decision.get("owner_sentiment") == "overconfident":
            biases.append("overconfidence")
        if raw_decision.get("alternatives") in (None, []) or len(
            raw_decision.get("alternatives", [])
        ) < 2:
            biases.append("limited_alternatives")
        if not raw_decision.get("data_sources"):
            biases.append("missing_data")
        if raw_decision.get("rush"):
            biases.append("time_pressure")
        return biases

    def calculate_noise_score(
        self, raw_decision: Dict[str, Any], biases: List[str]
    ) -> float:
        base = raw_decision.get("noise_floor", 0.2)
        score = np.clip(base + 0.15 * len(biases), 0, 1)
        raw_decision["noise_score"] = score
        return float(score)

    def identify_noise_factors(self, biases: List[str]) -> List[NoiseFactor]:
        mapping = {
            "overconfidence": "historical success bias",
            "limited_alternatives": "insufficient exploration",
            "missing_data": "data gaps",
            "time_pressure": "deadline stress",
        }
        return [
            NoiseFactor(bias, min(1.0, 0.3 + idx * 0.2), mapping[bias])
            for idx, bias in enumerate(biases)
        ]

    def calculate_stakes(self, raw_decision: Dict[str, Any]) -> float:
        stakes = raw_decision.get(
            "stakes", raw_decision.get("financial_impact", 0.5)
        )
        return float(np.clip(stakes, 0, 1))

    def find_similar_decisions(
        self, decision: OonruDecision
    ) -> List[OonruDecision]:
        return [
            hist for hist in self.history if hist.module == decision.module
        ]

    def calculate_consistency(
        self, decision: OonruDecision, similar: List[OonruDecision]
    ) -> float:
        if not similar:
            return 1.0
        diffs = [abs(decision.stakes - peer.stakes) for peer in similar]
        mean_diff = np.mean(diffs)
        return float(np.clip(1 - mean_diff, 0, 1))

    def flag_for_review(
        self, decision: OonruDecision, similar: List[OonruDecision]
    ) -> None:
        self.review_flags.append(
            {
                "decision_id": decision.id,
                "module": decision.module,
                "reason": "Low cross-module consistency",
                "comparison_sample": [peer.id for peer in similar],
            }
        )

    def generate_id(self) -> str:
        return uuid.uuid4().hex
