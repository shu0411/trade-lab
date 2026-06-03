import os
import boto3
from fastapi import APIRouter
from collections import defaultdict

router = APIRouter()

TABLE_NAME = os.environ.get("TABLE_NAME", "trade-lab-hypotheses")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)

FIXED_REASONS = [
    "25日線反発", "75日線反発", "高値更新", "出来高増加",
    "ゴールデンクロス", "安値切り上げ", "移動平均線上向き",
]
PATTERNS = ["押し目", "ブレイクアウト", "その他"]


def _scan_all():
    result = table.scan()
    items = result.get("Items", [])
    while "LastEvaluatedKey" in result:
        result = table.scan(ExclusiveStartKey=result["LastEvaluatedKey"])
        items.extend(result.get("Items", []))
    return items


def _rate(total: int, success: int) -> float | None:
    if total == 0:
        return None
    return round(success / total * 100, 1)


@router.get("/summary")
def summary():
    items = _scan_all()
    entries = [i for i in items if i.get("type") == "entry"]
    closed = [i for i in entries if i.get("status") == "closed"]
    success = [i for i in closed if i.get("result") == "success"]
    return {
        "total": len(entries),
        "open": len([i for i in entries if i.get("status") == "open"]),
        "closed": len(closed),
        "successRate": _rate(len(closed), len(success)),
        "passCount": len([i for i in items if i.get("type") == "pass"]),
    }


@router.get("/patterns")
def patterns():
    items = _scan_all()
    entries = [i for i in items if i.get("type") == "entry"]
    result = []
    for pattern in PATTERNS:
        pats = [i for i in entries if i.get("pattern") == pattern]
        closed = [i for i in pats if i.get("status") == "closed"]
        success = [i for i in closed if i.get("result") == "success"]
        result.append({
            "pattern": pattern,
            "total": len(pats),
            "closed": len(closed),
            "success": len(success),
            "successRate": _rate(len(closed), len(success)),
        })
    return result


@router.get("/reasons")
def reasons():
    items = _scan_all()
    entries = [i for i in items if i.get("type") == "entry"]
    result = []
    for reason in FIXED_REASONS:
        matched = [i for i in entries if reason in i.get("reasons", [])]
        closed = [i for i in matched if i.get("status") == "closed"]
        success = [i for i in closed if i.get("result") == "success"]
        result.append({
            "reason": reason,
            "total": len(matched),
            "closed": len(closed),
            "success": len(success),
            "successRate": _rate(len(closed), len(success)),
        })
    return result
