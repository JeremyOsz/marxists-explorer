import json
import re
from collections import defaultdict

# Read the HTML file
with open('ref/index', 'r') as f:
    html_content = f.read()

# Category mapping from HTML anchors to our JSON files
category_mapping = {
    'iwma': 'first-international',
    'social-democracy': 'social-democracy',
    'reformism': 'reformists',
    'fabianism': 'fabians',
    'bolsheviks': 'the-bolsheviks',
    'early-comintern': 'early-comintern',
    'comintern': 'comintern',
    'soviet-writers': 'soviet-science',
    'soviet-marxism': 'soviet-marxism',
    'western-marxism': 'western-marxism',
    'french-left': 'french-left',
    'frankfurt-school': 'frankfurt-school',
    'trotskyism': 'trotskyists',
    'left-communism': 'left-communism',
    'marxist-humanism': 'marxist-humanism',
    'market-socialism': 'market-socialists',
    'guerilla-marxism': 'guerilla-marxism',
    'maoism': 'maoists',
    'national-liberation': 'national-liberation',
    'african-liberation': 'african-liberation',
    'black-liberation': 'black-liberation',
    'french-revolution': 'french-revolution',
    'paris-commune': 'paris-commune',
    'utopianism': 'utopianism',
    'anarchism': 'anarchists',
    'feminism': 'feminists',
    'populists': 'populists',
    'political-science': 'political-science',
    'philosophy': 'philosophy',
    'ethics': 'ethics',
    'political-economy': 'political-economy',
    'natural-science': 'natural-science'
}

thinkers_by_category = defaultdict(list)

# Find all anchor tags with name attributes
anchor_pattern = r'<a[^>]*name="([^"]+)"[^>]*>'
anchors = re.finditer(anchor_pattern, html_content)

# Extract positions and anchors
anchor_positions = []
for match in anchors:
    anchor_positions.append((match.start(), match.group(1)))

# Now process each section
for i, (start_pos, anchor_name) in enumerate(anchor_positions):
    if anchor_name not in category_mapping:
        continue
    
    # Find the end of this section (next anchor or end of file)
    if i + 1 < len(anchor_positions):
        end_pos = anchor_positions[i + 1][0]
    else:
        end_pos = len(html_content)
    
    # Extract section content
    section_html = html_content[start_pos:end_pos]
    
    # Pattern to match author names in this section
    # Looking for: <span class="author"><a href="...">Name</a></span>
    author_pattern = r'<span class="author">.*?<a[^>]*class="[^"]*"[^>]*>([^<]+)</a>.*?</span>'
    authors = re.findall(author_pattern, section_html, re.DOTALL)
    
    # Clean and add names
    seen = set()
    for author in authors:
        # Clean the author name
        author = re.sub(r'&amp;', '&', author)
        author = re.sub(r'&lt;', '<', author)
        author = re.sub(r'&gt;', '>', author)
        author = re.sub(r'&nbsp;', ' ', author)
        author = re.sub(r'&quot;', '"', author)
        author = re.sub(r'&apos;', "'", author)
        author = re.sub(r'\s+', ' ', author).strip()
        
        # Skip if name is too short or looks like HTML
        if len(author) < 3 or '<' in author or '&#' in author:
            continue
        
        # Skip dates patterns
        if re.match(r'^\d+-\d+$', author):
            continue
            
        # Remove duplicates
        if author not in seen:
            seen.add(author)
            category_file = category_mapping[anchor_name]
            thinkers_by_category[category_file].append(author)

# Sort names and write to files
for category_file, names in thinkers_by_category.items():
    file_path = f'data/categories/{category_file}.json'
    names_sorted = sorted(list(set(names)))  # Remove duplicates and sort
    with open(file_path, 'w') as f:
        json.dump(names_sorted, f, indent=2)
    print(f"✓ Wrote {len(names_sorted)} names to {category_file}.json")

print(f"\nTotal categories processed: {len(thinkers_by_category)}")
print(f"Total unique thinkers: {sum(len(names) for names in thinkers_by_category.values())}")
