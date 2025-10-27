#!/usr/bin/env python3

import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

def fetch_and_parse_subject_page(url):
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for HTTP errors
        soup = BeautifulSoup(response.text, 'lxml')
        works = []

        # Assuming works are listed as links within the content area
        # This might need refinement based on the actual HTML structure of subject pages
        for link in soup.find_all('a', href=True):
            link_text = link.get_text(strip=True)
            href = link['href']
            
            # Simple heuristic to filter out non-work links (e.g., navigation, external links)
            # This will likely need to be more robust based on actual page structure
            if link_text and href and not href.startswith(('#', 'http', '/', '../..')):
                # Construct full URL, handling relative paths
                full_work_url = urljoin(url, href)
                works.append({
                    'title': link_text,
                    'url': full_work_url
                })
        return works
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return []

def main():
    subjects_file = 'data/marx-subjects.json'
    output_file = 'data/marx-works-by-subject.json'

    all_works = []

    with open(subjects_file, 'r', encoding='utf-8') as f:
        subjects = json.load(f)

    for subject in subjects:
        print(f"Processing subject: {subject['title']}")
        subject_url = subject['full_url']
        extracted_works = fetch_and_parse_subject_page(subject_url)
        for work in extracted_works:
            work['subject'] = subject['title']  # Add subject context
            all_works.append(work)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_works, f, indent=2, ensure_ascii=False)
    print(f"Extracted {len(all_works)} works and saved to {output_file}")

if __name__ == '__main__':
    main()
