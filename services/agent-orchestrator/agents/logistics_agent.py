from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from .base_agent import BaseAgent


class LogisticsAgent(BaseAgent):
    """Handles cold-chain telemetry and shipment advisories."""

    async def execute_action(
        self,
        action: str,
        parameters: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        handlers = {
            "track_shipment": self.track_shipment,
            "assess_cold_chain": self.assess_cold_chain,
        }
        if action not in handlers:
            return {"success": False, "error": f"Unknown action: {action}"}
        result = await handlers[action](parameters, context)
        await self.log_activity(action, parameters, result)
        return result

    async def track_shipment(
        self,
        parameters: Dict[str, Any],
        _context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        checkpoints = parameters.get("checkpoints") or []
        checkpoints.append(
            {
                "location": parameters.get("current_loc", "Unknown"),
                "status": parameters.get("status", "IN_TRANSIT"),
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        )
        return {
            "success": True,
            "data": {
                "shipment_id": parameters.get("shipment_id"),
                "checkpoints": checkpoints[-5:],
            },
            "confidence": 0.8,
            "reasoning": "Tracking feed updated",
        }

    async def assess_cold_chain(
        self,
        parameters: Dict[str, Any],
        _context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        readings = parameters.get("readings", [])
        threshold = parameters.get("threshold", 8)
        breaches = [r for r in readings if r.get("temp") > threshold]
        return {
            "success": True,
            "data": {
                "breaches": breaches,
                "compliant": len(breaches) == 0,
            },
            "confidence": 0.78,
            "requires_approval": bool(breaches),
            "reasoning": "Cold-chain telemetry scanned",
        }
