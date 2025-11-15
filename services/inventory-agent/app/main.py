from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Inventory Agent")


class InventoryEvent(BaseModel):
    facility_id: str
    sku: str
    delta: float


@app.post("/qa/hold")
async def qa_hold(event: InventoryEvent):
    return {"status": "hold_applied", "event": event.model_dump()}
