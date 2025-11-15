from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="HRM Agent")


class TimeOffRequest(BaseModel):
    employee_id: str
    days: int


@app.post("/timeoff")
async def timeoff(payload: TimeOffRequest):
    return {"employee": payload.employee_id, "days": payload.days}
