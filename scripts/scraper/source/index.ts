#!/usr/bin/env tsx
import { parseArgs } from 'node:util';
import { join } from 'node:path';
import { HttpClient } from './httpClient';
import { createRunPaths, resolvePreviousCatalogue, updateLatestPointer, updateManifest, writeJsonFile, writeRawSnapshot, writeTextFile } from './storage';
import { fetchAuthorsResource } from './downloaders/authors';
import { fetchSectionsResource } from './downloaders/sections';
import { fetchPeriodicalsResource } from './downloaders/periodicals';
import { fetchSubjectIndices } from './downloaders/htmlIndex';
import { parseAuthors } from './parsers/authors';
import { parseSections } from './parsers/sections';
import { parsePeriodicals } from './parsers/periodicals';
import { parseSubjectIndex } from './parsers/htmlIndex';
import { buildSourceCatalogue } from './catalogueBuilder';
import { diffCatalogues, formatDiffMarkdown } from './diff';

interface CliOptions {
  readonly outDir?: string;
  readonly runId?: string;
}

async function main(): Promise<void> {
  const start = Date.now();
  const cli = parseCliArgs();
  const paths = await createRunPaths({
    outDir: cli.outDir,
    runId: cli.runId,
  });

  const client = new HttpClient();
  const runLogPath = join(paths.logsDir, 'run.log');

  try {
    console.log(`Starting source sync run ${paths.runId}`);

    const authorsResource = await fetchAuthorsResource(client);
    await writeRawSnapshot(
      authorsResource.meta,
      JSON.stringify(authorsResource.data, null, 2),
      paths.rawDir,
      'authors',
      'json',
    );
    const authorsParsed = parseAuthors(authorsResource.data);

    const sectionsResource = await fetchSectionsResource(client);
    await writeRawSnapshot(
      sectionsResource.meta,
      JSON.stringify(sectionsResource.data, null, 2),
      paths.rawDir,
      'sections',
      'json',
    );
    const sectionsParsed = parseSections(sectionsResource.data);

    const periodicalsResource = await fetchPeriodicalsResource(client);
    await writeRawSnapshot(
      periodicalsResource.meta,
      JSON.stringify(periodicalsResource.data, null, 2),
      paths.rawDir,
      'periodicals',
      'json',
    );
    const periodicalsParsed = parsePeriodicals(periodicalsResource.data);

    const subjectSnapshots = await fetchSubjectIndices(client);
    const subjectAnomalies = [];
    for (const snapshot of subjectSnapshots) {
      await writeRawSnapshot(
        snapshot.meta,
        snapshot.html,
        paths.rawDir,
        snapshot.id,
        'html',
      );
      const parsed = parseSubjectIndex(snapshot.html);
      subjectAnomalies.push(...parsed.anomalies);
    }

    const anomalies = [
      ...authorsParsed.anomalies,
      ...sectionsParsed.anomalies,
      ...periodicalsParsed.anomalies,
      ...subjectAnomalies,
    ];

    const catalogue = buildSourceCatalogue({
      fetchedAt: new Date().toISOString(),
      authors: authorsParsed.authors,
      sections: sectionsParsed.sections,
      periodicals: periodicalsParsed.periodicals,
      anomalies,
    });

    const previousCatalogue = await resolvePreviousCatalogue(paths.manifestPath);
    const diff = diffCatalogues(previousCatalogue, catalogue);
    const diffMarkdown = formatDiffMarkdown(diff);

    await writeJsonFile(paths.cataloguePath, catalogue);
    await writeTextFile(paths.diffPath, diffMarkdown);
    await writeJsonFile(
      join(paths.rootDir, 'run.json'),
      {
        runId: paths.runId,
        startedAt: new Date(start).toISOString(),
        finishedAt: new Date().toISOString(),
        durationsMs: {
          total: Date.now() - start,
        },
        resources: {
          authors: authorsResource.meta,
          sections: sectionsResource.meta,
          periodicals: periodicalsResource.meta,
          subjectHtml: subjectSnapshots.map((snapshot) => snapshot.meta),
        },
        summary: diff.summary,
        anomalyCount: anomalies.length,
      },
    );

    await updateManifest(paths.manifestPath, paths.runId, paths.cataloguePath);
    await updateLatestPointer(paths.rootDir, paths.latestPointer);

    console.log(`Source sync run ${paths.runId} complete.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Source sync failed: ${message}`);
    await writeTextFile(
      runLogPath,
      `[${new Date().toISOString()}] ERROR: ${message}\n${String(
        (error as Error).stack ?? '',
      )}`,
    );
    process.exitCode = 1;
  } finally {
    client.dispose();
  }
}

function parseCliArgs(): CliOptions {
  const { values } = parseArgs({
    options: {
      out: { type: 'string' },
      runId: { type: 'string' },
    },
  });

  return {
    outDir: values.out,
    runId: values.runId,
  };
}

void main();


