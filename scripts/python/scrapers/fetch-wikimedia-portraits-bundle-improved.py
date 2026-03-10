#!/usr/bin/env python3
"""
Fetch portrait images from Wikimedia Commons for thinkers in bundle format
Uses requests library for better compatibility
Supports parallel processing for faster execution
"""

import argparse
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from typing import Any, Dict, Optional, Tuple

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

WIKIMEDIA_API_BASE = "https://commons.wikimedia.org/w/api.php"
DEFAULT_BUNDLE_PATH = "data/thinkers-bundle.json"
REQUEST_TIMEOUT = 10
MAX_RETRIES = 3

# Thread-safe print lock
print_lock = Lock()

def thread_safe_print(*args, **kwargs):
    """Thread-safe print function"""
    with print_lock:
        print(*args, **kwargs)

def create_session() -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {"User-Agent": "Marxists Explorer Bot 1.0 (https://github.com/user/marxists-explorer)"}
    )
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


def get_wikimedia_image(search_term: str, session: requests.Session) -> Optional[Dict[str, str]]:
    """Search for an image on Wikimedia Commons and return the first result URL and thumbnail."""
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
        
        response = session.get(WIKIMEDIA_API_BASE, params=search_params, timeout=REQUEST_TIMEOUT)
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
            
            response2 = session.get(WIKIMEDIA_API_BASE, params=image_params, timeout=REQUEST_TIMEOUT)
            response2.raise_for_status()
            data2 = response2.json()
            
            pages = data2.get('query', {}).get('pages', {})
            for _page_id, page_data in pages.items():
                if 'imageinfo' in page_data and len(page_data['imageinfo']) > 0:
                    image_info = page_data['imageinfo'][0]
                    full_url = image_info.get('url', '')
                    thumb_url = image_info.get('thumburl', '')  # Thumbnail URL
                    return {
                        'url': full_url,
                        'thumburl': thumb_url if thumb_url else full_url  # Fallback to full URL if no thumb
                    }
    except (requests.RequestException, ValueError) as e:
        thread_safe_print(f"    Error searching for {search_term}: {e}")

    return None


def process_thinker(args: Tuple[int, Dict[str, Any], int]) -> Dict[str, Any]:
    """Process a single thinker to fetch images. Designed for parallel execution."""
    index, thinker, total_thinkers = args
    name = thinker.get('name', '').strip()
    if not name:
        return {'success': False, 'name': '', 'skipped': True}

    session = create_session()
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
                found_image = get_wikimedia_image(search_term, session=session)
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
        found_image = get_wikimedia_image(search_term, session=session)
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

def update_thinker_images(bundle_data: Dict[str, Any], max_thinkers: Optional[int] = None, max_workers: int = 8):
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
    args = [(i + 1, thinker, total_thinkers) for i, (_category, thinker) in enumerate(all_thinkers)]
    
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

def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch Wikimedia portrait URLs for thinkers bundle.")
    parser.add_argument(
        "--bundle-file",
        default=DEFAULT_BUNDLE_PATH,
        help="Path to thinkers-bundle.json",
    )
    parser.add_argument(
        "--max-thinkers",
        type=int,
        default=None,
        help="Optional cap for debugging runs.",
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=8,
        help="Number of parallel workers (default: 8).",
    )
    args = parser.parse_args()

    # Read the thinkers bundle data
    with open(args.bundle_file, 'r', encoding='utf-8') as f:
        bundle_data = json.load(f)

    if args.max_thinkers:
        thread_safe_print(f"Testing with first {args.max_thinkers} thinkers\n")
    thread_safe_print(f"Using {args.max_workers} parallel workers\n")

    # Update images
    bundle_data = update_thinker_images(bundle_data, args.max_thinkers, args.max_workers)

    # Write the updated data back
    with open(args.bundle_file, 'w', encoding='utf-8') as f:
        json.dump(bundle_data, f, indent=2, ensure_ascii=False)

    print("\nDone! Updated thinkers-bundle.json with Wikimedia image URLs and thumbnails.")

if __name__ == '__main__':
    main()
