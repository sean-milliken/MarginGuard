import json
import os
import boto3
from boto3.dynamodb.conditions import Key

TABLE_NAME = os.environ["EVENTS_TABLE"]
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)

HEADERS = {"Content-Type": "application/json"}

SEED_EVENTS = [
    {
        "eventId": "evt-001",
        "companyId": "demo",
        "type": "MARGIN_CALL",
        "severity": "HIGH",
        "title": "Margin Call Triggered — Q4 Positions",
        "description": "Portfolio margin requirements exceeded threshold due to equity drawdown.",
        "occurredAt": "2024-11-15T14:30:00.000Z",
        "createdAt": "2024-11-15T14:30:00.000Z",
    },
    {
        "eventId": "evt-002",
        "companyId": "demo",
        "type": "EARNINGS",
        "severity": "MEDIUM",
        "title": "Q3 Earnings Beat Estimates",
        "description": "EPS of $2.45 vs $2.10 consensus.",
        "occurredAt": "2024-10-25T20:00:00.000Z",
        "createdAt": "2024-10-25T20:00:00.000Z",
    },
]


def handler(event, _context):
    path_params = event.get("pathParameters") or {}
    query_params = event.get("queryStringParameters") or {}
    event_id = path_params.get("id")

    if event_id:
        result = table.get_item(Key={"eventId": event_id})
        item = result.get("Item")
        if not item:
            seed = next((e for e in SEED_EVENTS if e["eventId"] == event_id), None)
            if not seed:
                return {"statusCode": 404, "headers": HEADERS, "body": json.dumps({"error": "Event not found"})}
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps(seed)}
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps(item)}

    company_id = query_params.get("companyId")
    if company_id:
        result = table.query(
            IndexName="companyId-index",
            KeyConditionExpression=Key("companyId").eq(company_id),
        )
        items = result.get("Items", [])
        if not items and company_id == "demo":
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps(SEED_EVENTS)}
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps(items)}

    result = table.scan(Limit=100)
    items = result.get("Items", [])
    return {"statusCode": 200, "headers": HEADERS, "body": json.dumps(items if items else SEED_EVENTS)}
