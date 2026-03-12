import type { Thinker, SubjectSummary } from "@/lib/types/thinker";

export type ThinkerGraphMode = "hybrid" | "subjects" | "categories";
export type ThinkerGraphPrimaryType = "subject" | "category" | "hybrid";
export type ThinkerGraphReasonType = "subject" | "category" | "scale" | "curated";
export type ThinkerNodeSizeMetric = "connections" | "workCount" | "subjectBreadth";
export type ThinkerClusterLens = "categories" | "subjects";

export interface ThinkerGraphReason {
  type: ThinkerGraphReasonType;
  label: string;
  value: number;
}

export interface ThinkerGraphNode {
  id: string;
  name: string;
  category: string;
  workCount: number;
  subjectCount: number;
  topSubjects: string[];
  group: number;
  degree: number;
  bridgeScore: number;
  description: string;
  searchText?: string;
  allSubjects: SubjectSummary[];
}

export interface ThinkerGraphLink {
  source: string;
  target: string;
  strength: number;
  primaryType: ThinkerGraphPrimaryType;
  reasons: ThinkerGraphReason[];
}

export interface ThinkerGraph {
  nodes: ThinkerGraphNode[];
  links: ThinkerGraphLink[];
}

export interface ThinkerInsights {
  totalThinkers: number;
  totalCategories: number;
  connectedThinkers: number;
  strongestBridgeThinker?: {
    id: string;
    name: string;
    category: string;
    bridgeScore: number;
  };
  rankedSubjects: Array<{
    name: string;
    thinkerCount: number;
  }>;
  bridgeThinkers: Array<{
    id: string;
    name: string;
    category: string;
    bridgeScore: number;
    connections: number;
  }>;
  categorySummaries: Array<{
    category: string;
    thinkers: number;
    averageWorks: number;
  }>;
}

export interface ThinkerGraphCluster {
  id: string;
  label: string;
  lens: ThinkerClusterLens;
  nodeCount: number;
  averageWorks: number;
  topThinkers: string[];
  subjects: string[];
}

interface BuildThinkerGraphOptions {
  mode?: ThinkerGraphMode;
  maxNodes?: number;
  minLinkStrength?: number;
  maxEdgesPerNode?: number;
}

const GENERAL_SUBJECT = "general";

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function thinkerId(thinker: Pick<Thinker, "category" | "name">): string {
  return `${thinker.category}::${thinker.name}`;
}

function hashGroup(category: string): number {
  return category.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 12;
}

function sortSubjects(subjects: SubjectSummary[] = []): SubjectSummary[] {
  return [...subjects].sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.name.localeCompare(b.name);
  });
}

function getMeaningfulSubjects(subjects: SubjectSummary[] = []): SubjectSummary[] {
  return sortSubjects(subjects).filter((subject) => normalizeText(subject.name) !== GENERAL_SUBJECT);
}

function getTopSubjects(subjects: SubjectSummary[] = []): string[] {
  return getMeaningfulSubjects(subjects)
    .slice(0, 3)
    .map((subject) => subject.name);
}

function getScaleScore(a: number, b: number): number {
  if (a <= 0 || b <= 0) {
    return 0;
  }

  const max = Math.max(a, b);
  const min = Math.min(a, b);

  return max / min <= 2 ? 1 : 0;
}

function getSharedSubjects(a: SubjectSummary[], b: SubjectSummary[]): SubjectSummary[] {
  const bMap = new Map(b.map((subject) => [normalizeText(subject.name), subject]));

  return a.filter((subject) => {
    const key = normalizeText(subject.name);
    return key !== GENERAL_SUBJECT && bMap.has(key);
  });
}

function buildNodes(thinkers: Thinker[]): ThinkerGraphNode[] {
  return thinkers.map((thinker) => {
    const meaningfulSubjects = getMeaningfulSubjects(thinker.subjects);

    return {
      id: thinkerId(thinker),
      name: thinker.name,
      category: thinker.category,
      workCount: thinker.workCount ?? 0,
      subjectCount: meaningfulSubjects.length,
      topSubjects: getTopSubjects(thinker.subjects),
      group: hashGroup(thinker.category),
      degree: 0,
      bridgeScore: 0,
      description: thinker.description,
      searchText: thinker.searchText,
      allSubjects: meaningfulSubjects,
    };
  });
}

