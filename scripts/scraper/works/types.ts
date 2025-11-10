import type { HttpResourceMeta } from '../source/types';

export interface WorkEntry {
  readonly title: string;
  readonly url: string;
}

export interface FollowUpLink {
  readonly url: string;
  readonly label?: string;
  readonly reason?: string;
}

export interface AuthorPageSnapshot {
  readonly url: string;
  readonly meta: HttpResourceMeta;
}

export interface AuthorWorksRecord {
  readonly authorId: string;
  readonly authorName: string;
  readonly sourceUrl: string;
  readonly seedUrls: readonly string[];
  readonly pages: readonly AuthorPageSnapshot[];
  readonly works: readonly WorkEntry[];
  readonly anomalies: readonly WorksAnomaly[];
  readonly fetchMeta: HttpResourceMeta | null;
}

export interface WorksHarvestFailure {
  readonly authorId: string;
  readonly authorName: string;
  readonly sourceUrl: string;
  readonly error: string;
}

export interface WorksAnomaly {
  readonly level: 'info' | 'warning' | 'error';
  readonly message: string;
  readonly context?: Record<string, unknown>;
}

export interface WorksRunSummary {
  readonly runId: string;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly totalAuthors: number;
  readonly successes: number;
  readonly failures: number;
  readonly totalWorks: number;
  readonly anomalies: number;
  readonly durationsMs: {
    readonly total: number;
  };
  readonly resources: {
    readonly totalPages: number;
    readonly averageBytes?: number;
  };
}


