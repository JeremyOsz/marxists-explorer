import { Thinker, ThinkerLookup, ThinkerLibrary } from '../types/thinker';
import { categories } from './categories';
// Import auto-generated lookups from category JSON files
import { thinkerLookups } from './thinker-lookups';

// Re-export the lookups for convenience
export { thinkerLookups };

/**
 * Thinker Data Library
 * Full data for each thinker including works, descriptions, images, etc.
 * Import from data/thinkers.json or maintain here
 */
export const thinkers: Thinker[] = [
  // This will be populated from the current thinkers.json or expanded
  // For now, this is just a placeholder structure
];

/**
 * Complete Thinker Library
 * Combines all data structures for the application
 */
export const thinkerLibrary: ThinkerLibrary = {
  thinkers,
  lookups: thinkerLookups,
  categories
};

/**
 * Search functions
 */

/**
 * Search thinkers by name
 */
export function searchThinkers(query: string, limit: number = 20): ThinkerLookup[] {
  const lowerQuery = query.toLowerCase();
  return thinkerLookups
    .filter(thinker => thinker.name.toLowerCase().includes(lowerQuery))
    .slice(0, limit);
}

/**
 * Get thinkers by category
 */
export function getThinkersByCategory(categoryId: string): ThinkerLookup[] {
  return thinkerLookups.filter(thinker => thinker.category === categoryId);
}

/**
 * Get specific thinker lookup by name
 */
export function getThinkerLookup(name: string): ThinkerLookup | undefined {
  return thinkerLookups.find(lookup => lookup.name === name);
}

/**
 * Get specific thinker data by name
 */
export function getThinkerData(name: string): Thinker | undefined {
  return thinkers.find(thinker => thinker.name === name);
}

/**
 * Get all unique names (for autocomplete)
 */
export function getAllThinkerNames(): string[] {
  return thinkerLookups.map(lookup => lookup.name).sort();
}
