#!/usr/bin/env python3
"""
Harvest works from Goldman Archive (Pitzer) author pages.

Reads matches from map_goldman_archive.py, fetches each author's archive
page (and optional "Collected Works" or similar subpage), and collects
links to .htm/.html on the same domain. Writes per-thinker harvest JSON.

Usage:
    python scripts/python/scrapers/harvest_goldman_archive.py \
        --matches-file data/zero-works-goldman-archive-matches.json \
        --output-dir data/zero-works-harvest/goldman_archive
"""

from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path
from typing import Dict, List, Set
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


USER_AGENT = "Marxists Explorer Bot/0.1 (+https://github.com/jeremy-marxists-explorer)"
REQUEST_TIMEOUT = 15
REQUEST_DELAY_SECONDS = 1.5
MAX_RETRIES = 3
ALLOWED_HOST = "dwardmac.pitzer.edu"
NAV_TITLES = frozenset({
    "home", "about us", "contact us", "other links", "critics corner",
    "biography", "bibliography", "commentary", "graphics", "collected works",
    "[home]", "[about us]", "[contact us]", "[other links]", "[critics corner]",
})


def same_domain(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.netloc == ALLOWED_HOST or parsed.netloc == ""


def is_content_link(href: str, link_text: str) -> bool:
    if not href or (".htm" not in href and ".html" not in href):
        return False
    if link_text and link_text.strip().lower() in NAV_TITLES:
        return False
    if "goldmanarchive" in href or "Bakuninarchive" in href or "Godwinarchive" in href:
        return False
    return True


def collect_works_from_page(page_url: str, html: str) -> List[Dict[str, str]]:
    """Extract same-domain .htm/.html links from page."""
    soup = BeautifulSoup(html, "html.parser")
    works: List[Dict[str, str]] = []
    seen: Set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a.get("href", "")
        full_url = urljoin(page_url, href)
        if not same_domain(full_url):
            continue
        parsed = urlparse(full_url)
        if parsed.path and not (parsed.path.endswith(".htm") or parsed.path.endswith(".html")):
            continue
        text = a.get_text(strip=True)
        if not is_content_link(href, text):
            continue
        if full_url in seen:
            continue
        seen.add(full_url)
        title = text[:200] if text else full_url.split("/")[-1]
        works.append({"title": title, "url": full_url})
    return works


def find_collected_works_link(html: str, base_url: str) -> str | None:
    """Find href to 'Collected Works' or 'GoldmanCW' type page."""
    soup = BeautifulSoup(html, "html.parser")
    for a in soup.find_all("a", href=True):
        text = a.get_text(strip=True).lower()
        if "collected works" in text or "writings" in text:
            href = a.get("href", "")
            if ".htm" in href or ".html" in href:
                return urljoin(base_url, href)
    return None


def fetch_author_works(archive_url: str, session: requests.Session) -> List[Dict[str, str]]:
    """Fetch archive page and optionally Collected Works page; return all work links."""
    try:
        if REQUEST_DELAY_SECONDS > 0:
            time.sleep(REQUEST_DELAY_SECONDS)
        resp = session.get(archive_url, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
    except requests.RequestException:
        return []

    works = collect_works_from_page(archive_url, resp.text)
    cw_url = find_collected_works_link(resp.text, archive_url)
    if cw_url and cw_url != archive_url:
        try:
            time.sleep(REQUEST_DELAY_SECONDS)
            resp2 = session.get(cw_url, timeout=REQUEST_TIMEOUT)
            resp2.raise_for_status()
            extra = collect_works_from_page(cw_url, resp2.text)
            seen_urls = {w["url"] for w in works}
            for w in extra:
                if w["url"] not in seen_urls:
                    works.append(w)
                    seen_urls.add(w["url"])
        except requests.RequestException:
            pass
    return works


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Harvest works from Goldman Archive author pages."
    )
    parser.add_argument(
        "--matches-file",
        type=Path,
        default=Path("data/zero-works-goldman-archive-matches.json"),
        help="Output from map_goldman_archive.py",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/zero-works-harvest/goldman_archive"),
        help="Directory to write per-thinker harvest JSONs.",
    )
    parser.add_argument("--limit", type=int, default=None, help="Limit thinkers (debug).")
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
    session.mount("http://", HTTPAdapter(max_retries=retry))

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
                "source_id": "goldman_archive",
                "status": "no_source_match",
                "message": "No Goldman Archive author page matched.",
                "warnings": record.get("notes", []),
                "works": [],
                "visited_urls": [],
            }
        else:
            author_url = matches[0].get("url", "")
            works = fetch_author_works(author_url, session)
            works_with_source = [{**w, "source_id": "goldman_archive"} for w in works]
            payload = {
                "collection": collection,
                "thinker": thinker,
                "slug": slug,
                "source_url": author_url,
                "source_id": "goldman_archive",
                "status": "success" if works_with_source else "no_works_found",
                "message": f"Collected {len(works_with_source)} works from Goldman Archive." if works_with_source else "No works found on author page.",
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
