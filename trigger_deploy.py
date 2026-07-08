import json, urllib.request, ssl

TOKEN = "CF_API_TOKEN"
ACCOUNT_ID = "CF_ACCOUNT_ID"

ctx = ssl.create_default_context()
url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/turath-al-libiyayn/deployments"

# Trigger a new deployment from GitHub
data = json.dumps({"branch": "master"}).encode()
req = urllib.request.Request(url, data=data, method="POST")
req.add_header("Authorization", f"Bearer {TOKEN}")
req.add_header("Content-Type", "application/json")
req.timeout = 30

try:
    with urllib.request.urlopen(req, context=ctx) as resp:
        result = json.loads(resp.read().decode())
    if result.get("success"):
        dep = result.get("result", {})
        print(f"Deployment started!")
        print(f"ID: {dep.get('id')}")
        print(f"URL: {dep.get('url')}")
        print(f"Environment: {dep.get('environment')}")
    else:
        print(f"Error: {result.get('errors')}")
except Exception as e:
    print(f"Failed: {e}")
