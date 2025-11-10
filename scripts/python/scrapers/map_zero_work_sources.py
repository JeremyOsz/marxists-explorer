#!/usr/bin/env python3
"""
Map thinkers with zero indexed works to their canonical Marxists.org author pages.

This script fetches https://www.marxists.org/archive/index.htm, builds a lookup table
of author names to their URLs, and then matches each thinker listed in
data/zero-works-thinkers.json to candidate source pages.

Usage:
    python scripts/python/scrapers/map_zero_work_sources.py \
        --zero-file data/zero-works-thinkers.json \
        --output-file data/zero-works-source-matches.json
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import unicodedata
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List

import requests
from bs4 import BeautifulSoup
from requests import Response


MIA_INDEX_URL = "https://www.marxists.org/archive/index.htm"
USER_AGENT = "Marxists Explorer Bot/0.1 (+https://github.com/jeremy-marxists-explorer)"

REQUEST_TIMEOUT = 15
REQUEST_DELAY_SECONDS = 1.0


def normalize_name(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    tokens = [token for token in ascii_name.lower().replace("&", " ").split() if token]
    return "".join(tokens)


@dataclass
class AuthorEntry:
    text: str
    href: str
    url: str
    category: str | None = None


@dataclass
class MatchResult:
    collection: str
    thinker: str
    slug: str
    matches: List[Dict[str, str]] = field(default_factory=list)
    status: str = "unmatched"
    notes: List[str] = field(default_factory=list)


class AuthorIndexMapper:
    def __init__(self, index_url: str = MIA_INDEX_URL):
        self.index_url = index_url
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})
        self._last_request_timestamp = 0.0

    def _throttled_get(self, url: str) -> Response:
        elapsed = time.time() - self._last_request_timestamp
        if elapsed < REQUEST_DELAY_SECONDS:
            time.sleep(REQUEST_DELAY_SECONDS - elapsed)
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        self._last_request_timestamp = time.time()
        return response

    def fetch_index(self) -> BeautifulSoup:
        response = self._throttled_get(self.index_url)
        return BeautifulSoup(response.content, "html.parser")

    def build_author_lookup(self, soup: BeautifulSoup) -> Dict[str, List[AuthorEntry]]:
        lookup: Dict[str, List[AuthorEntry]] = defaultdict(list)

        current_category: str | None = None

        for element in soup.find_all(["h2", "h3", "a"]):
            if element.name in {"h2", "h3"}:
                current_category = element.get_text(strip=True)
                continue

            if element.name != "a" or not element.get("href"):
                continue

            text = element.get_text(strip=True)
            if not text:
                continue

            href = element["href"]
            if href.startswith("http"):
                url = href
            else:
                # Avoid paths that climb up the tree in unexpected ways
                if href.startswith("../"):
                    continue
                url = requests.compat.urljoin(self.index_url, href)

            normalized = normalize_name(text)
            entry = AuthorEntry(text=text, href=href, url=url, category=current_category)
            lookup[normalized].append(entry)

            # Add secondary key for last-name only entries
            tokens = normalized.split()
            if len(tokens) > 1:
                lookup[tokens[-1]].append(entry)

        return lookup

    def match_thinkers(self, zero_records: Iterable[Dict[str, str]]) -> List[MatchResult]:
        soup = self.fetch_index()
        lookup = self.build_author_lookup(soup)

        results: List[MatchResult] = []

        for record in zero_records:
            thinker = record["thinker"]
            normalized = normalize_name(thinker)
            matches = lookup.get(normalized, [])

            match_result = MatchResult(
                collection=record["collection"],
                thinker=thinker,
                slug=record["slug"],
            )

            if matches:
                match_result.status = "matched"
                match_result.matches = [
                    {
                        "text": entry.text,
                        "href": entry.href,
                        "url": entry.url,
                        "category": entry.category or "",
                    }
                    for entry in matches
                ]
            else:
                # Try last name match
                tokens = normalized.split()
                if tokens:
                    fallback_matches = lookup.get(tokens[-1], [])
                    if fallback_matches:
                        match_result.status = "last_name_match"
                        match_result.matches = [
                            {
                                "text": entry.text,
                                "href": entry.href,
                                "url": entry.url,
                                "category": entry.category or "",
                            }
                            for entry in fallback_matches
                        ]
                        match_result.notes.append("Matched on last name only")
                if not match_result.matches:
                    match_result.status = "unmatched"
                    match_result.notes.append("No entry located on index page")

            results.append(match_result)

        return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Map zero-work thinkers to source URLs.")
    parser.add_argument(
        "--zero-file",
        type=Path,
        default=Path("data/zero-works-thinkers.json"),
        help="Input JSON file created by extract_zero_works.py",
    )
    parser.add_argument(
        "--output-file",
        type=Path,
        default=Path("data/zero-works-source-matches.json"),
        help="Destination JSON for match results.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Optional limit for debugging or sampling.",
    )
    args = parser.parse_args()

    zero_records = json.loads(args.zero_file.read_text(encoding="utf-8"))
    if args.limit is not None:
        zero_records = zero_records[: args.limit]

    mapper = AuthorIndexMapper()

    try:
        results = mapper.match_thinkers(zero_records)
    except requests.RequestException as exc:
        print(f"Error fetching Marxists.org index: {exc}", file=sys.stderr)
        sys.exit(1)

    payload = [result.__dict__ for result in results]
    args.output_file.parent.mkdir(parents=True, exist_ok=True)
    args.output_file.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    matched_count = sum(1 for result in results if result.status != "unmatched")
    print(f"Mapped {matched_count} of {len(results)} thinkers to candidate source URLs")


if __name__ == "__main__":
    main()


