from __future__ import annotations

from statistics import mean
from typing import Any, Dict, Optional

from .base_agent import BaseAgent


class DecisionNoiseAgent(BaseAgent):
    """Assesses decision queues for noise and bias signals."""

    async def execute_action(
        self,
        action: str,
        parameters: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        handlers = {
            "score_noise": self.score_noise,
            "recommend_path": self.recommend_path,
        }
        if action not in handlers:
            return {"success": False, "error": f"Unknown action: {action}"}
        result = await handlers[action](parameters, context)
        await self.log_activity(action, parameters, result)
        return result

    async def score_noise(
        self,
        parameters: Dict[str, Any],
        _context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        signals = parameters.get("signals", [0.5])
        noise = 1 - mean(signals)
        return {
            "success": True,
            "data": {
                "noise_score": round(noise, 3),
                "signals": signals,
            },
            "confidence": 0.74,
            "reasoning": "Noise score derived from provided indicators",
        }

    async def recommend_path(
        self,
        parameters: Dict[str, Any],
        _context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        priority = parameters.get("priority", "medium")
        if priority == "critical":
            recommendation = "escalate"
            confidence = 0.91
        elif priority == "high":
            recommendation = "approve"
            confidence = 0.82
        else:
            recommendation = "defer"
            confidence = 0.7
        return {
            "success": True,
            "data": {
                "recommendation": recommendation,
                "priority": priority,
            },
            "confidence": confidence,
            "requires_approval": recommendation == "escalate",
            "reasoning": "Recommendation produced from priority bands",
        }
