import asyncio
import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class BaseAgent:
    """Reusable base class for all orchestrated AI agents."""

    def __init__(
        self,
        agent_id: str,
        agent_type: str,
        redis_client: Any = None,
        config: Optional[Dict[str, Any]] = None
    ) -> None:
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.redis_client = redis_client
        self.config: Dict[str, Any] = config or {}
        self.status = "idle"
        self.mode = self.config.get("mode", "autonomous")
        self._started_at: Optional[datetime] = None
        self._paused_at: Optional[datetime] = None

    async def start(self) -> None:
        if self.status == "running":
            return
        self.status = "running"
        self._started_at = datetime.utcnow()
        await self.publish_event("agent_started", {"mode": self.mode})

    async def stop(self) -> None:
        if self.status == "stopped":
            return
        self.status = "stopped"
        await self.publish_event("agent_stopped", {})

    async def pause(self) -> None:
        if self.status != "running":
            return
        self.status = "paused"
        self._paused_at = datetime.utcnow()
        await self.publish_event("agent_paused", {})

    async def resume(self) -> None:
        if self.status != "paused":
            return
        self.status = "running"
        await self.publish_event("agent_resumed", {})

    async def execute_action(self, action: str, parameters: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        raise NotImplementedError

    async def log_activity(self, action: str, parameters: Dict[str, Any], result: Dict[str, Any]) -> None:
        if not self.redis_client:
            return
        record = {
            "agent_id": self.agent_id,
            "action": action,
            "parameters": parameters,
            "result": result,
            "timestamp": datetime.utcnow().isoformat(),
        }
        try:
            await self.redis_client.lpush(f"agent:activity:{self.agent_id}", json.dumps(record))
            await self.redis_client.ltrim(f"agent:activity:{self.agent_id}", 0, 999)
        except Exception as exc:
            logger.warning("Failed to log activity for %s: %s", self.agent_id, exc)

    async def publish_event(self, event_type: str, payload: Dict[str, Any]) -> None:
        if not self.redis_client:
            return
        event = {
            "type": event_type,
            "agent_id": self.agent_id,
            "timestamp": datetime.utcnow().isoformat(),
            "payload": payload,
        }
        try:
            await self.redis_client.publish(f"agent:events:{self.agent_id}", json.dumps(event))
        except Exception as exc:
            logger.warning("Failed to publish event for %s: %s", self.agent_id, exc)

    def get_uptime(self) -> float:
        if not self._started_at:
            return 0.0
        end_time = self._paused_at or datetime.utcnow()
        return (end_time - self._started_at).total_seconds()

    async def emit_heartbeat(self) -> None:
        await self.publish_event("heartbeat", {"status": self.status})

    async def ensure_running(self) -> None:
        if self.status != "running":
            await self.start()

    async def shutdown(self) -> None:
        await self.stop()


async def background_heartbeat(agent: BaseAgent, interval: int = 10) -> None:
    while agent.status in {"running", "paused"}:
        await agent.emit_heartbeat()
        await asyncio.sleep(interval)
