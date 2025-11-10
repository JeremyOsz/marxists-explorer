#!/usr/bin/env python3
"""
Extract the list of thinkers with zero works from docs/work-coverage-audit.md.

Outputs JSON mapping each collection to a sorted list of thinker names.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path("/Users/jeremy/Documents/marxists-explorer")
AUDIT_PATH = ROOT / "docs" / "work-coverage-audit.md"


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
            current = line.removeprefix("### ").strip()
            if current:
                collections[current] = []
            continue

        if line.startswith("- "):
            if current is None:
                continue
            thinker = line.removeprefix("- ").strip()
            if thinker:
                collections[current].append(thinker)

    # Drop empty collections and sort names for determinism
    return {collection: sorted(names) for collection, names in collections.items() if names}


def main() -> int:
    data = parse_zero_coverage(AUDIT_PATH)
    json.dump(data, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


