from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import redis.asyncio as redis
import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.inventory_agent import InventoryAgent
from agents.production_agent import ProductionAgent
from agents.qa_agent import QAAgent
from agents.logistics_agent import LogisticsAgent
from agents.decision_agent import DecisionNoiseAgent
from agents.finance_agent import FinanceAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Oru Agent Orchestrator", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_client: Optional[redis.Redis] = None
agents: Dict[str, Any] = {}


class AgentConfig(BaseModel):
    agent_id: str
    agent_type: str
    mode: str
    config: Dict[str, Any]
    permissions: List[str]


class AgentAction(BaseModel):
    agent_id: str
    action: str
    parameters: Dict[str, Any]
    context: Optional[Dict[str, Any]] = None


class AgentResponse(BaseModel):
    success: bool
    data: Any
    confidence: float
    reasoning: Optional[str] = None
    requires_approval: bool = False


@app.on_event("startup")
async def startup_event() -> None:
    global redis_client
    redis_client = await redis.Redis.from_url(
        "redis://localhost:6379",
        decode_responses=False,
    )
    logger.info("Connected to Redis")
    await initialize_default_agents()


@app.on_event("shutdown")
async def shutdown_event() -> None:
    if redis_client:
        await redis_client.close()
        logger.info("Disconnected from Redis")


async def initialize_default_agents() -> None:
    default_agents = [
        {
            "id": "inventory-agent-01",
            "type": "inventory",
            "class": InventoryAgent,
        },
        {
            "id": "production-agent-01",
            "type": "production",
            "class": ProductionAgent,
        },
        {"id": "qa-agent-01", "type": "qa", "class": QAAgent},
        {
            "id": "logistics-agent-01",
            "type": "logistics",
            "class": LogisticsAgent,
        },
        {
            "id": "decision-agent-01",
            "type": "decision",
            "class": DecisionNoiseAgent,
        },
        {"id": "finance-agent-01", "type": "finance", "class": FinanceAgent},
    ]

    for config in default_agents:
        agents[config["id"]] = config["class"](
            agent_id=config["id"],
            redis_client=redis_client,
        )
        logger.info("Initialized agent %s", config["id"])


@app.get("/health")
async def health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "agents": list(agents.keys()),
    }


@app.post("/agents/deploy")
async def deploy_agent(config: AgentConfig) -> Dict[str, Any]:
    try:
        agent_class = get_agent_class(config.agent_type)
        agent = agent_class(
            agent_id=config.agent_id,
            config=config.config,
            redis_client=redis_client,
        )
        agents[config.agent_id] = agent
        await redis_client.set(
            f"agent:config:{config.agent_id}",
            json.dumps(config.dict()),
        )
        return {
            "success": True,
            "agent_id": config.agent_id,
            "status": "deployed",
        }
    except Exception as exc:
        logger.exception("Failed to deploy agent")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/agents/{agent_id}/execute")
async def execute_agent_action(
    agent_id: str, action: AgentAction
) -> AgentResponse:
    if agent_id not in agents:
        raise HTTPException(status_code=404, detail="Agent not found")

    try:
        agent = agents[agent_id]
        result = await agent.execute_action(
            action.action,
            action.parameters,
            action.context,
        )
        activity = {
            "agent_id": agent_id,
            "action": action.action,
            "timestamp": datetime.utcnow().isoformat(),
            "confidence": result.get("confidence", 0),
            "success": result.get("success", False),
        }
        await redis_client.lpush(
            f"agent:activity:{agent_id}",
            json.dumps(activity),
        )
        await redis_client.ltrim(f"agent:activity:{agent_id}", 0, 999)
        return AgentResponse(
            success=result.get("success", False),
            data=result.get("data"),
            confidence=result.get("confidence", 0),
            reasoning=result.get("reasoning"),
            requires_approval=result.get("requires_approval", False),
        )
    except Exception as exc:
        logger.exception("Agent execution failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/agents/{agent_id}/status")
async def get_agent_status(agent_id: str) -> Dict[str, Any]:
    if agent_id not in agents:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent = agents[agent_id]
    activities = await redis_client.lrange(f"agent:activity:{agent_id}", 0, 9)
    recent = [json.loads(item) for item in activities]
    success_count = sum(1 for entry in recent if entry.get("success"))
    avg_confidence = (
        sum(entry.get("confidence", 0) for entry in recent) / len(recent)
        if recent
        else 0
    )

    return {
        "agent_id": agent_id,
        "status": agent.status,
        "mode": agent.mode,
        "metrics": {
            "total_actions": len(recent),
            "success_rate": (
                success_count / len(recent) * 100
            ) if recent else 0,
            "average_confidence": avg_confidence,
            "uptime": agent.get_uptime(),
        },
        "recent_activities": recent[:5],
    }


@app.post("/agents/{agent_id}/control")
async def control_agent(agent_id: str, action: str) -> Dict[str, Any]:
    if agent_id not in agents:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent = agents[agent_id]
    if action == "start":
        await agent.start()
    elif action == "stop":
        await agent.stop()
    elif action == "pause":
        await agent.pause()
    elif action == "resume":
        await agent.resume()
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    return {
        "success": True,
        "agent_id": agent_id,
        "action": action,
        "new_status": agent.status,
    }


@app.websocket("/ws/agents/{agent_id}")
async def agent_websocket(websocket: WebSocket, agent_id: str) -> None:
    await websocket.accept()

    if agent_id not in agents:
        await websocket.close(code=4004, reason="Agent not found")
        return

    pubsub = redis_client.pubsub()
    await pubsub.subscribe(f"agent:events:{agent_id}")

    try:
        while True:
            await websocket.send_json(
                {
                    "type": "heartbeat",
                    "timestamp": datetime.utcnow().isoformat(),
                    "agent_status": agents[agent_id].status,
                }
            )
            message = await pubsub.get_message(ignore_subscribe_messages=True)
            if message:
                await websocket.send_json(
                    {"type": "event", "data": json.loads(message["data"])}
                )
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected for %s", agent_id)
    except Exception as exc:
        logger.error("WebSocket error for %s: %s", agent_id, exc)
    finally:
        await pubsub.unsubscribe(f"agent:events:{agent_id}")


def get_agent_class(agent_type: str):
    registry = {
        "inventory": InventoryAgent,
        "production": ProductionAgent,
        "qa": QAAgent,
        "logistics": LogisticsAgent,
        "decision": DecisionNoiseAgent,
        "finance": FinanceAgent,
    }
    if agent_type not in registry:
        raise ValueError(f"Unknown agent type: {agent_type}")
    return registry[agent_type]


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
