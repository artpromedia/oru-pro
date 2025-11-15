from __future__ import annotations

import importlib
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[3]
SDK_PATH = REPO_ROOT / "packages" / "agent-sdk"
if SDK_PATH.exists() and str(SDK_PATH) not in sys.path:
    sys.path.append(str(SDK_PATH))

agent_sdk_module = importlib.import_module("oru_agent_sdk")
AgentContext = agent_sdk_module.AgentContext
BaseAgent = agent_sdk_module.BaseAgent


@dataclass(slots=True)
class BOMComponent:
    code: str
    description: str
    quantity_per_batch: float
    uom: str
    allergen: Optional[str] = None


@dataclass(slots=True)
class ProductionOrder:
    sku: str
    batch_size: float
    regulatory_batch_limit: float
    requested_date: date


@dataclass(slots=True)
class AllergenRule:
    allergen: str
    sanitation_minutes: int
    requires_dedicated_line: bool


class ProductionBOMOptimizer(BaseAgent):
    """Co-pilot that assists planners with BOM intelligence."""

    def __init__(self) -> None:
        ctx = AgentContext(
            name="production-bom-copilot-v1",
            queue="production.copilot",
            metadata={
                "mode": "copilot",
                "capabilities": [
                    "bom_explosion",
                    "capacity_planning",
                    "yield_optimization",
                    "allergen_guardrails",
                    "regulatory_batching",
                ],
            },
        )
        super().__init__(context=ctx)

    def explode_bom(
        self,
        order: ProductionOrder,
        bom: Iterable[BOMComponent],
        inventory: pd.DataFrame,
    ) -> pd.DataFrame:
        """Return component-level requirements with availability deltas."""

        rows: List[Dict[str, Any]] = []
        for component in bom:
            required_qty = component.quantity_per_batch * order.batch_size
            available = float(
                inventory.loc[inventory["code"] == component.code, "qty"].sum()
            )
            rows.append(
                {
                    "code": component.code,
                    "description": component.description,
                    "required": required_qty,
                    "available": available,
                    "delta": available - required_qty,
                    "uom": component.uom,
                    "allergen": component.allergen,
                }
            )
        df = pd.DataFrame(rows).sort_values("delta")
        return df

    def recommend_capacity_plan(
        self,
        order: ProductionOrder,
        capacity: pd.DataFrame,
    ) -> Dict[str, Any]:
        """Suggest shifts/lines that can absorb the batch."""

        window = capacity[capacity["date"] >= order.requested_date.isoformat()]
        window = window.sort_values("available_hours", ascending=False)
        best_option = window.iloc[0].to_dict() if not window.empty else {}
        utilization = (
            order.batch_size / best_option.get("max_batch", order.batch_size)
            if best_option
            else 1.0
        )
        return {
            "recommended_line": best_option.get("line", "Line-1"),
            "available_hours": best_option.get("available_hours", 0),
            "utilization": round(utilization, 2),
            "notes": "Allocate overtime" if utilization > 0.9 else "On-plan",
        }

    def recommend_yield_actions(
        self, yield_df: pd.DataFrame
    ) -> List[Dict[str, Any]]:
        """Highlight SKUs with drift versus golden batch."""

        variance = yield_df.copy()
        variance["gap_pct"] = (
            variance["actual_yield"] - variance["golden_yield"]
        )
        variance = variance.sort_values("gap_pct")
        recommendations: List[Dict[str, Any]] = []
        for row in variance.itertuples():
            if row.gap_pct < -0.02:
                recommendations.append(
                    {
                        "sku": row.sku,
                        "gap_pct": round(row.gap_pct * 100, 2),
                        "action": (
                            "Tighten hydration"
                            if row.process == "dough"
                            else "Audit proofing"
                        ),
                    }
                )
        return recommendations

    def detect_allergen_risk(
        self,
        bom: Iterable[BOMComponent],
        allergen_rules: Iterable[AllergenRule],
        last_run_allergen: Optional[str],
    ) -> List[Dict[str, Any]]:
        rules = {rule.allergen: rule for rule in allergen_rules}
        alerts: List[Dict[str, Any]] = []
        allergen_set = {
            component.allergen for component in bom if component.allergen
        }
        for allergen in allergen_set:
            rule = rules.get(allergen)
            if not rule:
                continue
            if rule.requires_dedicated_line and allergen != last_run_allergen:
                alerts.append(
                    {
                        "allergen": allergen,
                        "message": "Requires dedicated line switch-over",
                    }
                )
            if rule.sanitation_minutes > 0 and allergen == last_run_allergen:
                alerts.append(
                    {
                        "allergen": allergen,
                        "message": (
                            f"Sanitation window {rule.sanitation_minutes}m"
                        ),
                    }
                )
        return alerts

    def recommend_batch_size(self, order: ProductionOrder) -> Dict[str, Any]:
        """Respect regulatory batch size ceilings for F&B."""

        if order.batch_size <= order.regulatory_batch_limit:
            return {
                "status": "ok",
                "recommended_batch_size": order.batch_size,
                "notes": "Within regulatory range",
            }
        batches = order.batch_size / order.regulatory_batch_limit
        return {
            "status": "split",
            "recommended_batch_size": order.regulatory_batch_limit,
            "number_of_batches": int(batches) + (1 if batches % 1 else 0),
            "notes": "Split lots to comply with USDA guidance",
        }

    async def orchestrate_plan(
        self,
        order: ProductionOrder,
        bom: Iterable[BOMComponent],
        inventory: pd.DataFrame,
        capacity: pd.DataFrame,
        yield_df: pd.DataFrame,
        allergen_rules: Iterable[AllergenRule],
        last_run_allergen: Optional[str] = None,
    ) -> Dict[str, Any]:
        """High-level orchestration entry point used by the FastAPI surface."""

        exploded = self.explode_bom(order, bom, inventory)
        capacity_plan = self.recommend_capacity_plan(order, capacity)
        yield_actions = self.recommend_yield_actions(yield_df)
        allergen_alerts = self.detect_allergen_risk(
            bom, allergen_rules, last_run_allergen
        )
        batch_guidance = self.recommend_batch_size(order)
        return {
            "bom": exploded.to_dict(orient="records"),
            "capacity": capacity_plan,
            "yield": yield_actions,
            "allergens": allergen_alerts,
            "batching": batch_guidance,
        }
