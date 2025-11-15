from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Production Agent")


class BomPlan(BaseModel):
    bom_code: str
    quantity: int


@app.post("/plan")
async def plan(payload: BomPlan):
    return {
        "bom": payload.bom_code,
        "quantity": payload.quantity,
        "status": "planned",
    }
