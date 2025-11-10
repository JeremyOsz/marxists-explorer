import { MIA_BASE_URL } from '../config';
import type {
  DiscoveryAnomaly,
  SectionRecord,
} from '../types';

export interface ParseSectionsResult {
  readonly sections: SectionRecord[];
  readonly anomalies: DiscoveryAnomaly[];
}

export function parseSections(raw: unknown): ParseSectionsResult {
  const anomalies: DiscoveryAnomaly[] = [];

  if (!Array.isArray(raw)) {
    anomalies.push({
      scope: 'sections',
      level: 'error',
      message: 'Expected sections payload to be an array.',
      context: { type: typeof raw },
    });
    return { sections: [], anomalies };
  }

  const sections: SectionRecord[] = [];

  for (const entry of raw) {
    if (
      !entry ||
      typeof entry !== 'object' ||
      Array.isArray(entry)
    ) {
      anomalies.push({
        scope: 'sections',
        level: 'warning',
        message: 'Encountered non-object section entry.',
        context: { entry },
      });
      continue;
    }

    const record = entry as Record<string, unknown>;
    const title = typeof record.title === 'string' ? record.title.trim() : null;
    const href = typeof record.href === 'string' ? record.href.trim() : null;

    if (!title || !href) {
      anomalies.push({
        scope: 'sections',
        level: 'warning',
        message: 'Section entry missing title or href.',
        context: { entry: record },
      });
      continue;
    }

    const description =
      typeof record.description === 'string'
        ? record.description.trim()
        : undefined;

    sections.push({
      id: toSectionId(title),
      title,
      href: normalizeHref(href),
      description,
      raw: record,
    });
  }

  return { sections, anomalies };
}

function toSectionId(title: string): string {
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


