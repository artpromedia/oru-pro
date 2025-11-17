from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from .base_agent import BaseAgent

logger = logging.getLogger(__name__)


class ProductionAgent(BaseAgent):
    """Lightweight production planning agent."""

    async def execute_action(
        self,
        action: str,
        parameters: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        handlers = {
            "schedule_order": self.schedule_order,
            "report_oee": self.report_oee,
            "adjust_capacity": self.adjust_capacity,
        }
        if action not in handlers:
            return {"success": False, "error": f"Unknown action: {action}"}
        result = await handlers[action](parameters, context)
        await self.log_activity(action, parameters, result)
        return result

    async def schedule_order(
        self,
        parameters: Dict[str, Any],
        context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        start_time = datetime.utcnow()
        end_time = start_time + timedelta(
            hours=parameters.get("duration_hours", 4)
        )
        return {
            "success": True,
            "data": {
                "order_id": parameters.get("order_id", "PO-UNKNOWN"),
                "line": parameters.get("line_id", "LINE-A"),
                "scheduled_start": start_time.isoformat() + "Z",
                "scheduled_end": end_time.isoformat() + "Z",
            },
            "confidence": 0.9,
            "reasoning": "Scheduled using default capacity heuristics",
        }

    async def report_oee(
        self,
        parameters: Dict[str, Any],
        context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        availability = parameters.get("availability", 0.92)
        performance = parameters.get("performance", 0.88)
        quality = parameters.get("quality", 0.98)
        oee = availability * performance * quality
        return {
            "success": True,
            "data": {
                "availability": availability,
                "performance": performance,
                "quality": quality,
                "oee": round(oee, 3),
            },
            "confidence": 0.82,
            "reasoning": "Derived from provided telemetry",
        }

    async def adjust_capacity(
        self,
        parameters: Dict[str, Any],
        context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        shift = parameters.get("shift", "B")
        delta = parameters.get("delta_units", 100)
        return {
            "success": True,
            "data": {
                "shift": shift,
                "delta_units": delta,
                "recommendation": "Approve" if delta < 150 else "Escalate",
            },
            "confidence": 0.76,
            "reasoning": (
                "Capacity adjustment evaluated against historical throughput"
            ),
            "requires_approval": delta >= 200,
        }
