#!/usr/bin/env python3
"""
Generate docs/work-coverage-audit.md based on current data-v2 metadata files.

The report includes two sections:
  - Thinkers with 0 works
  - Thinkers with 1-5 works (inclusive)

Each section is grouped by collection folder (e.g., anarchists, maoists).
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple


WORK_AUDIT_HEADER = """# Work Coverage Audit

Generated automatically.

"""


def gather_metadata(base_dir: Path) -> Dict[str, List[Dict[str, object]]]:
    """Return mapping of collection folder -> metadata entries."""
    collections: Dict[str, List[Dict[str, object]]] = {}

    for collection_dir in sorted(p for p in base_dir.iterdir() if p.is_dir()):
        metadata_file = collection_dir / "metadata.json"
        if not metadata_file.exists():
            continue
        try:
            entries = json.loads(metadata_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise ValueError(f"Failed to parse {metadata_file}: {exc}") from exc
        collections[collection_dir.name] = entries

    return collections


def build_sections(collections: Dict[str, List[Dict[str, object]]]) -> Tuple[str, str]:
    zero_map: Dict[str, List[str]] = defaultdict(list)
    low_map: Dict[str, List[Tuple[str, int]]] = defaultdict(list)

    for collection, entries in collections.items():
        for entry in entries:
            name = entry.get("n")
            work_count = int(entry.get("w") or 0)
            if not name:
                continue

            if work_count == 0:
                zero_map[collection].append(name)
            elif 1 <= work_count <= 5:
                low_map[collection].append((name, work_count))

    zero_lines: List[str] = ["## Thinkers with 0 works", ""]
    total_zero = sum(len(names) for names in zero_map.values())
    zero_lines.append(f"Total: {total_zero}")
    zero_lines.append("")

    for collection in sorted(zero_map, key=_collection_sort_key):
        thinkers = sorted(zero_map[collection], key=lambda item: item.lower())
        pretty_name = _format_collection_name(collection)
        zero_lines.append(f"### {pretty_name} ({len(thinkers)})")
        zero_lines.append("")
        for thinker in thinkers:
            zero_lines.append(f"- {thinker}")
        zero_lines.append("")

    low_lines: List[str] = ["## Thinkers with 1-5 works", ""]
    total_low = sum(len(entries) for entries in low_map.values())
    low_lines.append(f"Total: {total_low}")
    low_lines.append("")

    for collection in sorted(low_map, key=_collection_sort_key):
        thinkers = sorted(low_map[collection], key=lambda item: item[0].lower())
        pretty_name = _format_collection_name(collection)
        low_lines.append(f"### {pretty_name} ({len(thinkers)})")
        low_lines.append("")
        for thinker, count in thinkers:
            noun = "works" if count != 1 else "work"
            low_lines.append(f"- {thinker} — {count} {noun}")
        low_lines.append("")

    return "\n".join(zero_lines).rstrip() + "\n", "\n".join(low_lines).rstrip() + "\n"


def _collection_sort_key(collection: str) -> str:
    return _format_collection_name(collection).lower()


def _format_collection_name(folder_name: str) -> str:
    if not folder_name:
        return folder_name
    transformed = folder_name.replace("-", " ").replace("_", " ").strip()
    if not transformed:
        return folder_name
    words = transformed.split()
    normalized_words = [word.upper() if len(word) == 1 else word.capitalize() for word in words]
    return " ".join(normalized_words)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate work coverage audit markdown.")
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path("public/data-v2"),
        help="Root directory containing category folders with metadata.json files.",
    )
    parser.add_argument(
        "--output-file",
        type=Path,
        default=Path("docs/work-coverage-audit.md"),
        help="Destination markdown file.",
    )
    args = parser.parse_args()

    if not args.data_dir.exists():
        raise FileNotFoundError(f"Data directory not found: {args.data_dir}")

    collections = gather_metadata(args.data_dir)
    zero_section, low_section = build_sections(collections)

    content = WORK_AUDIT_HEADER + zero_section + "\n\n" + low_section
    args.output_file.write_text(content, encoding="utf-8")
    print(f"Wrote work coverage audit to {args.output_file}")


if __name__ == "__main__":
    main()


