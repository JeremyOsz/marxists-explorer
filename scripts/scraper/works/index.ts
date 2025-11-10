#!/usr/bin/env tsx
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { HttpClient } from '../source/httpClient';
import type { AuthorRecord, SourceCatalogue } from '../source/types';
import {
  DEFAULT_ARTIFACTS_ROOT,
  MIA_BASE_URL,
} from '../source/config';
import {
  createWorksRunPaths,
  writeJsonFile,
} from './storage';
import type {
  AuthorPageSnapshot,
  AuthorWorksRecord,
  FollowUpLink,
  WorksHarvestFailure,
  WorksRunSummary,
  WorksAnomaly,
} from './types';
import { parseWorksFromHtml } from './parsers';

interface CliOptions {
  readonly cataloguePath: string;
  readonly outDir?: string;
  readonly runId?: string;
  readonly concurrency: number;
  readonly maxAuthors?: number;
  readonly maxPagesPerAuthor: number;
}

const DEFAULT_CATALOGUE_PATH = join(
  process.cwd(),
  'data/source/latest/sources/derived/catalogue.json',
);

const DEFAULT_MAX_PAGES_PER_AUTHOR = Math.max(
  1,
  Number.parseInt(process.env.MIA_WORKS_MAX_PAGES ?? '25', 10),
);

async function main(): Promise<void> {
  const startedAt = Date.now();
  const cli = await parseCliOptions();

  const catalogue = await loadCatalogue(cli.cataloguePath);
  let authors = catalogue.authors as AuthorRecord[];
  if (cli.maxAuthors && cli.maxAuthors > 0) {
    authors = authors.slice(0, cli.maxAuthors);
  }

  const paths = await createWorksRunPaths({
    outDir: cli.outDir,
    runId: cli.runId,
  });

  console.log(
    `Starting works harvest run ${paths.runId} for ${authors.length} authors.`,
  );

  const client = new HttpClient();
  const successes: AuthorWorksRecord[] = [];
  const failures: WorksHarvestFailure[] = [];

  try {
    for (let i = 0; i < authors.length; i += cli.concurrency) {
      const batch = authors.slice(i, i + cli.concurrency);
      await Promise.all(
        batch.map(async (author, indexInBatch) => {
          const authorIndex = i + indexInBatch + 1;
          try {
            const record = await harvestAuthorWorks(author, client, {
              maxPages: cli.maxPagesPerAuthor,
            });
            successes.push(record);
            console.log(
              `[${authorIndex}/${authors.length}] ${author.name} → ${record.works.length} works (${record.pages.length} pages)`,
            );
          } catch (error) {
            const url = resolveAuthorUrl(author);
            failures.push({
              authorId: author.id,
              authorName: author.name,
              sourceUrl: url,
              error: error instanceof Error ? error.message : String(error),
            });
            console.warn(
              `[${authorIndex}/${authors.length}] ${author.name} FAILED → ${error instanceof Error ? error.message : error}`,
            );
          }
        }),
      );
    }
  } finally {
    client.dispose();
  }

  await writeJsonFile(paths.worksPath, successes);
  await writeJsonFile(paths.failuresPath, failures);

  const finishedAt = Date.now();
  const totalWorks = successes.reduce(
    (acc, record) => acc + record.works.length,
    0,
  );
  const totalBytes = successes.reduce((acc, record) => {
    const pageBytes = record.pages.reduce(
      (pageAcc, page) => pageAcc + (page.meta.bytes ?? 0),
      0,
    );
    return acc + pageBytes;
  }, 0);
  const totalPages = successes.reduce(
    (acc, record) => acc + record.pages.length,
    0,
  );
  const totalAnomalies = successes.reduce(
    (acc, record) => acc + record.anomalies.length,
    0,
  );

  const summary: WorksRunSummary = {
    runId: paths.runId,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date(finishedAt).toISOString(),
    totalAuthors: authors.length,
    successes: successes.length,
    failures: failures.length,
    totalWorks,
    anomalies: totalAnomalies,
    durationsMs: {
      total: finishedAt - startedAt,
    },
    resources: {
      totalPages,
      averageBytes:
        totalPages > 0 ? totalBytes / totalPages : undefined,
    },
  };

  await writeJsonFile(paths.runPath, summary);

  console.log(
    `Works harvest run ${paths.runId} complete: ${successes.length} successes, ${failures.length} failures, ${totalWorks} works.`,
  );
}

