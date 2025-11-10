#!/usr/bin/env tsx
import { promises as fs } from 'node:fs';
import path from 'node:path';

interface Manifest {
  runs: Array<{
    readonly runId: string;
    readonly createdAt: string;
    readonly cataloguePath?: string;
  }>;
}

const CWD = process.cwd();
const ARTIFACTS_DIR = path.join(CWD, 'artifacts');
const MANIFEST_PATH = path.join(ARTIFACTS_DIR, 'manifest.json');

const SOURCE_LATEST_DIR = path.join(CWD, 'data', 'source', 'latest');
const RUN_ARCHIVE_DIR = path.join(CWD, 'data', 'run-archive');

const RETENTION_COUNT = Math.max(
  1,
  Number.parseInt(process.env.SCRAPER_ARCHIVE_KEEP ?? '5', 10),
);

async function main(): Promise<void> {
  await ensureDir(SOURCE_LATEST_DIR);
  await ensureDir(RUN_ARCHIVE_DIR);

  const latestRunId = await resolveLatestRunId();
  if (!latestRunId) {
    console.log('No artifact runs found. Nothing to promote.');
    return;
  }

  const runDir = path.join(ARTIFACTS_DIR, latestRunId);
  const exists = await pathExists(runDir);
  if (!exists) {
    console.warn(`Latest run directory ${runDir} not found. Aborting.`);
    return;
  }

  console.log(`Promoting artifacts from run ${latestRunId}...`);

  await promoteSources(runDir);
  await archiveRun(runDir, latestRunId);
  await pruneArchives();
  await removeRunFromManifest(latestRunId);

  await fs.rm(runDir, { recursive: true, force: true });

  console.log(`Run ${latestRunId} promoted and cleaned up.`);
}

async function promoteSources(runDir: string): Promise<void> {
  const sourceDerived = path.join(runDir, 'sources', 'derived');
  const exists = await pathExists(sourceDerived);
  if (!exists) {
    return;
  }

  console.log('  → Updating latest source snapshot');
  await emptyDir(SOURCE_LATEST_DIR);
  await fs.cp(sourceDerived, SOURCE_LATEST_DIR, { recursive: true });
}

async function archiveRun(runDir: string, runId: string): Promise<void> {
  const archivePath = path.join(RUN_ARCHIVE_DIR, runId);
  console.log(`  → Archiving run to ${path.relative(CWD, archivePath)}`);

  await fs.rm(archivePath, { recursive: true, force: true });
  await fs.cp(runDir, archivePath, { recursive: true });
}

async function pruneArchives(): Promise<void> {
  const entries = await fs.readdir(RUN_ARCHIVE_DIR, {
    withFileTypes: true,
  });

  const runDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));

  if (runDirs.length <= RETENTION_COUNT) {
    return;
  }

  const toRemove = runDirs.slice(RETENTION_COUNT);
  if (toRemove.length === 0) {
    return;
  }

  console.log(
    `  → Pruning ${toRemove.length} archived run(s): ${toRemove.join(', ')}`,
  );
  await Promise.all(
    toRemove.map((dir) =>
      fs.rm(path.join(RUN_ARCHIVE_DIR, dir), { recursive: true, force: true }),
    ),
  );
}

async function removeRunFromManifest(runId: string): Promise<void> {
  const exists = await pathExists(MANIFEST_PATH);
  if (!exists) {
    return;
  }

  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf-8');
    const manifest = JSON.parse(raw) as Manifest;
    const updated = {
      runs: manifest.runs.filter((run) => run.runId !== runId),
    };
    await fs.writeFile(
      MANIFEST_PATH,
      JSON.stringify(updated, null, 2),
      'utf-8',
    );
  } catch (error) {
    console.warn(
      `  ⚠️ Unable to update manifest: ${(error as Error).message}`,
    );
  }
}

async function resolveLatestRunId(): Promise<string | null> {
  const entries = await fs.readdir(ARTIFACTS_DIR, { withFileTypes: true });
  const runDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith('.'))
    .sort((a, b) => b.localeCompare(a));

  return runDirs[0] ?? null;
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function emptyDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

void main().catch((error) => {
  console.error('Failed to promote latest artifacts:', error);
  process.exitCode = 1;
});