function buildLink(
  nodeA: ThinkerGraphNode,
  nodeB: ThinkerGraphNode,
  mode: ThinkerGraphMode,
  minLinkStrength: number
): ThinkerGraphLink | null {
  const sharedSubjects = getSharedSubjects(nodeA.allSubjects, nodeB.allSubjects);
  const sharedSubjectNames = new Set(sharedSubjects.map((subject) => normalizeText(subject.name)));
  const topSubjectNames = new Set([
    ...nodeA.topSubjects.map(normalizeText),
    ...nodeB.topSubjects.map(normalizeText),
  ]);

  const subjectBase = sharedSubjects.length * 3;
  const topBonus = [...sharedSubjectNames].reduce(
    (sum, subject) => sum + (topSubjectNames.has(subject) ? 1 : 0),
    0
  );
  const subjectScore = mode === "categories" ? 0 : subjectBase + topBonus;
  const categoryScore = nodeA.category === nodeB.category && mode !== "subjects" ? 2 : 0;
  const scaleScore = mode === "categories" ? 0 : getScaleScore(nodeA.workCount, nodeB.workCount);
  const strength = subjectScore + categoryScore + scaleScore;

  if (strength < minLinkStrength) {
    return null;
  }

  const reasons: ThinkerGraphReason[] = [];

  if (sharedSubjects.length > 0) {
    reasons.push({
      type: "subject",
      label: `Shared subjects: ${sharedSubjects.map((subject) => subject.name).slice(0, 3).join(", ")}`,
      value: subjectScore,
    });
  }

  if (categoryScore > 0) {
    reasons.push({
      type: "category",
      label: `Shared category: ${nodeA.category}`,
      value: categoryScore,
    });
  }

  if (scaleScore > 0) {
    reasons.push({
      type: "scale",
      label: "Comparable work volume",
      value: scaleScore,
    });
  }

  let primaryType: ThinkerGraphPrimaryType = "hybrid";
  if (subjectScore > categoryScore && subjectScore > 0) {
    primaryType = "subject";
  } else if (categoryScore > subjectScore && categoryScore > 0) {
    primaryType = "category";
  }

  return {
    source: nodeA.id,
    target: nodeB.id,
    strength,
    primaryType,
    reasons,
  };
}

function rankNodes(nodes: ThinkerGraphNode[]): ThinkerGraphNode[] {
  return [...nodes].sort((a, b) => {
    if (b.bridgeScore !== a.bridgeScore) {
      return b.bridgeScore - a.bridgeScore;
    }
    if (b.subjectCount !== a.subjectCount) {
      return b.subjectCount - a.subjectCount;
    }
    if (b.workCount !== a.workCount) {
      return b.workCount - a.workCount;
    }
    return a.name.localeCompare(b.name);
  });
}

function getEffectiveThreshold(mode: ThinkerGraphMode, minLinkStrength: number): number {
  return mode === "categories" ? Math.min(minLinkStrength, 2) : minLinkStrength;
}

function pruneLinks(
  links: ThinkerGraphLink[],
  maxEdgesPerNode: number
): ThinkerGraphLink[] {
  if (maxEdgesPerNode <= 0) {
    return [];
  }

  const nodeLinkMap = new Map<string, ThinkerGraphLink[]>();
  for (const link of links) {
    const currentSource = nodeLinkMap.get(link.source) ?? [];
    currentSource.push(link);
    nodeLinkMap.set(link.source, currentSource);

    const currentTarget = nodeLinkMap.get(link.target) ?? [];
    currentTarget.push(link);
    nodeLinkMap.set(link.target, currentTarget);
  }

  const keep = new Set<string>();
  for (const [nodeId, nodeLinks] of nodeLinkMap.entries()) {
    const ranked = [...nodeLinks].sort((a, b) => {
      if (b.strength !== a.strength) {
        return b.strength - a.strength;
      }
      if (a.primaryType !== b.primaryType) {
        return a.primaryType.localeCompare(b.primaryType);
      }
      const aOther = a.source === nodeId ? a.target : a.source;
      const bOther = b.source === nodeId ? b.target : b.source;
      return aOther.localeCompare(bOther);
    });

    for (const link of ranked.slice(0, maxEdgesPerNode)) {
      const key = [link.source, link.target].sort().join("::");
      keep.add(key);
    }
  }

  return links.filter((link) => keep.has([link.source, link.target].sort().join("::")));
}

export function buildThinkerGraph(
  thinkers: Thinker[],
  options: BuildThinkerGraphOptions = {}
): ThinkerGraph {
  const {
    mode = "hybrid",
    maxNodes = thinkers.length,
    minLinkStrength = 4,
    maxEdgesPerNode = mode === "categories" ? 6 : 4,
  } = options;
  const nodes = buildNodes(thinkers);
  const links: ThinkerGraphLink[] = [];
  const effectiveThreshold = getEffectiveThreshold(mode, minLinkStrength);

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const link = buildLink(nodes[i], nodes[j], mode, effectiveThreshold);
      if (link) {
        links.push(link);
      }
    }
  }

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  for (const link of links) {
    const source = nodeMap.get(link.source);
    const target = nodeMap.get(link.target);
    if (!source || !target) {
      continue;
    }

    source.degree += 1;
    target.degree += 1;
    source.bridgeScore += link.strength + (source.category !== target.category ? 1 : 0);
    target.bridgeScore += link.strength + (source.category !== target.category ? 1 : 0);
  }

  const selectedNodes = rankNodes(nodes).slice(0, Math.min(maxNodes, nodes.length));
  const selectedIds = new Set(selectedNodes.map((node) => node.id));
  const selectedLinks = pruneLinks(
    links.filter(
      (link) => selectedIds.has(link.source) && selectedIds.has(link.target)
    ),
    maxEdgesPerNode
  ).filter(
    (link) => selectedIds.has(link.source) && selectedIds.has(link.target)
  );
  const connectedIds = new Set<string>();

  for (const link of selectedLinks) {
    connectedIds.add(link.source);
    connectedIds.add(link.target);
  }

  const hydratedNodes = selectedNodes.map((node) => {
    const degree = selectedLinks.reduce((sum, link) => {
      return sum + (link.source === node.id || link.target === node.id ? 1 : 0);
    }, 0);
    const bridgeScore = selectedLinks.reduce((sum, link) => {
      if (link.source !== node.id && link.target !== node.id) {
        return sum;
      }

      const otherId = link.source === node.id ? link.target : link.source;
      const other = nodeMap.get(otherId);
      return sum + link.strength + (other && other.category !== node.category ? 1 : 0);
    }, 0);

    return {
      ...node,
      degree,
      bridgeScore,
    };
  });

  return {
    nodes: rankNodes(hydratedNodes),
    links: selectedLinks.sort((a, b) => b.strength - a.strength || a.source.localeCompare(b.source)),
  };
}

