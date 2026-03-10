#!/usr/bin/env python3
"""
Fetch the complete Mao Zedong selected works catalogue from Marxists.org
and populate decade-based JSON files under the data-v2 hierarchy.

This script:
  * scrapes https://www.marxists.org/reference/archive/mao/selected-works/date-index.htm
  * groups works by the major periods listed on the page
  * writes the grouped works to public/data-v2/maoists/Mao Zedong/{subject}.json
  * updates Mao Zedong's entry in public/data-v2/maoists/metadata.json with
    fresh subject counts, total work count, and recommended works
"""

from __future__ import annotations

import json
import re
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Tuple

import requests
from bs4 import BeautifulSoup
from bs4.element import NavigableString, Tag
from requests.adapters import HTTPAdapter
from urllib.parse import urljoin
from urllib3.util.retry import Retry


BASE_URL = "https://www.marxists.org/reference/archive/mao/selected-works/date-index.htm"
DEFAULT_DATA_ROOT = Path("public/data-v2/maoists/Mao Zedong")
DEFAULT_METADATA_PATH = Path("public/data-v2/maoists/metadata.json")
USER_AGENT = "MarxistsExplorer/1.0 (+https://github.com/jeremy/marxists-explorer)"
REQUEST_TIMEOUT = 60
MAX_RETRIES = 3


def build_session() -> requests.Session:
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
    return session


def fetch_html(url: str, session: requests.Session, verify_tls: bool = True) -> BeautifulSoup:
    """Download the HTML page and return a BeautifulSoup parser."""
    response = session.get(url, timeout=REQUEST_TIMEOUT, verify=verify_tls)
    response.raise_for_status()
    return BeautifulSoup(response.content, "html.parser")


def is_inline_recommended(link: Tag) -> bool:
    """Return True if the link is marked as 'recommended' on the page."""
    # Check immediate siblings first.
    for sibling in link.next_siblings:
        if isinstance(sibling, NavigableString):
            continue
        if isinstance(sibling, Tag):
            if sibling.name == "img" and "alt" in sibling.attrs:
                if "recommended" in sibling["alt"].lower():
                    return True
            # stop scanning siblings once we hit a block-level tag
            if sibling.name in {"p", "div", "hr", "br"}:
                break

    # Fallback: search within the same parent container for a recommendation icon.
    parent = link.parent
    while isinstance(parent, Tag):
        recommended_icon = parent.find("img", alt=lambda value: isinstance(value, str) and "recommended" in value.lower())
        if recommended_icon:
            return True
        parent = parent.parent

    return False


def normalise_subject_name(header: Tag) -> str:
    """Extract a clean subject name from an h4 header."""
    text = header.get_text(" ", strip=True)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def collect_sections(soup: BeautifulSoup) -> Tuple[Dict[str, List[Dict[str, str]]], List[Dict[str, str]]]:
    """Parse the soup and return a mapping of subject -> works plus recommended works."""
    sections: Dict[str, List[Dict[str, str]]] = {}
    recommended: List[Dict[str, str]] = []
    recommended_seen: set[str] = set()

    for header in soup.find_all("h4"):
        anchor = header.find("a", attrs={"name": True})
        if anchor is None:
            # Skip the navigation h4 near the top that has no named anchor.
            continue

        subject_name = normalise_subject_name(header)
        if not subject_name:
            continue

        works: List[Dict[str, str]] = []
        seen_bases: set[str] = set()

        for element in header.next_siblings:
            if isinstance(element, NavigableString):
                continue

            if isinstance(element, Tag):
                if element.name == "h4":
                    break  # next subject reached

                links = element.find_all("a", href=True)
                for link in links:
                    href = link.get("href")
                    if not href:
                        continue

                    text = link.get_text(" ", strip=True)
                    if not text:
                        continue
                    text = re.sub(r"\s+", " ", text).strip()

                    lower_href = href.lower()

                    # Skip navigation, index, or external anchors.
                    if lower_href.endswith("index.htm"):
                        continue
                    if lower_href.startswith("#"):
                        continue
                    if lower_href.startswith("javascript:"):
                        continue

                    absolute_url = urljoin(BASE_URL, href)
                    if not absolute_url.startswith(("http://", "https://")):
                        continue

                    base_url = absolute_url.split("#", 1)[0]

                    if base_url in seen_bases:
                        continue
                    seen_bases.add(base_url)

                    record = {"title": text, "url": base_url}
                    if is_inline_recommended(link) and base_url not in recommended_seen:
                        record["description"] = "Recommended by Marxists.org"
                        recommended_seen.add(base_url)
                        recommended.append({"title": text, "url": base_url})

                    works.append(record)

        if works:
            sections[subject_name] = works

    return sections, recommended


def write_section_files(sections: Dict[str, List[Dict[str, str]]], data_root: Path) -> None:
    """Write JSON files for each subject and clean up obsolete files."""
    data_root.mkdir(parents=True, exist_ok=True)

    new_filenames = {f"{subject}.json" for subject in sections}
    for existing_file in data_root.glob("*.json"):
        if existing_file.name not in new_filenames:
            existing_file.unlink()

    for subject, works in sections.items():
        out_path = data_root / f"{subject}.json"
        with out_path.open("w", encoding="utf-8") as handle:
            json.dump(works, handle, indent=2, ensure_ascii=False)
            handle.write("\n")


def update_metadata(
    sections: Dict[str, List[Dict[str, str]]],
    recommended: List[Dict[str, str]],
    metadata_path: Path,
) -> None:
    """Update Mao Zedong's metadata entry with new subjects, counts, totals, and major works."""
    if not metadata_path.exists():
        raise FileNotFoundError(f"Metadata file not found: {metadata_path}")

    with metadata_path.open("r", encoding="utf-8") as handle:
        metadata = json.load(handle)

    updated = False
    total_works = sum(len(items) for items in sections.values())
    subjects_payload = [{"name": subject, "count": len(items)} for subject, items in sections.items()]
    major_works = recommended[:25]

    for entry in metadata:
        if entry.get("n") != "Mao Zedong":
            continue

        entry["subjects"] = subjects_payload
        entry["w"] = total_works

        if major_works:
            entry["j"] = major_works
        elif "j" in entry:
            del entry["j"]

        updated = True
        break

    if not updated:
        raise ValueError("Mao Zedong entry not found in metadata.")

    with metadata_path.open("w", encoding="utf-8") as handle:
        json.dump(metadata, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch and persist Mao selected works from Marxists.org.")
    parser.add_argument(
        "--url",
        default=BASE_URL,
        help="Source date-index URL",
    )
    parser.add_argument(
        "--data-root",
        type=Path,
        default=DEFAULT_DATA_ROOT,
        help="Output folder for subject JSON files.",
    )
    parser.add_argument(
        "--metadata-path",
        type=Path,
        default=DEFAULT_METADATA_PATH,
        help="Path to maoists metadata.json",
    )
    parser.add_argument(
        "--insecure",
        action="store_true",
        help="Disable TLS certificate verification for legacy environments.",
    )
    args = parser.parse_args()

    session = build_session()
    soup = fetch_html(args.url, session=session, verify_tls=not args.insecure)
    sections, recommended = collect_sections(soup)

    if not sections:
        print("No sections were parsed from the source page.", file=sys.stderr)
        return 1

    write_section_files(sections, data_root=args.data_root)
    update_metadata(sections, recommended, metadata_path=args.metadata_path)

    print(f"Updated {len(sections)} subject files for Mao Zedong with {sum(len(v) for v in sections.values())} works.")
    print(f"Marked {len(recommended)} works as recommended.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

