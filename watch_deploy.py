import json, urllib.request, ssl, time

TOKEN = "CF_API_TOKEN"
ACCOUNT_ID = "CF_ACCOUNT_ID"
DEP_ID = "c8ec9535-4044-46e8-a5da-fa8bb31cf82e"

ctx = ssl.create_default_context()
url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/turath-al-libiyayn/deployments/{DEP_ID}"

for i in range(60):
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    with urllib.request.urlopen(req, context=ctx) as resp:
        dep = json.loads(resp.read().decode())["result"]
    stage = dep.get("latest_stage", {})
    print(f"[{i*10}s] Stage: {stage.get('name', '?')} Status: {stage.get('status', '?')}", flush=True)
    if stage.get("status") == "success":
        print(f"\nDeployed! URL: {dep.get('url')}", flush=True)
        print(f"Alias: {dep.get('aliases', [])}", flush=True)
        break
    if stage.get("status") == "failure":
        print("\nBuild failed!", flush=True)
        break
    time.sleep(10)
