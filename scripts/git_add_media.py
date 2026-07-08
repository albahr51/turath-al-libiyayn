"""Add media files under 25MB to git, exclude larger ones."""
import os, subprocess, sys

MEDIA_DIR = r"D:\book-src\public\media"
MAX_MB = 25

# Find files over 25MB
over_limit = []
all_files = []
for root, dirs, files in os.walk(MEDIA_DIR):
    for fn in files:
        fp = os.path.join(root, fn)
        rel = os.path.relpath(fp, r"D:\book-src").replace("\\", "/")
        sz_mb = os.path.getsize(fp) / (1024 * 1024)
        all_files.append(rel)
        if sz_mb > MAX_MB:
            over_limit.append(rel)

print(f"Total files in public/media/: {len(all_files)}")
print(f"Files over {MAX_MB}MB (will be excluded): {len(over_limit)}")

# Create a temporary gitignore addition
gitignore_extra = r"D:\book-src\.gitignore-media-large"
with open(gitignore_extra, "w", encoding="utf-8") as f:
    for path in over_limit:
        f.write(path + "\n")

print(f"Wrote {len(over_limit)} paths to .gitignore-media-large")
print("\nNow run: git add .")
print("Then: git commit -m 'add media files under 25MB'")
print("Then: git push")
