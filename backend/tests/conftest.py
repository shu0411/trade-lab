import pytest
from datetime import datetime
from typing import Optional
from fastapi.testclient import TestClient

from app.main import app
from app.dependencies import get_entry_store
from app.models.entry import ResultUpdate


class InMemoryEntryStore:
    def __init__(self):
        self._items: dict[str, dict] = {}

    def list_all(self) -> list[dict]:
        return list(self._items.values())

    def get(self, entry_id: str) -> Optional[dict]:
        return self._items.get(f"ENTRY#{entry_id}")

    def create(self, item: dict) -> dict:
        self._items[item["pk"]] = item
        return item

    def update(self, entry_id: str, body: ResultUpdate) -> dict:
        item = self._items[f"ENTRY#{entry_id}"]
        item.update(
            {
                "exitPrice": str(body.exitPrice),
                "maxGainPct": (
                    str(body.maxGainPct) if body.maxGainPct is not None else None
                ),
                "maxLossPct": (
                    str(body.maxLossPct) if body.maxLossPct is not None else None
                ),
                "result": body.result,
                "resultNote": body.resultNote,
                "status": "closed",
                "closedAt": datetime.utcnow().isoformat(),
            }
        )
        return item

    def delete(self, entry_id: str) -> None:
        self._items.pop(f"ENTRY#{entry_id}", None)


@pytest.fixture
def store():
    return InMemoryEntryStore()


@pytest.fixture
def client(store):
    app.dependency_overrides[get_entry_store] = lambda: store
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
