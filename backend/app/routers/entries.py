from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from app.models.entry import EntryCreate, ResultUpdate, entry_to_dynamo, dynamo_to_response
from app.services.entry_store import EntryStore
from app.dependencies import get_entry_store

router = APIRouter()


@router.get("")
def list_entries(
    type: Optional[str] = None,
    status: Optional[str] = None,
    store: EntryStore = Depends(get_entry_store),
):
    items = store.list_all()
    if type:
        items = [i for i in items if i.get("type") == type]
    if status:
        items = [i for i in items if i.get("status") == status]
    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return [dynamo_to_response(i) for i in items]


@router.post("", status_code=201)
def create_entry(body: EntryCreate, store: EntryStore = Depends(get_entry_store)):
    item = entry_to_dynamo(body)
    store.create(item)
    return dynamo_to_response(item)


@router.get("/{entry_id}")
def get_entry(entry_id: str, store: EntryStore = Depends(get_entry_store)):
    item = store.get(entry_id)
    if not item:
        raise HTTPException(status_code=404, detail="Entry not found")
    return dynamo_to_response(item)


@router.put("/{entry_id}")
def update_entry(entry_id: str, body: ResultUpdate, store: EntryStore = Depends(get_entry_store)):
    if not store.get(entry_id):
        raise HTTPException(status_code=404, detail="Entry not found")
    return dynamo_to_response(store.update(entry_id, body))


@router.delete("/{entry_id}", status_code=204)
def delete_entry(entry_id: str, store: EntryStore = Depends(get_entry_store)):
    if not store.get(entry_id):
        raise HTTPException(status_code=404, detail="Entry not found")
    store.delete(entry_id)
