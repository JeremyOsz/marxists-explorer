import type { Thinker } from "@/lib/types/thinker";

export interface ThinkerSubjectNode {
  id: string;
  label: string;
  type: "thinker" | "subject";
  thinkerCount?: number;
  workCount?: number;
  totalSubjectCount?: number;
}

export interface ThinkerSubjectEdge {
  source: string;
  target: string;
  weight: number;
  subjectCount: number;
}

export interface ThinkerSubjectNetwork {
  thinkers: ThinkerSubjectNode[];
  subjects: ThinkerSubjectNode[];
  edges: ThinkerSubjectEdge[];
}

interface BuildThinkerSubjectNetworkOptions {
  maxThinkers?: number;
  maxSubjects?: number;
}

function rankedSubjects(thinker: Thinker) {
  return (thinker.subjects ?? [])
    .filter((subject) => subject.name !== "General")
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function buildThinkerSubjectNetwork(
  thinkers: Thinker[],
  options: BuildThinkerSubjectNetworkOptions = {}
): ThinkerSubjectNetwork {
  const { maxThinkers = 14, maxSubjects = 6 } = options;

  const selectedThinkers = [...thinkers]
    .sort((a, b) => (b.workCount ?? 0) - (a.workCount ?? 0) || a.name.localeCompare(b.name))
    .slice(0, maxThinkers);

  const subjectCounts = new Map<string, number>();
  for (const thinker of selectedThinkers) {
    for (const subject of rankedSubjects(thinker)) {
      subjectCounts.set(subject.name, (subjectCounts.get(subject.name) ?? 0) + 1);
    }
  }

  const selectedSubjects = [...subjectCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, maxSubjects)
    .map(([subject]) => subject);
  const selectedSubjectSet = new Set(selectedSubjects);

  const thinkerNodes: ThinkerSubjectNode[] = selectedThinkers.map((thinker) => ({
    id: `thinker::${thinker.category}::${thinker.name}`,
    label: thinker.name,
    type: "thinker",
    workCount: thinker.workCount ?? 0,
    totalSubjectCount: rankedSubjects(thinker).length,
  }));

  const subjectNodes: ThinkerSubjectNode[] = selectedSubjects.map((subject) => ({
    id: `subject::${subject}`,
    label: subject,
    type: "subject",
    thinkerCount: subjectCounts.get(subject) ?? 0,
  }));

  const edges: ThinkerSubjectEdge[] = [];
  for (const thinker of selectedThinkers) {
    for (const subject of rankedSubjects(thinker)) {
      if (!selectedSubjectSet.has(subject.name)) {
        continue;
      }

      edges.push({
        source: `thinker::${thinker.category}::${thinker.name}`,
        target: `subject::${subject.name}`,
        weight: Math.max(1, Math.min(10, Math.round(subject.count / 3))),
        subjectCount: subject.count,
      });
    }
  }

  return {
    thinkers: thinkerNodes,
    subjects: subjectNodes,
    edges: edges.sort((a, b) => b.subjectCount - a.subjectCount || a.source.localeCompare(b.source)),
  };
}
