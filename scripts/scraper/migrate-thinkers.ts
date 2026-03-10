#!/usr/bin/env tsx
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { eq, and } from 'drizzle-orm';

import { db } from '../../lib/db/client';
import { collections, thinkers } from '../../lib/db/schema';
import type { AuthorAlias, AuthorRecord, SourceCatalogue } from './source/types';

interface CliOptions {
  readonly dryRun: boolean;
}

interface IndexedAuthor {
  readonly author: AuthorRecord;
  readonly alias: string;
}

interface MigrationSummary {
  collectionsCreated: number;
  collectionsUpdated: number;
  thinkersCreated: number;
  thinkersUpdated: number;
  missingAssignments: Array<{ collection: string; name: string }>;
  ambiguousAssignments: Array<{ collection: string; name: string; aliases: string[] }>;
}

const ROOT_DIR = process.cwd();
const CATALOGUE_PATH = path.join(ROOT_DIR, 'data', 'source', 'latest', 'catalogue.json');
const CATEGORIES_DIR = path.join(ROOT_DIR, 'data', 'categories');

async function main(): Promise<void> {
  const cli = parseCliOptions();
  if (cli.dryRun) {
    console.log('Running in dry-run mode. No database changes will be written.');
  }

  const catalogue = await loadCatalogue(CATALOGUE_PATH);
  const aliasIndex = buildAliasIndex(catalogue.authors);

  const summary: MigrationSummary = {
    collectionsCreated: 0,
    collectionsUpdated: 0,
    thinkersCreated: 0,
    thinkersUpdated: 0,
    missingAssignments: [],
    ambiguousAssignments: [],
  };

  const categoryFiles = await fs.readdir(CATEGORIES_DIR);
  for (const file of categoryFiles.filter((name) => name.endsWith('.json'))) {
    const collectionSlug = file.replace(/\.json$/i, '');
    const collectionDisplayName = toTitleCase(collectionSlug);
    const thinkersForCollection = JSON.parse(
      await fs.readFile(path.join(CATEGORIES_DIR, file), 'utf-8'),
    ) as string[];

    await upsertCollection(collectionSlug, collectionDisplayName, cli.dryRun, summary);

    for (const thinkerName of thinkersForCollection) {
      const match = findAuthor(aliasIndex, thinkerName);
      if (!match) {
        summary.missingAssignments.push({ collection: collectionSlug, name: thinkerName });
        continue;
      }

      if (match.length > 1) {
        summary.ambiguousAssignments.push({
          collection: collectionSlug,
          name: thinkerName,
          aliases: match.map((m) => m.alias),
        });
      }

      const selected = pickBestMatch(match, thinkerName);
      await upsertThinker(
        collectionSlug,
        thinkerName,
        selected.author,
        cli.dryRun,
        summary,
      );
    }
  }

  reportSummary(summary);
}

function parseCliOptions(): CliOptions {
  const { values } = parseArgs({
    options: {
      'dry-run': {
        type: 'boolean',
        default: false,
      },
    },
  });

  return {
    dryRun: Boolean(values['dry-run']),
  };
}

async function loadCatalogue(filePath: string): Promise<SourceCatalogue> {
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw) as SourceCatalogue;
}

function buildAliasIndex(authors: readonly AuthorRecord[]): Map<string, IndexedAuthor[]> {
  const index = new Map<string, IndexedAuthor[]>();

  for (const author of authors) {
    const aliases: string[] = [
      author.name,
      ...author.aliases.map((alias: AuthorAlias) => alias.value),
    ];

    for (const alias of aliases) {
      const key = normalize(alias);
      if (!key) continue;
      const existing = index.get(key);
      const entry: IndexedAuthor = { author, alias };
      if (existing) {
        existing.push(entry);
      } else {
        index.set(key, [entry]);
      }
    }
  }

  return index;
}

function findAuthor(
  index: Map<string, IndexedAuthor[]>,
  name: string,
): IndexedAuthor[] | null {
  const key = normalize(name);
  if (!key) return null;
  const matches = index.get(key);
  if (!matches || matches.length === 0) {
    return null;
  }
  return matches;
}

