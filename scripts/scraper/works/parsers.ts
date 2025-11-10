import { load } from 'cheerio';
import type { FollowUpLink, WorksAnomaly, WorkEntry } from './types';

export interface ParseWorksOptions {
  readonly baseUrl: string;
}

export interface ParseWorksResult {
  readonly works: WorkEntry[];
  readonly anomalies: WorksAnomaly[];
  readonly followUps: FollowUpLink[];
}

const SKIP_PATTERNS = [
  /\/bio\//i,
  /\/about/i,
  /\/faq/i,
  /javascript:/i,
  /^#/,
];

const ACCEPT_PATTERNS = [
  /\.htm$/i,
  /\.html$/i,
  /\.php$/i,
  /\.pdf$/i,
  /\/archive\//i,
  /\/works\//i,
];

const FOLLOWUP_PATTERNS = [
  /index\.htm$/i,
  /index\.html$/i,
  /\/by-date/i,
  /\/by-topic/i,
  /\/by-type/i,
  /\/works\/?$/i,
  /\/works\/index/i,
  /\/chronology/i,
  /\/chronological/i,
  /\/timeline/i,
];

export function parseWorksFromHtml(
  html: string,
  options: ParseWorksOptions,
): ParseWorksResult {
  const anomalies: WorksAnomaly[] = [];
  const $ = load(html);
  const seen = new Set<string>();
  const works: WorkEntry[] = [];
  const followUps: FollowUpLink[] = [];
  const followUpSet = new Set<string>();

  const baseUrl = new URL(options.baseUrl);

  $('a[href]').each((_, element) => {
    const anchor = $(element);
    const text = anchor.text().replace(/\s+/g, ' ').trim();
    const href = anchor.attr('href')?.trim() ?? '';

    if (!text || !href) {
      return;
    }

    const lowerHref = href.toLowerCase();
    if (SKIP_PATTERNS.some((pattern) => pattern.test(lowerHref))) {
      return;
    }

    if (!ACCEPT_PATTERNS.some((pattern) => pattern.test(lowerHref))) {
      // Still consider as potential follow-up even if not a direct work.
      const resolvedFollowUp = resolveFollowUpUrl(lowerHref, href, baseUrl);
      if (resolvedFollowUp) {
        const followUpKey = resolvedFollowUp.toLowerCase();
        if (!followUpSet.has(followUpKey)) {
          followUpSet.add(followUpKey);
          followUps.push({
            url: resolvedFollowUp,
            label: text || undefined,
            reason: 'pattern',
          });
        }
      }
      return;
    }

    try {
      const urlObj = new URL(href, options.baseUrl);
      if (urlObj.host !== baseUrl.host) {
        return;
      }
      const url = urlObj.toString();
      const key = `${text.toLowerCase()}::${url}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);

      if (text.length <= 3) {
        return;
      }

      works.push({
        title: text,
        url,
      });

      if (FOLLOWUP_PATTERNS.some((pattern) => pattern.test(urlObj.pathname))) {
        const followUpKey = url.toLowerCase();
        if (!followUpSet.has(followUpKey)) {
          followUpSet.add(followUpKey);
          followUps.push({
            url,
            label: text || undefined,
            reason: 'follow-up',
          });
        }
      }
    } catch (error) {
      anomalies.push({
        level: 'warning',
        message: 'Failed to resolve work URL.',
        context: {
          href,
          baseUrl: options.baseUrl,
          error: (error as Error).message,
        },
      });
    }
  });

  if (works.length === 0) {
    anomalies.push({
      level: 'warning',
      message: 'No works detected in author page.',
      context: { baseUrl: options.baseUrl },
    });
  }

  return { works, anomalies, followUps };
}

function resolveFollowUpUrl(
  lowerHref: string,
  originalHref: string,
  baseUrl: URL,
): string | null {
  if (!FOLLOWUP_PATTERNS.some((pattern) => pattern.test(lowerHref))) {
    return null;
  }

  try {
    const resolved = new URL(originalHref, baseUrl);
    if (resolved.host !== baseUrl.host) {
      return null;
    }
    return resolved.toString();
  } catch {
    return null;
  }
}


