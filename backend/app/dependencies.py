import os

from app.services.entry_store import EntryStore


def get_entry_store() -> EntryStore:
    if os.environ.get("STORE_BACKEND") == "dynamodb":
        from app.services.dynamo_entry_store import DynamoEntryStore

        return DynamoEntryStore()
    from app.services.sqlite_entry_store import SqliteEntryStore

    return SqliteEntryStore()