export function summarizeThinkerInsights(graph: ThinkerGraph): ThinkerInsights {
  const rankedSubjects = new Map<string, number>();
  const categoryMap = new Map<string, { thinkers: number; works: number }>();

  for (const node of graph.nodes) {
    for (const subject of node.allSubjects) {
      rankedSubjects.set(subject.name, (rankedSubjects.get(subject.name) ?? 0) + 1);
    }

    const current = categoryMap.get(node.category) ?? { thinkers: 0, works: 0 };
    categoryMap.set(node.category, {
      thinkers: current.thinkers + 1,
      works: current.works + node.workCount,
    });
  }

  const connectedThinkers = graph.nodes.filter((node) => node.degree > 0).length;
  const bridgeThinkers = [...graph.nodes]
    .sort((a, b) => b.bridgeScore - a.bridgeScore || b.degree - a.degree || a.name.localeCompare(b.name))
    .slice(0, 10)
    .map((node) => ({
      id: node.id,
      name: node.name,
      category: node.category,
      bridgeScore: node.bridgeScore,
      connections: node.degree,
    }));

  return {
    totalThinkers: graph.nodes.length,
    totalCategories: new Set(graph.nodes.map((node) => node.category)).size,
    connectedThinkers,
    strongestBridgeThinker: bridgeThinkers[0]
      ? {
          id: bridgeThinkers[0].id,
          name: bridgeThinkers[0].name,
          category: bridgeThinkers[0].category,
          bridgeScore: bridgeThinkers[0].bridgeScore,
        }
      : undefined,
    rankedSubjects: [...rankedSubjects.entries()]
      .map(([name, thinkerCount]) => ({ name, thinkerCount }))
      .sort((a, b) => b.thinkerCount - a.thinkerCount || a.name.localeCompare(b.name))
      .slice(0, 10),
    bridgeThinkers,
    categorySummaries: [...categoryMap.entries()]
      .map(([category, summary]) => ({
        category,
        thinkers: summary.thinkers,
        averageWorks: Math.round(summary.works / summary.thinkers),
      }))
      .sort((a, b) => b.thinkers - a.thinkers || b.averageWorks - a.averageWorks || a.category.localeCompare(b.category)),
  };
}

export function summarizeGraphClusters(
  graph: ThinkerGraph,
  lens: ThinkerClusterLens
): ThinkerGraphCluster[] {
  const clusterMap = new Map<
    string,
    {
      label: string;
      nodes: ThinkerGraphNode[];
      subjects: Map<string, number>;
    }
  >();

  for (const node of graph.nodes) {
    const keys =
      lens === "categories"
        ? [node.category]
        : node.topSubjects.length > 0
          ? [node.topSubjects[0]]
          : ["Unclassified"];

    for (const key of keys) {
      const current = clusterMap.get(key) ?? {
        label: key,
        nodes: [],
        subjects: new Map<string, number>(),
      };
      current.nodes.push(node);
      for (const subject of node.topSubjects) {
        current.subjects.set(subject, (current.subjects.get(subject) ?? 0) + 1);
      }
      clusterMap.set(key, current);
    }
  }

  return [...clusterMap.entries()]
    .map(([key, cluster]) => ({
      id: `${lens}::${key}`,
      label: cluster.label,
      lens,
      nodeCount: cluster.nodes.length,
      averageWorks: Math.round(
        cluster.nodes.reduce((sum, node) => sum + node.workCount, 0) / Math.max(cluster.nodes.length, 1)
      ),
      topThinkers: [...cluster.nodes]
        .sort((a, b) => b.bridgeScore - a.bridgeScore || b.workCount - a.workCount || a.name.localeCompare(b.name))
        .slice(0, 3)
        .map((node) => node.name),
      subjects: [...cluster.subjects.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 3)
        .map(([subject]) => subject),
    }))
    .sort((a, b) => b.nodeCount - a.nodeCount || b.averageWorks - a.averageWorks || a.label.localeCompare(b.label));
}
