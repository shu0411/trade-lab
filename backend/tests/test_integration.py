import os
import pytest
from app.models.entry import EntryCreate, entry_to_dynamo
from app.services.dynamo_entry_store import DynamoEntryStore

pytestmark = pytest.mark.skipif(
    not os.environ.get("AWS_ENDPOINT_URL"),
    reason="requires LocalStack (AWS_ENDPOINT_URL not set)",
)

ENTRY = EntryCreate(
    type="entry",
    date="2026-06-24",
    ticker="7203",
    tickerName="トヨタ自動車",
    pattern="押し目",
    entryPrice=3000.0,
    targetPct=10.0,
    stopPct=5.0,
    reasons=["25日線反発"],
    reasonNote="",
)


@pytest.fixture
def store():
    return DynamoEntryStore()


def test_create_and_get(store):
    item = entry_to_dynamo(ENTRY)
    store.create(item)
    fetched = store.get(item["id"])
    assert fetched is not None
    assert fetched["ticker"] == "7203"
    store.delete(item["id"])


def test_list_all(store):
    item = entry_to_dynamo(ENTRY)
    store.create(item)
    items = store.list_all()
    assert any(i["id"] == item["id"] for i in items)
    store.delete(item["id"])


def test_update(store):
    from app.models.entry import ResultUpdate
    item = entry_to_dynamo(ENTRY)
    store.create(item)

    from app.models.entry import ResultUpdate
    body = ResultUpdate(exitPrice=3300.0, result="success", resultNote="目標達成")
    updated = store.update(item["id"], body)
    assert updated["status"] == "closed"
    assert updated["result"] == "success"
    store.delete(item["id"])


def test_delete(store):
    item = entry_to_dynamo(ENTRY)
    store.create(item)
    store.delete(item["id"])
    assert store.get(item["id"]) is None
