import json
from datetime import datetime, timezone


def handler(event, _context):
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}),
    }
