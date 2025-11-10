import { load } from 'cheerio';
import type { DiscoveryAnomaly } from '../types';

export interface SubjectAuthorLink {
  readonly name: string;
  readonly href: string;
}

export interface SubjectCategory {
  readonly id: string;
  readonly title: string;
  readonly authors: readonly SubjectAuthorLink[];
}

export interface ParseSubjectIndexResult {
  readonly categories: SubjectCategory[];
  readonly anomalies: DiscoveryAnomaly[];
}

export function parseSubjectIndex(html: string): ParseSubjectIndexResult {
  const anomalies: DiscoveryAnomaly[] = [];
  const $ = load(html);
  const categories: SubjectCategory[] = [];

  $('div.category').each((_, element) => {
    const node = $(element);
    const title =
      node.find('h2, h3, h4, strong').first().text().trim() ||
      node.attr('data-title') ||
      null;

    if (!title) {
      anomalies.push({
        scope: 'subjects',
        level: 'warning',
        message: 'Category block missing title.',
      });
      return;
    }

    const authors: SubjectAuthorLink[] = [];
    node.find('span.author a').each((__, link) => {
      const anchor = $(link);
      const name = anchor.text().trim();
      const href = anchor.attr('href') ?? '';
      if (name && href) {
        authors.push({ name, href });
      }
    });

    categories.push({
      id: toCategoryId(title),
      title,
      authors,
    });
  });

  if (categories.length === 0) {
    anomalies.push({
      scope: 'subjects',
      level: 'warning',
      message: 'No subject categories detected in HTML index.',
    });
  }

  return { categories, anomalies };
}

function toCategoryId(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}


