import json, urllib.request, ssl

TOKEN = "CF_API_TOKEN"
ACCOUNT_ID = "CF_ACCOUNT_ID"

ctx = ssl.create_default_context()
url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/turath-al-libiyayn"

# Get current config
req = urllib.request.Request(url)
req.add_header("Authorization", f"Bearer {TOKEN}")
with urllib.request.urlopen(req, context=ctx) as resp:
    proj = json.loads(resp.read().decode())

p = proj["result"]
print(f"Production branch: {p.get('production_branch')}")
src = p.get("source", {})
print(f"Source: {json.dumps(src, indent=2)[:500]}")

# Update production_branch to master
data = json.dumps({"production_branch": "master"}).encode()
req2 = urllib.request.Request(url, data=data, method="PATCH")
req2.add_header("Authorization", f"Bearer {TOKEN}")
req2.add_header("Content-Type", "application/json")
with urllib.request.urlopen(req2, context=ctx) as resp2:
    result = json.loads(resp2.read().decode())
if result.get("success"):
    print("Updated production_branch to master!")
else:
    print(f"Error: {result.get('errors')}")
