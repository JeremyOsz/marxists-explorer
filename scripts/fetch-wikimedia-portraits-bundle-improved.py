#!/usr/bin/env python3
"""
Fetch portrait images from Wikimedia Commons for thinkers in bundle format
Uses requests library for better compatibility
Supports parallel processing for faster execution
"""

import json
import requests
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

WIKIMEDIA_API_BASE = "https://commons.wikimedia.org/w/api.php"

# Thread-safe print lock
print_lock = Lock()

def thread_safe_print(*args, **kwargs):
    """Thread-safe print function"""
    with print_lock:
        print(*args, **kwargs)

def get_wikimedia_image(search_term):
    """Search for an image on Wikimedia Commons and return the first result URL and thumbnail."""
    # Create a session for this thread
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Marxists Explorer Bot 1.0 (https://github.com/user/marxists-explorer)'
    })
    
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
        
        response = session.get(WIKIMEDIA_API_BASE, params=search_params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if 'query' in data and 'search' in data['query'] and len(data['query']['search']) > 0:
            file_name = data['query']['search'][0]['title'].replace('File:', '')
            
            # Get the actual image URL and thumbnail
            image_params = {
                'action': 'query',
                'format': 'json',
                'titles': f'File:{file_name}',
                'prop': 'imageinfo',
                'iiprop': 'url',
                'iiurlwidth': '200'  # Request thumbnail of 200px width
            }
            
            response2 = session.get(WIKIMEDIA_API_BASE, params=image_params, timeout=10)
            response2.raise_for_status()
            data2 = response2.json()
            
            pages = data2.get('query', {}).get('pages', {})
            for page_id, page_data in pages.items():
                if 'imageinfo' in page_data and len(page_data['imageinfo']) > 0:
                    image_info = page_data['imageinfo'][0]
                    full_url = image_info.get('url', '')
                    thumb_url = image_info.get('thumburl', '')  # Thumbnail URL
                    return {
                        'url': full_url,
                        'thumburl': thumb_url if thumb_url else full_url  # Fallback to full URL if no thumb
                    }
    except Exception as e:
        thread_safe_print(f"    Error searching for {search_term}: {e}")
    
    return None

def process_thinker(args):
    """Process a single thinker to fetch images. Designed for parallel execution."""
    index, category, thinker, total_thinkers = args
    name = thinker['name']
    result = {'success': False, 'name': name, 'skipped': False}
    
    # Skip if already has both image and thumbnail
    if thinker.get('imageUrl') and thinker.get('thumbnailUrl'):
        thread_safe_print(f"[{index}/{total_thinkers}] {name}: Already has image and thumbnail")
        result['skipped'] = True
        return result
    
    # If has image but no thumbnail, try to get thumbnail
    if thinker.get('imageUrl') and not thinker.get('thumbnailUrl'):
        thread_safe_print(f"[{index}/{total_thinkers}] {name}: Has image, fetching thumbnail...")
        try:
            search_terms = [f"{name} portrait", f"{name}"]
            found_image = None
            for search_term in search_terms:
                found_image = get_wikimedia_image(search_term)
                if found_image:
                    thinker['thumbnailUrl'] = found_image['thumburl']
                    thread_safe_print(f"    Thumbnail: {found_image['thumburl'][:80]}...")
                    result['success'] = True
                    return result
        except Exception as e:
            thread_safe_print(f"    Error fetching thumbnail: {e}")
        thread_safe_print(f"    Skipping - couldn't fetch thumbnail")
        result['skipped'] = True
        return result
    
    # Try different search terms
    search_terms = [f"{name} portrait", f"{name}"]
    found_image = None
    for search_term in search_terms:
        found_image = get_wikimedia_image(search_term)
        if found_image:
            thread_safe_print(f"[{index}/{total_thinkers}] ✓ Found image for {name}")
            thread_safe_print(f"    URL: {found_image['url'][:80]}...")
            thread_safe_print(f"    Thumbnail: {found_image['thumburl'][:80]}...")
            thinker['imageUrl'] = found_image['url']
            thinker['thumbnailUrl'] = found_image['thumburl']
            result['success'] = True
            return result
    
    if not found_image:
        thread_safe_print(f"[{index}/{total_thinkers}] ✗ No image found for {name}")
    
    # Small delay to be respectful with rate limiting
    time.sleep(0.1)
    return result

def update_thinker_images(bundle_data, max_thinkers=None, max_workers=8):
    """Update images for all thinkers in bundle format with parallel processing"""
    all_thinkers = []
    for category, thinkers in bundle_data.items():
        for thinker in thinkers:
            all_thinkers.append((category, thinker))
    
    if max_thinkers:
        all_thinkers = all_thinkers[:max_thinkers]
    
    total_thinkers = len(all_thinkers)
    
    thread_safe_print(f"Fetching portrait URLs from Wikimedia Commons...\n")
    thread_safe_print(f"Processing {total_thinkers} thinkers with {max_workers} workers...\n")
    
    # Prepare arguments for parallel processing
    args = [(i + 1, category, thinker, total_thinkers) 
            for i, (category, thinker) in enumerate(all_thinkers)]
    
    success_count = 0
    
    # Use ThreadPoolExecutor for parallel processing
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(process_thinker, arg) for arg in args]
        
        for future in as_completed(futures):
            try:
                result = future.result()
                if result['success']:
                    success_count += 1
            except Exception as e:
                thread_safe_print(f"Error processing thinker: {e}")
    
    thread_safe_print(f"\n=== Summary ===")
    thread_safe_print(f"Total thinkers: {total_thinkers}")
    thread_safe_print(f"Images found: {success_count}")
    if total_thinkers > 0:
        thread_safe_print(f"Success rate: {success_count/total_thinkers*100:.1f}%")
    
    return bundle_data

def main():
    import sys
    
    # Read the thinkers bundle data
    with open('data/thinkers-bundle.json', 'r', encoding='utf-8') as f:
        bundle_data = json.load(f)
    
    # Check for arguments
    max_thinkers = None
    max_workers = 8  # Default to 8 workers
    
    if len(sys.argv) > 1:
        try:
            max_thinkers = int(sys.argv[1])
            print(f"Testing with first {max_thinkers} thinkers\n")
        except ValueError:
            print("Usage: python fetch-wikimedia-portraits-bundle-improved.py [max_thinkers] [max_workers]")
            sys.exit(1)
    
    if len(sys.argv) > 2:
        try:
            max_workers = int(sys.argv[2])
            print(f"Using {max_workers} parallel workers\n")
        except ValueError:
            print("Usage: python fetch-wikimedia-portraits-bundle-improved.py [max_thinkers] [max_workers]")
            sys.exit(1)
    
    # Update images
    bundle_data = update_thinker_images(bundle_data, max_thinkers, max_workers)
    
    # Write the updated data back
    with open('data/thinkers-bundle.json', 'w', encoding='utf-8') as f:
        json.dump(bundle_data, f, indent=2, ensure_ascii=False)
    
    print("\nDone! Updated thinkers-bundle.json with Wikimedia image URLs and thumbnails.")

if __name__ == '__main__':
    main()
