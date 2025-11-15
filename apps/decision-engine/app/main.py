from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Decision Engine")


class ForecastRequest(BaseModel):
    sku: str
    demand: list[int]


@app.post("/forecast")
async def forecast(payload: ForecastRequest):
    horizon = len(payload.demand)
    avg = sum(payload.demand) / max(horizon, 1)
    return {"sku": payload.sku, "forecast": [avg] * horizon}
