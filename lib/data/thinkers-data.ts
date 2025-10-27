import { Thinker } from '../types/thinker';
// Bundle size: ~160KB raw, ~40KB gzipped with 564 thinkers
// Monitor this file if data expands significantly
import thinkersBundle from '../../data/thinkers-bundle.json';

// Cast the imported JSON to the correct type
const typedBundle: Record<string, Thinker[]> = thinkersBundle as any;

/**
 * Load all thinkers from the bundled data
 */
export function loadThinkersData(): Thinker[] {
  const allThinkers: Thinker[] = [];
  
  for (const category of Object.keys(typedBundle)) {
    allThinkers.push(...typedBundle[category]);
  }
  
  // Remove duplicates
  const uniqueThinkers = Array.from(
    new Map(allThinkers.map(t => [t.name, t])).values()
  );
  
  return uniqueThinkers.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Load thinkers for a specific category
 */
export function loadThinkersByCategory(category: string): Thinker[] {
  // Find the matching key (case-insensitive)
  const key = Object.keys(typedBundle).find(
    k => k.toLowerCase() === category.toLowerCase()
  );
  
  if (!key) {
    console.warn(`Category "${category}" not found`);
    return [];
  }
  
  return typedBundle[key];
}

/**
 * Get available categories
 */
export function getAvailableCategories(): string[] {
  return Object.keys(typedBundle).sort();
}

/**
 * Get all thinkers as a single array with category metadata
 */
export function getAllThinkersWithCategories(): Array<Thinker & { categoryName: string }> {
  const result: Array<Thinker & { categoryName: string }> = [];
  
  for (const [categoryName, thinkers] of Object.entries(typedBundle)) {
    thinkers.forEach(thinker => {
      result.push({ ...thinker, categoryName });
    });
  }
  
  // Remove duplicates by name
  const unique = Array.from(
    new Map(result.map(t => [t.name, t])).values()
  );
  
  return unique.sort((a, b) => a.name.localeCompare(b.name));
}

