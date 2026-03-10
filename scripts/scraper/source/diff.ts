import type { CatalogueDiff, SourceCatalogue, WorkRecord } from './types';

export function diffCatalogues(
  previous: SourceCatalogue | null,
  next: SourceCatalogue,
): CatalogueDiff {
  const nextWorks = listWorks(next);

  if (!previous) {
    return {
      summary: {
        authorsAdded: next.authors.length,
        authorsRemoved: 0,
        sectionsAdded: next.sections.length,
        sectionsRemoved: 0,
        periodicalsAdded: next.periodicals.length,
        periodicalsRemoved: 0,
        worksAdded: nextWorks.length,
        worksRemoved: 0,
      },
      authorsAdded: [...next.authors],
      authorsRemoved: [],
      sectionsAdded: [...next.sections],
      sectionsRemoved: [],
      periodicalsAdded: [...next.periodicals],
      periodicalsRemoved: [],
      worksAdded: [...nextWorks],
      worksRemoved: [],
    };
  }

  const previousWorks = listWorks(previous);
  const authorDiff = diffById(previous.authors, next.authors);
  const sectionDiff = diffById(previous.sections, next.sections);
  const periodicalDiff = diffById(previous.periodicals, next.periodicals);
  const workDiff = diffWorks(previousWorks, nextWorks);

  return {
    summary: {
      authorsAdded: authorDiff.added.length,
      authorsRemoved: authorDiff.removed.length,
      sectionsAdded: sectionDiff.added.length,
      sectionsRemoved: sectionDiff.removed.length,
      periodicalsAdded: periodicalDiff.added.length,
      periodicalsRemoved: periodicalDiff.removed.length,
      worksAdded: workDiff.added.length,
      worksRemoved: workDiff.removed.length,
    },
    authorsAdded: authorDiff.added,
    authorsRemoved: authorDiff.removed,
    sectionsAdded: sectionDiff.added,
    sectionsRemoved: sectionDiff.removed,
    periodicalsAdded: periodicalDiff.added,
    periodicalsRemoved: periodicalDiff.removed,
    worksAdded: workDiff.added,
    worksRemoved: workDiff.removed,
  };
}

export function formatDiffMarkdown(diff: CatalogueDiff): string {
  const lines: string[] = [];
  lines.push('# Source Catalogue Diff');
  lines.push('');
  lines.push(
    `- Authors: +${diff.summary.authorsAdded} / -${diff.summary.authorsRemoved}`,
  );
  lines.push(
    `- Sections: +${diff.summary.sectionsAdded} / -${diff.summary.sectionsRemoved}`,
  );
  lines.push(
    `- Periodicals: +${diff.summary.periodicalsAdded} / -${diff.summary.periodicalsRemoved}`,
  );
  lines.push(
    `- Works: +${diff.summary.worksAdded} / -${diff.summary.worksRemoved}`,
  );
  lines.push('');

  const pushList = <T extends { name?: string; title?: string; id: string }>(
    heading: string,
    items: readonly T[],
  ) => {
    if (items.length === 0) return;
    lines.push(`## ${heading}`);
    lines.push('');
    for (const item of items) {
      const label = itemHasName(item)
        ? item.name!
        : itemHasTitle(item)
          ? item.title!
          : item.id;
      lines.push(`- ${label} (\`${item.id}\`)`);
    }
    lines.push('');
  };

  const pushWorkList = (
    heading: string,
    items: readonly WorkRecord[],
  ) => {
    if (items.length === 0) return;
    lines.push(`## ${heading}`);
    lines.push('');
    // Limit to first 100 works to avoid huge diffs
    const displayItems = items.slice(0, 100);
    for (const work of displayItems) {
      lines.push(`- ${work.title} (by \`${work.authorId}\`)`);
    }
    if (items.length > 100) {
      lines.push(`\n_... and ${items.length - 100} more works_`);
    }
    lines.push('');
  };

  pushList('Authors Added', diff.authorsAdded);
  pushList('Authors Removed', diff.authorsRemoved);
  pushList('Sections Added', diff.sectionsAdded);
  pushList('Sections Removed', diff.sectionsRemoved);
  pushList('Periodicals Added', diff.periodicalsAdded);
  pushList('Periodicals Removed', diff.periodicalsRemoved);
  pushWorkList('Works Added', diff.worksAdded);
  pushWorkList('Works Removed', diff.worksRemoved);

  if (lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines.join('\n');
}

function diffById<T extends { id: string }>(
  previous: readonly T[],
  next: readonly T[],
): { added: T[]; removed: T[] } {
  const prevMap = new Map(previous.map((item) => [item.id, item]));
  const nextMap = new Map(next.map((item) => [item.id, item]));

  const added: T[] = [];
  for (const [id, item] of nextMap.entries()) {
    if (!prevMap.has(id)) {
      added.push(item);
    }
  }

  const removed: T[] = [];
  for (const [id, item] of prevMap.entries()) {
    if (!nextMap.has(id)) {
      removed.push(item);
    }
  }

  return { added, removed };
}

function itemHasName(
  item: { name?: string; title?: string },
): item is { name: string } {
  return typeof item.name === 'string' && item.name.length > 0;
}

function itemHasTitle(
  item: { name?: string; title?: string },
): item is { title: string } {
  return typeof item.title === 'string' && item.title.length > 0;
}

function listWorks(catalogue: SourceCatalogue): readonly WorkRecord[] {
  return Array.isArray(catalogue.works) ? catalogue.works : [];
}

function diffWorks(
  previous: readonly WorkRecord[],
  next: readonly WorkRecord[],
): { added: WorkRecord[]; removed: WorkRecord[] } {
  // Works are identified by authorId + canonicalHref combination
  const prevKey = (work: WorkRecord) =>
    `${work.authorId}|${work.canonicalHref}`;
  const prevMap = new Map(previous.map((work) => [prevKey(work), work]));
  const nextMap = new Map(next.map((work) => [prevKey(work), work]));

  const added: WorkRecord[] = [];
  for (const [key, work] of nextMap.entries()) {
    if (!prevMap.has(key)) {
      added.push(work);
    }
  }

  const removed: WorkRecord[] = [];
  for (const [key, work] of prevMap.entries()) {
    if (!nextMap.has(key)) {
      removed.push(work);
    }
  }

  return { added, removed };
}

