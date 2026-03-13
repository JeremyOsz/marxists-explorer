#!/usr/bin/env python3
"""
Map zero-work thinkers to the Goldman Archive (Pitzer) author pages.

The Goldman Archive index at dwardmac.pitzer.edu/goldman lists several
anarchist authors. We fetch the index, build author name -> archive URL,
and match thinkers from zero-works-thinkers.json.

Usage:
    python scripts/python/scrapers/map_goldman_archive.py \
        --zero-file data/zero-works-thinkers.json \
        --output-file data/zero-works-goldman-archive-matches.json
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import unicodedata
from pathlib import Path
from typing import Any, Dict, List
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


GOLDMAN_ARCHIVE_INDEX = "http://dwardmac.pitzer.edu/goldman/goldmanarchive.html"
USER_AGENT = "Marxists Explorer Bot/0.1 (+https://github.com/jeremy-marxists-explorer)"
REQUEST_TIMEOUT = 15
REQUEST_DELAY_SECONDS = 1.0
MAX_RETRIES = 3
BASE_URL = "http://dwardmac.pitzer.edu"


def normalize_name(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    tokens = [t for t in ascii_name.lower().replace("&", " ").replace(",", " ").split() if t]
    return " ".join(tokens)


def name_tokens(name: str) -> List[str]:
    return normalize_name(name).split()


def parse_index(html: str) -> Dict[str, str]:
    """Parse Goldman Archive index for author name -> archive URL (Cynosure section)."""
    soup = BeautifulSoup(html, "html.parser")
    name_to_url: Dict[str, str] = {}
    skip_sections = frozenset({
        "bright but lesser lights", "pamphlets", "periodicals", "anarchist history",
        "worldwide movements", "first international", "paris commune", "haymarket massacre",
        "spanish civil war", "art and anarchy", "education and anarchy", "anarchist poets",
        "bibliography", "timeline",
    })
    for a in soup.find_all("a", href=True):
        href = a.get("href", "")
        text = a.get_text(strip=True)
        if not text or not href:
            continue
        if "archive" not in href.lower():
            continue
        full_url = urljoin(GOLDMAN_ARCHIVE_INDEX, href)
        if "dwardmac.pitzer.edu" not in full_url:
            continue
        if normalize_name(text) in skip_sections:
            continue
        norm = normalize_name(text)
        name_to_url[norm] = full_url
        tokens = name_tokens(text)
        if len(tokens) >= 2:
            last_first = f"{tokens[-1]} {' '.join(tokens[:-1])}"
            name_to_url[normalize_name(last_first)] = full_url
    return name_to_url


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Map zero-work thinkers to Goldman Archive (Pitzer) author pages."
    )
    parser.add_argument(
        "--zero-file",
        type=Path,
        default=Path("data/zero-works-thinkers.json"),
        help="Input JSON from extract_zero_works.py",
    )
    parser.add_argument(
        "--output-file",
        type=Path,
        default=Path("data/zero-works-goldman-archive-matches.json"),
        help="Output matches for harvester.",
    )
    parser.add_argument("--limit", type=int, default=None, help="Limit thinkers (debug).")
    args = parser.parse_args()

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

    try:
        if REQUEST_DELAY_SECONDS > 0:
            time.sleep(REQUEST_DELAY_SECONDS)
        resp = session.get(GOLDMAN_ARCHIVE_INDEX, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        lookup = parse_index(resp.text)
    except requests.RequestException as e:
        print(f"Error fetching Goldman Archive index: {e}", file=sys.stderr)
        sys.exit(1)

    zero_records = json.loads(args.zero_file.read_text(encoding="utf-8"))
    if args.limit is not None:
        zero_records = zero_records[: args.limit]

    results: List[Dict[str, Any]] = []
    for record in zero_records:
        thinker = record["thinker"]
        collection = record["collection"]
        slug = record["slug"]
        thinker_norm = normalize_name(thinker)
        thinker_tokens = name_tokens(thinker)

        url = lookup.get(thinker_norm)
        if not url and thinker_tokens:
            url = lookup.get(normalize_name(f"{thinker_tokens[-1]} {' '.join(thinker_tokens[:-1])}"))

        status = "matched" if url else "unmatched"
        matches = [{"text": thinker, "url": url}] if url else []

        results.append({
            "collection": collection,
            "thinker": thinker,
            "slug": slug,
            "status": status,
            "source_id": "goldman_archive",
            "matches": matches,
            "notes": [],
        })

    args.output_file.parent.mkdir(parents=True, exist_ok=True)
    args.output_file.write_text(json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    matched = sum(1 for r in results if r["status"] == "matched")
    print(f"Mapped {matched} of {len(results)} thinkers to Goldman Archive. Wrote {args.output_file}")


if __name__ == "__main__":
    main()
