from __future__ import annotations

import statistics
from typing import Any, Dict, List, Optional

from .base_agent import BaseAgent


class FinanceAgent(BaseAgent):
    """Provides quick financial health assessments and recommendations."""

    def __init__(
        self,
        agent_id: str,
        redis_client: Any = None,
        config: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(agent_id, "finance", redis_client, config)
        defaults = {
            "cash_floor": 50000.0,
            "variance_threshold": 0.08,
        }
        self.settings = defaults | (config or {})

    async def execute_action(
        self,
        action: str,
        parameters: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        handlers = {
            "forecast_cash_flow": self.forecast_cash_flow,
            "evaluate_budget": self.evaluate_budget,
            "assess_risk": self.assess_risk,
        }
        if action not in handlers:
            return {"success": False, "error": f"Unknown action: {action}"}

        result = await handlers[action](parameters, context)
        await self.log_activity(action, parameters, result)
        return result

    async def forecast_cash_flow(
        self,
        parameters: Dict[str, Any],
        _context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        history: List[Dict[str, Any]] = parameters.get("history", [])
        horizon = parameters.get("horizon_days", 14)
        baseline = parameters.get("baseline", self.settings["cash_floor"])

        if not history:
            forecast = [baseline for _ in range(horizon)]
        else:
            tail = history[-6:]
            values = [item.get("net", 0) for item in tail]
            avg = statistics.fmean(values)
            slope = (values[-1] - values[0]) / max(len(values) - 1, 1)
            forecast = [avg + slope * idx for idx in range(horizon)]

        buffer_gap = forecast[0] - self.settings["cash_floor"]
        recommendation = "secure credit line" if buffer_gap < 0 else "monitor"
        requires_approval = buffer_gap < 0
        return {
            "success": True,
            "data": {
                "forecast": forecast,
                "buffer_gap": buffer_gap,
                "recommendation": recommendation,
            },
            "confidence": 0.78 if history else 0.65,
            "requires_approval": requires_approval,
            "reasoning": "Derived from short-term net cash history",
        }

    async def evaluate_budget(
        self,
        parameters: Dict[str, Any],
        _context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        planned = parameters.get("planned", 0.0)
        actual = parameters.get("actual", 0.0)
        variance = actual - planned
        variance_pct = (variance / planned) if planned else 0.0
        threshold = self.settings["variance_threshold"]
        status = "over" if variance > 0 else "under"
        requires_approval = abs(variance_pct) > threshold
        return {
            "success": True,
            "data": {
                "planned": planned,
                "actual": actual,
                "variance": variance,
                "variance_pct": round(variance_pct, 4),
                "status": status,
            },
            "confidence": 0.84,
            "requires_approval": requires_approval,
            "reasoning": "Variance calculated against configured tolerance",
        }

    async def assess_risk(
        self,
        parameters: Dict[str, Any],
        _context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        metrics = parameters.get("metrics", {})
        liquidity = metrics.get("liquidity", 0.6)
        burn = metrics.get("burn_ratio", 0.4)
        ar_days = metrics.get("ar_days", 45)

        weighted = 0.5 * (1 - liquidity) + 0.3 * burn + 0.2 * (ar_days / 120)
        risk_score = max(0.0, min(1.0, weighted))
        if risk_score > 0.7:
            tier = "high"
        elif risk_score > 0.4:
            tier = "medium"
        else:
            tier = "low"
        return {
            "success": True,
            "data": {
                "risk_score": round(risk_score, 3),
                "tier": tier,
                "liquidity": liquidity,
                "burn_ratio": burn,
                "ar_days": ar_days,
            },
            "confidence": 0.8,
            "requires_approval": tier == "high",
            "reasoning": (
                "Weighted composite of liquidity, burn, and AR exposure"
            ),
        }
