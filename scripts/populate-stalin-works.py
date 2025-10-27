#!/usr/bin/env python3
"""
Populate Joseph Stalin works from Marxists.org decades index
"""

import json
import re
from urllib.request import urlopen
from urllib.error import URLError

def fetch_page(url):
    """Fetch a web page and return its content"""
    try:
        with urlopen(url) as response:
            return response.read().decode('utf-8')
    except URLError as e:
        print(f"Error fetching {url}: {e}")
        return None

def extract_stalin_works():
    """Extract works from Stalin's decades index"""
    url = "https://www.marxists.org/reference/archive/stalin/works/decades-index.htm"
    content = fetch_page(url)
    
    if not content:
        return []
    
    works = []
    
    # Extract links with titles and dates
    # Pattern: <a href="1901/09/x01.htm">From the Editors</a> (September 1901)<br>
    pattern = r'<a href="([^"]+)">([^<]+)</a>\s*\(([^)]+)\)'
    matches = re.findall(pattern, content)
    
    for href, title, date in matches:
        if href.startswith('http'):
            work_url = href
        else:
            work_url = f"https://www.marxists.org/reference/archive/stalin/works/{href}"
        
        # Filter out Collected Works index and other non-individual works
        if "collected/index.htm" in href or "Collected Works Index" in title:
            continue
            
        works.append({
            "title": title.strip(),
            "url": work_url,
            "date": date.strip()
        })
    
    # Add Collected Works as a major entry if not already present
    # This is a representative entry, actual volumes vary
    if not any("Collected Works" in work['title'] for work in works):
        works.insert(0, {
            "title": "Collected Works of Joseph Stalin",
            "url": "https://www.marxists.org/reference/archive/stalin/works/collected/index.htm",
            "date": "1901-1940"
        })
    
    return works

def update_thinkers_bundle():
    """Update the thinkers-bundle.json file with Joseph Stalin works"""
    print("Reading thinkers-bundle.json...")
    with open('data/thinkers-bundle.json', 'r', encoding='utf-8') as f:
        bundle = json.load(f)
    
    stalin_works = extract_stalin_works()
    
    print(f"\nFound {len(stalin_works)} works for Joseph Stalin")
    
    updated = False
    for category, thinkers in bundle.items():
        for i, thinker in enumerate(thinkers):
            if thinker['name'] == 'Joseph Stalin':
                thinker['works'] = stalin_works
                updated = True
                print(f"Updated Joseph Stalin with {len(stalin_works)} works")
                break
        if updated:
            break
            
    if updated:
        print("\nWriting updated thinkers-bundle.json...")
        with open('data/thinkers-bundle.json', 'w', encoding='utf-8') as f:
            json.dump(bundle, f, indent=2, ensure_ascii=False)
        print("Done!")
    else:
        print("Joseph Stalin not found in bundle")

if __name__ == '__main__':
    update_thinkers_bundle()
