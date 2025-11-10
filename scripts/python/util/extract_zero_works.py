#!/usr/bin/env python3
"""
Extract the "Thinkers with 0 works" portion of docs/work-coverage-audit.md
and emit a structured JSON file for downstream scraping tasks.

Usage:
    python scripts/python/util/extract_zero_works.py \
        --audit-file docs/work-coverage-audit.md \
        --output-file data/zero-works-thinkers.json
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Dict, List


SECTION_HEADING = "## Thinkers with 0 works"
NEXT_SECTION_HEADING = "## Thinkers with 1-5 works"
CATEGORY_PREFIX = "### "
ENTRY_PREFIX = "- "


def slugify_name(name: str) -> str:
    """Create a lightweight slug used for logging and checklisting."""
    cleaned = re.sub(r"[’'`]", "", name)
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", cleaned).strip("-")
    return cleaned.lower()


def parse_zero_works_section(markdown_text: str) -> Dict[str, List[str]]:
    """Parse audit markdown and return mapping of category -> thinker names."""
    lines = markdown_text.splitlines()

    try:
        start_idx = lines.index(SECTION_HEADING)
    except ValueError as exc:
        raise ValueError(f"Could not find section heading '{SECTION_HEADING}'") from exc

    try:
        end_idx = lines.index(NEXT_SECTION_HEADING, start_idx + 1)
    except ValueError:
        end_idx = len(lines)

    zero_work_lines = lines[start_idx + 1 : end_idx]

    collection_map: Dict[str, List[str]] = {}
    current_category: str | None = None

    for raw_line in zero_work_lines:
        line = raw_line.strip()
        if not line:
            continue

        if line.startswith(CATEGORY_PREFIX):
            current_category = line[len(CATEGORY_PREFIX) :].strip()
            collection_map.setdefault(current_category, [])
            continue

        if line.startswith(ENTRY_PREFIX):
            if current_category is None:
                raise ValueError(f"Found thinker entry before category heading: '{line}'")
            thinker_name = line[len(ENTRY_PREFIX) :].strip()
            if thinker_name:
                collection_map[current_category].append(thinker_name)

    return collection_map


def build_output_structure(collection_map: Dict[str, List[str]]) -> List[Dict[str, object]]:
    """Flatten the mapping into a list of records with computed helper data."""
    records: List[Dict[str, object]] = []
    for collection, thinkers in sorted(collection_map.items()):
        for thinker in thinkers:
            records.append(
                {
                    "collection": collection,
                    "thinker": thinker,
                    "slug": slugify_name(thinker),
                }
            )
    return records


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract zero-work thinkers into JSON")
    parser.add_argument(
        "--audit-file",
        type=Path,
        default=Path("docs/work-coverage-audit.md"),
        help="Path to work coverage audit markdown file.",
    )
    parser.add_argument(
        "--output-file",
        type=Path,
        default=Path("data/zero-works-thinkers.json"),
        help="Destination for JSON output.",
    )
    args = parser.parse_args()

    markdown_text = args.audit_file.read_text(encoding="utf-8")
    collection_map = parse_zero_works_section(markdown_text)
    records = build_output_structure(collection_map)

    args.output_file.parent.mkdir(parents=True, exist_ok=True)
    args.output_file.write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Wrote {len(records)} thinkers with zero works to {args.output_file}")


if __name__ == "__main__":
    main()


