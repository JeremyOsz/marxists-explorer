export interface Thinker {
  name: string;
  description: string;
  category: string;
  works: Work[];
  bioUrl: string;
  imageUrl?: string;
  workCount?: number; // For metadata-only thinkers
}

export interface Work {
  title: string;
  url: string;
  year?: string;
}

export interface ThinkerCategory {
  name: string;
  description: string;
  thinkers: string[];
}
