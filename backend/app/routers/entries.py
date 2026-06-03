import os
import boto3
from boto3.dynamodb.conditions import Key
from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import Optional

from app.models.entry import EntryCreate, ResultUpdate, entry_to_dynamo, dynamo_to_response

router = APIRouter()

TABLE_NAME = os.environ.get("TABLE_NAME", "trade-lab-hypotheses")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


@router.get("")
def list_entries(type: Optional[str] = None, status: Optional[str] = None):
    result = table.scan()
    items = result.get("Items", [])
    while "LastEvaluatedKey" in result:
        result = table.scan(ExclusiveStartKey=result["LastEvaluatedKey"])
        items.extend(result.get("Items", []))

    if type:
        items = [i for i in items if i.get("type") == type]
    if status:
        items = [i for i in items if i.get("status") == status]

    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return [dynamo_to_response(i) for i in items]


@router.post("", status_code=201)
def create_entry(body: EntryCreate):
    item = entry_to_dynamo(body)
    table.put_item(Item=item)
    return dynamo_to_response(item)


@router.get("/{entry_id}")
def get_entry(entry_id: str):
    res = table.get_item(Key={"pk": f"ENTRY#{entry_id}"})
    item = res.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Entry not found")
    return dynamo_to_response(item)


@router.put("/{entry_id}")
def update_entry(entry_id: str, body: ResultUpdate):
    res = table.get_item(Key={"pk": f"ENTRY#{entry_id}"})
    item = res.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Entry not found")

    now = datetime.utcnow().isoformat()
    table.update_item(
        Key={"pk": f"ENTRY#{entry_id}"},
        UpdateExpression=(
            "SET exitPrice = :ep, maxGainPct = :mg, maxLossPct = :ml, "
            "#r = :res, resultNote = :rn, #s = :st, closedAt = :ca"
        ),
        ExpressionAttributeNames={"#r": "result", "#s": "status"},
        ExpressionAttributeValues={
            ":ep": str(body.exitPrice),
            ":mg": str(body.maxGainPct) if body.maxGainPct is not None else None,
            ":ml": str(body.maxLossPct) if body.maxLossPct is not None else None,
            ":res": body.result,
            ":rn": body.resultNote,
            ":st": "closed",
            ":ca": now,
        },
    )

    res = table.get_item(Key={"pk": f"ENTRY#{entry_id}"})
    return dynamo_to_response(res["Item"])


@router.delete("/{entry_id}", status_code=204)
def delete_entry(entry_id: str):
    res = table.get_item(Key={"pk": f"ENTRY#{entry_id}"})
    if not res.get("Item"):
        raise HTTPException(status_code=404, detail="Entry not found")
    table.delete_item(Key={"pk": f"ENTRY#{entry_id}"})
