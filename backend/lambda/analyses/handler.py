import json
import os
import uuid
from datetime import datetime, timezone
import boto3

TABLE_NAME = os.environ["ANALYSES_TABLE"]
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)

HEADERS = {"Content-Type": "application/json"}

MOCK_RESULT = {
    "marginImpact": -125000,
    "riskScore": 72,
    "recommendations": [
        "Reduce equity exposure in the Technology sector by 15% to lower margin requirements.",
        "Increase cash reserves to $500K to buffer potential margin calls over the next 30 days.",
        "Review positions with delta exposure > 0.8 for potential hedging opportunities.",
    ],
    "breakdown": [
        {"category": "Equity Positions", "current": 500000, "projected": 425000, "delta": -75000},
        {"category": "Fixed Income",     "current": 300000, "projected": 250000, "delta": -50000},
        {"category": "Derivatives",      "current": 150000, "projected": 150000, "delta": 0},
        {"category": "Cash Reserves",    "current": 200000, "projected": 200000, "delta": 0},
    ],
}


def handler(event, _context):
    if not event.get("body"):
        return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Request body required"})}

    body = json.loads(event["body"])
    company_id = body.get("companyId")
    if not company_id:
        return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "companyId is required"})}

    now = datetime.now(timezone.utc).isoformat()
    analysis_id = f"analysis-{uuid.uuid4()}"

    analysis = {
        "analysisId": analysis_id,
        "companyId": company_id,
        "sourceIds": body.get("sourceIds", []),
        "status": "COMPLETE",
        "result": MOCK_RESULT,
        "createdAt": now,
        "updatedAt": now,
    }
    if body.get("scenarioId"):
        analysis["scenarioId"] = body["scenarioId"]

    table.put_item(Item=analysis)

    return {"statusCode": 201, "headers": HEADERS, "body": json.dumps(analysis)}
