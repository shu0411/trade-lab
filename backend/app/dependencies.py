from app.services.dynamo_entry_store import DynamoEntryStore


def get_entry_store() -> DynamoEntryStore:
    return DynamoEntryStore()
