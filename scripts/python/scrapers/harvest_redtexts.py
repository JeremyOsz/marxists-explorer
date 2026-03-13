#!/usr/bin/env python3
"""
Convert redtexts match output into per-thinker harvest JSON (no extra fetch).

Reads the JSON produced by map_redtexts_sources.py (which embeds works per
thinker) and writes one harvest file per thinker in the same format as
harvest_zero_work_thinkers.py, so merge_harvest_sources.py and
apply_zero_works_harvest.py can consume it.

Usage:
    python scripts/python/scrapers/harvest_redtexts.py \
        --matches-file data/zero-works-redtexts-matches.json \
        --output-dir data/zero-works-harvest/redtexts
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


REDTEXTS_INDEX_URL = "https://www.redtexts.org/"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert redtexts matches (with embedded works) into harvest JSON files."
    )
    parser.add_argument(
        "--matches-file",
        type=Path,
        default=Path("data/zero-works-redtexts-matches.json"),
        help="Output from map_redtexts_sources.py",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/zero-works-harvest/redtexts"),
        help="Directory to write per-thinker harvest JSONs.",
    )
    args = parser.parse_args()

    if not args.matches_file.exists():
        raise FileNotFoundError(f"Matches file not found: {args.matches_file}")

    records = json.loads(args.matches_file.read_text(encoding="utf-8"))
    written = 0
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
                "source_id": "redtexts",
                "status": "no_source_match",
                "message": "No redtexts.org author section matched.",
                "warnings": record.get("notes", []),
                "works": [],
                "visited_urls": [],
            }
        else:
            first_match = matches[0]
            works = first_match.get("works") or []
            works_with_source = [{**w, "source_id": "redtexts"} for w in works]
            payload = {
                "collection": collection,
                "thinker": thinker,
                "slug": slug,
                "source_url": first_match.get("url") or REDTEXTS_INDEX_URL,
                "source_id": "redtexts",
                "status": "success" if works_with_source else "no_works_found",
                "message": f"Collected {len(works_with_source)} works from redtexts.org." if works_with_source else "No works in matched section.",
                "warnings": record.get("notes", []),
                "works": works_with_source,
                "visited_urls": [REDTEXTS_INDEX_URL],
            }

        out_dir = args.output_dir / collection
        out_dir.mkdir(parents=True, exist_ok=True)
        out_file = out_dir / f"{slug}.json"
        out_file.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        written += 1

    print(f"Wrote {written} harvest files to {args.output_dir}")


if __name__ == "__main__":
    main()
