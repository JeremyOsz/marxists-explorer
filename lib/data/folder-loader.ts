import { Thinker, ThinkerMetadata, Work } from '../types/thinker';
// Statically import the index to avoid fetching during build
import categoryIndexData from '../../public/data-v2/index.json';

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
let globalIndexCache: GlobalIndex | null = null;
const categoryPathCache = new Map<string, string>(); // Maps display name to folder path

/**
 * Get the base URL for data fetching
 * On Vercel, we need to use the public production URL or relative paths
 */
function getDataUrl(path: string): string {
  // On server-side, use the production URL or localhost
  if (typeof window === 'undefined') {
    // Use NEXT_PUBLIC_SITE_URL if available (set in Vercel env vars)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return `${baseUrl}${DATA_BASE}${path}`;
  }
  
  // Client-side: relative path works fine
  return `${DATA_BASE}${path}`;
}

// Type definitions
interface CategoryMetadata {
  n: string;
  c: string;
  d: string;
  b: string;
  i: string;
  t?: string;
  w: number;
  j?: Array<{ title: string; url: string }>; // major works
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

  // Use statically imported data to avoid fetching during build
  const index = categoryIndexData as GlobalIndex;
  
  // Build mapping from category name to path
  if (index.categories) {
    for (const cat of index.categories) {
      categoryPathCache.set(cat.name, cat.path);
    }
  }

  globalIndexCache = index;
  return index;
}

/**
 * Get folder path for a category (handles case differences)
 */
async function getCategoryPath(categoryName: string): Promise<string> {
  // Load index to build cache if needed
  await loadCategoryIndex();
  
  // Try exact match first
  const exactMatch = categoryPathCache.get(categoryName);
  if (exactMatch) {
    return exactMatch;
  }
  
  // Try case-insensitive match
  const index = await loadCategoryIndex();
  const found = index.categories.find(
    cat => cat.name.toLowerCase() === categoryName.toLowerCase()
  );
  
  return found?.path || categoryName.toLowerCase();
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
  // Get the folder path for the category
  const categoryPath = await getCategoryPath(category);
  
  // Check cache
  if (metadataCache.has(categoryPath)) {
    return metadataCache.get(categoryPath)!;
  }

  try {
    const url = getDataUrl(`/${categoryPath}/metadata.json`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Failed to load metadata for category "${category}": ${response.status}`);
      return [];
    }

    const metadata = await response.json() as CategoryMetadata[];
    
    // Cache it
    metadataCache.set(categoryPath, metadata);
    
    return metadata;
  } catch (error) {
    console.error(`Failed to load metadata for category "${category}":`, error);
    return [];
  }
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
    majorWorks: metadata.j,
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

    const url = getDataUrl(`/${sanitizedCategory}/${sanitizedThinker}/${sanitizedSubject}.json`);
    const response = await fetch(url);

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
  // Get the folder path for the category
  const categoryPath = await getCategoryPath(category);
  
  // Get metadata to find subjects
  const metadata = await loadCategoryMetadata(category);
  const thinkerData = metadata.find(t => t.n === thinkerName);

  if (!thinkerData || !thinkerData.subjects) {
    return [];
  }

  // Load works from all subjects in parallel
  const workPromises = thinkerData.subjects.map(subject =>
    loadThinkerWorksBySubject(categoryPath, thinkerName, subject.name)
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
    majorWorks: thinkerData.j,
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
      majorWorks: thinkerData.j,
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

