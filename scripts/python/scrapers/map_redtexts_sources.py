#!/usr/bin/env python3
"""
Map zero-work thinkers to redtexts.org author sections and extract works.

Fetches the redtexts.org index page, parses author sections and work links,
builds a lookup of author name -> works, and matches thinkers from
zero-works-thinkers.json. Outputs a matches file that includes works
per thinker so the harvester can write harvest JSON without re-fetching.

Usage:
    python scripts/python/scrapers/map_redtexts_sources.py \
        --zero-file data/zero-works-thinkers.json \
        --output-file data/zero-works-redtexts-matches.json
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import unicodedata
from pathlib import Path
from typing import Any, Dict, List, Tuple
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from requests import Response
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


REDTEXTS_INDEX_URL = "https://www.redtexts.org/"
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


def parse_redtexts_index(html: str, base_url: str) -> Dict[str, List[Dict[str, str]]]:
    """
    Parse redtexts index HTML into author/section name -> list of {title, url}.
    Structure: <tr><th colspan=3>Author or section name</th></tr> then
    <tr><td><a href="./html/...">Title</a></td>...</tr> for each work.
    """
    author_works: Dict[str, List[Dict[str, str]]] = {}
    soup = BeautifulSoup(html, "html.parser")
    tables = soup.find_all("table")
    if not tables:
        return author_works

    current_author: str | None = None
    for table in tables:
        for tr in table.find_all("tr"):
            th = tr.find("th", colspan=True)
            if th is not None:
                current_author = th.get_text(strip=True)
                continue
            first_td = tr.find("td")
            if first_td is None:
                continue
            link = first_td.find("a", href=True)
            if not link:
                continue
            href = link.get("href") or ""
            if ".html" not in href:
                continue
            url = urljoin(base_url, href) if not href.startswith("http") else href
            title = link.get_text(strip=True)
            if not title or not current_author:
                continue
            author_works.setdefault(current_author, []).append({"title": title, "url": url})

    return author_works


def build_author_lookup(author_works: Dict[str, List[Dict[str, str]]]) -> Dict[str, Tuple[str, List[Dict[str, str]]]]:
    """
    Build normalized name -> (original_author_name, works) for matching.
    """
    lookup: Dict[str, Tuple[str, List[Dict[str, str]]]] = {}
    for author_name, works in author_works.items():
        if not works:
            continue
        norm = normalize_name(author_name)
        lookup[norm] = (author_name, works)
        tokens = name_tokens(author_name)
        if len(tokens) >= 2:
            last_first = f"{tokens[-1]} {' '.join(tokens[:-1])}"
            lookup[normalize_name(last_first)] = (author_name, works)
    return lookup


def main() -> None:
    parser = argparse.ArgumentParser(description="Map zero-work thinkers to redtexts.org and extract works.")
    parser.add_argument(
        "--zero-file",
        type=Path,
        default=Path("data/zero-works-thinkers.json"),
        help="Input JSON from extract_zero_works.py",
    )
    parser.add_argument(
        "--output-file",
        type=Path,
        default=Path("data/zero-works-redtexts-matches.json"),
        help="Output matches with embedded works.",
    )
    parser.add_argument("--limit", type=int, default=None, help="Limit number of thinkers (debug).")
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
    session.mount("http://", HTTPAdapter(max_retries=retry))

    try:
        if REQUEST_DELAY_SECONDS > 0:
            time.sleep(REQUEST_DELAY_SECONDS)
        resp = session.get(REDTEXTS_INDEX_URL, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        html = resp.text
    except requests.RequestException as e:
        print(f"Error fetching redtexts index: {e}", file=sys.stderr)
        sys.exit(1)

    author_works = parse_redtexts_index(html, REDTEXTS_INDEX_URL)
    lookup = build_author_lookup(author_works)

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

        match_data = None
        status = "unmatched"
        notes: List[str] = []

        if thinker_norm in lookup:
            author_name, works = lookup[thinker_norm]
            match_data = {
                "text": author_name,
                "url": REDTEXTS_INDEX_URL,
                "works": works,
            }
            status = "matched"
        elif thinker_tokens:
            last_first = f"{thinker_tokens[-1]} {' '.join(thinker_tokens[:-1])}"
            if last_first in lookup:
                author_name, works = lookup[last_first]
                match_data = {"text": author_name, "url": REDTEXTS_INDEX_URL, "works": works}
                status = "last_name_match"
                notes.append("Matched on last name only")

        matches = [match_data] if match_data else []
        results.append({
            "collection": collection,
            "thinker": thinker,
            "slug": slug,
            "status": status,
            "source_id": "redtexts",
            "matches": matches,
            "notes": notes,
        })

    args.output_file.parent.mkdir(parents=True, exist_ok=True)
    args.output_file.write_text(json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    matched = sum(1 for r in results if r["status"] != "unmatched")
    print(f"Mapped {matched} of {len(results)} thinkers to redtexts.org. Wrote {args.output_file}")


if __name__ == "__main__":
    main()
