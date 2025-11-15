from __future__ import annotations

import asyncio
import importlib
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[3]
SDK_PATH = REPO_ROOT / "packages" / "agent-sdk"
if SDK_PATH.exists() and str(SDK_PATH) not in sys.path:
    sys.path.append(str(SDK_PATH))

agent_sdk_module = importlib.import_module("oru_agent_sdk")
AgentContext = agent_sdk_module.AgentContext
BaseAgent = agent_sdk_module.BaseAgent


@dataclass(slots=True)
class InventoryItem:
    sku: str
    facility_id: str
    quantity: float
    days_until_expiry: int
    temperature_zone: str
    predicted_date: Optional[datetime] = None
    daily_demand: float = 0.0


@dataclass(slots=True)
class TemperatureExcursion:
    sensor_id: str
    sku: str
    temperature: float
    threshold: float
    duration_minutes: int
    location: str


@dataclass(slots=True)
class QAHold:
    batch_id: str
    sku: str
    hold_started_at: datetime
    supplier: str
    tests: Dict[str, Any]


@dataclass(slots=True)
class Alert:
    type: str
    severity: str
    message: Optional[str] = None
    items: Optional[List[InventoryItem]] = None
    item: Optional[InventoryItem] = None
    suggested_action: Optional[str] = None
    suggested_actions: Optional[List[str]] = None
    auto_create_task: bool = False
    affected_inventory: Optional[List[TemperatureExcursion]] = None
    compliance_risk: bool = False
    predicted_stockout_date: Optional[datetime] = None
    recommended_order_qty: Optional[float] = None


