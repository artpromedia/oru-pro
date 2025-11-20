from fastapi.testclient import TestClient
from pathlib import Path
import sys

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.main import app  # noqa: E402

client = TestClient(app)


def test_ledger_round_trip():
    payload = {"account": "AR-100", "amount": 123.45}
    response = client.post("/ledger", json=payload)
    assert response.status_code == 200
    assert response.json() == payload


def test_ledger_requires_amount():
    response = client.post("/ledger", json={"account": "AR-101"})
    assert response.status_code == 422
    body = response.json()
    assert body["detail"][0]["loc"][-1] == "amount"
