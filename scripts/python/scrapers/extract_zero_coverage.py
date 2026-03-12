#!/usr/bin/env python3
"""
Extract the list of thinkers with zero works from docs/work-coverage-audit.md.

Outputs JSON mapping each collection to a sorted list of thinker names.
"""

from __future__ import annotations

import json
import sys
import argparse
import re
from pathlib import Path

DEFAULT_AUDIT_PATH = Path("docs/work-coverage-audit.md")
EXCLUDED_THINKER_NAMES = {"full biography"}


def parse_zero_coverage(path: Path) -> dict[str, list[str]]:
    if not path.exists():
        raise FileNotFoundError(f"Audit file not found: {path}")

    collections: dict[str, list[str]] = {}
    current: str | None = None
    in_zero_section = False

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()

        if line.startswith("## "):
            if line == "## Thinkers with 0 works":
                in_zero_section = True
                continue
            if in_zero_section:
                break  # reached the next section

        if not in_zero_section:
            continue

        if line.startswith("### "):
            current = re.sub(r"\s+\(\d+\)\s*$", "", line.removeprefix("### ").strip())
            if current:
                collections[current] = []
            continue

        if line.startswith("- "):
            if current is None:
                continue
            thinker = line.removeprefix("- ").strip()
            if thinker and thinker.lower() not in EXCLUDED_THINKER_NAMES:
                collections[current].append(thinker)

    # Drop empty collections and sort names for determinism
    return {collection: sorted(names) for collection, names in collections.items() if names}


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract thinkers with zero works from coverage audit.")
    parser.add_argument(
        "--audit-file",
        type=Path,
        default=DEFAULT_AUDIT_PATH,
        help="Path to docs/work-coverage-audit.md",
    )
    args = parser.parse_args()

    data = parse_zero_coverage(args.audit_file)
    json.dump(data, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