async function parseCliOptions(): Promise<CliOptions> {
  const tokens = process.argv
    .slice(2)
    .filter((token) => token !== '--');

  const { values, positionals } = parseArgs({
    args: tokens,
    options: {
      catalogue: { type: 'string' },
      out: { type: 'string' },
      runId: { type: 'string' },
      concurrency: { type: 'string' },
      maxAuthors: { type: 'string' },
      maxPages: { type: 'string' },
    },
    allowPositionals: true,
  });

  if (positionals.length > 0) {
    throw new Error(
      `Unexpected positional arguments: ${positionals.join(', ')}`,
    );
  }

  const rawCatalogue = optionAsString(values.catalogue);
  const cataloguePath =
    rawCatalogue && rawCatalogue.length > 0
      ? rawCatalogue
      : DEFAULT_CATALOGUE_PATH;

  const rawConcurrency = optionAsString(values.concurrency);
  const concurrency = rawConcurrency
    ? Math.max(1, Number.parseInt(rawConcurrency, 10))
    : 4;

  const rawMaxAuthors = optionAsString(values.maxAuthors);
  const maxAuthors = rawMaxAuthors
    ? Math.max(1, Number.parseInt(rawMaxAuthors, 10))
    : undefined;

  const rawMaxPages = optionAsString(values.maxPages);
  const maxPagesPerAuthor = rawMaxPages
    ? Math.max(1, Number.parseInt(rawMaxPages, 10))
    : DEFAULT_MAX_PAGES_PER_AUTHOR;

  return {
    cataloguePath,
    outDir: optionAsString(values.out) ?? DEFAULT_ARTIFACTS_ROOT,
    runId: optionAsString(values.runId),
    concurrency,
    maxAuthors,
    maxPagesPerAuthor,
  };
}

async function loadCatalogue(path: string): Promise<SourceCatalogue> {
  const buffer = await fs.readFile(path, 'utf-8');
  return JSON.parse(buffer) as SourceCatalogue;
}

function resolveAuthorUrl(author: AuthorRecord): string {
  if (author.canonicalHref) {
    return author.canonicalHref;
  }
  if (author.href?.startsWith('http')) {
    return author.href;
  }
  const relative = author.href?.startsWith('/')
    ? author.href.slice(1)
    : author.href;
  return `${MIA_BASE_URL}/${relative ?? ''}`;
}

interface HarvestAuthorOptions {
  readonly maxPages: number;
}

