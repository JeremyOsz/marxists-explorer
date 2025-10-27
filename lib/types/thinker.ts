/**
 * Type definitions for the Marxists Explorer thinker library
 */

export interface Work {
  title: string;
  url: string;
}

export interface Thinker {
  name: string;
  category: string;
  description: string;
  bioUrl: string;
  works: Work[];
  imageUrl: string;
  workCount?: number; // For metadata-only thinkers
}

// Lightweight metadata for initial bundle (works loaded separately)
export interface ThinkerMetadata {
  n: string; // name
  c: string; // category
  d: string; // description
  b: string; // bioUrl
  i: string; // imageUrl
  w: number; // workCount
}

export interface ThinkerLookup {
  name: string;
  category: string;
  keywords?: string[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  order: number;
}

export interface ThinkerLibrary {
  thinkers: Thinker[];
  lookups: ThinkerLookup[];
  categories: Category[];
}
