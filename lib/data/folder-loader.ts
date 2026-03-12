import categoryIndexData from '../../public/data-v2/index.json';
import searchManifestData from '../../public/data-v2/manifests/search-manifest.json';
import { SearchManifestThinker, Thinker, Work } from '../types/thinker';

const DATA_BASE = '/data-v2';

interface CategoryIndexEntry {
  id: string;
  name: string;
  path: string;
  count: number;
}

interface GlobalIndex {
  categories: CategoryIndexEntry[];
}

const categoryPathCache = new Map<string, string>();
const searchManifest = searchManifestData as SearchManifestThinker[];
const globalIndex = categoryIndexData as GlobalIndex;

function normalizeCategoryKey(value: string): string {
  return decodeURIComponent(value).trim().toLowerCase().replace(/\s+/g, '-');
}

function sanitizePath(name: string): string {
  return encodeURIComponent(name);
}

function expandMetadata(metadata: SearchManifestThinker): Thinker {
  return {
    name: metadata.n,
    category: metadata.c,
    description: metadata.d,
    bioUrl: metadata.b,
    imageUrl: metadata.i,
    thumbnailUrl: metadata.t,
    workCount: metadata.w,
    majorWorks: metadata.j,
    subjects: metadata.subjects,
    searchText: metadata.s,
    works: [],
  };
}

async function readDataJson<T>(relativePath: string): Promise<T> {
  if (typeof window === 'undefined') {
    const [{ readFile }, path] = await Promise.all([
      import('fs/promises'),
      import('path'),
    ]);
    const filePath = path.join(
      process.cwd(),
      'public',
      'data-v2',
      ...relativePath.split('/').map((segment) => decodeURIComponent(segment))
    );
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  }

  const response = await fetch(`${DATA_BASE}/${relativePath}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${relativePath}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function ensureCategoryCache(): void {
  if (categoryPathCache.size > 0) {
    return;
  }

  for (const category of globalIndex.categories) {
    categoryPathCache.set(normalizeCategoryKey(category.id), category.path);
    categoryPathCache.set(normalizeCategoryKey(category.name), category.path);
    categoryPathCache.set(normalizeCategoryKey(category.path), category.path);
  }
}

export async function loadCategoryIndex(): Promise<GlobalIndex> {
  ensureCategoryCache();
  return globalIndex;
}

async function getCategoryPath(categoryName: string): Promise<string> {
  ensureCategoryCache();
  return categoryPathCache.get(normalizeCategoryKey(categoryName)) || normalizeCategoryKey(categoryName);
}

export async function getAvailableCategories(): Promise<string[]> {
  return globalIndex.categories.map((category) => category.id);
}

export async function loadSearchManifest(): Promise<SearchManifestThinker[]> {
  return searchManifest;
}

export async function loadCategoryMetadata(category: string): Promise<SearchManifestThinker[]> {
  const categoryPath = await getCategoryPath(category);
  return searchManifest.filter(
    (thinker) => normalizeCategoryKey(thinker.c) === categoryPath
  );
}

export async function loadCategoryThinkersMetadata(category: string): Promise<Thinker[]> {
  const metadata = await loadCategoryMetadata(category);
  return metadata.map(expandMetadata);
}

export async function loadAllThinkersMetadata(): Promise<Thinker[]> {
  return searchManifest.map(expandMetadata);
}

export async function loadThinkerManifest(
  category: string,
  thinkerName: string
): Promise<SearchManifestThinker | null> {
  const categoryPath = await getCategoryPath(category);
  const manifestPath = `manifests/thinkers/${categoryPath}/${sanitizePath(thinkerName)}.json`;

  try {
    return await readDataJson<SearchManifestThinker>(manifestPath);
  } catch {
    return (
      searchManifest.find(
        (thinker) =>
          normalizeCategoryKey(thinker.c) === categoryPath &&
          thinker.n.toLowerCase() === thinkerName.toLowerCase()
      ) || null
    );
  }
}

export async function loadThinkerWorksBySubject(
  category: string,
  thinkerName: string,
  subject: string
): Promise<Work[]> {
  try {
    const categoryPath = await getCategoryPath(category);
    const relativePath = `${categoryPath}/${sanitizePath(thinkerName)}/${sanitizePath(subject)}.json`;
    return await readDataJson<Work[]>(relativePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('ENOENT') && !message.includes('Failed to load')) {
      console.error(`Failed to load works for ${thinkerName} - ${subject}:`, error);
    }
    return [];
  }
}

export async function loadThinkerWorks(
  category: string,
  thinkerName: string
): Promise<Work[]> {
  const thinker = await loadThinkerManifest(category, thinkerName);

  if (!thinker?.subjects?.length) {
    return [];
  }

  const worksArrays = await Promise.all(
    thinker.subjects.map((subject) =>
      loadThinkerWorksBySubject(category, thinkerName, subject.name)
    )
  );

  return worksArrays.flat();
}

export async function loadThinker(category: string, thinkerName: string): Promise<Thinker | null> {
  const thinker = await loadThinkerManifest(category, thinkerName);

  if (!thinker) {
    return null;
  }

  const works = await loadThinkerWorks(category, thinkerName);

  return {
    ...expandMetadata(thinker),
    works,
  };
}

export async function loadThinkersByCategory(category: string): Promise<Thinker[]> {
  const thinkers = await loadCategoryMetadata(category);
  return Promise.all(
    thinkers.map(async (thinker) => ({
      ...expandMetadata(thinker),
      works: await loadThinkerWorks(category, thinker.n),
    }))
  );
}

export async function getThinkerSubjects(category: string, thinkerName: string): Promise<string[]> {
  const thinker = await loadThinkerManifest(category, thinkerName);
  return thinker?.subjects?.map((subject) => subject.name) || [];
}

export function clearCache(): void {
  categoryPathCache.clear();
}

export function getCacheStats(): { cachedCategories: number; manifestEntries: number } {
  return {
    cachedCategories: categoryPathCache.size,
    manifestEntries: searchManifest.length,
  };
}
