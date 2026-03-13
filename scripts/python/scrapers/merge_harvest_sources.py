#!/usr/bin/env python3
"""
Merge harvest outputs from multiple sources into a single harvest directory.

Reads per-thinker harvest JSON files from one or more harvest directories
(e.g. data/zero-works-harvest/mia, data/zero-works-harvest/redtexts), groups
by (collection, slug), merges works and dedupes by canonical URL. Writes
merged results to --output-dir for consumption by apply_zero_works_harvest.py.

Usage:
    python scripts/python/scrapers/merge_harvest_sources.py \
        --harvest-dirs data/zero-works-harvest/mia data/zero-works-harvest/redtexts \
        --output-dir data/zero-works-harvest/merged
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List, Tuple
from urllib.parse import urlparse, urlunparse


def canonicalize_url(url: str) -> str:
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        return ""
    cleaned = parsed._replace(path=parsed.path or "/", query="", fragment="")
    return urlunparse(cleaned)


def load_harvest_files(harvest_dirs: List[Path]) -> List[Tuple[Path, dict]]:
    """Yield (path, payload) for each harvest JSON under the given directories."""
    seen: set = set()
    for base in harvest_dirs:
        if not base.exists():
            continue
        for file_path in sorted(base.rglob("*.json")):
            if not file_path.is_file():
                continue
            try:
                rel = file_path.relative_to(base)
            except ValueError:
                continue
            key = (base.resolve(), rel)
            if key in seen:
                continue
            seen.add(key)
            try:
                payload = json.loads(file_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                continue
            yield file_path, payload


def merge_payloads(payloads: List[dict]) -> dict:
    """Merge multiple harvest payloads for the same thinker. Dedupe works by URL."""
    if not payloads:
        raise ValueError("Need at least one payload")
    first = payloads[0]
    collection = first.get("collection", "")
    thinker = first.get("thinker", "")
    slug = first.get("slug", "")

    unique_by_url: Dict[str, Dict[str, Any]] = {}
    all_visited: set = set()
    status = "no_works_found"
    message_parts: List[str] = []
    all_warnings: List[str] = []

    for p in payloads:
        all_visited.update(p.get("visited_urls") or [])
        all_warnings.extend(p.get("warnings") or [])
        if p.get("status") == "success":
            status = "success"
        for w in p.get("works") or []:
            if not isinstance(w, dict):
                continue
            url = w.get("url")
            title = w.get("title")
            if not url or not title:
                continue
            canonical = canonicalize_url(str(url))
            if not canonical:
                continue
            if canonical not in unique_by_url:
                entry: Dict[str, Any] = {
                    "title": str(title).strip(),
                    "url": canonical,
                }
                if w.get("source_id"):
                    entry["source_id"] = w["source_id"]
                unique_by_url[canonical] = entry

    if unique_by_url:
        message_parts.append(f"Collected {len(unique_by_url)} works from {len(payloads)} source(s).")
    else:
        message_parts.append("No works after merge.")

    source_url = first.get("source_url")
    for p in payloads:
        if p.get("source_url"):
            source_url = p["source_url"]
            break

    return {
        "collection": collection,
        "thinker": thinker,
        "slug": slug,
        "source_url": source_url,
        "source_id": first.get("source_id"),  # optional; merged has multiple
        "status": status,
        "message": " ".join(message_parts),
        "warnings": list(dict.fromkeys(all_warnings)),
        "works": sorted(unique_by_url.values(), key=lambda w: (str(w.get("title", "")).lower())),
        "visited_urls": sorted(all_visited),
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Merge harvest outputs from multiple sources into one directory."
    )
    parser.add_argument(
        "--harvest-dirs",
        type=Path,
        nargs="+",
        required=True,
        help="One or more directories containing per-thinker harvest JSONs (e.g. .../mia .../redtexts).",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/zero-works-harvest/merged"),
        help="Output directory for merged harvest files.",
    )
    args = parser.parse_args()

    # Group by (collection, slug)
    by_thinker: Dict[Tuple[str, str], List[dict]] = {}
    for _path, payload in load_harvest_files(args.harvest_dirs):
        collection = payload.get("collection") or ""
        slug = payload.get("slug") or ""
        if not collection or not slug:
            continue
        key = (collection, slug)
        by_thinker.setdefault(key, []).append(payload)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    written = 0
    for (collection, slug), payloads in sorted(by_thinker.items()):
        merged = merge_payloads(payloads)
        out_dir = args.output_dir / collection
        out_dir.mkdir(parents=True, exist_ok=True)
        out_file = out_dir / f"{slug}.json"
        out_file.write_text(
            json.dumps(merged, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        written += 1

    print(f"Merged {len(by_thinker)} thinkers into {args.output_dir}. Wrote {written} files.")


if __name__ == "__main__":
    main()
