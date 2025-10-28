/**
 * Catalogue API Client
 * 
 * Type-safe client for accessing the Catalogue API
 */

import { Thinker, Work } from '@/lib/types/thinker';

const BASE_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CategoryInfo {
  id: string;
  name: string;
  path: string;
  count: number;
}

interface CatalogueIndex {
  categories: CategoryInfo[];
}

interface CategoryResponse {
  category: string;
  thinkers: Thinker[];
  count: number;
}

interface ThinkersResponse {
  thinkers: Thinker[];
  count: number;
}

interface ThinkerSubjectsResponse {
  category: string;
  name: string;
  subjects: string[];
}

interface WorksBySubjectResponse {
  category: string;
  thinker: string;
  subject: string;
  works: Work[];
  count: number;
}

interface SearchResponse {
  query: string;
  category?: string;
  results: Thinker[];
  count: number;
}

class CatalogueAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CatalogueAPIError';
  }
}

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}/api/catalogue${endpoint}`);
  const result: ApiResponse<T> = await response.json();
  
  if (!result.success || !result.data) {
    throw new CatalogueAPIError(result.error || 'API request failed');
  }
  
  return result.data;
}

export class CatalogueClient {
  /**
   * Get the complete catalogue index
   */
  static async getCatalogue(): Promise<CatalogueIndex> {
    return fetchAPI<CatalogueIndex>('');
  }
  
  /**
   * Get list of all category IDs
   */
  static async getCategories(): Promise<string[]> {
    const data = await fetchAPI<{ categories: string[]; count: number }>('/categories');
    return data.categories;
  }
  
  /**
   * Get all thinkers in a specific category
   */
  static async getCategoryThinkers(category: string): Promise<Thinker[]> {
    const encodedCategory = encodeURIComponent(category);
    const data = await fetchAPI<CategoryResponse>(`/categories/${encodedCategory}`);
    return data.thinkers;
  }
  
  /**
   * Get all thinkers (metadata only)
   */
  static async getAllThinkers(): Promise<Thinker[]> {
    const data = await fetchAPI<ThinkersResponse>('/thinkers');
    return data.thinkers;
  }
  
  /**
   * Get a specific thinker with all their works
   */
  static async getThinker(category: string, name: string): Promise<Thinker> {
    const encodedCategory = encodeURIComponent(category);
    const encodedName = encodeURIComponent(name);
    return fetchAPI<Thinker>(`/thinkers/${encodedCategory}/${encodedName}`);
  }
  
  /**
   * Get a thinker's subjects (metadata only, without works)
   */
  static async getThinkerSubjects(category: string, name: string): Promise<string[]> {
    const encodedCategory = encodeURIComponent(category);
    const encodedName = encodeURIComponent(name);
    const data = await fetchAPI<ThinkerSubjectsResponse>(
      `/thinkers/${encodedCategory}/${encodedName}?metadata_only=true`
    );
    return data.subjects;
  }
  
  /**
   * Get works for a specific thinker and subject
   */
  static async getThinkerWorksBySubject(
    category: string,
    name: string,
    subject: string
  ): Promise<Work[]> {
    const encodedCategory = encodeURIComponent(category);
    const encodedName = encodeURIComponent(name);
    const encodedSubject = encodeURIComponent(subject);
    const data = await fetchAPI<WorksBySubjectResponse>(
      `/thinkers/${encodedCategory}/${encodedName}/subjects/${encodedSubject}`
    );
    return data.works;
  }
  
  /**
   * Search for thinkers
   */
  static async search(query: string, category?: string): Promise<Thinker[]> {
    const params = new URLSearchParams({ q: query });
    if (category) {
      params.append('category', category);
    }
    const data = await fetchAPI<SearchResponse>(`/search?${params}`);
    return data.results;
  }
}

// Export convenience functions
export const {
  getCatalogue,
  getCategories,
  getCategoryThinkers,
  getAllThinkers,
  getThinker,
  getThinkerSubjects,
  getThinkerWorksBySubject,
  search,
} = CatalogueClient;

