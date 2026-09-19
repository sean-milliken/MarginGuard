import json

DEMO_COMPANY = {
    "companyId": "demo",
    "name": "Acme Capital Management",
    "ticker": "ACME",
    "sector": "Asset Management",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
}

HEADERS = {"Content-Type": "application/json"}


def handler(event, _context):
    company_id = (event.get("pathParameters") or {}).get("companyId")
    if company_id != "demo":
        return {"statusCode": 404, "headers": HEADERS, "body": json.dumps({"error": "Company not found"})}
    return {"statusCode": 200, "headers": HEADERS, "body": json.dumps(DEMO_COMPANY)}
