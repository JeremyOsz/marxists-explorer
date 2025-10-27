#!/usr/bin/env python3
"""
Fetch portrait images from Wikimedia Commons for thinkers in bundle format
Uses requests library for better compatibility
"""

import json
import requests
import time

WIKIMEDIA_API_BASE = "https://commons.wikimedia.org/w/api.php"

def get_wikimedia_image(search_term):
    """Search for an image on Wikimedia Commons and return the first result URL."""
    try:
        # Search for images
        search_params = {
            'action': 'query',
            'format': 'json',
            'list': 'search',
            'srsearch': search_term,
            'srnamespace': 6,  # File namespace
            'srlimit': 1
        }
        
        response = requests.get(WIKIMEDIA_API_BASE, params=search_params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if 'query' in data and 'search' in data['query'] and len(data['query']['search']) > 0:
            file_name = data['query']['search'][0]['title'].replace('File:', '')
            
            # Get the actual image URL
            image_params = {
                'action': 'query',
                'format': 'json',
                'titles': f'File:{file_name}',
                'prop': 'imageinfo',
                'iiprop': 'url'
            }
            
            response2 = requests.get(WIKIMEDIA_API_BASE, params=image_params, timeout=10)
            response2.raise_for_status()
            data2 = response2.json()
            
            pages = data2.get('query', {}).get('pages', {})
            for page_id, page_data in pages.items():
                if 'imageinfo' in page_data and len(page_data['imageinfo']) > 0:
                    return page_data['imageinfo'][0].get('url', '')
    except Exception as e:
        print(f"    Error searching for {search_term}: {e}")
    
    return None

def update_thinker_images(bundle_data, max_thinkers=None):
    """Update images for all thinkers in bundle format"""
    all_thinkers = []
    for category, thinkers in bundle_data.items():
        for thinker in thinkers:
            all_thinkers.append((category, thinker))
    
    if max_thinkers:
        all_thinkers = all_thinkers[:max_thinkers]
    
    total_thinkers = len(all_thinkers)
    success_count = 0
    
    print(f"Fetching portrait URLs from Wikimedia Commons...\n")
    print(f"Processing {total_thinkers} thinkers...\n")
    
    for i, (category, thinker) in enumerate(all_thinkers, 1):
        name = thinker['name']
        
        # Skip if already has an image
        if thinker.get('imageUrl'):
            print(f"[{i}/{total_thinkers}] {name}: Already has image")
            continue
        
        # Try different search terms
        search_terms = [
            f"{name} portrait",
            f"{name}",
        ]
        
        found_url = None
        for search_term in search_terms:
            found_url = get_wikimedia_image(search_term)
            if found_url:
                print(f"[{i}/{total_thinkers}] ✓ Found image for {name}")
                print(f"    URL: {found_url[:80]}...")
                thinker['imageUrl'] = found_url
                success_count += 1
                break
        
        if not found_url:
            print(f"[{i}/{total_thinkers}] ✗ No image found for {name}")
        
        # Be respectful with rate limiting
        time.sleep(0.5)
    
    print(f"\n=== Summary ===")
    print(f"Total thinkers: {total_thinkers}")
    print(f"Images found: {success_count}")
    print(f"Success rate: {success_count/total_thinkers*100:.1f}%")
    
    return bundle_data

def main():
    import sys
    
    # Read the thinkers bundle data
    with open('data/thinkers-bundle.json', 'r', encoding='utf-8') as f:
        bundle_data = json.load(f)
    
    # Check for max_thinkers argument
    max_thinkers = None
    if len(sys.argv) > 1:
        try:
            max_thinkers = int(sys.argv[1])
            print(f"Testing with first {max_thinkers} thinkers\n")
        except ValueError:
            print("Usage: python fetch-wikimedia-portraits-bundle-improved.py [max_thinkers]")
            sys.exit(1)
    
    # Update images
    bundle_data = update_thinker_images(bundle_data, max_thinkers)
    
    # Write the updated data back
    with open('data/thinkers-bundle.json', 'w', encoding='utf-8') as f:
        json.dump(bundle_data, f, indent=2, ensure_ascii=False)
    
    print("\nDone! Updated thinkers-bundle.json with Wikimedia image URLs.")

if __name__ == '__main__':
    main()
