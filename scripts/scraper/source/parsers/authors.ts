import { MIA_BASE_URL } from '../config';
import type {
  AuthorAlias,
  AuthorRecord,
  DiscoveryAnomaly,
} from '../types';

export interface ParseAuthorsResult {
  readonly authors: AuthorRecord[];
  readonly anomalies: DiscoveryAnomaly[];
}

export function parseAuthors(raw: unknown): ParseAuthorsResult {
  const anomalies: DiscoveryAnomaly[] = [];

  if (!Array.isArray(raw)) {
    anomalies.push({
      scope: 'authors',
      level: 'error',
      message: 'Expected authors payload to be an array.',
      context: { type: typeof raw },
    });
    return { authors: [], anomalies };
  }

  const authors: AuthorRecord[] = [];

  for (const entry of raw) {
    if (
      !entry ||
      typeof entry !== 'object' ||
      Array.isArray(entry)
    ) {
      anomalies.push({
        scope: 'authors',
        level: 'warning',
        message: 'Encountered non-object author entry.',
        context: { entry },
      });
      continue;
    }

    const record = entry as Record<string, unknown>;
    const name = typeof record.name === 'string' ? record.name.trim() : null;
    const href = typeof record.href === 'string' ? record.href.trim() : null;

    if (!name || !href) {
      anomalies.push({
        scope: 'authors',
        level: 'warning',
        message: 'Author entry missing name or href.',
        context: { entry: record },
      });
      continue;
    }

    const id = toAuthorId(name);
    const canonicalHref = normalizeHref(href);
    const aliases = buildAliases(name, record);
    const categories = extractCategories(record);

    authors.push({
      id,
      name,
      href,
      canonicalHref,
      aliases,
      categories,
      raw: record,
    });
  }

  return { authors, anomalies };
}

function buildAliases(
  canonicalName: string,
  record: Record<string, unknown>,
): AuthorAlias[] {
  const aliasSet = new Map<string, AuthorAlias>();
  const addAlias = (value: string, source: AuthorAlias['source']): void => {
    const normalized = value.trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (aliasSet.has(key)) return;
    aliasSet.set(key, { value: normalized, source });
  };

  addAlias(canonicalName, 'primary');

  const aka = record.aka;
  if (typeof aka === 'string') {
    aka
      .split(/[;,]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((alias) => addAlias(alias, 'aka'));
  }

  const aliases = record.aliases;
  if (Array.isArray(aliases)) {
    for (const alias of aliases) {
      if (typeof alias === 'string') {
        addAlias(alias, 'aka');
      }
    }
  }

  const parenthetical = canonicalName.match(/\(([^)]+)\)/g);
  if (parenthetical) {
    parenthetical
      .map((segment) => segment.replace(/[()]/g, '').trim())
      .filter(Boolean)
      .forEach((alias) => addAlias(alias, 'parenthetical'));
  }

  const commaSeparated = canonicalName.split(',');
  if (commaSeparated.length === 2) {
    addAlias(
      `${commaSeparated[1].trim()} ${commaSeparated[0].trim()}`.trim(),
      'derived',
    );
  }

  return Array.from(aliasSet.values());
}

function extractCategories(record: Record<string, unknown>): string[] {
  const categories = new Set<string>();
  const push = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) {
      categories.add(value.trim());
    }
  };

  if (Array.isArray(record.sections)) {
    for (const item of record.sections) {
      push(item);
    }
  }

  if (Array.isArray(record.categories)) {
    for (const item of record.categories) {
      push(item);
    }
  }

  if (typeof record.section === 'string') {
    push(record.section);
  }

  if (typeof record.category === 'string') {
    push(record.category);
  }

  return Array.from(categories);
}

function normalizeHref(href: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }
  if (href.startsWith('/')) {
    return `${MIA_BASE_URL}${href}`;
  }
  return `${MIA_BASE_URL}/${href}`;
}

function toAuthorId(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}


