export interface RateLimitConfig {
  readonly requestsPerSecond: number;
  readonly burst: number;
}

export interface HttpHeadersSnapshot {
  etag?: string | null;
  lastModified?: string | null;
  cacheControl?: string | null;
}

export interface HttpResourceMeta {
  readonly url: string;
  readonly status: number;
  readonly fetchedAt: string;
  readonly durationMs: number;
  readonly headers: HttpHeadersSnapshot;
  readonly sha256: string;
  readonly bytes: number;
}

export interface HttpResource<T> {
  readonly data: T;
  readonly meta: HttpResourceMeta;
}

export interface AuthorAlias {
  readonly value: string;
  readonly source: 'primary' | 'aka' | 'parenthetical' | 'derived';
}

export interface AuthorRecord {
  readonly id: string;
  readonly name: string;
  readonly href: string;
  readonly canonicalHref: string;
  readonly aliases: readonly AuthorAlias[];
  readonly categories: readonly string[];
  readonly raw: Record<string, unknown>;
}

export interface SectionRecord {
  readonly id: string;
  readonly title: string;
  readonly href: string;
  readonly description?: string;
  readonly raw: Record<string, unknown>;
}

export interface PeriodicalRecord {
  readonly id: string;
  readonly title: string;
  readonly href: string;
  readonly language?: string;
  readonly raw: Record<string, unknown>;
}

export interface WorkRecord {
  readonly authorId: string;
  readonly title: string;
  readonly href: string;
  readonly canonicalHref: string;
  readonly raw: Record<string, unknown>;
}

export interface DiscoveryAnomaly {
  readonly scope: 'authors' | 'sections' | 'periodicals' | 'works' | 'subjects' | 'general';
  readonly level: 'warning' | 'error';
  readonly message: string;
  readonly context?: Record<string, unknown>;
}

export interface SourceCatalogue {
  readonly fetchedAt: string;
  readonly authors: readonly AuthorRecord[];
  readonly sections: readonly SectionRecord[];
  readonly periodicals: readonly PeriodicalRecord[];
  readonly works: readonly WorkRecord[];
  readonly anomalies: readonly DiscoveryAnomaly[];
}

export interface CatalogueDiff {
  readonly summary: {
    readonly authorsAdded: number;
    readonly authorsRemoved: number;
    readonly sectionsAdded: number;
    readonly sectionsRemoved: number;
    readonly periodicalsAdded: number;
    readonly periodicalsRemoved: number;
    readonly worksAdded: number;
    readonly worksRemoved: number;
  };
  readonly authorsAdded: readonly AuthorRecord[];
  readonly authorsRemoved: readonly AuthorRecord[];
  readonly sectionsAdded: readonly SectionRecord[];
  readonly sectionsRemoved: readonly SectionRecord[];
  readonly periodicalsAdded: readonly PeriodicalRecord[];
  readonly periodicalsRemoved: readonly PeriodicalRecord[];
  readonly worksAdded: readonly WorkRecord[];
  readonly worksRemoved: readonly WorkRecord[];
}

export interface DiscoveryRunPaths {
  readonly runId: string;
  readonly rootDir: string;
  readonly rawDir: string;
  readonly derivedDir: string;
  readonly logsDir: string;
  readonly cataloguePath: string;
  readonly diffPath: string;
  readonly latestPointer: string;
  readonly manifestPath: string;
}

export interface PreviousRunMetadata {
  readonly runId: string;
  readonly cataloguePath: string;
}

export interface CatalogueManifest {
  readonly runs: readonly {
    readonly runId: string;
    readonly createdAt: string;
    readonly cataloguePath: string;
  }[];
}

export interface RawSnapshotInfo {
  readonly targetPath: string;
  readonly meta: HttpResourceMeta;
}

export type HeaderExtractor = (headers: Headers) => HttpHeadersSnapshot;

