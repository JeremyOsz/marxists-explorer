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
from pathlib import Path
from typing import Dict, List, Tuple

import requests
from bs4 import BeautifulSoup
from bs4.element import NavigableString, Tag
from urllib.parse import urljoin


BASE_URL = "https://www.marxists.org/reference/archive/mao/selected-works/date-index.htm"
DATA_ROOT = Path("/Users/jeremy/Documents/marxists-explorer/public/data-v2/maoists/Mao Zedong")
METADATA_PATH = Path("/Users/jeremy/Documents/marxists-explorer/public/data-v2/maoists/metadata.json")
USER_AGENT = "MarxistsExplorer/1.0 (+https://github.com/jeremy/marxists-explorer)"


def fetch_html(url: str) -> BeautifulSoup:
    """Download the HTML page and return a BeautifulSoup parser."""
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    response = session.get(url, timeout=60, verify=False)  # noqa: S501 - site uses older cert chain
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


def write_section_files(sections: Dict[str, List[Dict[str, str]]]) -> None:
    """Write JSON files for each subject and clean up obsolete files."""
    DATA_ROOT.mkdir(parents=True, exist_ok=True)

    new_filenames = {f"{subject}.json" for subject in sections}
    for existing_file in DATA_ROOT.glob("*.json"):
        if existing_file.name not in new_filenames:
            existing_file.unlink()

    for subject, works in sections.items():
        out_path = DATA_ROOT / f"{subject}.json"
        with out_path.open("w", encoding="utf-8") as handle:
            json.dump(works, handle, indent=2, ensure_ascii=False)
            handle.write("\n")


def update_metadata(sections: Dict[str, List[Dict[str, str]]], recommended: List[Dict[str, str]]) -> None:
    """Update Mao Zedong's metadata entry with new subjects, counts, totals, and major works."""
    if not METADATA_PATH.exists():
        raise FileNotFoundError(f"Metadata file not found: {METADATA_PATH}")

    with METADATA_PATH.open("r", encoding="utf-8") as handle:
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

    with METADATA_PATH.open("w", encoding="utf-8") as handle:
        json.dump(metadata, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def main() -> int:
    soup = fetch_html(BASE_URL)
    sections, recommended = collect_sections(soup)

    if not sections:
        print("No sections were parsed from the source page.", file=sys.stderr)
        return 1

    write_section_files(sections)
    update_metadata(sections, recommended)

    print(f"Updated {len(sections)} subject files for Mao Zedong with {sum(len(v) for v in sections.values())} works.")
    print(f"Marked {len(recommended)} works as recommended.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


