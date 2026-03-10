#!/usr/bin/env python3
"""
Final comprehensive pipeline to populate thinkers-bundle.json with works data
Uses parallel processing for 4-8x faster execution
"""

import json
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urlunparse
import logging
from typing import Dict, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
import argparse
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Base URL for Marxists Internet Archive
MIA_BASE_URL = "https://www.marxists.org"
REQUEST_TIMEOUT = 15
MAX_RETRIES = 3

class ComprehensiveMIAWorksScraper:
    def __init__(self, base_url: str = MIA_BASE_URL):
        self.base_url = base_url
        self.print_lock = Lock()
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'Marxists Explorer Bot 1.0'})
        retry = Retry(
            total=MAX_RETRIES,
            backoff_factor=0.5,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=("GET",),
            respect_retry_after_header=True,
        )
        self.session.mount("https://", HTTPAdapter(max_retries=retry))
        self.session.mount("http://", HTTPAdapter(max_retries=retry))
        
    def extract_author_links_from_index(self, index_file: str) -> List[Tuple[str, str, str]]:
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
                
                # Get category from parent
                category = 'unknown'
                parent = span.find_parent('div', class_='category') or span.find_previous('div', class_='category')
                if parent:
                    category = parent.get_text(strip=True)
                
                author_links.append((author_name, href, category))
        
        return author_links
    
    def fetch_works_for_author(self, author_name: str, author_url: str, category: str) -> Optional[List[Dict[str, str]]]:
        """Fetch works for a single author with retry logic"""
        try:
            full_url = self._normalize_author_url(author_url)

            response = self.session.get(full_url, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find the works list (look for links in archive directories)
            works = []
            for link in soup.find_all('a', href=True):
                href = link.get('href')
                title = link.get_text(strip=True)
                
                # Skip if empty or navigation links
                if not title or not href:
                    continue
                
                # Skip navigation and metadata links
                if any(skip in href.lower() for skip in ['index.htm', 'bio/', 'other/', 'about']):
                    continue
                if title.lower() in {'home', 'contents', 'index'}:
                    continue
                
                # Only include works that point to archive or have .htm
                if '/archive/' in href or href.endswith('.htm'):
                    # Clean up the title
                    title = re.sub(r'\s+', ' ', title).strip()
                    if len(title) > 3:  # Filter out very short titles
                        absolute_url = self._canonicalize_url(urljoin(full_url, href))
                        works.append({'title': title, 'url': absolute_url})
            
            # Remove duplicates
            seen = set()
            unique_works = []
            for work in works:
                work_tuple = (work['title'], work['url'])
                if work_tuple not in seen:
                    seen.add(work_tuple)
                    unique_works.append(work)
            
            return unique_works
            
        except requests.exceptions.RequestException as e:
            with self.print_lock:
                logger.debug(f"Error fetching works for {author_name}: {str(e)}")
            return None
        except Exception as e:
            with self.print_lock:
                logger.error(f"Unexpected error for {author_name}: {str(e)}")
            return None

    def _normalize_author_url(self, author_url: str) -> str:
        if author_url.startswith("http://") or author_url.startswith("https://"):
            return author_url
        if not author_url.startswith('/archive/'):
            if author_url.startswith('/'):
                author_url = f'/archive{author_url}'
            else:
                author_url = f'/archive/{author_url}'
        return urljoin(self.base_url, author_url)

    @staticmethod
    def _canonicalize_url(url: str) -> str:
        parsed = urlparse(url)
        cleaned = parsed._replace(query="", fragment="")
        return urlunparse(cleaned)
    
    def populate_thinkers_bundle(self, index_file: str, bundle_file: str, max_authors: Optional[int] = None, max_workers: int = 8):
        """Populate the thinkers bundle with works data using parallel processing"""
        logger.info("Starting comprehensive thinkers bundle population...")
        
        # Extract author links
        author_links = self.extract_author_links_from_index(index_file)
        logger.info(f"Found {len(author_links)} author links")
        
        if max_authors:
            author_links = author_links[:max_authors]
            logger.info(f"Processing first {max_authors} authors")
        
        # Load the bundle
        with open(bundle_file, 'r', encoding='utf-8') as f:
            bundle_data = json.load(f)
        
        successful_matches = 0
        processed_count = 0
        
        # Process authors in parallel batches
        def process_author(author_info: Tuple[str, str, str]) -> Optional[Tuple[str, List[Dict[str, str]], str]]:
            author_name, author_url, category = author_info
            nonlocal processed_count
            
            works = self.fetch_works_for_author(author_name, author_url, category)
            
            with self.print_lock:
                processed_count += 1
                status = f"Processing {processed_count}/{len(author_links)}: {author_name}"
                if works:
                    logger.info(f"{status}")
                    logger.info(f"Found {len(works)} works for {author_name}")
                else:
                    logger.warning(f"Could not find works for {author_name}")
            
            if works:
                return (author_name, works, category)
            return None
        
        # Process in parallel batches
        batch_size = 20
        for i in range(0, len(author_links), batch_size):
            batch = author_links[i:i+batch_size]
            results = []
            
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = {executor.submit(process_author, author_info): author_info for author_info in batch}
                
                for future in as_completed(futures):
                    result = future.result()
                    if result:
                        author_name, works, category = result
                        results.append((author_name, works, category))
            
            # Update bundle with results from this batch
            for author_name, works, category in results:
                thinker = self._find_thinker_in_bundle(bundle_data, author_name, category)
                if thinker:
                    thinker['works'] = works
                    successful_matches += 1
            
            # Save bundle after each batch to preserve progress
            with open(bundle_file, 'w', encoding='utf-8') as f:
                json.dump(bundle_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Thinkers bundle population completed! Successfully matched {successful_matches} authors")
    
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
        """Check if two names match (case-insensitive, handles variations)"""
        # Normalize both names
        n1 = name1.lower().strip()
        n2 = name2.lower().strip()
        
        # Exact match
        if n1 == n2:
            return True
        
        # Check if one name is contained in the other
        if n1 in n2 or n2 in n1:
            return True
        
        # Split and check if all parts match (handles "Karl Marx" vs "Karl Heinrich Marx")
        n1_parts = set(n1.split())
        n2_parts = set(n2.split())
        
        # If significant overlap, consider it a match
        if len(n1_parts.intersection(n2_parts)) >= 2:
            return True
        
        return False

def main():
    parser = argparse.ArgumentParser(description="Populate thinkers-bundle.json with scraped works.")
    parser.add_argument("--index-file", default="ref/index", help="Path to local author index HTML file.")
    parser.add_argument("--bundle-file", default="data/thinkers-bundle.json", help="Path to thinkers bundle JSON.")
    parser.add_argument("--max-authors", type=int, default=None, help="Optional cap for debugging.")
    parser.add_argument("--max-workers", type=int, default=8, help="Thread pool size (default: 8).")
    args = parser.parse_args()

    scraper = ComprehensiveMIAWorksScraper()
    scraper.populate_thinkers_bundle(
        index_file=args.index_file,
        bundle_file=args.bundle_file,
        max_authors=args.max_authors,
        max_workers=args.max_workers,
    )

if __name__ == '__main__':
    main()