class InventoryCoPilot(BaseAgent):
    """Phase 1 monitoring and alerting agent for F&B inventory"""

    def __init__(self) -> None:
        context = AgentContext(
            name="inventory-copilot-v1",
            queue="inventory.copilot",
            metadata={
                "mode": "copilot",
                "monitoring_interval": 300,
                "alert_channels": ["email", "slack", "in_app"],
                "f&b_specific": True,
            },
        )
        super().__init__(context=context)

    async def monitor_inventory(self) -> List[Alert]:
        """Phase 1: Detect operational issues and route alerts to humans."""

        alerts: List[Alert] = []

        qa_holds = await self.check_qa_hold_duration()
        if qa_holds:
            alerts.append(
                Alert(
                    type="QA_HOLD_EXCEEDED",
                    severity="high",
                    items=[InventoryItem(**{
                        "sku": hold.sku,
                        "facility_id": "qa_lab",
                        "quantity": 0,
                        "days_until_expiry": 10,
                        "temperature_zone": "ambient",
                    }) for hold in qa_holds],
                    suggested_action="Review QA test results",
                    auto_create_task=True,
                    message=f"{len(qa_holds)} QA holds exceeded SLA",
                )
            )

        expiring = await self.check_expiry_dates()
        for item in expiring:
            if item.days_until_expiry < 7:
                alerts.append(
                    Alert(
                        type="EXPIRY_IMMINENT",
                        severity="critical",
                        item=item,
                        suggested_actions=[
                            "Initiate clearance sale",
                            "Donate to food bank",
                            "Process return to supplier",
                        ],
                        message=(
                            f"{item.sku} expires in "
                            f"{item.days_until_expiry}d"
                        ),
                    )
                )

        temp_issues = await self.check_temperature_compliance()
        if temp_issues:
            alerts.append(
                Alert(
                    type="TEMPERATURE_EXCURSION",
                    severity="critical",
                    affected_inventory=temp_issues,
                    compliance_risk=True,
                    message="Cold chain excursion detected",
                )
            )

        low_stock = await self.predict_stockouts()
        for item in low_stock:
            alerts.append(
                Alert(
                    type="STOCKOUT_RISK",
                    severity="medium",
                    item=item,
                    predicted_stockout_date=item.predicted_date,
                    recommended_order_qty=self.calculate_reorder(item),
                    message="{sku} will stock out by {date}".format(
                        sku=item.sku,
                        date=(
                            item.predicted_date.date()
                            if item.predicted_date
                            else "N/A"
                        ),
                    ),
                )
            )

        return alerts

    async def suggest_qa_approval(self, qa_hold: QAHold) -> Dict[str, Any]:
        """Assist QA managers with review flows."""

        await asyncio.sleep(0)
        return {
            "test_results_summary": self.summarize_tests(qa_hold),
            "historical_pass_rate": self.get_supplier_history(qa_hold),
            "risk_assessment": self.assess_risk(qa_hold),
            "recommendation": self.generate_recommendation(qa_hold),
            "confidence": 0.85,
            "requires_human_approval": True,
        }

    async def check_qa_hold_duration(self) -> List[QAHold]:
        await asyncio.sleep(0)
        now = datetime.utcnow()
        return [
            QAHold(
                batch_id="BATCH-9821",
                sku="FROZEN-EMPANADA",
                hold_started_at=now - timedelta(hours=9),
                supplier="Verdant Greens Co.",
                tests={"micro": "pending", "organoleptic": "pass"},
            )
        ]

    async def check_expiry_dates(self) -> List[InventoryItem]:
        await asyncio.sleep(0)
        return [
            InventoryItem(
                sku="CREAM-001",
                facility_id="DFW_F1",
                quantity=420,
                days_until_expiry=5,
                temperature_zone="chilled",
                predicted_date=datetime.utcnow() + timedelta(days=5),
                daily_demand=120,
            ),
            InventoryItem(
                sku="SALAD-KALE",
                facility_id="LA_F7",
                quantity=180,
                days_until_expiry=3,
                temperature_zone="chilled",
                predicted_date=datetime.utcnow() + timedelta(days=3),
                daily_demand=90,
            ),
        ]

    async def check_temperature_compliance(self) -> List[TemperatureExcursion]:
        await asyncio.sleep(0)
        return [
            TemperatureExcursion(
                sensor_id="SENSOR-33A",
                sku="SALMON-PORTION",
                temperature=-12.4,
                threshold=-15.0,
                duration_minutes=37,
                location="Freezer Tunnel 2",
            )
        ]

    async def predict_stockouts(self) -> List[InventoryItem]:
        await asyncio.sleep(0)
        df = pd.DataFrame(
            [
                {"sku": "YEAST-BLK", "qty": 90, "daily_demand": 40},
                {"sku": "TOMATO-PUREE", "qty": 330, "daily_demand": 60},
            ]
        )
        df["days_left"] = (df["qty"] / df["daily_demand"]).round(1)
        forecasts: List[InventoryItem] = []
        for row in df.itertuples():
            predicted_date = datetime.utcnow() + timedelta(
                days=float(row.days_left)
            )
            forecasts.append(
                InventoryItem(
                    sku=row.sku,
                    facility_id="AUTO",
                    quantity=float(row.qty),
                    days_until_expiry=int(row.days_left),
                    temperature_zone="ambient",
                    predicted_date=predicted_date,
                    daily_demand=float(row.daily_demand),
                )
            )
        return [item for item in forecasts if item.days_until_expiry < 7]

    def calculate_reorder(self, item: InventoryItem) -> float:
        safety_factor = 1.35
        lead_time_days = 5
        recommended = (item.daily_demand * lead_time_days) * safety_factor
        return round(recommended, 2)

    def summarize_tests(self, qa_hold: QAHold) -> Dict[str, str]:
        return {
            "micro": qa_hold.tests.get("micro", "pending"),
            "organoleptic": qa_hold.tests.get("organoleptic", "pending"),
            "packaging": qa_hold.tests.get("packaging", "not_run"),
        }

    def get_supplier_history(self, qa_hold: QAHold) -> Dict[str, float]:
        history = pd.Series([0.98, 0.94, 0.91, 0.97])
        return {
            "supplier": qa_hold.supplier,
            "rolling_pass_rate": round(history.mean(), 2),
            "last_30_days": 0.93,
        }

    def assess_risk(self, qa_hold: QAHold) -> Dict[str, Any]:
        delta = datetime.utcnow() - qa_hold.hold_started_at
        age_hours = delta.total_seconds() / 3600
        return {
            "aging_hours": round(age_hours, 1),
            "risk": "high" if age_hours > 8 else "medium",
            "shelf_life_impact": "moderate",
        }

    def generate_recommendation(self, qa_hold: QAHold) -> str:
        micro_status = qa_hold.tests.get("micro")
        if micro_status == "fail":
            return "Reject batch and trigger supplier corrective action"
        if micro_status == "pending":
            return "Maintain hold until micro testing completes"
        return "Approve with expedited release and temperature monitoring"
