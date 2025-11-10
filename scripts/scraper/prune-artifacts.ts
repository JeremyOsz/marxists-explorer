#!/usr/bin/env tsx
import { promises as fs } from 'node:fs';
import path from 'node:path';

const CWD = process.cwd();
const ARTIFACTS_DIR = path.join(CWD, 'artifacts');
const RETENTION_COUNT = Math.max(
  1,
  Number.parseInt(process.env.SCRAPER_ARTIFACT_KEEP ?? '3', 10),
);

async function main(): Promise<void> {
  const exists = await pathExists(ARTIFACTS_DIR);
  if (!exists) {
    console.log('Artifacts directory not found, nothing to prune.');
    return;
  }

  const entries = await fs.readdir(ARTIFACTS_DIR, { withFileTypes: true });
  const runDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith('.'))
    .sort((a, b) => b.localeCompare(a));

  if (runDirs.length <= RETENTION_COUNT) {
    console.log(`Artifacts count (${runDirs.length}) within retention limit.`);
    return;
  }

  const toRemove = runDirs.slice(RETENTION_COUNT);
  console.log(
    `Removing ${toRemove.length} artifact run(s): ${toRemove.join(', ')}`,
  );

  await Promise.all(
    toRemove.map((dir) =>
      fs.rm(path.join(ARTIFACTS_DIR, dir), { recursive: true, force: true }),
    ),
  );

  console.log('Artifact pruning complete.');
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
  console.error('Failed to prune artifacts:', error);
  process.exitCode = 1;
});

