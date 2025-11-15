from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Finance Agent")


class LedgerEntry(BaseModel):
    account: str
    amount: float


@app.post("/ledger")
async def ledger(payload: LedgerEntry):
    return {"account": payload.account, "amount": payload.amount}
