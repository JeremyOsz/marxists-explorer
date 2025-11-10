#!/usr/bin/env python3
"""
Harvest works for thinkers who currently have zero entries in the local dataset.

This script consumes the output of map_zero_work_sources.py, walks the
Marxists.org author pages for each matched thinker, and extracts candidate work
URLs. Results are written into per-thinker JSON files for further processing.

Example usage:
    .venv/bin/python scripts/python/scrapers/harvest_zero_work_thinkers.py \
        --matches-file data/zero-works-source-matches.json \
        --output-dir data/zero-works-harvest \
        --limit 50
"""

from __future__ import annotations

import argparse
import json
import time
import unicodedata
from collections import deque
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set, Tuple

import requests
from bs4 import BeautifulSoup
from requests import Response
from urllib.parse import urljoin, urlparse


USER_AGENT = "Marxists Explorer Bot/0.1 (+https://github.com/jeremy-marxists-explorer)"
REQUEST_TIMEOUT = 15
REQUEST_DELAY_SECONDS = 1.0
MAX_CRAWL_DEPTH = 3

LINK_KEYWORDS = (
    "/works/",
    "/articles/",
    "/letters/",
    "/writings/",
    "/speeches/",
    "/pamphlets/",
    "/essays/",
    "/books/",
    "/chron/",
    "/texts/",
    "/docs/",
    "/poems/",
    "/verses/",
    "/interviews/",
)

ALLOWED_EXTENSIONS = (".htm", ".html", ".pdf", ".txt")


def normalize_whitespace(text: str) -> str:
    return " ".join(text.split())


def strip_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    return normalized.encode("ascii", "ignore").decode("ascii")


@dataclass
class ThinkerMatch:
    collection: str
    thinker: str
    slug: str
    status: str
    matches: List[Dict[str, str]]
    notes: List[str] = field(default_factory=list)


@dataclass
class HarvestResult:
    collection: str
    thinker: str
    slug: str
    source_url: Optional[str]
    works: List[Dict[str, str]]
    visited_urls: List[str]
    status: str
    message: str = ""
    warnings: List[str] = field(default_factory=list)


