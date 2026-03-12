import type { Thinker } from "@/lib/types/thinker";

export type OverviewNodeType = "category" | "subject";

export interface OverviewNode {
  id: string;
  label: string;
  type: OverviewNodeType;
  thinkerCount: number;
  totalWorks: number;
  topThinkers: string[];
}

export interface OverviewEdge {
  source: string;
  target: string;
  weight: number;
  thinkerNames: string[];
}

export interface OverviewNetwork {
  categories: OverviewNode[];
  subjects: OverviewNode[];
  edges: OverviewEdge[];
}

export interface OverviewSelection {
  type: OverviewNodeType;
  label: string;
}

interface BuildOverviewOptions {
  maxCategories?: number;
  maxSubjects?: number;
}

function meaningfulSubjects(thinker: Thinker): string[] {
  return (thinker.subjects ?? [])
    .filter((subject) => subject.name !== "General")
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .map((subject) => subject.name);
}

function buildNode(id: string, label: string, type: OverviewNodeType, thinkers: Thinker[]): OverviewNode {
  const ranked = [...thinkers].sort(
    (a, b) => (b.workCount ?? 0) - (a.workCount ?? 0) || a.name.localeCompare(b.name)
  );

  return {
    id,
    label,
    type,
    thinkerCount: thinkers.length,
    totalWorks: thinkers.reduce((sum, thinker) => sum + (thinker.workCount ?? 0), 0),
    topThinkers: ranked.slice(0, 4).map((thinker) => thinker.name),
  };
}

export function buildThinkerOverviewNetwork(
  thinkers: Thinker[],
  options: BuildOverviewOptions = {}
): OverviewNetwork {
  const { maxCategories = 16, maxSubjects = 8 } = options;
  const subjectMap = new Map<string, Thinker[]>();
  const categoryMap = new Map<string, Thinker[]>();

  for (const thinker of thinkers) {
    categoryMap.set(thinker.category, [...(categoryMap.get(thinker.category) ?? []), thinker]);
    for (const subject of meaningfulSubjects(thinker)) {
      subjectMap.set(subject, [...(subjectMap.get(subject) ?? []), thinker]);
    }
  }

  const subjects = [...subjectMap.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .slice(0, maxSubjects);
  const subjectSet = new Set(subjects.map(([subject]) => subject));

  const categories = [...categoryMap.entries()]
    .map(([category, categoryThinkers]) => ({
      category,
      thinkers: categoryThinkers,
      linkedCount: categoryThinkers.filter((thinker) =>
        meaningfulSubjects(thinker).some((subject) => subjectSet.has(subject))
      ).length,
    }))
    .filter((entry) => entry.linkedCount > 0)
    .sort((a, b) => b.linkedCount - a.linkedCount || a.category.localeCompare(b.category))
    .slice(0, maxCategories);

  const categorySet = new Set(categories.map((entry) => entry.category));
  const edges: OverviewEdge[] = [];

  for (const { category, thinkers: categoryThinkers } of categories) {
    for (const [subject] of subjects) {
      const matching = categoryThinkers.filter((thinker) => meaningfulSubjects(thinker).includes(subject));
      if (matching.length === 0) {
        continue;
      }

      const ranked = [...matching].sort(
        (a, b) => (b.workCount ?? 0) - (a.workCount ?? 0) || a.name.localeCompare(b.name)
      );

      edges.push({
        source: `category::${category}`,
        target: `subject::${subject}`,
        weight: matching.length,
        thinkerNames: ranked.slice(0, 5).map((thinker) => thinker.name),
      });
    }
  }

  return {
    categories: categories.map(({ category, thinkers: categoryThinkers }) =>
      buildNode(`category::${category}`, category, "category", categoryThinkers)
    ),
    subjects: subjects
      .filter(([subject, subjectThinkers]) =>
        subjectThinkers.some((thinker) => categorySet.has(thinker.category))
      )
      .map(([subject, subjectThinkers]) => buildNode(`subject::${subject}`, subject, "subject", subjectThinkers)),
    edges: edges.sort((a, b) => b.weight - a.weight || a.source.localeCompare(b.source)),
  };
}

export function getThinkersForOverviewSelection(
  thinkers: Thinker[],
  selection: OverviewSelection | null
): Thinker[] {
  if (!selection) {
    return [];
  }

  if (selection.type === "category") {
    return thinkers.filter((thinker) => thinker.category === selection.label);
  }

  return thinkers.filter((thinker) =>
    meaningfulSubjects(thinker).includes(selection.label)
  );
}
