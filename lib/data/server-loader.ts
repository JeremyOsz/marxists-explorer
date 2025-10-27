import { Thinker } from '../types/thinker';

/**
 * Server-side data loader for thinkers
 * Compatible with Vercel serverless functions
 * Loads all categories and combines them
 */
export async function loadThinkersData(): Promise<Thinker[]> {
  try {
    const categories = await getAvailableCategories();
    const allThinkers: Thinker[] = [];
    
    for (const category of categories) {
      const thinkers = await loadThinkersByCategory(category);
      allThinkers.push(...thinkers);
    }
    
    // Remove duplicates
    const uniqueThinkers = Array.from(
      new Map(allThinkers.map(t => [t.name, t])).values()
    );
    
    return uniqueThinkers.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Failed to load thinkers data:', error);
    return [];
  }
}

/**
 * Server-side data loader for thinkers by category
 * Compatible with Vercel serverless functions
 * Uses fetch to load from public folder
 */
export async function loadThinkersByCategory(category: string): Promise<Thinker[]> {
  try {
    // Use absolute URL based on environment
    const protocol = process.env.NODE_ENV === 'production' ? 'https:' : 'http:';
    const host = process.env.VERCEL_URL || 'localhost:3000';
    const baseUrl = `${protocol}//${host}`;
    
    // First get the index to find the correct filename
    const indexResponse = await fetch(`${baseUrl}/data/thinkers-by-category/index.json`);
    if (!indexResponse.ok) {
      console.error(`Failed to fetch index: ${indexResponse.status} from ${baseUrl}`);
      return [];
    }
    const index = await indexResponse.json() as Record<string, string>;
    const filename = index[category];
    
    if (!filename) {
      console.warn(`No filename for category: ${category}`);
      return [];
    }
    
    const response = await fetch(`${baseUrl}/data/thinkers-by-category/${filename}`);
    if (!response.ok) {
      console.error(`Failed to fetch category: ${response.status} from ${baseUrl}`);
      return [];
    }
    const data = await response.json() as Thinker[];
    console.log(`Loaded ${data.length} thinkers from category: ${category}`);
    return data;
  } catch (error) {
    console.error(`Failed to load thinkers for category "${category}":`, error);
    return [];
  }
}

/**
 * Get available categories from the public folder
 * Compatible with Vercel serverless functions
 */
export async function getAvailableCategories(): Promise<string[]> {
  try {
    const protocol = process.env.NODE_ENV === 'production' ? 'https:' : 'http:';
    const host = process.env.VERCEL_URL || 'localhost:3000';
    const baseUrl = `${protocol}//${host}`;
    
    const response = await fetch(`${baseUrl}/data/thinkers-by-category/index.json`);
    if (!response.ok) {
      console.error(`Failed to fetch index: ${response.status} from ${baseUrl}`);
      return [];
    }
    const index = await response.json() as Record<string, string>;
    const categories = Object.keys(index).sort();
    console.log(`Found ${categories.length} categories`);
    return categories;
  } catch (error) {
    console.error('Failed to get available categories:', error);
    return [];
  }
}
