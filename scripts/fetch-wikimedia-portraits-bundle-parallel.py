#!/usr/bin/env python3
"""
Fetch portrait images from Wikimedia Commons for thinkers in bundle format
Uses parallel processing for faster execution
"""

import json
import requests
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

WIKIMEDIA_API_BASE = "https://commons.wikimedia.org/w/api.php"

# Create a session with proper headers
session = requests.Session()
session.headers.update({
    'User-Agent': 'Marxists Explorer Bot 1.0 (https://github.com/user/marxists-explorer)'
})

# Lock for thread-safe progress printing
print_lock = Lock()

def get_wikimedia_image(search_term):
    """Search for an image on Wikimedia Commons and return the first result URL."""
    try:
        # Create a separate session for each thread
        thread_session = requests.Session()
        thread_session.headers.update({
            'User-Agent': 'Marxists Explorer Bot 1.0 (https://github.com/user/marxists-explorer)'
        })
        
        # Search for images
        search_params = {
            'action': 'query',
            'format': 'json',
            'list': 'search',
            'srsearch': search_term,
            'srnamespace': 6,  # File namespace
            'srlimit': 1
        }
        
        response = thread_session.get(WIKIMEDIA_API_BASE, params=search_params, timeout=10)
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
            
            response2 = thread_session.get(WIKIMEDIA_API_BASE, params=image_params, timeout=10)
            response2.raise_for_status()
            data2 = response2.json()
            
            pages = data2.get('query', {}).get('pages', {})
            for page_id, page_data in pages.items():
                if 'imageinfo' in page_data and len(page_data['imageinfo']) > 0:
                    return page_data['imageinfo'][0].get('url', '')
    except Exception as e:
        with print_lock:
            print(f"    Error searching for {search_term}: {e}")
    
    return None

def process_thinker(args):
    """Process a single thinker's image fetching"""
    i, total, category, thinker = args
    name = thinker['name']
    
    # Skip if already has an image
    if thinker.get('imageUrl'):
        with print_lock:
            print(f"[{i}/{total}] {name}: Already has image")
        return {'thinker': thinker, 'found': False}
    
    # Try different search terms
    search_terms = [
        f"{name} portrait",
        f"{name}",
    ]
    
    found_url = None
    for search_term in search_terms:
        found_url = get_wikimedia_image(search_term)
        if found_url:
            with print_lock:
                print(f"[{i}/{total}] ✓ Found image for {name}")
                print(f"    URL: {found_url[:80]}...")
            thinker['imageUrl'] = found_url
            return {'thinker': thinker, 'found': True}
    
    with print_lock:
        print(f"[{i}/{total}] ✗ No image found for {name}")
    
    return {'thinker': thinker, 'found': False}

def update_thinker_images_parallel(bundle_data, max_thinkers=None, num_workers=10):
    """Update images for all thinkers in bundle format using parallel processing"""
    all_thinkers = []
    for category, thinkers in bundle_data.items():
        for thinker in thinkers:
            all_thinkers.append((category, thinker))
    
    if max_thinkers:
        all_thinkers = all_thinkers[:max_thinkers]
    
    total_thinkers = len(all_thinkers)
    success_count = 0
    
    print(f"Fetching portrait URLs from Wikimedia Commons...\n")
    print(f"Processing {total_thinkers} thinkers in parallel with {num_workers} workers...\n")
    
    # Prepare arguments for parallel processing
    args = [(i, total_thinkers, cat, thinker) for i, (cat, thinker) in enumerate(all_thinkers, 1)]
    
    # Process in parallel
    results = []
    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        # Submit all tasks
        future_to_thinker = {executor.submit(process_thinker, arg): arg for arg in args}
        
        # Process as they complete
        for future in as_completed(future_to_thinker):
            result = future.result()
            results.append(result)
            if result['found']:
                success_count += 1
            # Small delay to be respectful
            time.sleep(0.1)
    
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
    if len(sys.argv) > 1 and not sys.argv[1].startswith('--workers'):
        try:
            max_thinkers = int(sys.argv[1])
            print(f"Testing with first {max_thinkers} thinkers\n")
        except ValueError:
            print("Usage: python fetch-wikimedia-portraits-bundle-parallel.py [max_thinkers] [--workers N]")
            sys.exit(1)
    
    # Check for worker count
    num_workers = 10  # Default
    if '--workers' in sys.argv:
        idx = sys.argv.index('--workers')
        if idx + 1 < len(sys.argv):
            try:
                num_workers = int(sys.argv[idx + 1])
            except ValueError:
                pass
    
    if max_thinkers:
        print(f"Using {num_workers} parallel workers\n")
    
    # Update images
    bundle_data = update_thinker_images_parallel(bundle_data, max_thinkers, num_workers)
    
    # Write the updated data back
    with open('data/thinkers-bundle.json', 'w', encoding='utf-8') as f:
        json.dump(bundle_data, f, indent=2, ensure_ascii=False)
    
    print("\nDone! Updated thinkers-bundle.json with Wikimedia image URLs.")

if __name__ == '__main__':
    main()
