#!/usr/bin/env python3
"""
Improved scraper to populate thinkers with actual works data
"""

import json
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import time

def scrape_author_works_improved(author_path: str) -> list:
    """Improved scraper for author works"""
    base_url = "https://www.marxists.org"
    url = urljoin(base_url, author_path)
    
    try:
        print(f"  Scraping {url}...")
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        works = []
        
        # Method 1: Look for works sections
        works_sections = soup.find_all(['h3', 'h4'], string=re.compile(r'works|writings|articles|texts', re.I))
        
        for section in works_sections:
            # Find links in the section
            section_links = section.find_next_siblings(['a', 'ul', 'ol'])
            for element in section_links:
                if element.name == 'a':
                    work = extract_work_from_link(element, url)
                    if work:
                        works.append(work)
                elif element.name in ['ul', 'ol']:
                    for link in element.find_all('a'):
                        work = extract_work_from_link(link, url)
                        if work:
                            works.append(work)
        
        # Method 2: Look for links in tables (common MIA structure)
        tables = soup.find_all('table')
        for table in tables:
            links = table.find_all('a', href=True)
            for link in links:
                work = extract_work_from_link(link, url)
                if work:
                    works.append(work)
        
        # Method 3: Look for all links and filter intelligently
        if not works:
            all_links = soup.find_all('a', href=True)
            for link in all_links:
                work = extract_work_from_link(link, url)
                if work:
                    works.append(work)
        
        # Remove duplicates and filter out non-works
        seen_titles = set()
        unique_works = []
        for work in works:
            if (work['title'] not in seen_titles and 
                is_likely_work_title(work['title']) and
                is_likely_work_url(work['url'])):
                seen_titles.add(work['title'])
                unique_works.append(work)
                
        return unique_works
        
    except Exception as e:
        print(f"  Error scraping {url}: {e}")
        return []

def extract_work_from_link(link_element, base_url: str) -> dict:
    """Extract work information from a link element"""
    title = link_element.get_text(strip=True)
    href = link_element.get('href', '')
    
    if not title or not href:
        return None
        
    return {
        'title': title,
        'url': urljoin(base_url, href)
    }

def is_likely_work_title(title: str) -> bool:
    """Check if a title looks like a work title"""
    # Skip navigation and metadata
    skip_words = [
        'click here', 'home', 'back', 'next', 'previous', 'biography',
        'chronology', 'journalism', 'contact us', 'other languages',
        'lawrence', 'wishart', 'archive.org', 'gesamtausgabe',
        'foundation', 'party', 'archive', 'marxist', 'history',
        'socialist', 'mia', 'steering', 'committee', 'permission',
        'creative', 'commons', 'attribute', 'sharealike', 'encyclopedia',
        'introduction', 'life', 'thought', 'baggins', 'mitchell', 'abidor'
    ]
    
    title_lower = title.lower()
    
    # Skip if contains skip words
    for word in skip_words:
        if word in title_lower:
            return False
    
    # Must have reasonable length
    if len(title) < 5 or len(title) > 200:
        return False
    
    # Skip if it's just a year
    if re.match(r'^\d{4}$', title):
        return False
    
    # Skip if it's just a single word (likely navigation)
    if len(title.split()) < 2:
        return False
    
    return True

def is_likely_work_url(url: str) -> bool:
    """Check if a URL looks like a work URL"""
    # Skip certain patterns
    skip_patterns = [
        r'\.(jpg|jpeg|png|gif|pdf)$',
        r'^#',
        r'index\.htm$',
        r'bio/',
        r'biography',
        r'^mailto:',
        r'contact',
        r'foundation',
        r'party',
        r'archive\.org',
        r'wishart',
        r'permission',
        r'commons',
        r'encyclopedia'
    ]
    
    for pattern in skip_patterns:
        if re.search(pattern, url, re.I):
            return False
    
    return True

def main():
    print("=== Improved Test: Populate thinkers with actual works ===")
    
    # Load existing bundle
    with open('data/thinkers-bundle.json', 'r', encoding='utf-8') as f:
        bundle_data = json.load(f)
    
    # Test with a few well-known thinkers
    test_authors = [
        ("archive/marx/index.htm", "Karl Marx", "first-international"),
        ("archive/morris/index.htm", "William Morris", "social-democracy"),
        ("archive/debs/index.htm", "Eugene Debs", "social-democracy"),
        ("archive/luxemburg/index.htm", "Rosa Luxemburg", "social-democracy"),
        ("archive/gramsci/index.htm", "Antonio Gramsci", "early-comintern"),
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
            works = scrape_author_works_improved(author_path)
            print(f"  Found {len(works)} works")
            
            # Show first few works
            for i, work in enumerate(works[:10]):
                print(f"    {i+1}. {work['title']}")
            
            if len(works) > 10:
                print(f"    ... and {len(works) - 10} more")
            
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
