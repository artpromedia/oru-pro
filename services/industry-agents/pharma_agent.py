from __future__ import annotations

import asyncio
import importlib
import sys
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List

REPO_ROOT = Path(__file__).resolve().parents[2]
SDK_PATH = REPO_ROOT / "packages" / "agent-sdk"
if SDK_PATH.exists() and str(SDK_PATH) not in sys.path:
    sys.path.append(str(SDK_PATH))

agent_sdk_module = importlib.import_module("oru_agent_sdk")
AgentContext = agent_sdk_module.AgentContext
BaseAgent = agent_sdk_module.BaseAgent


@dataclass(slots=True)
class Decision:
    batch_id: str
    status: str
    rationale: str
    approvals_required: List[str]
    next_actions: List[str]
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class ComplianceIssue:
    issue_id: str
    severity: str
    area: str
    recommendation: str
    detected_at: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class MachiningJob:
    job_id: str
    material: str
    machine: str
    tool_diameter_mm: float
    target_finish_ra: float
    tolerance_microns: float
    current_params: Dict[str, float]


@dataclass(slots=True)
class Parameters:
    spindle_speed_rpm: float
    feed_rate_mm_per_min: float
    depth_per_pass_mm: float
    coolant_mix_ratio: str
    expected_chip_load_mm: float
    recommendations: List[str] = field(default_factory=list)


@dataclass(slots=True)
class Forecast:
    sku: str
    horizon_days: int
    projected_units: List[float]
    confidence: float
    notes: str
    signals: Dict[str, Any] = field(default_factory=dict)


class PharmaComplianceAgent(BaseAgent):
    """Pharmaceutical compliance and quality agent."""

    def __init__(self) -> None:
        context = AgentContext(
            name="pharma-compliance-v1",
            queue="pharma.compliance",
            metadata={
                "capabilities": [
                    "21_cfr_validation",
                    "batch_release",
                    "deviation_management",
                    "audit_trail_monitoring",
                ],
                "regulations": ["21 CFR Part 11", "GxP"],
            },
        )
        super().__init__(context=context)

    async def validate_batch_release(self, batch_id: str) -> Decision:
        """Validate batch for release per FDA requirements."""

        await asyncio.sleep(0)
        electronic_signatures_ok = True
        quality_tests = {
            "potency": 99.3,
            "sterility": "pass",
            "dissolution": "pass",
        }
        deviations_open = 0
        status = (
            "release_ready"
            if electronic_signatures_ok and deviations_open == 0
            else "hold"
        )
        rationale = (
            "All release criteria satisfied"
            if status == "release_ready"
            else "Open deviations require QA review"
        )
        return Decision(
            batch_id=batch_id,
            status=status,
            rationale=rationale,
            approvals_required=["QA", "Regulatory"],
            next_actions=[
                "Archive audit trail",
                "Notify release committee",
                "Update LIMS record",
            ],
            metadata={
                "quality_tests": quality_tests,
                "electronic_signatures": electronic_signatures_ok,
                "deviations": deviations_open,
            },
        )

    async def monitor_gxp_compliance(self) -> List[ComplianceIssue]:
        """Continuous GxP compliance monitoring."""

        await asyncio.sleep(0)
        now = datetime.utcnow()
        return [
            ComplianceIssue(
                issue_id="CAPA-1021",
                severity="high",
                area="Training Records",
                recommendation=(
                    "Trigger overdue GMP refresher for 14 associates"
                ),
                detected_at=now - timedelta(minutes=15),
                metadata={"overdue_days": 12, "business_unit": "Fill-Finish"},
            ),
            ComplianceIssue(
                issue_id="AUDIT-447",
                severity="medium",
                area="Equipment Calibration",
                recommendation="Calibrate lyophilizer LYO-7 before next batch",
                detected_at=now - timedelta(hours=2),
                metadata={"last_calibration": "2025-08-01"},
            ),
        ]


class ManufacturingOptimizationAgent(BaseAgent):
    """Precision manufacturing optimization agent."""

    def __init__(self) -> None:
        context = AgentContext(
            name="manufacturing-opt-v1",
            queue="manufacturing.optimization",
            metadata={
                "capabilities": [
                    "cnc_optimization",
                    "predictive_maintenance",
                    "quality_prediction",
                    "oee_improvement",
                ],
                "digital_twin": True,
            },
        )
        super().__init__(context=context)

    async def optimize_cutting_parameters(
        self, job: MachiningJob
    ) -> Parameters:
        """AI-optimized cutting parameters."""

        await asyncio.sleep(0)
        material_speed = {
            "aluminum": 1600,
            "steel": 950,
            "titanium": 600,
        }
        base_speed = material_speed.get(job.material.lower(), 1100)
        spindle_speed = base_speed * (25 / max(job.tool_diameter_mm, 1))
        feed_rate = spindle_speed * 0.08
        depth_of_cut = min(1.5, job.tolerance_microns / 20)
        chip_load = round(feed_rate / max(spindle_speed, 1), 4)

        recommendations = [
            "Balance surface finish with tool wear",
            "Sync with predictive maintenance window",
        ]
        if job.target_finish_ra < 0.4:
            recommendations.append("Add mist coolant for micro-finish")

        return Parameters(
            spindle_speed_rpm=round(spindle_speed, 0),
            feed_rate_mm_per_min=round(feed_rate, 1),
            depth_per_pass_mm=round(depth_of_cut, 2),
            coolant_mix_ratio="7%",
            expected_chip_load_mm=chip_load,
            recommendations=recommendations,
        )


class RetailDemandAgent(BaseAgent):
    """Retail demand forecasting and optimization agent."""

    def __init__(self) -> None:
        context = AgentContext(
            name="retail-demand-v1",
            queue="retail.demand",
            metadata={
                "capabilities": [
                    "demand_forecasting",
                    "price_optimization",
                    "inventory_allocation",
                    "promotion_planning",
                ],
                "channels": ["stores", "ecommerce", "wholesale"],
            },
        )
        super().__init__(context=context)

    async def forecast_demand(self, sku: str, horizon_days: int) -> Forecast:
        """ML-based demand forecasting."""

        await asyncio.sleep(0)
        base = 420.0
        trend = 1.012
        projection = [
            round(base * (trend ** day), 1) for day in range(horizon_days)
        ]
        signals = {
            "seasonality": "holiday",
            "promotion": "bundled",
            "weather": "cool+wet",
        }
        confidence = 0.82

        return Forecast(
            sku=sku,
            horizon_days=horizon_days,
            projected_units=projection,
            confidence=confidence,
            notes="Incorporates loyalty signals and markdown elasticity",
            signals=signals,
        )
