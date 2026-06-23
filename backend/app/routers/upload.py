import os
import uuid
import boto3
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

BUCKET = os.environ.get("IMAGES_BUCKET", "")
AWS_REGION = os.environ.get("AWS_DEFAULT_REGION", "ap-northeast-1")
s3 = boto3.client(
    "s3",
    region_name=AWS_REGION,
    endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
)


class PresignedUrlRequest(BaseModel):
    filename: str
    contentType: str


@router.post("/presigned")
def get_presigned_url(body: PresignedUrlRequest):
    key = f"charts/{uuid.uuid4()}/{body.filename}"
    url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": BUCKET,
            "Key": key,
            "ContentType": body.contentType,
        },
        ExpiresIn=300,
    )
    return {"url": url, "key": key}


@router.get("/signed-url/{key:path}")
def get_signed_read_url(key: str):
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET, "Key": key},
        ExpiresIn=3600,
    )
    return {"url": url}
