from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Procurement Agent")


class PurchaseOrder(BaseModel):
    supplier: str
    total: float


@app.post("/po/issue")
async def issue_po(payload: PurchaseOrder):
    return {
        "supplier": payload.supplier,
        "total": payload.total,
        "status": "issued",
    }
