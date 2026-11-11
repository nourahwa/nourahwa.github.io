"""Write repos.json with my public GitHub repositories, newest first.

For each repository it keeps the description, the language and the first
image in the README (a dashboard screenshot, for example), so the Projects
folder on the site shows new work by itself.

Run by the daily GitHub Actions job in .github/workflows/update-repos.yml,
or by hand: python automation/update_repos.py
"""
import json
import os
import re
import urllib.request
from datetime import datetime, timezone
from urllib.parse import urljoin

USER = "inourahwahaq"
SKIP = {USER, f"{USER}.github.io"}  # the profile and the site itself
API = "https://api.github.com"
HEADERS = {"Accept": "application/vnd.github+json", "User-Agent": "portfolio-repos"}
if os.environ.get("GITHUB_TOKEN"):
    HEADERS["Authorization"] = "Bearer " + os.environ["GITHUB_TOKEN"]

IMAGE = re.compile(r'!\[[^\]]*\]\(\s*<?([^)\s>]+)|<img[^>]+src=["\']([^"\']+)', re.I)


def get(url, raw=False):
    headers = dict(HEADERS)
    if raw:
        headers["Accept"] = "application/vnd.github.raw"
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=30) as response:
        return response.read().decode("utf-8", "replace") if raw else json.load(response)


def first_image(repo):
    """The first image in the README, as a full link, or an empty string."""
    try:
        readme = get(f"{API}/repos/{USER}/{repo['name']}/readme", raw=True)
    except Exception:
        return ""
    for match in IMAGE.finditer(readme):
        src = match.group(1) or match.group(2)
        if re.search(r"shields\.io|badge|\.svg(\?|$)", src, re.I):
            continue  # skip badges and icons
        if src.startswith(("http://", "https://")):
            return src.replace("github.com/", "raw.githubusercontent.com/", 1).replace("/blob/", "/", 1) if "/blob/" in src else src
        base = f"https://raw.githubusercontent.com/{USER}/{repo['name']}/{repo['default_branch']}/"
        return urljoin(base, src.lstrip("./"))
    return ""


repos = get(f"{API}/users/{USER}/repos?per_page=100&sort=pushed")
rows = []
for r in repos:
    if r["fork"] or r["archived"] or r["name"] in SKIP:
        continue
    rows.append({
        "name": r["name"],
        "description": r["description"] or "",
        "language": r["language"] or "",
        "topics": r.get("topics") or [],
        "image": first_image(r),
        "url": r["html_url"],
        "pushed": r["pushed_at"],
    })
rows.sort(key=lambda r: r["pushed"], reverse=True)

with open("repos.json", "w", encoding="utf-8") as f:
    json.dump({"updated": datetime.now(timezone.utc).isoformat(timespec="seconds"), "repos": rows}, f, ensure_ascii=False, indent=2)
print(f"{len(rows)} repositories written to repos.json")
