/**
 * Type definitions for the Marxists Explorer thinker library
 */

export interface Work {
  title: string;
  url: string;
  description?: string;
}

export interface Thinker {
  name: string;
  category: string;
  description: string;
  bioUrl: string;
  works: Work[];
  majorWorks?: Work[];
  imageUrl: string;
  thumbnailUrl?: string;
  workCount?: number; // For metadata-only thinkers
}

// Lightweight metadata for initial bundle (works loaded separately)
export interface ThinkerMetadata {
  n: string
  c: string; // category
  d: string; // description
  b: string; // bioUrl
  i: string; // imageUrl
  t?: string; // thumbnailUrl
  w: number; // workCount
  j?: Work[]; // majorWorks
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
