import { Thinker } from '../types/thinker';

/**
 * Server-side data loader for thinkers
 * Compatible with Vercel serverless functions
 * Uses dynamic imports instead of fs.readFileSync
 */
export async function loadThinkersData(): Promise<Thinker[]> {
  try {
    // Dynamic import works in Vercel serverless
    const thinkersData = await import('@/data/thinkers-expanded.json');
    return thinkersData.default as Thinker[];
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
    const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/data/thinkers-by-category/${category}.json`);
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
