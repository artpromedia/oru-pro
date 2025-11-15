from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Logistics Agent")


class ShipmentPlan(BaseModel):
    lane: str
    temperature: str = "ambient"


@app.post("/tms/create")
async def create_shipment(payload: ShipmentPlan):
    return {"lane": payload.lane, "temperature": payload.temperature}
