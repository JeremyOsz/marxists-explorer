export interface Thinker {
  name: string;
  description: string;
  category: string;
  works: Work[];
  bioUrl: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  workCount?: number;
}

export interface Work {
  title: string;
  url: string;
  year?: string;
  description?: string;
  subject?: string;
}

export interface ThinkerCategory {
  name: string;
  description: string;
  thinkers: string[];
}
