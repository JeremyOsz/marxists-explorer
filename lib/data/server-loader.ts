import { Thinker } from '../types/thinker';

/**
 * Server-side data loader for all thinkers
 * Loads all category files and combines them
 * Compatible with Vercel serverless functions
 */
export async function loadThinkersData(): Promise<Thinker[]> {
  try {
    // Get available categories
    const categories = await getAvailableCategories();
    
    // Load all categories in parallel
    const promises = categories.map(category => 
      loadThinkersByCategory(category)
    );
    
    const categoryResults = await Promise.all(promises);
    
    // Flatten and deduplicate results
    const allThinkers: Thinker[] = [];
    const seenNames = new Set<string>();
    
    categoryResults.forEach(thinkers => {
      thinkers.forEach(thinker => {
        if (!seenNames.has(thinker.name)) {
          seenNames.add(thinker.name);
          allThinkers.push(thinker);
        }
      });
    });
    
    // Sort by name
    allThinkers.sort((a, b) => a.name.localeCompare(b.name));
    
    return allThinkers;
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
    // First get the category index to find the correct filename
    const indexResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/data/thinkers-by-category/index.json`);
    if (!indexResponse.ok) {
      throw new Error(`Failed to fetch category index: ${indexResponse.status}`);
    }
    const index = await indexResponse.json() as Record<string, string>;
    
    // Get the filename for this category
    const filename = index[category];
    if (!filename) {
      console.warn(`Category "${category}" not found in index`);
      return [];
    }
    
    // Load the category data
    const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/data/thinkers-by-category/${filename}`);
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
    const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/data/thinkers-by-category/index.json`);
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
