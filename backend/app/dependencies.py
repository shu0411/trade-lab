import os

from app.services.entry_store import EntryStore
from app.services.quote_client import QuoteClient


def get_entry_store() -> EntryStore:
    if os.environ.get("STORE_BACKEND") == "dynamodb":
        from app.services.dynamo_entry_store import DynamoEntryStore

        return DynamoEntryStore()
    from app.services.sqlite_entry_store import SqliteEntryStore

    return SqliteEntryStore()


def get_quote_client() -> QuoteClient:
    from app.services.quote_client import YahooFinanceQuoteClient

    return YahooFinanceQuoteClient()