function pickBestMatch(matches: IndexedAuthor[], desiredName: string): IndexedAuthor {
  if (matches.length === 1) {
    return matches[0];
  }

  const desiredNormalized = normalize(desiredName);
  const exact = matches.find((candidate) => normalize(candidate.alias) === desiredNormalized);
  if (exact) {
    return exact;
  }

  const preferred = matches.find((candidate) =>
    normalize(candidate.author.name) === desiredNormalized,
  );
  if (preferred) {
    return preferred;
  }

  return matches[0];
}

async function upsertCollection(
  slug: string,
  displayName: string,
  dryRun: boolean,
  summary: MigrationSummary,
): Promise<void> {
  const existing = await db.query.collections.findFirst({
    where: eq(collections.id, slug),
  });

  if (!existing) {
    summary.collectionsCreated += 1;
    if (dryRun) {
      console.log(`[dry-run] create collection ${slug}`);
      return;
    }

    await db.insert(collections).values({
      id: slug,
      name: slug,
      displayName,
      description: null,
    });
    return;
  }

  if (existing.displayName !== displayName || existing.name !== slug) {
    summary.collectionsUpdated += 1;
    if (dryRun) {
      console.log(`[dry-run] update collection ${slug}`);
      return;
    }

    await db
      .update(collections)
      .set({
        name: slug,
        displayName,
        updatedAt: new Date(),
      })
      .where(eq(collections.id, slug));
  }
}

async function upsertThinker(
  collectionId: string,
  displayName: string,
  author: AuthorRecord,
  dryRun: boolean,
  summary: MigrationSummary,
): Promise<void> {
  const existing = await db.query.thinkers.findFirst({
    where: and(
      eq(thinkers.collectionId, collectionId),
      eq(thinkers.slug, author.id),
    ),
  });

  const preferredName = displayName || toDisplayName(author);
  const bioUrl = author.canonicalHref;

  if (!existing) {
    summary.thinkersCreated += 1;
    if (dryRun) {
      console.log(
        `[dry-run] create thinker ${collectionId}/${author.id} (${preferredName})`,
      );
      return;
    }

    await db.insert(thinkers).values({
      collectionId,
      slug: author.id,
      name: preferredName,
      bioUrl,
      description: null,
      imageUrl: null,
      thumbnailUrl: null,
    });
    return;
  }

  const needsUpdate =
    existing.name !== preferredName || (bioUrl && existing.bioUrl !== bioUrl);

  if (needsUpdate) {
    summary.thinkersUpdated += 1;
    if (dryRun) {
      console.log(
        `[dry-run] update thinker ${collectionId}/${author.id} (${preferredName})`,
      );
      return;
    }

    await db
      .update(thinkers)
      .set({
        name: preferredName,
        bioUrl,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(thinkers.collectionId, collectionId),
          eq(thinkers.slug, author.id),
        ),
      );
  }
}

function reportSummary(summary: MigrationSummary): void {
  console.log('--- Migration Summary ---');
  console.log(`Collections created: ${summary.collectionsCreated}`);
  console.log(`Collections updated: ${summary.collectionsUpdated}`);
  console.log(`Thinkers created:    ${summary.thinkersCreated}`);
  console.log(`Thinkers updated:    ${summary.thinkersUpdated}`);

  if (summary.missingAssignments.length > 0) {
    console.warn('\nMissing thinker matches:');
    for (const miss of summary.missingAssignments) {
      console.warn(`  - ${miss.collection}: ${miss.name}`);
    }
  }

  if (summary.ambiguousAssignments.length > 0) {
    console.warn('\nAmbiguous thinker matches:');
    for (const ambiguous of summary.ambiguousAssignments) {
      console.warn(
        `  - ${ambiguous.collection}: ${ambiguous.name} (aliases: ${ambiguous.aliases.join(', ')})`,
      );
    }
  }
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toDisplayName(author: AuthorRecord): string {
  const [last, first] = author.name.split(',').map((part) => part.trim());
  if (first) {
    return `${first} ${last}`;
  }
  return author.name;
}

function toTitleCase(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

void main().catch((error) => {
  console.error('Failed to migrate thinkers:', error);
  process.exitCode = 1;
});

