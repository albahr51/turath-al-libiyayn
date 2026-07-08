import urllib.request, json, ssl

TOKEN = "CF_API_TOKEN"
ACCOUNT_ID = "CF_ACCOUNT_ID"

# Update project build config
url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/turath-al-libiyayn"
data = json.dumps({
    "build_config": {
        "build_command": "npm run build",
        "destination_dir": "dist",
        "root_dir": ""
    }
}).encode()

req = urllib.request.Request(url, data=data, method="PATCH")
req.add_header("Authorization", f"Bearer {TOKEN}")
req.add_header("Content-Type", "application/json")
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read().decode())
        if result.get("success"):
            print("Build config updated!")
        else:
            print(f"Errors: {result.get('errors')}")
except Exception as e:
    print(f"Error: {e}")
