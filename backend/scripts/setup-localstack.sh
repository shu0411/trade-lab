#!/usr/bin/env bash
set -euo pipefail

ENDPOINT="${AWS_ENDPOINT_URL:-http://localhost:4566}"
REGION="${AWS_DEFAULT_REGION:-ap-northeast-1}"
TABLE="${TABLE_NAME:-trade-lab-hypotheses}"
BUCKET="${IMAGES_BUCKET:-trade-lab-charts-local}"

echo "==> Creating DynamoDB table: $TABLE"
aws dynamodb create-table \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  --table-name "$TABLE" \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=gsi1pk,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=pk,KeyType=HASH \
  --global-secondary-indexes '[
    {
      "IndexName": "date-index",
      "KeySchema": [
        {"AttributeName": "gsi1pk", "KeyType": "HASH"},
        {"AttributeName": "createdAt", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    }
  ]' \
  --billing-mode PAY_PER_REQUEST \
  2>/dev/null && echo "  Created." || echo "  Already exists, skipping."

echo "==> Creating S3 bucket: $BUCKET"
aws s3 mb "s3://$BUCKET" \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  2>/dev/null && echo "  Created." || echo "  Already exists, skipping."

echo "==> Done."
