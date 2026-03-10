import { load } from 'cheerio';
import { MIA_BASE_URL } from '../config';
import type { DiscoveryAnomaly, WorkRecord } from '../types';
import type { AuthorWorksSnapshot } from '../downloaders/works';

export interface ParseWorksResult {
  readonly works: WorkRecord[];
  readonly anomalies: DiscoveryAnomaly[];
}

export function parseWorksFromAuthorPage(
  snapshot: AuthorWorksSnapshot,
): ParseWorksResult {
  const anomalies: DiscoveryAnomaly[] = [];
  const works: WorkRecord[] = [];
  const $ = load(snapshot.html);
  const author = snapshot.author;

  // Find all links that could be works
  // Skip navigation and metadata links
  const skipPatterns = [
    /index\.htm$/i,
    /bio\//i,
    /other\//i,
    /about/i,
    /^#/,
    /^mailto:/i,
    /^javascript:/i,
  ];

  const seenWorks = new Set<string>();

  $('a[href]').each((_, element) => {
    const $link = $(element);
    const href = $link.attr('href');
    const title = $link.text().trim();

    if (!href || !title || title.length < 3) {
      return;
    }

    // Skip navigation and metadata links
    if (skipPatterns.some((pattern) => pattern.test(href))) {
      return;
    }

    const hrefForMatch = href.split(/[?#]/, 1)[0].toLowerCase();

    // Only include works that point to archive directories or have .htm extension
    // This matches the logic from the Python scraper
    const isWorkLink =
      hrefForMatch.includes('/archive/') ||
      hrefForMatch.endsWith('.htm') ||
      hrefForMatch.endsWith('.html');

    if (!isWorkLink) {
      return;
    }

    // Normalize the title
    const normalizedTitle = title.replace(/\s+/g, ' ').trim();

    const canonicalHref = normalizeHref(href, snapshot.author.canonicalHref);

    // Create a unique key to avoid duplicates across relative URL variants
    const workKey = `${normalizedTitle.toLowerCase()}|${canonicalHref}`;
    if (seenWorks.has(workKey)) {
      return;
    }
    seenWorks.add(workKey);

    works.push({
      authorId: author.id,
      title: normalizedTitle,
      href,
      canonicalHref,
      raw: {
        href,
        title: normalizedTitle,
        authorName: author.name,
        authorHref: author.href,
      },
    });
  });

  if (works.length === 0) {
    anomalies.push({
      scope: 'works',
      level: 'warning',
      message: `No works found for author ${author.name}`,
      context: {
        authorId: author.id,
        authorHref: author.canonicalHref,
      },
    });
  }

  return { works, anomalies };
}

export function parseWorksFromAuthors(
  snapshots: readonly AuthorWorksSnapshot[],
): ParseWorksResult {
  const allWorks: WorkRecord[] = [];
  const allAnomalies: DiscoveryAnomaly[] = [];

  for (const snapshot of snapshots) {
    const result = parseWorksFromAuthorPage(snapshot);
    allWorks.push(...result.works);
    allAnomalies.push(...result.anomalies);
  }

  return {
    works: allWorks,
    anomalies: allAnomalies,
  };
}

function normalizeHref(href: string, baseUrl: string): string {
  // If already absolute, return as-is
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }

  // If starts with /, make it relative to MIA base
  if (href.startsWith('/')) {
    return `${MIA_BASE_URL}${href}`;
  }

  // Otherwise, resolve relative to the author's page URL
  try {
    const base = new URL(baseUrl);
    const resolved = new URL(href, base);
    return resolved.toString();
  } catch {
    // Fallback: prepend MIA base if resolution fails
    return `${MIA_BASE_URL}/${href}`;
  }
}

