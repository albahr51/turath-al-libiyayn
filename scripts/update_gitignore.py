"""Append files over 25MB to .gitignore so they don't get pushed."""
import os

MEDIA = r"D:\book-src\public\media"
GITIGNORE = r"D:\book-src\.gitignore"
MAX_MB = 25

over = []
for root, dirs, files in os.walk(MEDIA):
    for fn in files:
        fp = os.path.join(root, fn)
        sz = os.path.getsize(fp) / (1024 * 1024)
        if sz > MAX_MB:
            rel = os.path.relpath(fp, r"D:\book-src").replace("\\", "/")
            # Skip mp4s (already excluded by pattern)
            if not fn.lower().endswith(".mp4"):
                over.append(rel)

# Read current gitignore
with open(GITIGNORE, "r", encoding="utf-8") as f:
    content = f.read()

# Add marker if not present
marker = "# Auto-added: files over 25MB"
if marker not in content:
    with open(GITIGNORE, "a", encoding="utf-8") as f:
        f.write(f"\n\n{marker}\n")
        for path in sorted(over):
            f.write(f"{path}\n")
    print(f"Added {len(over)} files to .gitignore")
else:
    print("Marker already exists, skipping")
