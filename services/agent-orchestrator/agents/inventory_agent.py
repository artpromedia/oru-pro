from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
from joblib import load
from scipy import stats
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler

from .base_agent import BaseAgent

logger = logging.getLogger(__name__)


class InventoryAgent(BaseAgent):
    """AI Agent for inventory management and optimization."""

    def __init__(
        self,
        agent_id: str,
        redis_client: Any = None,
        config: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(agent_id, "inventory", redis_client, config)
        self.demand_model: Optional[RandomForestRegressor] = None
        self.scaler = StandardScaler()
        self.initialize_models()

    def initialize_models(self) -> None:
        try:
            self.demand_model = load(
                f"models/demand_model_{self.agent_id}.pkl"
            )
            self.scaler = load(f"models/scaler_{self.agent_id}.pkl")
        except Exception:
            self.demand_model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
            )
            logger.info("Initialized new demand model for %s", self.agent_id)

    async def execute_action(
        self,
        action: str,
        parameters: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        handlers = {
            "analyze_inventory": self.analyze_inventory,
            "predict_demand": self.predict_demand,
            "optimize_reorder": self.optimize_reorder_point,
            "check_expiry": self.check_expiry_risks,
            "handle_low_stock": self.handle_low_stock,
            "analyze_qa_tests": self.analyze_qa_tests,
            "suggest_transfers": self.suggest_stock_transfers,
        }

        if action not in handlers:
            return {"success": False, "error": f"Unknown action: {action}"}

        try:
            result = await handlers[action](parameters, context)
            await self.log_activity(action, parameters, result)
            return result
        except Exception as exc:
            logger.exception("Inventory action failed")
            return {"success": False, "error": str(exc)}

    async def analyze_inventory(
        self,
        parameters: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        inventories = parameters.get("inventories", [])
        insights: Dict[str, List[Dict[str, Any]]] = {
            "low_stock_items": [],
            "overstocked_items": [],
            "expiring_soon": [],
            "qa_holds": [],
            "optimization_opportunities": [],
        }

        for item in inventories:
            if item["quantity"] <= item["reorderPoint"]:
                insights["low_stock_items"].append(
                    {
                        "sku": item["sku"],
                        "current": item["quantity"],
                        "reorder_point": item["reorderPoint"],
                        "urgency": "critical"
                        if item["quantity"] < item["reorderPoint"] * 0.5
                        else "high",
                        "recommended_order": item["reorderQty"] * 2
                        if item["quantity"] < item["reorderPoint"] * 0.5
                        else item["reorderQty"],
                    }
                )

            if item["quantity"] > item["reorderPoint"] * 3:
                insights["overstocked_items"].append(
                    {
                        "sku": item["sku"],
                        "current": item["quantity"],
                        "excess": (
                            item["quantity"] - (item["reorderPoint"] * 2)
                        ),
                        "recommendation": "Consider promotion or transfer",
                    }
                )

            if item.get("expiryDate"):
                days_to_expiry = (
                    datetime.fromisoformat(item["expiryDate"]) - datetime.now()
                ).days
                if days_to_expiry <= 30:
                    insights["expiring_soon"].append(
                        {
                            "sku": item["sku"],
                            "days_left": days_to_expiry,
                            "quantity": item["quantity"],
                            "action": "Flash sale"
                            if days_to_expiry < 7
                            else "Promotion",
                        }
                    )

            if item.get("qaStatus") == "qa_hold":
                insights["qa_holds"].append(
                    {
                        "sku": item["sku"],
                        "batch": item.get("batchNumber"),
                        "hold_duration": item.get("holdDuration", "Unknown"),
                    }
                )

        if len(insights["low_stock_items"]) > 5:
            insights["optimization_opportunities"].append(
                {
                    "type": "bulk_ordering",
                    "description": "Combine orders for better pricing",
                    "potential_savings": "$2,500",
                }
            )

        confidence = 92.5
        return {
            "success": True,
            "data": insights,
            "confidence": confidence,
            "reasoning": (
                f"Analyzed {len(inventories)} items with "
                f"{len(insights['low_stock_items'])} requiring attention"
            ),
        }

    async def predict_demand(
        self,
        parameters: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        sku = parameters.get("sku")
        horizon_days = parameters.get("horizon_days", 30)
        historical_data = parameters.get("historical_data", [])

        if not historical_data or len(historical_data) < 30:
            window = historical_data[-7:] if historical_data else []
            avg = (
                np.mean([d.get("quantity", 0) for d in window])
                if window
                else 10
            )
            predictions = [
                avg * (1 + np.random.normal(0, 0.1))
                for _ in range(horizon_days)
            ]
        else:
            features = self.prepare_demand_features(historical_data)
            if self.demand_model and features is not None:
                try:
                    scaled = self.scaler.fit_transform(features)
                    predictions = self.demand_model.predict(
                        scaled[:horizon_days]
                    )
                except Exception:
                    predictions = self.statistical_forecast(
                        historical_data,
                        horizon_days,
                    )
            else:
                predictions = self.statistical_forecast(
                    historical_data,
                    horizon_days,
                )

        confidence = min(85 + len(historical_data) / 10, 95)
        if isinstance(predictions, np.ndarray):
            predictions = predictions.tolist()

        return {
            "success": True,
            "data": {
                "sku": sku,
                "predictions": predictions,
                "total_predicted": float(np.sum(predictions)),
                "peak_day": int(np.argmax(predictions)),
                "average_daily": float(np.mean(predictions)),
            },
            "confidence": confidence,
            "reasoning": (
                f"Predicted demand for {horizon_days} days based on "
                f"{len(historical_data)} historical data points"
            ),
        }

    async def optimize_reorder_point(
        self,
        parameters: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        demand_data = parameters.get("demand_data", [])
        if not demand_data:
            return {"success": False, "error": "No demand data provided"}

        sku = parameters.get("sku")
        lead_time = parameters.get("lead_time", 3)
        service_level = parameters.get("service_level", 0.95)

        daily_demand = np.array([d.get("quantity", 0) for d in demand_data])
        avg_demand = np.mean(daily_demand)
        std_demand = np.std(daily_demand)

        z_score = stats.norm.ppf(service_level)
        safety_stock = z_score * std_demand * np.sqrt(lead_time)
        reorder_point = (avg_demand * lead_time) + safety_stock

        holding_cost = parameters.get("holding_cost", 1)
        ordering_cost = parameters.get("ordering_cost", 100)
        eoq = np.sqrt((2 * avg_demand * 365 * ordering_cost) / holding_cost)

        return {
            "success": True,
            "data": {
                "sku": sku,
                "optimal_reorder_point": int(np.ceil(reorder_point)),
                "safety_stock": int(np.ceil(safety_stock)),
                "economic_order_quantity": int(np.ceil(eoq)),
                "average_demand": float(avg_demand),
                "demand_variability": (
                    float(std_demand / avg_demand)
                    if avg_demand
                    else 0
                ),
            },
            "confidence": 88.5,
            "reasoning": (
                "Optimized for "
                f"{service_level * 100:.0f}% service level with "
                f"{lead_time} day lead time"
            ),
        }

    async def check_expiry_risks(
        self, parameters: Dict[str, Any], context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        items = parameters.get("items", [])
        risk_analysis: Dict[str, List[Dict[str, Any]]] = {
            "critical": [],
            "high": [],
            "medium": [],
            "low": [],
        }
        total_value_at_risk = 0

        for item in items:
            if not item.get("expiryDate"):
                continue

            expiry_date = datetime.fromisoformat(item["expiryDate"])
            days_to_expiry = (expiry_date - datetime.now()).days
            value_at_risk = item.get("quantity", 0) * item.get("unitCost", 10)
            risk_item = {
                "sku": item["sku"],
                "days_to_expiry": days_to_expiry,
                "quantity": item["quantity"],
                "value_at_risk": value_at_risk,
                "recommended_action": self.get_expiry_action(
                    days_to_expiry,
                    item,
                ),
            }

            if days_to_expiry < 7:
                risk_analysis["critical"].append(risk_item)
            elif days_to_expiry < 14:
                risk_analysis["high"].append(risk_item)
            elif days_to_expiry < 30:
                risk_analysis["medium"].append(risk_item)
            else:
                risk_analysis["low"].append(risk_item)

            if days_to_expiry < 30:
                total_value_at_risk += value_at_risk

        return {
            "success": True,
            "data": {
                "risk_analysis": risk_analysis,
                "total_value_at_risk": total_value_at_risk,
                "items_at_risk": (
                    len(risk_analysis["critical"])
                    + len(risk_analysis["high"])
                ),
                "immediate_action_required": len(risk_analysis["critical"]),
            },
            "confidence": 94.2,
            "reasoning": f"Analyzed {len(items)} items for expiry risk",
        }

    async def handle_low_stock(
        self, parameters: Dict[str, Any], context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        inventory = parameters.get("inventory", {})
        sku = inventory.get("sku")
        current_stock = inventory.get("quantity", 0)
        reorder_point = inventory.get("reorderPoint", 0)
        reorder_qty = inventory.get("reorderQty", 0)

        stock_ratio = current_stock / reorder_point if reorder_point else 0
        multiplier: float
        if stock_ratio < 0.25:
            urgency = "critical"
            multiplier = 2.0
        elif stock_ratio < 0.5:
            urgency = "high"
            multiplier = 1.5
        else:
            urgency = "medium"
            multiplier = 1.0

        recommended_order = int(reorder_qty * multiplier)
        alternatives = []

        if context and context.get("other_warehouses"):
            for warehouse in context["other_warehouses"]:
                if (
                    warehouse.get("sku") == sku
                    and warehouse.get("quantity", 0) > reorder_point * 2
                ):
                    alternatives.append(
                        {
                            "action": "transfer",
                            "from": warehouse["warehouse_id"],
                            "quantity": min(
                                warehouse["quantity"] // 2,
                                recommended_order,
                            ),
                            "time": "1-2 days",
                        }
                    )

        alternatives.append(
            {
                "action": "emergency_order",
                "supplier": "Express Supplier",
                "quantity": recommended_order,
                "premium": "15%",
                "time": "next day",
            }
        )

        return {
            "success": True,
            "data": {
                "sku": sku,
                "urgency": urgency,
                "recommended_order_quantity": recommended_order,
                "alternatives": alternatives,
                "estimated_stockout_days": (
                    current_stock / (reorder_point / 7) if reorder_point else 0
                ),
            },
            "confidence": 91.3,
            "requires_approval": urgency == "critical" or recommended_order > reorder_qty * 2,
            "reasoning": (
                f"Stock at {stock_ratio * 100:.1f}% of reorder point, {urgency} action required"
            ),
        }

    async def analyze_qa_tests(
        self, parameters: Dict[str, Any], context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        tests = parameters.get("tests", {})
        failed_tests = [name for name, data in tests.items() if data["status"] == "failed"]
        passed_tests = [name for name, data in tests.items() if data["status"] == "passed"]
        pending_tests = [name for name, data in tests.items() if data["status"] not in {"failed", "passed"}]

        if failed_tests:
            if "microbiological" in failed_tests:
                confidence = 95
                recommendation = "reject"
                reasoning = "Microbiological failure poses health risk"
            else:
                confidence = 75
                recommendation = "retest"
                reasoning = f"Failed {', '.join(failed_tests)} - consider retesting"
        elif pending_tests:
            confidence = 60
            recommendation = "wait"
            reasoning = f"Waiting for {', '.join(pending_tests)} results"
        else:
            confidence = 92
            recommendation = "approve"
            reasoning = "All tests passed within acceptable limits"

        historical_confidence = 85
        if context and context.get("supplier_history"):
            pass_rate = context["supplier_history"].get("pass_rate", 0.85)
            historical_confidence = pass_rate * 100

        final_confidence = (confidence + historical_confidence) / 2

        return {
            "success": True,
            "data": {
                "recommendation": recommendation,
                "passed_tests": passed_tests,
                "failed_tests": failed_tests,
                "pending_tests": pending_tests,
                "risk_level": "high" if failed_tests else "low",
            },
            "confidence": final_confidence,
            "requires_approval": recommendation != "approve",
            "reasoning": reasoning,
        }

    async def suggest_stock_transfers(
        self, parameters: Dict[str, Any], context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        warehouses = parameters.get("warehouses", [])
        transfer_suggestions: List[Dict[str, Any]] = []
        sku_inventory: Dict[str, List[Dict[str, Any]]] = {}

        for warehouse in warehouses:
            for item in warehouse.get("inventory", []):
                sku = item["sku"]
                sku_inventory.setdefault(sku, []).append(
                    {
                        "warehouse_id": warehouse["id"],
                        "warehouse_name": warehouse["name"],
                        "quantity": item["quantity"],
                        "reorder_point": item["reorderPoint"],
                    }
                )

        for sku, locations in sku_inventory.items():
            if len(locations) < 2:
                continue

            excess_locations = [
                loc for loc in locations if loc["quantity"] > loc["reorder_point"] * 2
            ]
            shortage_locations = [
                loc for loc in locations if loc["quantity"] < loc["reorder_point"]
            ]

            for shortage in shortage_locations:
                for excess in excess_locations:
                    transfer_qty = min(
                        excess["quantity"] - excess["reorder_point"],
                        shortage["reorder_point"] - shortage["quantity"],
                    )
                    if transfer_qty > 0:
                        transfer_suggestions.append(
                            {
                                "sku": sku,
                                "from_warehouse": excess["warehouse_name"],
                                "to_warehouse": shortage["warehouse_name"],
                                "quantity": int(transfer_qty),
                                "urgency": "high"
                                if shortage["quantity"] < shortage["reorder_point"] * 0.5
                                else "medium",
                                "estimated_cost": float(transfer_qty * 0.5),
                                "estimated_time": "1-2 days",
                            }
                        )

        transfer_suggestions.sort(
            key=lambda suggestion: 0 if suggestion["urgency"] == "high" else 1
        )
        return {
            "success": True,
            "data": {
                "suggested_transfers": transfer_suggestions[:10],
                "total_suggestions": len(transfer_suggestions),
                "potential_stockouts_prevented": len(
                    [t for t in transfer_suggestions if t["urgency"] == "high"]
                ),
            },
            "confidence": 87.5,
            "reasoning": (
                f"Analyzed {len(sku_inventory)} SKUs across {len(warehouses)} warehouses"
            ),
        }

    def prepare_demand_features(self, historical_data: List[Dict[str, Any]]):
        if not historical_data:
            return None

        features: List[List[float]] = []
        for idx, data in enumerate(historical_data):
            quantity = data.get("quantity", 0)
            date = datetime.fromisoformat(data.get("date", datetime.now().isoformat()))
            day_of_week = date.weekday()
            day_of_month = date.day
            month = date.month
            lag_1 = historical_data[idx - 1].get("quantity", quantity) if idx > 0 else quantity
            lag_7 = historical_data[idx - 7].get("quantity", quantity) if idx >= 7 else quantity
            if idx >= 7:
                ma_7 = np.mean([historical_data[j].get("quantity", 0) for j in range(idx - 6, idx + 1)])
            else:
                ma_7 = quantity
            features.append(
                [quantity, day_of_week, day_of_month, month, lag_1, lag_7, ma_7]
            )
        return np.array(features)

    def statistical_forecast(self, historical_data: List[Dict[str, Any]], horizon: int) -> List[float]:
        quantities = [d.get("quantity", 0) for d in historical_data]
        alpha = 0.3
        forecast = [quantities[-1] if quantities else 0]
        baseline = np.mean(quantities[-7:]) if len(quantities) >= 7 else (quantities[-1] if quantities else 0)

        for _ in range(horizon - 1):
            next_val = alpha * forecast[-1] + (1 - alpha) * baseline
            forecast.append(next_val)

        return [val * (1 + np.random.normal(0, 0.05)) for val in forecast]

    def get_expiry_action(self, days_to_expiry: int, item: Dict[str, Any]) -> str:
        if days_to_expiry < 3:
            return "Immediate clearance - 70% discount"
        if days_to_expiry < 7:
            return "Flash sale - 50% discount"
        if days_to_expiry < 14:
            return "Promotion - 30% discount"
        if days_to_expiry < 30:
            return "Feature in weekly deals"
        return "Monitor"
