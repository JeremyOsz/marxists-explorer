import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  DEFAULT_ARTIFACTS_ROOT,
  DERIVED_SUBDIR,
  LATEST_POINTER_PATH,
  LOGS_SUBDIR,
  MANIFEST_PATH,
  RAW_SUBDIR,
  ensureDirectory,
} from './config';
import type {
  CatalogueManifest,
  DiscoveryRunPaths,
  HttpResourceMeta,
  RawSnapshotInfo,
  SourceCatalogue,
} from './types';

export interface RunSetupOptions {
  readonly outDir?: string;
  readonly runId?: string;
}

export async function createRunPaths(
  options: RunSetupOptions = {},
): Promise<DiscoveryRunPaths> {
  const runId =
    options.runId ?? new Date().toISOString().replace(/[:.]/g, '-');
  const rootDir = join(options.outDir ?? DEFAULT_ARTIFACTS_ROOT, runId);
  const rawDir = join(rootDir, RAW_SUBDIR);
  const derivedDir = join(rootDir, DERIVED_SUBDIR);
  const logsDir = join(rootDir, LOGS_SUBDIR);
  const cataloguePath = join(derivedDir, 'catalogue.json');
  const diffPath = join(derivedDir, 'diff.md');
  const latestPointer = LATEST_POINTER_PATH;
  const manifestPath = MANIFEST_PATH;

  [rootDir, rawDir, derivedDir, logsDir, dirname(latestPointer)].forEach(
    (dir) => ensureDirectory(dir),
  );

  return {
    runId,
    rootDir,
    rawDir,
    derivedDir,
    logsDir,
    cataloguePath,
    diffPath,
    latestPointer,
    manifestPath,
  };
}

export async function writeRawSnapshot(
  meta: HttpResourceMeta,
  contents: string,
  targetDir: string,
  prefix: string,
  extension: 'json' | 'html',
): Promise<RawSnapshotInfo> {
  const filename = `${prefix}-${meta.fetchedAt.replace(/[:.]/g, '-')}-${meta.sha256.slice(0, 8)}.${extension}`;
  const targetPath = join(targetDir, filename);
  await fs.writeFile(targetPath, contents, 'utf-8');
  return { targetPath, meta };
}

export async function writeJsonFile(
  targetPath: string,
  data: unknown,
): Promise<void> {
  await fs.writeFile(targetPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function writeTextFile(
  targetPath: string,
  contents: string,
): Promise<void> {
  await fs.writeFile(targetPath, contents, 'utf-8');
}

export async function loadCatalogue(
  filePath: string,
): Promise<SourceCatalogue | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as SourceCatalogue;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function updateLatestPointer(
  runDir: string,
  latestPath: string,
): Promise<void> {
  try {
    await fs.rm(latestPath, { recursive: true, force: true });
  } catch {
    // ignore
  }
  await fs.symlink(runDir, latestPath);
}

export async function updateManifest(
  manifestPath: string,
  runId: string,
  cataloguePath: string,
): Promise<void> {
  const existing = await readManifest(manifestPath);
  const updated: CatalogueManifest = {
    runs: [
      ...existing.runs,
      {
        runId,
        createdAt: new Date().toISOString(),
        cataloguePath,
      },
    ],
  };
  await writeJsonFile(manifestPath, updated);
}

async function readManifest(
  manifestPath: string,
): Promise<CatalogueManifest> {
  try {
    const contents = await fs.readFile(manifestPath, 'utf-8');
    return JSON.parse(contents) as CatalogueManifest;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { runs: [] };
    }
    throw error;
  }
}

export async function resolvePreviousCatalogue(
  manifestPath: string,
): Promise<SourceCatalogue | null> {
  const manifest = await readManifest(manifestPath);
  const previous = manifest.runs.at(-1);
  if (!previous) return null;
  return loadCatalogue(previous.cataloguePath);
}


