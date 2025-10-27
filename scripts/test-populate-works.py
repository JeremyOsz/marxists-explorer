#!/usr/bin/env python3
"""
Small test script to populate a few thinkers with works data
"""

import json
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import time

def scrape_author_works_simple(author_path: str) -> list:
    """Simple scraper for author works"""
    base_url = "https://www.marxists.org"
    url = urljoin(base_url, author_path)
    
    try:
        print(f"  Scraping {url}...")
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        works = []
        
        # Look for all links that might be works
        all_links = soup.find_all('a', href=True)
        for link in all_links:
            href = link.get('href')
            text = link.get_text(strip=True)
            
            # Skip navigation and non-work links
            if (href.startswith('#') or 
                href.startswith('mailto:') or
                'index.htm' in href or
                len(text) < 3 or
                text.lower() in ['home', 'back', 'next', 'previous', 'biography']):
                continue
                
            # Check if this looks like a work
            if is_likely_work_link(href, text):
                works.append({
                    'title': text,
                    'url': urljoin(url, href)
                })
        
        # Remove duplicates
        seen_titles = set()
        unique_works = []
        for work in works:
            if work['title'] not in seen_titles:
                seen_titles.add(work['title'])
                unique_works.append(work)
                
        return unique_works
        
    except Exception as e:
        print(f"  Error scraping {url}: {e}")
        return []

def is_likely_work_link(href: str, text: str) -> bool:
    """Determine if a link is likely a work"""
    # Skip certain patterns
    skip_patterns = [
        r'\.(jpg|jpeg|png|gif|pdf)$',
        r'^#',
        r'index\.htm$',
        r'bio/',
        r'biography',
        r'^mailto:'
    ]
    
    for pattern in skip_patterns:
        if re.search(pattern, href, re.I):
            return False
            
    # Must have reasonable text length
    if len(text) < 3 or len(text) > 200:
        return False
        
    return True

def main():
    print("=== Small Test: Populate a few thinkers with works ===")
    
    # Load existing bundle
    with open('data/thinkers-bundle.json', 'r', encoding='utf-8') as f:
        bundle_data = json.load(f)
    
    # Test with a few well-known thinkers
    test_authors = [
        ("archive/marx/index.htm", "Karl Marx & Fredrick Engels", "first-international"),
        ("archive/morris/index.htm", "William Morris", "social-democracy"),
        ("archive/debs/index.htm", "Eugene Debs", "social-democracy"),
        ("archive/lenin/index.htm", "Vladimir Lenin", "the-bolsheviks"),
        ("archive/trotsky/index.htm", "Leon Trotsky", "trotskyists"),
        ("archive/luxemburg/index.htm", "Rosa Luxemburg", "social-democracy"),
        ("archive/gramsci/index.htm", "Antonio Gramsci", "early-comintern"),
        ("archive/guevara/index.htm", "Che Guevara", "guerilla-marxism")
    ]
    
    for author_path, author_name, category in test_authors:
        print(f"\nProcessing {author_name}...")
        
        # Find matching thinker in bundle
        thinker = None
        if category in bundle_data:
            for t in bundle_data[category]:
                if author_name.lower() in t['name'].lower() or t['name'].lower() in author_name.lower():
                    thinker = t
                    break
        
        if thinker:
            print(f"  Found thinker: {thinker['name']}")
            
            # Scrape works
            works = scrape_author_works_simple(author_path)
            print(f"  Found {len(works)} works")
            
            # Show first few works
            for i, work in enumerate(works[:5]):
                print(f"    {i+1}. {work['title']}")
            
            if len(works) > 5:
                print(f"    ... and {len(works) - 5} more")
            
            # Update thinker with works
            thinker['works'] = works
            
            # Add delay to be respectful
            time.sleep(2)
        else:
            print(f"  Could not find thinker for {author_name}")
    
    # Save updated bundle
    with open('data/thinkers-bundle.json', 'w', encoding='utf-8') as f:
        json.dump(bundle_data, f, indent=2, ensure_ascii=False)
    
    print("\n=== Test completed! ===")
    print("Check data/thinkers-bundle.json for updated works data")

if __name__ == '__main__':
    main()