class WorkHarvester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})
        self._last_request_timestamp = 0.0

    def _throttled_get(self, url: str) -> Response:
        elapsed = time.time() - self._last_request_timestamp
        if elapsed < REQUEST_DELAY_SECONDS:
            time.sleep(max(0.0, REQUEST_DELAY_SECONDS - elapsed))
        response = self.session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        self._last_request_timestamp = time.time()
        return response

    def _parse(self, url: str) -> Tuple[BeautifulSoup, Response]:
        response = self._throttled_get(url)
        soup = BeautifulSoup(response.content, "html.parser")
        return soup, response

    def harvest(self, thinker: ThinkerMatch, max_depth: int = MAX_CRAWL_DEPTH) -> HarvestResult:
        if not thinker.matches:
            return HarvestResult(
                collection=thinker.collection,
                thinker=thinker.thinker,
                slug=thinker.slug,
                source_url=None,
                works=[],
                visited_urls=[],
                status="no_source_match",
                message="No Marxists.org author page was identified.",
                warnings=thinker.notes,
            )

        # Prefer the first match (closest to exact name)
        primary_match = thinker.matches[0]
        source_url = primary_match["url"]
        source_root = self._get_author_root(source_url)

        queue: deque[Tuple[str, int]] = deque()
        visited: Set[str] = set()
        works: Dict[str, Dict[str, str]] = {}
        warnings: List[str] = []

        queue.append((source_url, 0))

        while queue:
            current_url, depth = queue.popleft()
            if current_url in visited:
                continue

            visited.add(current_url)

            if depth > max_depth:
                continue

            try:
                soup, response = self._parse(current_url)
            except requests.RequestException as exc:
                warnings.append(f"Request failed for {current_url}: {exc}")
                continue

            for link in soup.find_all("a", href=True):
                title = normalize_whitespace(link.get_text(strip=True))
                if not title or len(title) <= 2:
                    continue

                href = link["href"]
                next_url = urljoin(current_url, href)

                if not next_url.startswith(source_root):
                    continue

                if self._is_candidate_work(next_url, title):
                    works[next_url] = {
                        "title": title,
                        "url": next_url,
                    }
                    continue

                if self._should_descend(next_url, depth):
                    queue.append((next_url, depth + 1))

        if works:
            status = "success"
            message = f"Collected {len(works)} candidate works."
        else:
            status = "no_works_found"
            message = "No candidate works discovered within crawl depth."

        return HarvestResult(
            collection=thinker.collection,
            thinker=thinker.thinker,
            slug=thinker.slug,
            source_url=source_url,
            works=sorted(works.values(), key=lambda item: strip_accents(item["title"]).lower()),
            visited_urls=sorted(visited),
            status=status,
            message=message,
            warnings=warnings,
        )

    @staticmethod
    def _get_author_root(url: str) -> str:
        parsed = urlparse(url)
        path_parts = parsed.path.split("/")
        if path_parts[-1].endswith(".htm"):
            path_parts = path_parts[:-1]
        root_path = "/".join(part for part in path_parts if part)
        if not root_path.endswith("/"):
            root_path += "/"
        return f"{parsed.scheme}://{parsed.netloc}/{root_path}"

    @staticmethod
    def _contains_keyword(path: str) -> bool:
        lowered = path.lower()
        return any(keyword in lowered for keyword in LINK_KEYWORDS)

    @staticmethod
    def _has_allowed_extension(url: str) -> bool:
        lowered = url.lower()
        return lowered.endswith(ALLOWED_EXTENSIONS)

    def _is_candidate_work(self, url: str, title: str) -> bool:
        parsed = urlparse(url)
        path = parsed.path.lower()

        if not self._has_allowed_extension(path):
            return False

        if "bio" in path or "biography" in path:
            return False

        lowered_title = title.lower()
        if "biography" in lowered_title or "obituary" in lowered_title:
            return False

        if self._contains_keyword(path):
            return True

        # Capture year-based pages (e.g., /1967/...)
        if any(segment.isdigit() and len(segment) == 4 for segment in path.split("/")):
            return True

        # Fall back to heuristics: lengthy titles that are not indexes
        if "index" in path or "contents" in path:
            return False
        return len(title.split()) >= 3

    def _should_descend(self, url: str, depth: int) -> bool:
        if depth >= MAX_CRAWL_DEPTH:
            return False

        parsed = urlparse(url)
        path = parsed.path.lower()

        if any(keyword in path for keyword in LINK_KEYWORDS):
            if path.endswith("/") or path.endswith(".htm") or path.endswith(".html"):
                if not self._has_allowed_extension(path) or path.endswith("index.htm") or path.endswith("index.html"):
                    return True

        return False


def load_matches(path: Path, limit: Optional[int] = None) -> List[ThinkerMatch]:
    raw_records = json.loads(path.read_text(encoding="utf-8"))
    matches: List[ThinkerMatch] = []
    for record in raw_records[: limit or len(raw_records)]:
        matches.append(
            ThinkerMatch(
                collection=record["collection"],
                thinker=record["thinker"],
                slug=record["slug"],
                status=record.get("status", ""),
                matches=record.get("matches", []),
                notes=record.get("notes", []),
            )
        )
    return matches


def write_result(output_dir: Path, result: HarvestResult) -> None:
    thinker_dir = output_dir / result.collection
    thinker_dir.mkdir(parents=True, exist_ok=True)
    output_file = thinker_dir / f"{result.slug}.json"
    payload = {
        "collection": result.collection,
        "thinker": result.thinker,
        "slug": result.slug,
        "source_url": result.source_url,
        "status": result.status,
        "message": result.message,
        "warnings": result.warnings,
        "works": result.works,
        "visited_urls": result.visited_urls,
    }
    output_file.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Harvest works for zero-work thinkers.")
    parser.add_argument(
        "--matches-file",
        type=Path,
        default=Path("data/zero-works-source-matches.json"),
        help="Input file generated by map_zero_work_sources.py",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/zero-works-harvest"),
        help="Directory to store per-thinker harvest results.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Optional limit for debugging.",
    )
    args = parser.parse_args()

    matches = load_matches(args.matches_file, limit=args.limit)
    harvester = WorkHarvester()

    successes = 0
    total = len(matches)

    for record in matches:
        result = harvester.harvest(record)
        write_result(args.output_dir, result)
        if result.status == "success":
            successes += 1
        print(f"[{result.status:>15}] {record.thinker}: {result.message}")

    print(f"\nCompleted harvest for {total} thinkers. Successful: {successes}, failures: {total - successes}")


if __name__ == "__main__":
    main()


