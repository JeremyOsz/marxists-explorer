#!/usr/bin/env python3
"""
Fetch portrait images from Wikimedia Commons for thinkers in bundle format
"""

import json
import subprocess
import urllib.parse
import time

def get_wikimedia_image(search_term):
    """Search for an image on Wikimedia Commons and return the first result URL."""
    try:
        # URL encode the search term
        encoded_search = urllib.parse.quote(search_term)
        url = f"https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch={encoded_search}&srnamespace=6&srlimit=1"
        
        result = subprocess.run(['curl', '-s', url], capture_output=True, text=True)
        data = json.loads(result.stdout)
        
        if 'query' in data and 'search' in data['query'] and len(data['query']['search']) > 0:
            file_name = data['query']['search'][0]['title'].replace('File:', '')
            # Get the actual image URL
            encoded_file = urllib.parse.quote(file_name)
            image_url = f"https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=File:{encoded_file}&prop=imageinfo&iiprop=url"
            
            result2 = subprocess.run(['curl', '-s', image_url], capture_output=True, text=True)
            data2 = json.loads(result2.stdout)
            
            pages = data2.get('query', {}).get('pages', {})
            for page_id, page_data in pages.items():
                if 'imageinfo' in page_data and len(page_data['imageinfo']) > 0:
                    return page_data['imageinfo'][0].get('url', '')
    except Exception as e:
        print(f"Error searching for {search_term}: {e}")
    
    return None

def update_thinker_images(bundle_data):
    """Update images for all thinkers in bundle format"""
    total_thinkers = sum(len(thinkers) for thinkers in bundle_data.values())
    processed = 0
    
    print("Fetching portrait URLs from Wikimedia Commons...\n")
    
    for category, thinkers in bundle_data.items():
        print(f"Processing {category} ({len(thinkers)} thinkers)...")
        
        for thinker in thinkers:
            processed += 1
            name = thinker['name']
            
            # Skip if already has an image
            if thinker.get('imageUrl'):
                print(f"[{processed}/{total_thinkers}] {name}: Already has image")
                continue
            
            # Try different search terms
            search_terms = [
                f"{name} portrait",
                f"{name}",
            ]
            
            found_url = None
            for search_term in search_terms:
                print(f"[{processed}/{total_thinkers}] Searching: {search_term}")
                found_url = get_wikimedia_image(search_term)
                if found_url:
                    print(f"  ✓ Found: {found_url[:80]}...")
                    thinker['imageUrl'] = found_url
                    break
            
            if not found_url:
                print(f"  ✗ No image found for {name}")
            
            # Be respectful with rate limiting
            time.sleep(0.5)
        
        print()
    
    return bundle_data

def main():
    # Read the thinkers bundle data
    with open('data/thinkers-bundle.json', 'r', encoding='utf-8') as f:
        bundle_data = json.load(f)
    
    # Update images
    bundle_data = update_thinker_images(bundle_data)
    
    # Write the updated data back
    with open('data/thinkers-bundle.json', 'w', encoding='utf-8') as f:
        json.dump(bundle_data, f, indent=2, ensure_ascii=False)
    
    print("Done! Updated thinkers-bundle.json with Wikimedia image URLs.")

if __name__ == '__main__':
    main()
