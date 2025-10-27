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
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    
    // First get the index to find the correct filename
    const indexResponse = await fetch(`${baseUrl}/data/thinkers-by-category/index.json`);
    if (!indexResponse.ok) {
      throw new Error(`Failed to fetch index: ${indexResponse.status}`);
    }
    const index = await indexResponse.json() as Record<string, string>;
    const filename = index[category];
    
    if (!filename) {
      return [];
    }
    
    const response = await fetch(`${baseUrl}/data/thinkers-by-category/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch category data: ${response.status}`);
    }
    return await response.json() as Thinker[];
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
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/data/thinkers-by-category/index.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch category index: ${response.status}`);
    }
    const index = await response.json() as Record<string, string>;
    return Object.keys(index).sort();
  } catch (error) {
    console.error('Failed to get available categories:', error);
    return [];
  }
}
