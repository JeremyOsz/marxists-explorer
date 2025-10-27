#!/usr/bin/env python3
"""
Convert thinkers-bundle.json into efficient formats:
- thinkers-metadata.json (compressed metadata)
- thinkers-works.json (works lookup)
- Split category files in public/data/thinkers-by-category/
"""

import json
import os
from collections import defaultdict

def convert_to_efficient_formats():
    """Convert bundle to efficient formats"""
    
    # Read the bundle
    print("Reading thinkers-bundle.json...")
    with open('data/thinkers-bundle.json', 'r', encoding='utf-8') as f:
        bundle_data = json.load(f)
    
    # Initialize structures
    metadata_by_category = defaultdict(list)
    works_lookup = {}
    
    # Process each thinker
    print("Processing thinkers...")
    for category, thinkers in bundle_data.items():
        for thinker in thinkers:
            # Extract works for the lookup
            if 'works' in thinker and thinker['works']:
                works_lookup[thinker['name']] = thinker['works']
            
            # Create compressed metadata
            metadata = {
                'n': thinker['name'],           # name
                'c': thinker['category'],       # category
                'd': thinker['description'],    # description
                'b': thinker['bioUrl'],        # bioUrl
                'i': thinker.get('imageUrl', ''),  # imageUrl
                't': thinker.get('thumbnailUrl', ''),  # thumbnailUrl
                'w': len(thinker.get('works', []))  # workCount
            }
            
            metadata_by_category[category].append(metadata)
    
    # Write metadata file
    print("Writing thinkers-metadata.json...")
    with open('data/thinkers-metadata.json', 'w', encoding='utf-8') as f:
        json.dump(metadata_by_category, f, indent=2, ensure_ascii=False)
    
    # Write works lookup to both locations
    print("Writing thinkers-works.json...")
    with open('data/thinkers-works.json', 'w', encoding='utf-8') as f:
        json.dump(works_lookup, f, indent=2, ensure_ascii=False)
    
    # Also write to public directory for client-side loading
    with open('public/data/thinkers-works.json', 'w', encoding='utf-8') as f:
        json.dump(works_lookup, f, indent=2, ensure_ascii=False)
    
    # Create output directory if it doesn't exist
    os.makedirs('public/data/thinkers-by-category', exist_ok=True)
    
    # Write category files and build index
    print("Writing category files...")
    category_index = {}
    summary_data = {
        'total_thinkers': 0,
        'total_categories': len(metadata_by_category),
        'categories': []
    }
    
    for category, thinkers in metadata_by_category.items():
        # Format filename from category
        filename = category.lower().replace(' ', '-') + '.json'
        category_index[category] = filename
        
        # Write category file
        filepath = f'public/data/thinkers-by-category/{filename}'
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(thinkers, f, indent=2, ensure_ascii=False)
        
        summary_data['categories'].append({
            'category': category,
            'count': len(thinkers),
            'filename': filename
        })
        
        summary_data['total_thinkers'] += len(thinkers)
    
    # Sort categories for consistency
    summary_data['categories'].sort(key=lambda x: x['category'])
    
    # Write index file
    print("Writing index.json...")
    with open('public/data/thinkers-by-category/index.json', 'w', encoding='utf-8') as f:
        json.dump(category_index, f, indent=2, ensure_ascii=False)
    
    # Write summary file
    print("Writing summary.json...")
    with open('public/data/thinkers-by-category/summary.json', 'w', encoding='utf-8') as f:
        json.dump(summary_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Conversion complete!")
    print(f"  - Processed {summary_data['total_thinkers']} thinkers across {summary_data['total_categories']} categories")
    print(f"  - Created {len(works_lookup)} works lookups")
    print(f"  - Written to:")
    print(f"    - data/thinkers-metadata.json")
    print(f"    - data/thinkers-works.json")
    print(f"    - public/data/thinkers-works.json")
    print(f"    - public/data/thinkers-by-category/ (31 category files)")

if __name__ == '__main__':
    convert_to_efficient_formats()
