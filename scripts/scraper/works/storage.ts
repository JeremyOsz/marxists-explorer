import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  DEFAULT_ARTIFACTS_ROOT,
  ensureDirectory,
} from '../source/config';

export interface WorksRunPaths {
  readonly runId: string;
  readonly rootDir: string;
  readonly derivedDir: string;
  readonly logsDir: string;
  readonly worksPath: string;
  readonly failuresPath: string;
  readonly runPath: string;
}

export interface WorksRunSetupOptions {
  readonly outDir?: string;
  readonly runId?: string;
}

const DERIVED_SUBDIR = 'works/derived';
const LOGS_SUBDIR = 'works/logs';

export async function createWorksRunPaths(
  options: WorksRunSetupOptions = {},
): Promise<WorksRunPaths> {
  const runId =
    options.runId ?? new Date().toISOString().replace(/[:.]/g, '-');
  const rootDir = join(options.outDir ?? DEFAULT_ARTIFACTS_ROOT, runId);
  const derivedDir = join(rootDir, DERIVED_SUBDIR);
  const logsDir = join(rootDir, LOGS_SUBDIR);

  [rootDir, derivedDir, logsDir].forEach((dir) => ensureDirectory(dir));
  ensureDirectory(dirname(derivedDir));

  const worksPath = join(derivedDir, 'author-works.json');
  const failuresPath = join(derivedDir, 'failures.json');
  const runPath = join(rootDir, 'works-run.json');

  return {
    runId,
    rootDir,
    derivedDir,
    logsDir,
    worksPath,
    failuresPath,
    runPath,
  };
}

export async function writeJsonFile(
  targetPath: string,
  data: unknown,
): Promise<void> {
  await fs.writeFile(targetPath, JSON.stringify(data, null, 2), 'utf-8');
}


