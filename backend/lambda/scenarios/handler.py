import json
import math
import uuid
from datetime import datetime, timezone

HEADERS = {"Content-Type": "application/json"}

BASE_RESULT = {
    "marginImpact": -98500,
    "riskScore": 65,
    "recommendations": [
        "Scenario stress test indicates moderate margin pressure under proposed parameters.",
        "Consider diversifying collateral pool with AAA-rated fixed income instruments.",
    ],
    "breakdown": [
        {"category": "Equity Positions", "current": 500000, "projected": 440000, "delta": -60000},
        {"category": "Fixed Income",     "current": 300000, "projected": 261500, "delta": -38500},
        {"category": "Cash Reserves",    "current": 200000, "projected": 200000, "delta": 0},
    ],
}


def handler(event, _context):
    scenario_id = (event.get("pathParameters") or {}).get("id", "unknown")
    body = json.loads(event["body"]) if event.get("body") else {}
    params = body.get("parameters") or {}
    stress_level = float(params.get("stressLevel", 0.5))

    adjusted_risk = min(100, math.floor(BASE_RESULT["riskScore"] * (1 + stress_level * 0.3)))
    result = {**BASE_RESULT, "riskScore": adjusted_risk}

    return {
        "statusCode": 200,
        "headers": HEADERS,
        "body": json.dumps({
            "runId": f"run-{uuid.uuid4()}",
            "scenarioId": scenario_id,
            "companyId": body.get("companyId", "unknown"),
            "executedAt": datetime.now(timezone.utc).isoformat(),
            "result": result,
        }),
    }
