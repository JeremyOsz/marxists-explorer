import { Thinker } from '../types/thinker';

/**
 * Client-side data loader for thinkers by category
 * Loads individual category files on demand for better performance
 * Compatible with serverless deployments
 */

const CATEGORY_INDEX_PATH = '/data/thinkers-by-category/index.json';
const CATEGORY_DATA_PATH = '/data/thinkers-by-category/';

// Cache for loaded categories
const categoryCache = new Map<string, Thinker[]>();
let categoryIndex: Record<string, string> | null = null;

/**
 * Load the category index mapping
 */
async function loadCategoryIndex(): Promise<Record<string, string>> {
  if (categoryIndex) {
    return categoryIndex;
  }

  try {
    const response = await fetch(CATEGORY_INDEX_PATH);
    if (!response.ok) {
      throw new Error(`Failed to fetch category index: ${response.status}`);
    }
    const parsed = await response.json();
    categoryIndex = parsed as Record<string, string>;
    return parsed as Record<string, string>;
  } catch (error) {
    console.error('Failed to load category index:', error);
    throw new Error('Failed to load category index');
  }
}

/**
 * Load thinkers for a specific category
 */
export async function loadThinkersByCategory(category: string): Promise<Thinker[]> {
  // Check cache first
  if (categoryCache.has(category)) {
    return categoryCache.get(category)!;
  }

  try {
    // Load category index if not already loaded
    const index = await loadCategoryIndex();
    
    // Get filename for this category
    const filename = index[category];
    if (!filename) {
      console.warn(`Category "${category}" not found in index`);
      return [];
    }

    // Load the category data via fetch
    const response = await fetch(`${CATEGORY_DATA_PATH}${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch category data: ${response.status}`);
    }
    const thinkers: Thinker[] = await response.json();
    
    // Cache the result
    categoryCache.set(category, thinkers);
    
    return thinkers;
  } catch (error) {
    console.error(`Failed to load category "${category}":`, error);
    return [];
  }
}

/**
 * Load all categories (for initial load or when "All Categories" is selected)
 */
export async function loadAllThinkers(): Promise<Thinker[]> {
  try {
    const index = await loadCategoryIndex();
    const allThinkers: Thinker[] = [];
    
    // Load all categories in parallel
    const promises = Object.keys(index).map(category => 
      loadThinkersByCategory(category)
    );
    
    const categoryResults = await Promise.all(promises);
    
    // Flatten results
    categoryResults.forEach(thinkers => {
      allThinkers.push(...thinkers);
    });
    
    return allThinkers;
  } catch (error) {
    console.error('Failed to load all thinkers:', error);
    return [];
  }
}

/**
 * Get list of available categories
 */
export async function getAvailableCategories(): Promise<string[]> {
  try {
    const index = await loadCategoryIndex();
    return Object.keys(index).sort();
  } catch (error) {
    console.error('Failed to get available categories:', error);
    return [];
  }
}

/**
 * Clear the cache (useful for development)
 */
export function clearCache(): void {
  categoryCache.clear();
  categoryIndex = null;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { cachedCategories: number; totalCategories: number } {
  return {
    cachedCategories: categoryCache.size,
    totalCategories: categoryIndex ? Object.keys(categoryIndex).length : 0
  };
}
