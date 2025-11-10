import type { CatalogueDiff, SourceCatalogue } from './types';

export function diffCatalogues(
  previous: SourceCatalogue | null,
  next: SourceCatalogue,
): CatalogueDiff {
  if (!previous) {
    return {
      summary: {
        authorsAdded: next.authors.length,
        authorsRemoved: 0,
        sectionsAdded: next.sections.length,
        sectionsRemoved: 0,
        periodicalsAdded: next.periodicals.length,
        periodicalsRemoved: 0,
      },
      authorsAdded: [...next.authors],
      authorsRemoved: [],
      sectionsAdded: [...next.sections],
      sectionsRemoved: [],
      periodicalsAdded: [...next.periodicals],
      periodicalsRemoved: [],
    };
  }

  const authorDiff = diffById(previous.authors, next.authors);
  const sectionDiff = diffById(previous.sections, next.sections);
  const periodicalDiff = diffById(previous.periodicals, next.periodicals);

  return {
    summary: {
      authorsAdded: authorDiff.added.length,
      authorsRemoved: authorDiff.removed.length,
      sectionsAdded: sectionDiff.added.length,
      sectionsRemoved: sectionDiff.removed.length,
      periodicalsAdded: periodicalDiff.added.length,
      periodicalsRemoved: periodicalDiff.removed.length,
    },
    authorsAdded: authorDiff.added,
    authorsRemoved: authorDiff.removed,
    sectionsAdded: sectionDiff.added,
    sectionsRemoved: sectionDiff.removed,
    periodicalsAdded: periodicalDiff.added,
    periodicalsRemoved: periodicalDiff.removed,
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

  pushList('Authors Added', diff.authorsAdded);
  pushList('Authors Removed', diff.authorsRemoved);
  pushList('Sections Added', diff.sectionsAdded);
  pushList('Sections Removed', diff.sectionsRemoved);
  pushList('Periodicals Added', diff.periodicalsAdded);
  pushList('Periodicals Removed', diff.periodicalsRemoved);

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


