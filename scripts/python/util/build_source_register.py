#!/usr/bin/env python3
"""
Build an initial register of canonical source URLs for thinkers.

The register is seeded from harvest outputs in data/zero-works-harvest,
capturing the canonical Marxists.org author index for each successfully
processed thinker. This data can drive future automated refresh jobs that
need to know which URL tree to crawl for updates.

Usage:
    python scripts/python/util/build_source_register.py \
        --harvest-dir data/zero-works-harvest \
        --output-file data/thinker-source-register.json
"""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set, Tuple
from urllib.parse import urlparse


def iter_harvest_files(harvest_dir: Path) -> Iterable[Path]:
    """Yield all harvest JSON files."""
    for file_path in sorted(harvest_dir.rglob("*.json")):
        if file_path.is_file():
            yield file_path


PRUNE_SEGMENTS: Set[str] = {
    "works",
    "writings",
    "articles",
    "letters",
    "speeches",
    "pamphlets",
    "essays",
    "books",
    "chron",
    "texts",
    "docs",
    "poems",
    "verses",
    "interviews",
    "selected-works",
    "selectedworks",
    "selected",
    "poetry",
    "novels",
    "fiction",
}


def slugify(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    cleaned = re.sub(r"[’'`]", "", ascii_name)
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", cleaned).strip("-")
    return cleaned.lower()


def normalize_works_root(url: str) -> Optional[str]:
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        return None

    segments = [segment for segment in parsed.path.split("/") if segment]

    if segments and segments[-1].endswith((".htm", ".html", ".pdf", ".txt")):
        segments.pop()

    def should_prune(segment: str) -> bool:
        lowered = segment.lower()
        if lowered in PRUNE_SEGMENTS:
            return True
        if lowered.isdigit():
            return True
        if lowered.startswith("volume-") or lowered.startswith("vol-"):
            return True
        if lowered.startswith("book-") or lowered.startswith("chapter-"):
            return True
        return False

    while len(segments) > 1 and should_prune(segments[-1]):
        segments.pop()

    host = parsed.netloc.lower()
    if "marxists.org" in host:
        lowered = [segment.lower() for segment in segments]
        if "archive" in lowered:
            idx = lowered.index("archive")
            if idx + 1 < len(segments):
                segments = segments[: idx + 2]
        elif "writers" in lowered:
            idx = lowered.index("writers")
            segments = segments[: min(len(segments), idx + 2)]
        elif "leaders" in lowered:
            idx = lowered.index("leaders")
            segments = segments[: min(len(segments), idx + 2)]
        elif "newspape" in lowered:
            idx = lowered.index("newspape")
            segments = segments[: min(len(segments), idx + 2)]
        elif "subjects" in lowered:
            idx = lowered.index("subjects")
            segments = segments[: min(len(segments), idx + 2)]
        else:
            segments = segments[: min(len(segments), 4)]

    path = "/".join(segments)
    if path:
        return f"{parsed.scheme}://{parsed.netloc}/{path}/"
    return f"{parsed.scheme}://{parsed.netloc}/"


def ensure_entry(register: Dict[Tuple[str, str], Dict[str, object]], collection: str, thinker: str, slug_value: str) -> Dict[str, object]:
    return register.setdefault(
        (collection, slug_value),
        {
            "collection": collection,
            "thinker": thinker,
            "slug": slug_value,
            "sources": [],
        },
    )


def add_source(entry: Dict[str, object], url: str, works_root: str, label: str, source_type: str) -> None:
    sources: List[Dict[str, object]] = entry.setdefault("sources", [])
    for source in sources:
        existing_root = source.get("works_root")
        existing_url = source.get("url")
        if existing_root == works_root or existing_url == url:
            return
    sources.append(
        {
            "label": label,
            "type": source_type,
            "url": url,
            "works_root": works_root,
            "notes": [],
        }
    )


def classify_label(url: str) -> Tuple[str, str]:
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    if "marxists.org" in host:
        return "Marxists.org Works Root", "mia_works_root"
    return f"{host} Works Root", "external_works_root"


def build_register(harvest_dir: Path) -> Dict[Tuple[str, str], Dict[str, object]]:
    records: Dict[tuple, Dict[str, object]] = {}
    for file_path in iter_harvest_files(harvest_dir):
        payload = json.loads(file_path.read_text(encoding="utf-8"))
        status = payload.get("status")
        source_url = payload.get("source_url")
        collection = payload.get("collection")
        thinker = payload.get("thinker")
        slug = payload.get("slug")

        if status != "success" or not source_url or not collection or not thinker or not slug:
            continue

        works_root = normalize_works_root(source_url)
        if not works_root:
            continue

        entry = ensure_entry(records, collection, thinker, slug)

        add_source(entry, source_url, works_root, "Marxists.org Author Index", "mia_author_index")

    return records


def collect_work_urls(thinker_dir: Path) -> Iterable[str]:
    for json_file in sorted(thinker_dir.glob("*.json")):
        if json_file.name.lower() == "metadata.json":
            continue
        try:
            works = json.loads(json_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        if not isinstance(works, list):
            continue
        for work in works:
            if isinstance(work, dict):
                url = work.get("url")
                if isinstance(url, str) and url.startswith("http"):
                    yield url


def augment_with_dataset(register: Dict[Tuple[str, str], Dict[str, object]], data_dir: Path) -> None:
    if not data_dir.exists():
        return

    for collection_dir in sorted(p for p in data_dir.iterdir() if p.is_dir()):
        metadata_file = collection_dir / "metadata.json"
        if not metadata_file.exists():
            continue

        collection_key = collection_dir.name
        try:
            metadata = json.loads(metadata_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue

        for entry in metadata:
            thinker_name = entry.get("n")
            if not thinker_name:
                continue

            slug_value = slugify(thinker_name)
            register_entry = ensure_entry(register, collection_key, thinker_name, slug_value)
            register_entry["thinker"] = thinker_name  # ensure latest casing

            thinker_dir = collection_dir / thinker_name
            if not thinker_dir.exists():
                continue

            for url in collect_work_urls(thinker_dir):
                works_root = normalize_works_root(url)
                if not works_root:
                    continue
                label, source_type = classify_label(works_root)
                add_source(register_entry, works_root, works_root, label, source_type)


def register_to_list(register: Dict[Tuple[str, str], Dict[str, object]]) -> List[Dict[str, object]]:
    return [register[key] for key in sorted(register)]


def main() -> None:
    parser = argparse.ArgumentParser(description="Build thinker source register from harvest data.")
    parser.add_argument(
        "--harvest-dir",
        type=Path,
        default=Path("data/zero-works-harvest"),
        help="Directory containing per-thinker harvest results.",
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=None,
        help="Optional data-v2 root to augment sources from existing works.",
    )
    parser.add_argument(
        "--output-file",
        type=Path,
        default=Path("data/thinker-source-register.json"),
        help="Destination JSON file for the register.",
    )
    args = parser.parse_args()

    if not args.harvest_dir.exists():
        raise FileNotFoundError(f"Harvest directory not found: {args.harvest_dir}")

    register = build_register(args.harvest_dir)

    if args.data_dir:
        augment_with_dataset(register, args.data_dir)

    args.output_file.parent.mkdir(parents=True, exist_ok=True)
    payload = register_to_list(register)
    args.output_file.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(payload)} register entries to {args.output_file}")


if __name__ == "__main__":
    main()


