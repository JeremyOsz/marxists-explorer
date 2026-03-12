import {
  buildThinkerGraph,
  summarizeGraphClusters,
  summarizeThinkerInsights,
} from "@/lib/visualizations/thinker-graph";
import type { Thinker } from "@/lib/types/thinker";

const thinkers: Thinker[] = [
  {
    name: "Alpha",
    category: "Group A",
    description: "Alpha thinker",
    bioUrl: "https://example.com/alpha",
    imageUrl: "https://example.com/alpha.jpg",
    works: [],
    workCount: 100,
    subjects: [
      { name: "General", count: 40 },
      { name: "Economics", count: 20 },
      { name: "Philosophy", count: 10 },
    ],
  },
  {
    name: "Beta",
    category: "Group B",
    description: "Beta thinker",
    bioUrl: "https://example.com/beta",
    imageUrl: "https://example.com/beta.jpg",
    works: [],
    workCount: 80,
    subjects: [
      { name: "General", count: 50 },
      { name: "Economics", count: 30 },
      { name: "History", count: 10 },
    ],
  },
  {
    name: "Gamma",
    category: "Group A",
    description: "Gamma thinker",
    bioUrl: "https://example.com/gamma",
    imageUrl: "https://example.com/gamma.jpg",
    works: [],
    workCount: 55,
    subjects: [{ name: "General", count: 60 }],
  },
  {
    name: "Delta",
    category: "Group C",
    description: "Delta thinker",
    bioUrl: "https://example.com/delta",
    imageUrl: "https://example.com/delta.jpg",
    works: [],
    workCount: 52,
    subjects: [
      { name: "Economics", count: 12 },
      { name: "History", count: 12 },
      { name: "Philosophy", count: 12 },
    ],
  },
];

describe("thinker graph builder", () => {
  it("does not create thematic links from General alone", () => {
    const graph = buildThinkerGraph(thinkers, {
      mode: "subjects",
      maxNodes: 10,
      minLinkStrength: 4,
    });

    expect(
      graph.links.find(
        (link) =>
          (link.source === "Group A::Alpha" && link.target === "Group A::Gamma") ||
          (link.source === "Group A::Gamma" && link.target === "Group A::Alpha")
      )
    ).toBeUndefined();
  });

  it("prefers subject-driven links over category-only links", () => {
    const graph = buildThinkerGraph(thinkers, {
      mode: "hybrid",
      maxNodes: 10,
      minLinkStrength: 4,
    });

    const alphaBeta = graph.links.find(
      (link) =>
        (link.source === "Group A::Alpha" && link.target === "Group B::Beta") ||
        (link.source === "Group B::Beta" && link.target === "Group A::Alpha")
    );
    const alphaGamma = graph.links.find(
      (link) =>
        (link.source === "Group A::Alpha" && link.target === "Group A::Gamma") ||
        (link.source === "Group A::Gamma" && link.target === "Group A::Alpha")
    );

    expect(alphaBeta?.primaryType).toBe("subject");
    expect(alphaBeta?.strength).toBeGreaterThan(alphaGamma?.strength ?? 0);
  });

  it("drops weak pairs below the threshold", () => {
    const graph = buildThinkerGraph(thinkers, {
      mode: "hybrid",
      maxNodes: 10,
      minLinkStrength: 4,
    });

    expect(
      graph.links.find(
        (link) =>
          (link.source === "Group A::Gamma" && link.target === "Group C::Delta") ||
          (link.source === "Group C::Delta" && link.target === "Group A::Gamma")
      )
    ).toBeUndefined();
  });

  it("ranks bridge thinkers ahead of isolated category peers", () => {
    const graph = buildThinkerGraph(thinkers, {
      mode: "hybrid",
      maxNodes: 10,
      minLinkStrength: 4,
    });
    const insights = summarizeThinkerInsights(graph);

    expect(insights.bridgeThinkers[0]?.name).toBe("Delta");
  });

  it("trims nodes deterministically using bridge score then metadata depth", () => {
    const graph = buildThinkerGraph(thinkers, {
      mode: "hybrid",
      maxNodes: 2,
      minLinkStrength: 4,
    });

    expect(graph.nodes.map((node) => node.name)).toEqual(["Delta", "Alpha"]);
  });

  it("prunes the graph to strongest local edges instead of keeping a clique", () => {
    const graph = buildThinkerGraph(thinkers, {
      mode: "hybrid",
      maxNodes: 10,
      minLinkStrength: 4,
      maxEdgesPerNode: 1,
    });

    expect(graph.links.length).toBeLessThan(4);
    expect(Math.max(...graph.nodes.map((node) => node.degree))).toBeLessThanOrEqual(2);
  });

  it("keeps category mode connected with a lower effective threshold", () => {
    const graph = buildThinkerGraph(thinkers, {
      mode: "categories",
      maxNodes: 10,
      minLinkStrength: 4,
    });

    expect(graph.links.length).toBeGreaterThan(0);
    expect(graph.links.every((link) => link.primaryType === "category")).toBe(true);
  });

  it("aggregates zoomed-out cluster summaries by category and subject", () => {
    const graph = buildThinkerGraph(thinkers, {
      mode: "hybrid",
      maxNodes: 10,
      minLinkStrength: 4,
    });

    const categoryClusters = summarizeGraphClusters(graph, "categories");
    const subjectClusters = summarizeGraphClusters(graph, "subjects");

    expect(categoryClusters[0]?.label).toBe("Group A");
    expect(categoryClusters[0]?.nodeCount).toBeGreaterThanOrEqual(1);
    expect(subjectClusters.some((cluster) => cluster.label === "Economics")).toBe(true);
  });
});
