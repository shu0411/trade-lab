from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field, model_validator
from datetime import datetime
import uuid

PATTERNS = Literal["押し目", "ブレイクアウト", "その他"]
REASONS = Literal[
    "25日線反発",
    "75日線反発",
    "高値更新",
    "出来高増加",
    "ゴールデンクロス",
    "安値切り上げ",
    "移動平均線上向き",
]
RESULTS = Literal["success", "failure", "breakeven"]


class EntryCreate(BaseModel):
    type: Literal["entry", "pass"]
    date: str
    ticker: str
    tickerName: str
    pattern: PATTERNS
    entryPrice: Optional[float] = None
    targetPct: Optional[float] = None
    stopPct: Optional[float] = None
    holdDays: Optional[int] = None
    reasons: list[str] = Field(default_factory=list)
    reasonNote: str = ""
    chartImageKey: Optional[str] = None

    @model_validator(mode="after")
    def validate_entry_fields(self):
        if self.type == "entry":
            if self.entryPrice is None:
                raise ValueError("entryPrice is required for entry type")
            if self.targetPct is None or self.stopPct is None:
                raise ValueError("targetPct and stopPct are required for entry type")
        return self


class ResultUpdate(BaseModel):
    exitPrice: float
    maxGainPct: Optional[float] = None
    maxLossPct: Optional[float] = None
    result: RESULTS
    resultNote: str = ""


class EntryResponse(BaseModel):
    id: str
    type: str
    date: str
    ticker: str
    tickerName: str
    pattern: str
    entryPrice: Optional[float]
    targetPct: Optional[float]
    stopPct: Optional[float]
    targetPrice: Optional[float]
    stopPrice: Optional[float]
    holdDays: Optional[int]
    reasons: list[str]
    reasonNote: str
    chartImageKey: Optional[str]
    status: str
    exitPrice: Optional[float]
    maxGainPct: Optional[float]
    maxLossPct: Optional[float]
    result: Optional[str]
    resultNote: Optional[str]
    closedAt: Optional[str]
    createdAt: str


def entry_to_dynamo(entry: EntryCreate) -> dict:
    entry_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    target_price = None
    stop_price = None
    if entry.entryPrice and entry.targetPct:
        target_price = round(entry.entryPrice * (1 + entry.targetPct / 100), 0)
    if entry.entryPrice and entry.stopPct:
        stop_price = round(entry.entryPrice * (1 - abs(entry.stopPct) / 100), 0)

    return {
        "pk": f"ENTRY#{entry_id}",
        "gsi1pk": f"DATE#{entry.date}",
        "id": entry_id,
        "type": entry.type,
        "date": entry.date,
        "ticker": entry.ticker,
        "tickerName": entry.tickerName,
        "pattern": entry.pattern,
        "entryPrice": str(entry.entryPrice) if entry.entryPrice else None,
        "targetPct": str(entry.targetPct) if entry.targetPct else None,
        "stopPct": str(entry.stopPct) if entry.stopPct else None,
        "targetPrice": str(target_price) if target_price else None,
        "stopPrice": str(stop_price) if stop_price else None,
        "holdDays": entry.holdDays,
        "reasons": entry.reasons,
        "reasonNote": entry.reasonNote,
        "chartImageKey": entry.chartImageKey,
        "status": "open",
        "exitPrice": None,
        "maxGainPct": None,
        "maxLossPct": None,
        "result": None,
        "resultNote": None,
        "closedAt": None,
        "createdAt": now,
    }


def dynamo_to_response(item: dict) -> EntryResponse:
    def to_float(v):
        return float(v) if v is not None else None

    return EntryResponse(
        id=item["id"],
        type=item["type"],
        date=item["date"],
        ticker=item["ticker"],
        tickerName=item["tickerName"],
        pattern=item["pattern"],
        entryPrice=to_float(item.get("entryPrice")),
        targetPct=to_float(item.get("targetPct")),
        stopPct=to_float(item.get("stopPct")),
        targetPrice=to_float(item.get("targetPrice")),
        stopPrice=to_float(item.get("stopPrice")),
        holdDays=item.get("holdDays"),
        reasons=item.get("reasons", []),
        reasonNote=item.get("reasonNote", ""),
        chartImageKey=item.get("chartImageKey"),
        status=item.get("status", "open"),
        exitPrice=to_float(item.get("exitPrice")),
        maxGainPct=to_float(item.get("maxGainPct")),
        maxLossPct=to_float(item.get("maxLossPct")),
        result=item.get("result"),
        resultNote=item.get("resultNote"),
        closedAt=item.get("closedAt"),
        createdAt=item["createdAt"],
    )
