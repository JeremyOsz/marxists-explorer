import json
import subprocess
import urllib.parse

# Read the thinkers data
with open('data/thinkers.json', 'r') as f:
    thinkers_data = json.load(f)

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

# Update images for each thinker
print("Fetching portrait URLs from Wikimedia Commons...\n")

for thinker in thinkers_data:
    name = thinker['name']
    
    # Try different search terms
    search_terms = [
        f"{name} portrait",
        f"{name}",
    ]
    
    found_url = None
    for search_term in search_terms:
        print(f"Searching for: {search_term}")
        found_url = get_wikimedia_image(search_term)
        if found_url:
            print(f"  ✓ Found: {found_url}")
            thinker['imageUrl'] = found_url
            break
    
    if not found_url:
        print(f"  ✗ No image found for {name}")
    
    print()

# Write the updated data back to thinkers.json
with open('data/thinkers.json', 'w') as f:
    json.dump(thinkers_data, f, indent=2)

print("Done! Updated thinkers.json with Wikimedia image URLs.")
