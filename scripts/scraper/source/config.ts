import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { RateLimitConfig } from './types';

export const MIA_BASE_URL = 'https://www.marxists.org';
export const MIA_ADMIN_BASE_URL = `${MIA_BASE_URL}/admin/js/data`;

export const SOURCE_RESOURCES = {
  authors: `${MIA_ADMIN_BASE_URL}/authors.json`,
  sections: `${MIA_ADMIN_BASE_URL}/sections.json`,
  periodicals: `${MIA_ADMIN_BASE_URL}/periodicals.json`,
} as const;

export const SUBJECT_INDEX_PAGES = [
  {
    id: 'subject-root',
    url: `${MIA_BASE_URL}/subject/`,
    description: 'Main subject index page containing category groupings.',
  },
] as const;

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  requestsPerSecond: Number.parseFloat(process.env.MIA_SOURCE_RPS ?? '1'),
  burst: Number.parseInt(process.env.MIA_SOURCE_BURST ?? '5', 10),
};

export const DEFAULT_USER_AGENT =
  process.env.MIA_USER_AGENT ??
  'MarxistsExplorerSourceSync/1.0 (+https://github.com/MarxistsExplorer)';

export const DEFAULT_ARTIFACTS_ROOT = join(process.cwd(), 'artifacts');
export const RAW_SUBDIR = 'sources/raw';
export const DERIVED_SUBDIR = 'sources/derived';
export const LOGS_SUBDIR = 'sources/logs';

export const LATEST_POINTER_PATH = join(process.cwd(), 'data/source/latest');
export const MANIFEST_PATH = join(process.cwd(), 'artifacts/manifest.json');

export function ensureDirectory(path: string): void {
  mkdirSync(path, { recursive: true });
}


