import json
import os
import sqlite3
from datetime import datetime
from typing import Optional

from app.models.entry import ResultUpdate

DB_PATH = os.environ.get("SQLITE_DB_PATH", "trade_lab.db")

_conn: sqlite3.Connection | None = None


def _get_conn() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        _conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        _conn.execute(
            "CREATE TABLE IF NOT EXISTS entries (pk TEXT PRIMARY KEY, data TEXT NOT NULL)"
        )
        _conn.commit()
    return _conn


class SqliteEntryStore:
    def list_all(self) -> list[dict]:
        rows = _get_conn().execute("SELECT data FROM entries").fetchall()
        return [json.loads(r[0]) for r in rows]

    def get(self, entry_id: str) -> Optional[dict]:
        row = (
            _get_conn()
            .execute("SELECT data FROM entries WHERE pk = ?", (f"ENTRY#{entry_id}",))
            .fetchone()
        )
        return json.loads(row[0]) if row else None

    def create(self, item: dict) -> dict:
        conn = _get_conn()
        conn.execute(
            "INSERT INTO entries (pk, data) VALUES (?, ?)",
            (item["pk"], json.dumps(item)),
        )
        conn.commit()
        return item

    def update(self, entry_id: str, body: ResultUpdate) -> dict:
        conn = _get_conn()
        row = conn.execute(
            "SELECT data FROM entries WHERE pk = ?", (f"ENTRY#{entry_id}",)
        ).fetchone()
        item = json.loads(row[0])
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
        conn.execute(
            "UPDATE entries SET data = ? WHERE pk = ?",
            (json.dumps(item), f"ENTRY#{entry_id}"),
        )
        conn.commit()
        return item

    def delete(self, entry_id: str) -> None:
        conn = _get_conn()
        conn.execute("DELETE FROM entries WHERE pk = ?", (f"ENTRY#{entry_id}",))
        conn.commit()
