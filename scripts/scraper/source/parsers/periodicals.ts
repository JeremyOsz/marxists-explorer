import { MIA_BASE_URL } from '../config';
import type {
  DiscoveryAnomaly,
  PeriodicalRecord,
} from '../types';

export interface ParsePeriodicalsResult {
  readonly periodicals: PeriodicalRecord[];
  readonly anomalies: DiscoveryAnomaly[];
}

export function parsePeriodicals(raw: unknown): ParsePeriodicalsResult {
  const anomalies: DiscoveryAnomaly[] = [];

  if (!Array.isArray(raw)) {
    anomalies.push({
      scope: 'periodicals',
      level: 'error',
      message: 'Expected periodicals payload to be an array.',
      context: { type: typeof raw },
    });
    return { periodicals: [], anomalies };
  }

  const periodicals: PeriodicalRecord[] = [];

  for (const entry of raw) {
    if (
      !entry ||
      typeof entry !== 'object' ||
      Array.isArray(entry)
    ) {
      anomalies.push({
        scope: 'periodicals',
        level: 'warning',
        message: 'Encountered non-object periodical entry.',
        context: { entry },
      });
      continue;
    }

    const record = entry as Record<string, unknown>;
    const title = typeof record.title === 'string' ? record.title.trim() : null;
    const href = typeof record.href === 'string' ? record.href.trim() : null;

    if (!title || !href) {
      anomalies.push({
        scope: 'periodicals',
        level: 'warning',
        message: 'Periodical entry missing title or href.',
        context: { entry: record },
      });
      continue;
    }

    const language =
      typeof record.language === 'string'
        ? record.language.trim()
        : undefined;

    periodicals.push({
      id: toPeriodicalId(title),
      title,
      href: normalizeHref(href),
      language,
      raw: record,
    });
  }

  return { periodicals, anomalies };
}

function toPeriodicalId(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
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


