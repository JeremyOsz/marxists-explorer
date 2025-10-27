#!/usr/bin/env python3
"""
Script to populate thinkers-bundle.json with works data from Marxists Internet Archive
"""

import json
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import logging
from typing import Dict, List, Optional, Tuple

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Base URL for Marxists Internet Archive
MIA_BASE_URL = "https://www.marxists.org"

# Category mapping from MIA sections to our categories
CATEGORY_MAPPING = {
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

class MIAWorksScraper:
    def __init__(self, base_url: str = MIA_BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Marxists Explorer Bot 1.0'
        })
        
    def extract_author_links_from_index(self, index_file: str) -> List[Tuple[str, str]]:
        """Extract author links and their categories from ref/index"""
        author_links = []
        
        with open(index_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Parse HTML
        soup = BeautifulSoup(content, 'html.parser')
        
        # Find all author links
        author_spans = soup.find_all('span', class_='author')
        
        for span in author_spans:
            link = span.find('a')
            if link and link.get('href'):
                href = link.get('href')
                author_name = link.get_text(strip=True)
                
                # Skip non-author links
                if not href.endswith('index.htm') or '../' in href:
                    continue
                    
                # Determine category based on context
                category = self._determine_category(span)
                
                author_links.append((href, author_name, category))
                
        return author_links
    
    def _determine_category(self, span_element) -> str:
        """Determine category based on HTML context"""
        # Look for section headers above this span
        current = span_element.parent
        while current:
            if current.name == 'h4':
                section_link = current.find('a')
                if section_link and section_link.get('name'):
                    section_name = section_link.get('name')
                    return CATEGORY_MAPPING.get(section_name, 'unknown')
            current = current.parent
        return 'unknown'
    
    def scrape_author_works(self, author_path: str) -> List[Dict[str, str]]:
        """Scrape works from an author's page"""
        url = urljoin(self.base_url, author_path)
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            works = []
            
            # Look for works in various formats
            # Method 1: Look for links in works sections
            works_sections = soup.find_all(['h3', 'h4'], string=re.compile(r'works|writings|articles', re.I))
            
            for section in works_sections:
                # Find links in the section
                section_links = section.find_next_siblings(['a', 'ul', 'ol'])
                for element in section_links:
                    if element.name == 'a':
                        works.append(self._extract_work_from_link(element))
                    elif element.name in ['ul', 'ol']:
                        for link in element.find_all('a'):
                            works.append(self._extract_work_from_link(link))
            
            # Method 2: Look for all links that might be works
            if not works:
                all_links = soup.find_all('a', href=True)
                for link in all_links:
                    href = link.get('href')
                    text = link.get_text(strip=True)
                    
                    # Skip navigation and non-work links
                    if (href.startswith('#') or 
                        href.startswith('mailto:') or
                        'index.htm' in href or
                        len(text) < 3 or
                        text.lower() in ['home', 'back', 'next', 'previous']):
                        continue
                        
                    # Check if this looks like a work
                    if self._is_likely_work_link(href, text):
                        works.append({
                            'title': text,
                            'url': urljoin(url, href)
                        })
            
            # Remove duplicates
            seen_titles = set()
            unique_works = []
            for work in works:
                if work['title'] not in seen_titles:
                    seen_titles.add(work['title'])
                    unique_works.append(work)
                    
            return unique_works
            
        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            return []
    
    def _extract_work_from_link(self, link_element) -> Dict[str, str]:
        """Extract work information from a link element"""
        title = link_element.get_text(strip=True)
        href = link_element.get('href', '')
        
        return {
            'title': title,
            'url': href if href.startswith('http') else urljoin(self.base_url, href)
        }
    
    def _is_likely_work_link(self, href: str, text: str) -> bool:
        """Determine if a link is likely a work"""
        # Skip certain patterns
        skip_patterns = [
            r'\.(jpg|jpeg|png|gif|pdf)$',
            r'^#',
            r'index\.htm$',
            r'bio/',
            r'biography',
            r'^mailto:'
        ]
        
        for pattern in skip_patterns:
            if re.search(pattern, href, re.I):
                return False
                
        # Must have reasonable text length
        if len(text) < 3 or len(text) > 200:
            return False
            
        return True
    
    def populate_thinkers_bundle(self, index_file: str, bundle_file: str):
        """Main method to populate the thinkers bundle"""
        logger.info("Starting thinkers bundle population...")
        
        # Load existing bundle
        with open(bundle_file, 'r', encoding='utf-8') as f:
            bundle_data = json.load(f)
        
        # Extract author links
        author_links = self.extract_author_links_from_index(index_file)
        logger.info(f"Found {len(author_links)} author links")
        
        # Process each author
        for i, (author_path, author_name, category) in enumerate(author_links):
            logger.info(f"Processing {i+1}/{len(author_links)}: {author_name}")
            
            # Find matching thinker in bundle
            thinker = self._find_thinker_in_bundle(bundle_data, author_name, category)
            
            if thinker:
                # Scrape works
                works = self.scrape_author_works(author_path)
                logger.info(f"Found {len(works)} works for {author_name}")
                
                # Update thinker with works
                thinker['works'] = works
                
                # Add delay to be respectful
                time.sleep(1)
            else:
                logger.warning(f"Could not find thinker for {author_name} in category {category}")
        
        # Save updated bundle
        with open(bundle_file, 'w', encoding='utf-8') as f:
            json.dump(bundle_data, f, indent=2, ensure_ascii=False)
            
        logger.info("Thinkers bundle population completed!")
    
    def _find_thinker_in_bundle(self, bundle_data: dict, author_name: str, category: str) -> Optional[dict]:
        """Find a thinker in the bundle by name and category"""
        # Try exact category match first
        if category in bundle_data:
            for thinker in bundle_data[category]:
                if self._names_match(thinker['name'], author_name):
                    return thinker
        
        # Try fuzzy matching across all categories
        for cat_name, thinkers in bundle_data.items():
            for thinker in thinkers:
                if self._names_match(thinker['name'], author_name):
                    return thinker
                    
        return None
    
    def _names_match(self, name1: str, name2: str) -> bool:
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

def main():
    scraper = MIAWorksScraper()
    
    # Run the population
    scraper.populate_thinkers_bundle(
        index_file='ref/index',
        bundle_file='data/thinkers-bundle.json'
    )

if __name__ == '__main__':
    main()