async function harvestAuthorWorks(
  author: AuthorRecord,
  client: HttpClient,
  options: HarvestAuthorOptions,
): Promise<AuthorWorksRecord> {
  const seedUrl = normalizeUrl(resolveAuthorUrl(author));
  const queue: string[] = [seedUrl];
  const enqueued = new Set<string>(queue);
  const visited = new Set<string>();
  const pages: AuthorPageSnapshot[] = [];
  const worksMap = new Map<string, { title: string; url: string }>();
  const anomalies: WorksAnomaly[] = [];
  const seedUrls = new Set<string>([seedUrl]);
  const maxPages = Math.max(1, options.maxPages);

  const allowedPrefixes = computeAllowedPrefixes(seedUrl);
  const baseHost = new URL(seedUrl).host;

  while (queue.length > 0 && pages.length < maxPages) {
    const currentUrl = queue.shift()!;
    const normalizedCurrent = normalizeUrl(currentUrl);
    if (visited.has(normalizedCurrent)) {
      continue;
    }
    visited.add(normalizedCurrent);

    const resource = await client.getText(currentUrl);
    pages.push({ url: resource.meta.url, meta: resource.meta });

    const parsed = parseWorksFromHtml(resource.data, {
      baseUrl: resource.meta.url,
    });

    for (const anomaly of parsed.anomalies) {
      anomalies.push(anomaly);
    }

    for (const work of parsed.works) {
      const normalizedWorkUrl = normalizeUrl(work.url);
      const key = `${work.title.toLowerCase()}::${normalizedWorkUrl}`;
      if (!worksMap.has(key)) {
        worksMap.set(key, { title: work.title, url: normalizedWorkUrl });
      }
    }

    enqueueFollowUps(
      parsed.followUps,
      {
        queue,
        enqueued,
        seedUrls,
        allowedPrefixes,
        baseHost,
      },
    );
  }

  if (queue.length > 0) {
    anomalies.push({
      level: 'warning',
      message: `Reached page limit (${maxPages}) before exhausting follow-up links.`,
      context: { remainingQueue: queue.length },
    });
  }

  return {
    authorId: author.id,
    authorName: author.name,
    sourceUrl: seedUrl,
    seedUrls: Array.from(seedUrls),
    pages,
    works: Array.from(worksMap.values()),
    anomalies,
    fetchMeta: pages[0]?.meta ?? null,
  };
}

interface EnqueueContext {
  readonly queue: string[];
  readonly enqueued: Set<string>;
  readonly seedUrls: Set<string>;
  readonly allowedPrefixes: readonly string[];
  readonly baseHost: string;
}

function enqueueFollowUps(
  followUps: readonly FollowUpLink[],
  context: EnqueueContext,
): void {
  for (const follow of followUps) {
    const normalized = normalizeUrl(follow.url);
    if (!normalized) continue;

    let urlObject: URL;
    try {
      urlObject = new URL(normalized);
    } catch {
      continue;
    }

    if (urlObject.host !== context.baseHost) {
      continue;
    }

    if (
      context.allowedPrefixes.length > 0 &&
      !context.allowedPrefixes.some((prefix) =>
        urlObject.pathname.startsWith(prefix)
      )
    ) {
      continue;
    }

    if (!context.enqueued.has(normalized)) {
      context.queue.push(normalized);
      context.enqueued.add(normalized);
      context.seedUrls.add(normalized);
    }
  }
}

function computeAllowedPrefixes(seedUrl: string): string[] {
  try {
    const url = new URL(seedUrl);
    const path = url.pathname;
    const segments = path.split('/').filter(Boolean);

    if (segments.length === 0) {
      return [path.endsWith('/') ? path : `${path}/`];
    }

    const prefixes = new Set<string>();

    const baseDir = path.endsWith('/')
      ? path
      : `${path.slice(0, path.lastIndexOf('/') + 1)}`;
    prefixes.add(baseDir);

    if (segments.length >= 2) {
      prefixes.add(`/${segments[0]}/${segments[1]}/`);
    }

    if (segments.length >= 3) {
      prefixes.add(`/${segments.slice(0, 3).join('/')}/`);
    }

    if (segments.length >= 4) {
      prefixes.add(`/${segments.slice(0, 4).join('/')}/`);
    }

    return Array.from(prefixes);
  } catch {
    return [];
  }
}

function normalizeUrl(url: string): string {
  try {
    const normalized = new URL(url, MIA_BASE_URL);
    normalized.hash = '';
    return normalized.toString();
  } catch {
    return url;
  }
}

type RawCliOption = string | boolean | (string | boolean)[] | undefined;

function optionAsString(value: RawCliOption): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i -= 1) {
      const candidate = value[i];
      if (typeof candidate === 'string') {
        return candidate;
      }
    }
  }
  return undefined;
}

void main();


