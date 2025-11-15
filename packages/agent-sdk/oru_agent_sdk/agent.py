from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict

from pydantic import BaseModel


class AgentInput(BaseModel):
    correlation_id: str
    payload: Dict[str, Any]


class AgentOutput(BaseModel):
    correlation_id: str
    payload: Dict[str, Any]
    status: str = "success"


@dataclass(slots=True)
class AgentContext:
    name: str
    queue: str
    metadata: Dict[str, Any]


class BaseAgent:
    def __init__(self, context: AgentContext):
        self.context = context

    async def handle(self, request: AgentInput) -> AgentOutput:
        raise NotImplementedError("Agents must implement handle()")
