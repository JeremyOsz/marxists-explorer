import { Thinker, ThinkerMetadata, Work } from '../types/thinker';
// Lighter metadata-only bundle (~150KB vs ~400KB full data)
import thinkersMetadata from '../../data/thinkers-metadata.json';
import marxWorksBySubject from '../../data/marx-works-by-subject.json';

// Type for the metadata bundle
const typedMetadata: Record<string, ThinkerMetadata[]> = thinkersMetadata as any;

// Type for works lookup
type WorksLookup = Record<string, Work[]>;

let worksLookup: WorksLookup | null = null;

/**
 * Load works lookup data (lazy load)
 */
async function loadWorksLookup(): Promise<WorksLookup> {
  if (worksLookup) {
    return worksLookup;
  }

  // Dynamic import to avoid bundling the large works file
  const worksModule = await import('../../data/thinkers-works.json');
  worksLookup = worksModule.default as WorksLookup;
  return worksLookup;
}

/**
 * Expand metadata to full Thinker format
 */
function expandMetadata(metadata: ThinkerMetadata, works: Work[] = []): Thinker {
  return {
    name: metadata.n,
    category: metadata.c,
    description: metadata.d,
    bioUrl: metadata.b,
    imageUrl: metadata.i,
    thumbnailUrl: metadata.t,
    works: works,
    workCount: metadata.n === "Karl Marx" ? metadata.w + marxWorksBySubject.length : metadata.w,
  };
}

/**
 * Load all thinkers with their works (for initial page load)
 */
export async function loadThinkersData(): Promise<Thinker[]> {
  const allThinkers: Thinker[] = [];
  const works = await loadWorksLookup();

  for (const category of Object.keys(typedMetadata)) {
    const thinkers = typedMetadata[category];
    for (const metadata of thinkers) {
      const thinkerWorks = works[metadata.n] || [];
      allThinkers.push(expandMetadata(metadata, thinkerWorks));
    }
  }

  // Remove duplicates
  const uniqueThinkers = Array.from(
    new Map(allThinkers.map(t => [t.name, t])).values()
  );

  return uniqueThinkers.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Load thinkers for search/display (without works for faster loading)
 */
export function loadThinkersMetadata(): Thinker[] {
  const allThinkers: Thinker[] = [];

  for (const category of Object.keys(typedMetadata)) {
    const thinkers = typedMetadata[category];
    for (const metadata of thinkers) {
      // Load without works initially
      allThinkers.push(expandMetadata(metadata));
    }
  }

  // Remove duplicates
  const uniqueThinkers = Array.from(
    new Map(allThinkers.map(t => [t.name, t])).values()
  );

  return uniqueThinkers.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Load works for a specific thinker
 */
export async function loadThinkerWorks(thinkerName: string): Promise<Work[]> {
  const works = await loadWorksLookup();
  return works[thinkerName] || [];
}

/**
 * Load a single thinker with their works
 */
export async function loadThinker(thinkerName: string): Promise<Thinker | null> {
  for (const category of Object.keys(typedMetadata)) {
    const thinkers = typedMetadata[category];
    const metadata = thinkers.find(t => t.n === thinkerName);
    if (metadata) {
      const works = await loadThinkerWorks(thinkerName);
      return expandMetadata(metadata, works);
    }
  }
  return null;
}

/**
 * Load thinkers for a specific category
 */
export async function loadThinkersByCategory(category: string): Promise<Thinker[]> {
  // Find the matching key (case-insensitive)
  const key = Object.keys(typedMetadata).find(
    k => k.toLowerCase() === category.toLowerCase()
  );

  if (!key) {
    console.warn(`Category "${category}" not found`);
    return [];
  }

  const thinkers = typedMetadata[key];
  const works = await loadWorksLookup();

  return thinkers.map(metadata => {
    const thinkerWorks = works[metadata.n] || [];
    return expandMetadata(metadata, thinkerWorks);
  });
}

/**
 * Get available categories
 */
export function getAvailableCategories(): string[] {
  return Object.keys(typedMetadata).sort();
}

/**
 * Get all thinkers as a single array with category metadata
 */
export async function getAllThinkersWithCategories(): Promise<Array<Thinker & { categoryName: string }>> {
  const result: Array<Thinker & { categoryName: string }> = [];
  const works = await loadWorksLookup();

  for (const [categoryName, thinkers] of Object.entries(typedMetadata)) {
    for (const metadata of thinkers) {
      const thinkerWorks = works[metadata.n] || [];
      result.push({ ...expandMetadata(metadata, thinkerWorks), categoryName });
    }
  }

  // Remove duplicates by name
  const unique = Array.from(
    new Map(result.map(t => [t.name, t])).values()
  );

  return unique.sort((a, b) => a.name.localeCompare(b.name));
}
