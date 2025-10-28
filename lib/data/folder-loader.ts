import { Thinker, ThinkerMetadata, Work } from '../types/thinker';

/**
 * Folder-based data loader for hierarchical data structure
 * 
 * Structure: Category -> Thinker -> Subject -> Works
 * 
 * Example:
 * - /data-v2/anarchists/metadata.json
 * - /data-v2/anarchists/Bill Haywood/Political Theory.json
 */

const DATA_BASE = '/data-v2';

// Cache for loaded metadata
const metadataCache = new Map<string, CategoryMetadata[]>();
const globalIndexCache: GlobalIndex | null = null;

// Type definitions
interface CategoryMetadata {
  n: string;
  c: string;
  d: string;
  b: string;
  i: string;
  t?: string;
  w: number;
  subjects?: Array<{ name: string; count: number }>;
}

interface GlobalIndex {
  categories: Array<{
    id: string;
    name: string;
    path: string;
    count: number;
  }>;
}

/**
 * Sanitize name for URL paths
 */
function sanitizePath(name: string): string {
  return encodeURIComponent(name);
}

/**
 * Load global category index
 */
export async function loadCategoryIndex(): Promise<GlobalIndex> {
  if (globalIndexCache) {
    return globalIndexCache;
  }

  const response = await fetch(`${DATA_BASE}/index.json`);
  if (!response.ok) {
    throw new Error(`Failed to load category index: ${response.status}`);
  }

  return await response.json() as GlobalIndex;
}

/**
 * Get available categories
 */
export async function getAvailableCategories(): Promise<string[]> {
  const index = await loadCategoryIndex();
  return index.categories.map(c => c.id);
}

/**
 * Load metadata for a specific category
 */
export async function loadCategoryMetadata(category: string): Promise<CategoryMetadata[]> {
  // Check cache
  if (metadataCache.has(category)) {
    return metadataCache.get(category)!;
  }

  const response = await fetch(`${DATA_BASE}/${category}/metadata.json`);
  if (!response.ok) {
    console.warn(`Failed to load metadata for category "${category}": ${response.status}`);
    return [];
  }

  const metadata = await response.json() as CategoryMetadata[];
  
  // Cache it
  metadataCache.set(category, metadata);
  
  return metadata;
}

/**
 * Convert category metadata to Thinker (without works)
 */
function expandMetadata(metadata: CategoryMetadata): Thinker {
  return {
    name: metadata.n,
    category: metadata.c,
    description: metadata.d,
    bioUrl: metadata.b,
    imageUrl: metadata.i,
    thumbnailUrl: metadata.t,
    workCount: metadata.w,
    works: [], // Works loaded separately
  };
}

/**
 * Load all metadata for a category (without works)
 */
export async function loadCategoryThinkersMetadata(category: string): Promise<Thinker[]> {
  const metadata = await loadCategoryMetadata(category);
  return metadata.map(expandMetadata);
}

/**
 * Load works for a specific thinker by subject
 */
export async function loadThinkerWorksBySubject(
  category: string,
  thinkerName: string,
  subject: string
): Promise<Work[]> {
  try {
    const sanitizedCategory = sanitizePath(category);
    const sanitizedThinker = sanitizePath(thinkerName);
    const sanitizedSubject = sanitizePath(subject);

    const response = await fetch(
      `${DATA_BASE}/${sanitizedCategory}/${sanitizedThinker}/${sanitizedSubject}.json`
    );

    if (!response.ok) {
      if (response.status === 404) {
        // Subject file doesn't exist, return empty array
        return [];
      }
      throw new Error(`Failed to load works: ${response.status}`);
    }

    return await response.json() as Work[];
  } catch (error) {
    console.error(`Failed to load works for ${thinkerName} - ${subject}:`, error);
    return [];
  }
}

/**
 * Load all works for a specific thinker across all subjects
 */
export async function loadThinkerWorks(category: string, thinkerName: string): Promise<Work[]> {
  // Get metadata to find subjects
  const metadata = await loadCategoryMetadata(category);
  const thinkerData = metadata.find(t => t.n === thinkerName);

  if (!thinkerData || !thinkerData.subjects) {
    return [];
  }

  // Load works from all subjects in parallel
  const workPromises = thinkerData.subjects.map(subject =>
    loadThinkerWorksBySubject(category, thinkerName, subject.name)
  );

  const worksArrays = await Promise.all(workPromises);
  
  // Flatten and return
  return worksArrays.flat();
}

/**
 * Load a complete thinker with all their works
 */
export async function loadThinker(category: string, thinkerName: string): Promise<Thinker | null> {
  // Get metadata
  const metadata = await loadCategoryMetadata(category);
  const thinkerData = metadata.find(t => t.n === thinkerName);

  if (!thinkerData) {
    return null;
  }

  // Load works
  const works = await loadThinkerWorks(category, thinkerName);

  // Combine
  return {
    name: thinkerData.n,
    category: thinkerData.c,
    description: thinkerData.d,
    bioUrl: thinkerData.b,
    imageUrl: thinkerData.i,
    thumbnailUrl: thinkerData.t,
    works: works,
    workCount: thinkerData.w,
  };
}

/**
 * Load all thinkers for a category with their works
 */
export async function loadThinkersByCategory(category: string): Promise<Thinker[]> {
  const thinkers: Thinker[] = [];

  // Get metadata
  const metadata = await loadCategoryMetadata(category);

  // Load each thinker
  for (const thinkerData of metadata) {
    const works = await loadThinkerWorks(category, thinkerData.n);
    
    thinkers.push({
      name: thinkerData.n,
      category: thinkerData.c,
      description: thinkerData.d,
      bioUrl: thinkerData.b,
      imageUrl: thinkerData.i,
      thumbnailUrl: thinkerData.t,
      works: works,
      workCount: thinkerData.w,
    });
  }

  return thinkers;
}

/**
 * Load all thinkers from all categories (metadata only, no works)
 * Useful for initial page load
 */
export async function loadAllThinkersMetadata(): Promise<Thinker[]> {
  const allThinkers: Thinker[] = [];
  
  const index = await loadCategoryIndex();
  
  // Load metadata from all categories
  const metadataPromises = index.categories.map(cat => 
    loadCategoryMetadata(cat.path)
  );

  const allMetadata = await Promise.all(metadataPromises);

  // Flatten and convert
  for (const categoryMetadata of allMetadata) {
    for (const metadata of categoryMetadata) {
      allThinkers.push(expandMetadata(metadata));
    }
  }

  return allThinkers;
}

/**
 * Get subjects for a specific thinker
 */
export async function getThinkerSubjects(category: string, thinkerName: string): Promise<string[]> {
  const metadata = await loadCategoryMetadata(category);
  const thinkerData = metadata.find(t => t.n === thinkerName);

  if (!thinkerData || !thinkerData.subjects) {
    return [];
  }

  return thinkerData.subjects.map(s => s.name);
}

/**
 * Clear metadata cache (useful for development)
 */
export function clearCache(): void {
  metadataCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { cachedCategories: number } {
  return {
    cachedCategories: metadataCache.size,
  };
}

