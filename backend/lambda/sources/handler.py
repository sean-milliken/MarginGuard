import json
import os
import uuid
from datetime import datetime, timezone
import boto3

BUCKET = os.environ["SOURCES_BUCKET"]
EXPIRES_IN = 900

s3 = boto3.client("s3")
HEADERS = {"Content-Type": "application/json"}


def handler(event, _context):
    if not event.get("body"):
        return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Request body required"})}

    body = json.loads(event["body"])
    company_id = body.get("companyId")
    file_name = body.get("fileName")
    content_type = body.get("contentType")

    if not company_id or not file_name or not content_type:
        return {
            "statusCode": 400,
            "headers": HEADERS,
            "body": json.dumps({"error": "companyId, fileName, and contentType are required"}),
        }

    source_id = f"src-{uuid.uuid4()}"
    s3_key = f"uploads/{company_id}/{source_id}/{file_name}"

    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": BUCKET, "Key": s3_key, "ContentType": content_type},
        ExpiresIn=EXPIRES_IN,
    )

    metadata = {
        "sourceId": source_id,
        "companyId": company_id,
        "fileName": file_name,
        "contentType": content_type,
        "s3Key": s3_key,
        "status": "PENDING",
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    s3.put_object(
        Bucket=BUCKET,
        Key=f"metadata/{source_id}.json",
        Body=json.dumps(metadata),
        ContentType="application/json",
    )

    return {
        "statusCode": 201,
        "headers": HEADERS,
        "body": json.dumps({"sourceId": source_id, "uploadUrl": upload_url, "expiresIn": EXPIRES_IN}),
    }
