import os
import boto3
from datetime import datetime
from typing import Optional

from app.models.entry import ResultUpdate


class DynamoEntryStore:
    def __init__(self):
        region = os.environ.get("AWS_DEFAULT_REGION", "ap-northeast-1")
        endpoint_url = os.environ.get("AWS_ENDPOINT_URL")
        dynamodb = boto3.resource(
            "dynamodb", region_name=region, endpoint_url=endpoint_url
        )
        self.table = dynamodb.Table(
            os.environ.get("TABLE_NAME", "trade-lab-hypotheses")
        )

    def list_all(self) -> list[dict]:
        result = self.table.scan()
        items = result.get("Items", [])
        while "LastEvaluatedKey" in result:
            result = self.table.scan(ExclusiveStartKey=result["LastEvaluatedKey"])
            items.extend(result.get("Items", []))
        return items

    def get(self, entry_id: str) -> Optional[dict]:
        res = self.table.get_item(Key={"pk": f"ENTRY#{entry_id}"})
        return res.get("Item")

    def create(self, item: dict) -> dict:
        self.table.put_item(Item=item)
        return item

    def update(self, entry_id: str, body: ResultUpdate) -> dict:
        self.table.update_item(
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
                ":ca": datetime.utcnow().isoformat(),
            },
        )
        return self.table.get_item(Key={"pk": f"ENTRY#{entry_id}"})["Item"]

    def delete(self, entry_id: str) -> None:
        self.table.delete_item(Key={"pk": f"ENTRY#{entry_id}"})
