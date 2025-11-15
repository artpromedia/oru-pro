from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Decision Noise Agent")


class BiasProbe(BaseModel):
    scenario: str
    signal: float


@app.post("/detect")
async def detect(payload: BiasProbe):
    return {"scenario": payload.scenario, "score": 1 - payload.signal}
