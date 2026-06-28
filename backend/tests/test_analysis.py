import pytest
from app.models.entry import EntryCreate, entry_to_dynamo

BASE = {
    "type": "entry",
    "date": "2026-06-24",
    "ticker": "7203",
    "tickerName": "トヨタ自動車",
    "pattern": "押し目",
    "entryPrice": 3000.0,
    "targetPct": 10.0,
    "stopPct": 5.0,
    "reasons": ["25日線反発"],
    "reasonNote": "",
}


def _seed(
    store, *, type="entry", pattern="押し目", status="open", result=None, reasons=None
):
    payload = {
        **BASE,
        "type": type,
        "pattern": pattern,
        "reasons": reasons or ["25日線反発"],
    }
    if type == "pass":
        payload.update({"entryPrice": None, "targetPct": None, "stopPct": None})
    item = entry_to_dynamo(EntryCreate(**payload))
    if status == "closed":
        item.update(
            {"status": "closed", "result": result, "closedAt": "2026-06-25T00:00:00"}
        )
    store.create(item)
    return item


def test_summary_empty(client):
    data = client.get("/analysis/summary").json()
    assert data == {
        "total": 0,
        "open": 0,
        "closed": 0,
        "successRate": None,
        "passCount": 0,
    }


def test_summary(client, store):
    _seed(store, status="closed", result="success")
    _seed(store, status="closed", result="failure")
    _seed(store, status="open")
    _seed(store, type="pass")

    data = client.get("/analysis/summary").json()
    assert data["total"] == 3
    assert data["open"] == 1
    assert data["closed"] == 2
    assert data["passCount"] == 1
    assert data["successRate"] == 50.0


def test_patterns(client, store):
    _seed(store, pattern="押し目", status="closed", result="success")
    _seed(store, pattern="ブレイクアウト", status="closed", result="failure")

    data = {p["pattern"]: p for p in client.get("/analysis/patterns").json()}
    assert data["押し目"]["successRate"] == 100.0
    assert data["ブレイクアウト"]["successRate"] == 0.0
    assert data["その他"]["successRate"] is None


def test_reasons(client, store):
    _seed(store, reasons=["25日線反発"], status="closed", result="success")
    _seed(store, reasons=["75日線反発"], status="closed", result="failure")

    data = {r["reason"]: r for r in client.get("/analysis/reasons").json()}
    assert data["25日線反発"]["successRate"] == 100.0
    assert data["75日線反発"]["successRate"] == 0.0
    assert data["ゴールデンクロス"]["total"] == 0
