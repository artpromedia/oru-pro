from __future__ import annotations

from typing import Any, Dict, Optional

from .base_agent import BaseAgent


class QAAgent(BaseAgent):
    """Quality assurance agent that evaluates batch readiness."""

    async def execute_action(
        self,
        action: str,
        parameters: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        handlers = {
            "evaluate_batch": self.evaluate_batch,
            "release_hold": self.release_hold,
        }
        if action not in handlers:
            return {"success": False, "error": f"Unknown action: {action}"}
        result = await handlers[action](parameters, context)
        await self.log_activity(action, parameters, result)
        return result

    async def evaluate_batch(
        self,
        parameters: Dict[str, Any],
        _context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        tests = parameters.get("tests", {})
        failed = [
            name for name, data in tests.items() if data.get("status") == "failed"
        ]
        passed = [
            name for name, data in tests.items() if data.get("status") == "passed"
        ]
        if failed:
            decision = "reject"
            confidence = 0.95
        elif len(passed) == len(tests):
            decision = "approve"
            confidence = 0.9
        else:
            decision = "pending"
            confidence = 0.6
        return {
            "success": True,
            "data": {
                "decision": decision,
                "failed_tests": failed,
                "passed_tests": passed,
            },
            "confidence": confidence,
            "requires_approval": decision != "approve",
            "reasoning": "QA check completed",
        }

    async def release_hold(
        self,
        parameters: Dict[str, Any],
        _context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        release = bool(parameters.get("force", False))
        return {
            "success": True,
            "data": {
                "batch": parameters.get("batch_id"),
                "released": release,
            },
            "confidence": 0.72,
            "requires_approval": not release,
            "reasoning": "Hold release decision recorded",
        }
