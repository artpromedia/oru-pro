from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Project Agent")


class MilestoneUpdate(BaseModel):
    project_id: str
    progress: float


@app.post("/update")
async def update(payload: MilestoneUpdate):
    return {"project": payload.project_id, "progress": payload.progress}
