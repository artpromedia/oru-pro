from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Oonru Agent Orchestrator")


class AgentToggle(BaseModel):
    name: str
    enabled: bool


@app.get("/health")
async def health():
    return {"status": "ok", "gpt5_codex": True}


@app.post("/agents/toggle")
async def toggle_agent(payload: AgentToggle):
    return {"name": payload.name, "enabled": payload.enabled}
