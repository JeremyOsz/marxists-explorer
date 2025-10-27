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
