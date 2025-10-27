import json
import os
from pathlib import Path

def load_json(filepath):
    """Load JSON file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(filepath, data):
    """Save JSON file with proper formatting"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def load_all_category_lookups():
    """Load all thinker names from category JSON files"""
    categories_dir = Path('data/categories')
    all_names = {}
    
    for json_file in categories_dir.glob('*.json'):
        category = json_file.stem
        names = load_json(json_file)
        for name in names:
            if name not in all_names:
                all_names[name] = []
            all_names[name].append(category)
    
    return all_names

def create_default_thinker(name, categories):
    """Create a default thinker entry"""
    # Use the first category as the primary one
    primary_category = categories[0] if categories else "Other"
    
    # Convert category IDs to display names
    category_names = {
        'first-international': 'First International',
        'social-democracy': 'Social Democracy',
        'reformists': 'Reformists',
        'fabians': 'Fabians',
        'the-bolsheviks': 'The Bolsheviks',
        'early-comintern': 'Early Comintern',
        'comintern': 'Comintern',
        'soviet-science': 'Soviet Science',
        'soviet-marxism': 'Soviet Marxism',
        'western-marxism': 'Western Marxism',
        'french-left': 'French Left',
        'frankfurt-school': 'Frankfurt School',
        'trotskyists': 'Trotskyists',
        'left-communism': 'Left Communism',
        'marxist-humanism': 'Marxist Humanism',
        'market-socialists': 'Market Socialists',
        'guerilla-marxism': 'Guerilla Marxism',
        'maoists': 'Maoists',
        'national-liberation': 'National Liberation',
        'african-liberation': 'African Liberation',
        'black-liberation': 'Black Liberation',
        'french-revolution': 'French Revolution',
        'paris-commune': 'Paris Commune',
        'utopianism': 'Utopianism',
        'anarchists': 'Anarchists',
        'feminists': 'Feminists',
        'populists': 'Populists',
        'political-science': 'Political Science',
        'philosophy': 'Philosophy',
        'ethics': 'Ethics',
        'political-economy': 'Political Economy',
        'natural-science': 'Natural Science'
    }
    
    display_category = category_names.get(primary_category, primary_category)
    
    return {
        "name": name,
        "category": display_category,
        "description": f"Marxist thinker and theorist in the tradition of {display_category.lower()}.",
        "bioUrl": "/reference/archive/",  # Placeholder
        "works": [],  # Empty works array
        "imageUrl": ""  # No image URL
    }

def main():
    print("Loading existing thinkers data...")
    existing_thinkers = load_json('data/thinkers.json')
    existing_names = {thinker['name'] for thinker in existing_thinkers}
    
    print(f"Found {len(existing_thinkers)} existing thinkers")
    
    print("\nLoading category lookups...")
    category_lookups = load_all_category_lookups()
    print(f"Found {len(category_lookups)} unique thinker names across all categories")
    
    # Create new thinkers for names not in existing data
    new_thinkers = []
    for name, categories in category_lookups.items():
        if name not in existing_names:
            new_thinker = create_default_thinker(name, categories)
            new_thinkers.append(new_thinker)
    
    print(f"\nCreated {len(new_thinkers)} new thinker entries")
    
    # Combine existing and new thinkers
    all_thinkers = existing_thinkers + new_thinkers
    
    # Sort by name
    all_thinkers.sort(key=lambda x: x['name'])
    
    # Save to new file
    output_file = 'data/thinkers-expanded.json'
    save_json(output_file, all_thinkers)
    
    print(f"\n✓ Saved {len(all_thinkers)} total thinkers to {output_file}")
    print(f"  - {len(existing_thinkers)} with full data")
    print(f"  - {len(new_thinkers)} newly added with minimal data")
    
    # Also create a summary
    summary = {
        "total_thinkers": len(all_thinkers),
        "existing_with_full_data": len(existing_thinkers),
        "new_entries": len(new_thinkers),
        "by_category": {}
    }
    
    for thinker in all_thinkers:
        cat = thinker['category']
        summary['by_category'][cat] = summary['by_category'].get(cat, 0) + 1
    
    summary_file = 'data/thinkers-summary.json'
    save_json(summary_file, summary)
    print(f"\n✓ Saved summary to {summary_file}")

if __name__ == '__main__':
    main()
