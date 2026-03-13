#!/usr/bin/env python3
"""
Map zero-work thinkers to The Anarchist Library author category pages.

Fetches the author listing from theanarchistlibrary.org/category/author,
builds a normalized name -> URL lookup, and matches thinkers from
zero-works-thinkers.json. Output is a matches file for harvest_anarchist_library.py.

Usage:
    python scripts/python/scrapers/map_anarchist_library.py \
        --zero-file data/zero-works-thinkers.json \
        --output-file data/zero-works-anarchist-library-matches.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import unicodedata
from pathlib import Path
from typing import Any, Dict, List

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


TAL_AUTHORS_URL = "https://theanarchistlibrary.org/category/author"
USER_AGENT = "Marxists Explorer Bot/0.1 (+https://github.com/jeremy-marxists-explorer)"
REQUEST_TIMEOUT = 15
REQUEST_DELAY_SECONDS = 1.0
MAX_RETRIES = 3


def normalize_name(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    tokens = [t for t in ascii_name.lower().replace("&", " ").replace(",", " ").split() if t]
    return " ".join(tokens)


def name_tokens(name: str) -> List[str]:
    return normalize_name(name).split()


def strip_trailing_count(text: str) -> str:
    """Remove trailing digits/count from author name (e.g. 'Emma Goldman5' -> 'Emma Goldman')."""
    return re.sub(r"\s*\d+\s*$", "", text).strip()


def parse_author_listing(html: str, base_url: str) -> Dict[str, str]:
    """
    Parse TAL category/author page: collect author name -> category URL.
    Link text may have trailing count (e.g. 'Emma Goldman5'); strip it.
    """
    soup = BeautifulSoup(html, "html.parser")
    name_to_url: Dict[str, str] = {}
    for a in soup.find_all("a", href=True):
        href = a.get("href", "")
        if "/category/author/" not in href or href.rstrip("/").endswith("/author"):
            continue
        full_url = href if href.startswith("http") else f"{base_url.rstrip('/')}{href}" if href.startswith("/") else f"{base_url}/{href}"
        if "theanarchistlibrary.org" not in full_url:
            continue
        raw_name = a.get_text(strip=True)
        name = strip_trailing_count(raw_name)
        if not name:
            continue
        norm = normalize_name(name)
        name_to_url[norm] = full_url
        tokens = name_tokens(name)
        if len(tokens) >= 2:
            last_first = f"{tokens[-1]} {' '.join(tokens[:-1])}"
            name_to_url[normalize_name(last_first)] = full_url
    return name_to_url


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Map zero-work thinkers to The Anarchist Library author pages."
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
        default=Path("data/zero-works-anarchist-library-matches.json"),
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
    session.mount("https://", HTTPAdapter(max_retries=retry))

    try:
        if REQUEST_DELAY_SECONDS > 0:
            time.sleep(REQUEST_DELAY_SECONDS)
        resp = session.get(TAL_AUTHORS_URL, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        lookup = parse_author_listing(resp.text, "https://theanarchistlibrary.org")
    except requests.RequestException as e:
        print(f"Error fetching Anarchist Library authors: {e}", file=sys.stderr)
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
        notes: List[str] = []
        matches = []
        if url:
            matches = [{"text": thinker, "url": url}]

        results.append({
            "collection": collection,
            "thinker": thinker,
            "slug": slug,
            "status": status,
            "source_id": "anarchist_library",
            "matches": matches,
            "notes": notes,
        })

    args.output_file.parent.mkdir(parents=True, exist_ok=True)
    args.output_file.write_text(json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    matched = sum(1 for r in results if r["status"] == "matched")
    print(f"Mapped {matched} of {len(results)} thinkers to The Anarchist Library. Wrote {args.output_file}")


if __name__ == "__main__":
    main()
