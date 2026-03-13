#!/usr/bin/env python3
"""
Harvest works from The Anarchist Library author category pages.

Reads the matches file from map_anarchist_library.py, fetches each author's
category page, and extracts links to /library/... texts. Writes per-thinker
harvest JSON in the same format as harvest_zero_work_thinkers.py.

Usage:
    python scripts/python/scrapers/harvest_anarchist_library.py \
        --matches-file data/zero-works-anarchist-library-matches.json \
        --output-dir data/zero-works-harvest/anarchist_library
"""

from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path
from typing import Any, Dict, List
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


USER_AGENT = "Marxists Explorer Bot/0.1 (+https://github.com/jeremy-marxists-explorer)"
REQUEST_TIMEOUT = 15
REQUEST_DELAY_SECONDS = 1.5
MAX_RETRIES = 3
TAL_BASE = "https://theanarchistlibrary.org"


def clean_title(text: str) -> str:
    """Remove trailing metadata like 'Apr 26, 2021 16 pp' or '— Author' from link text."""
    text = text.strip()
    text = re.sub(r"\s*[—\-–]\s*[A-Za-z].*$", "", text)
    text = re.sub(r"[A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4}.*$", "", text)
    text = re.sub(r"\d+\s*pp\.?\s*$", "", text, flags=re.IGNORECASE)
    return " ".join(text.split()).strip()


def fetch_author_works(author_url: str, session: requests.Session) -> List[Dict[str, str]]:
    """Fetch author category page and return list of {title, url} for library texts."""
    try:
        if REQUEST_DELAY_SECONDS > 0:
            time.sleep(REQUEST_DELAY_SECONDS)
        resp = session.get(author_url, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
    except requests.RequestException:
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    works: List[Dict[str, str]] = []
    seen_urls: set = set()

    for a in soup.find_all("a", href=True):
        href = a.get("href", "")
        if "/library/" not in href:
            continue
        full_url = urljoin(author_url, href)
        if "theanarchistlibrary.org" not in full_url or "bookshelf." in full_url:
            continue
        if full_url in seen_urls:
            continue
        seen_urls.add(full_url)
        title = clean_title(a.get_text(strip=True))
        if not title or len(title) < 2:
            continue
        works.append({"title": title, "url": full_url})

    return works


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Harvest works from The Anarchist Library author pages."
    )
    parser.add_argument(
        "--matches-file",
        type=Path,
        default=Path("data/zero-works-anarchist-library-matches.json"),
        help="Output from map_anarchist_library.py",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/zero-works-harvest/anarchist_library"),
        help="Directory to write per-thinker harvest JSONs.",
    )
    parser.add_argument("--limit", type=int, default=None, help="Limit number of thinkers (debug).")
    args = parser.parse_args()

    if not args.matches_file.exists():
        raise FileNotFoundError(f"Matches file not found: {args.matches_file}")

    records = json.loads(args.matches_file.read_text(encoding="utf-8"))
    if args.limit is not None:
        records = records[: args.limit]

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})
    retry = Retry(
        total=MAX_RETRIES,
        backoff_factor=0.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("GET",),
        respect_retry_after_header=True,
    )
    session.mount("https://", HTTPAdapter(max_retries=retry))

    written = 0
    success = 0
    for record in records:
        collection = record.get("collection") or ""
        thinker = record.get("thinker") or ""
        slug = record.get("slug") or ""
        matches = record.get("matches") or []

        if not matches or not collection or not slug:
            payload = {
                "collection": collection,
                "thinker": thinker,
                "slug": slug,
                "source_url": None,
                "source_id": "anarchist_library",
                "status": "no_source_match",
                "message": "No Anarchist Library author page matched.",
                "warnings": record.get("notes", []),
                "works": [],
                "visited_urls": [],
            }
        else:
            author_url = matches[0].get("url", "")
            works = fetch_author_works(author_url, session)
            works_with_source = [{**w, "source_id": "anarchist_library"} for w in works]
            payload = {
                "collection": collection,
                "thinker": thinker,
                "slug": slug,
                "source_url": author_url,
                "source_id": "anarchist_library",
                "status": "success" if works_with_source else "no_works_found",
                "message": f"Collected {len(works_with_source)} works from The Anarchist Library." if works_with_source else "No works found on author page.",
                "warnings": record.get("notes", []),
                "works": works_with_source,
                "visited_urls": [author_url],
            }
            if works_with_source:
                success += 1

        out_dir = args.output_dir / collection
        out_dir.mkdir(parents=True, exist_ok=True)
        out_file = out_dir / f"{slug}.json"
        out_file.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        written += 1

    print(f"Wrote {written} harvest files to {args.output_dir}. Successful: {success}")


if __name__ == "__main__":
    main()
