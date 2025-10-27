#!/usr/bin/env python3
"""
Test script to validate the MIA works scraper approach
"""

import json
import re
from bs4 import BeautifulSoup

def test_author_link_extraction():
    """Test extracting author links from ref/index"""
    print("Testing author link extraction...")
    
    with open('ref/index', 'r', encoding='utf-8') as f:
        content = f.read()
    
    soup = BeautifulSoup(content, 'html.parser')
    author_spans = soup.find_all('span', class_='author')
    
    author_links = []
    for span in author_spans:
        link = span.find('a')
        if link and link.get('href'):
            href = link.get('href')
            author_name = link.get_text(strip=True)
            
            # Skip non-author links
            if not href.endswith('index.htm') or '../' in href:
                continue
                
            author_links.append((href, author_name))
    
    print(f"Found {len(author_links)} author links")
    
    # Show first 10 as examples
    print("\nFirst 10 author links:")
    for i, (href, name) in enumerate(author_links[:10]):
        print(f"{i+1}. {name} -> {href}")
    
    return author_links

def test_category_mapping():
    """Test category mapping logic"""
    print("\nTesting category mapping...")
    
    # Sample categories from ref/index
    mia_categories = [
        "iwma", "social-democracy", "reformism", "fabianism", 
        "bolsheviks", "early-comintern", "comintern", "soviet-writers",
        "soviet-marxism", "western-marxism", "french-left", 
        "frankfurt-school", "trotskyism", "left-communism",
        "marxist-humanism", "market-socialism", "guerilla-marxism",
        "maoism", "national-liberation", "african-liberation",
        "black-liberation", "french-revolution", "paris-commune",
        "utopianism", "anarchism", "feminism", "populists",
        "political-science", "philosophy", "ethics", 
        "political-economy", "natural-science"
    ]
    
    category_mapping = {
        "iwma": "first-international",
        "social-democracy": "social-democracy", 
        "reformism": "reformists",
        "fabianism": "fabians",
        "bolsheviks": "the-bolsheviks",
        "early-comintern": "early-comintern",
        "comintern": "comintern",
        "soviet-writers": "soviet-science",
        "soviet-marxism": "soviet-marxism",
        "western-marxism": "western-marxism",
        "french-left": "french-left",
        "frankfurt-school": "frankfurt-school",
        "trotskyism": "trotskyists",
        "left-communism": "left-communism",
        "marxist-humanism": "marxist-humanism",
        "market-socialism": "market-socialists",
        "guerilla-marxism": "guerilla-marxism",
        "maoism": "maoists",
        "national-liberation": "national-liberation",
        "african-liberation": "african-liberation",
        "black-liberation": "black-liberation",
        "french-revolution": "french-revolution",
        "paris-commune": "paris-commune",
        "utopianism": "utopianism",
        "anarchism": "anarchists",
        "feminism": "feminists",
        "populists": "populists",
        "political-science": "political-science",
        "philosophy": "philosophy",
        "ethics": "ethics",
        "political-economy": "political-economy",
        "natural-science": "natural-science"
    }
    
    print("Category mapping:")
    for mia_cat in mia_categories:
        our_cat = category_mapping.get(mia_cat, "UNMAPPED")
        print(f"  {mia_cat} -> {our_cat}")

def test_thinker_matching():
    """Test thinker name matching logic"""
    print("\nTesting thinker name matching...")
    
    # Load our bundle to see what thinkers we have
    with open('data/thinkers-bundle.json', 'r', encoding='utf-8') as f:
        bundle_data = json.load(f)
    
    # Sample MIA author names
    mia_authors = [
        "Karl Marx & Fredrick Engels",
        "William Morris", 
        "Eugene Debs",
        "Vladimir Lenin",
        "Leon Trotsky",
        "Rosa Luxemburg",
        "Antonio Gramsci",
        "Che Guevara"
    ]
    
    def names_match(name1: str, name2: str) -> bool:
        """Check if two names match (with fuzzy matching)"""
        # Normalize names
        norm1 = re.sub(r'[^\w\s]', '', name1.lower()).strip()
        norm2 = re.sub(r'[^\w\s]', '', name2.lower()).strip()
        
        # Exact match
        if norm1 == norm2:
            return True
            
        # Check if one name contains the other
        if norm1 in norm2 or norm2 in norm1:
            return True
            
        # Check for common variations
        name1_parts = norm1.split()
        name2_parts = norm2.split()
        
        # If both have multiple parts, check if they share significant parts
        if len(name1_parts) > 1 and len(name2_parts) > 1:
            common_parts = set(name1_parts) & set(name2_parts)
            if len(common_parts) >= min(len(name1_parts), len(name2_parts)) - 1:
                return True
                
        return False
    
    print("Testing name matching:")
    for mia_author in mia_authors:
        found_match = False
        for cat_name, thinkers in bundle_data.items():
            for thinker in thinkers:
                if names_match(thinker['name'], mia_author):
                    print(f"  ✓ {mia_author} matches {thinker['name']} in {cat_name}")
                    found_match = True
                    break
            if found_match:
                break
        
        if not found_match:
            print(f"  ✗ {mia_author} - NO MATCH FOUND")

def main():
    print("=== MIA Works Scraper Test ===")
    
    # Test 1: Extract author links
    author_links = test_author_link_extraction()
    
    # Test 2: Category mapping
    test_category_mapping()
    
    # Test 3: Thinker matching
    test_thinker_matching()
    
    print("\n=== Test Summary ===")
    print(f"Total author links found: {len(author_links)}")
    print("Ready to run the full scraper!")

if __name__ == '__main__':
    main()
