import type { Thinker } from "@/lib/types/thinker";
import { buildThinkerSubjectNetwork } from "@/lib/visualizations/thinker-subject";

const thinkers: Thinker[] = [
  {
    name: "Karl Marx",
    category: "First International",
    description: "Political economist",
    bioUrl: "https://example.com/marx",
    imageUrl: "https://example.com/marx.jpg",
    works: [],
    workCount: 120,
    subjects: [
      { name: "General", count: 90 },
      { name: "Economics", count: 30 },
      { name: "Philosophy", count: 12 },
    ],
  },
  {
    name: "Friedrich Engels",
    category: "First International",
    description: "Co-author of communist theory",
    bioUrl: "https://example.com/engels",
    imageUrl: "https://example.com/engels.jpg",
    works: [],
    workCount: 90,
    subjects: [
      { name: "Economics", count: 15 },
      { name: "History", count: 11 },
    ],
  },
  {
    name: "Eleanor Marx",
    category: "First International",
    description: "Socialist activist",
    bioUrl: "https://example.com/eleanor",
    imageUrl: "https://example.com/eleanor.jpg",
    works: [],
    workCount: 40,
    subjects: [
      { name: "Letters", count: 14 },
      { name: "Political Theory", count: 6 },
    ],
  },
];

describe("thinker subject network", () => {
  it("builds a thinker to subject graph for a narrowed category selection", () => {
    const graph = buildThinkerSubjectNetwork(thinkers, {
      maxThinkers: 3,
      maxSubjects: 5,
    });

    expect(graph.thinkers.map((node) => node.label)).toEqual([
      "Karl Marx",
      "Friedrich Engels",
      "Eleanor Marx",
    ]);
    expect(graph.subjects.map((node) => node.label)).toEqual(
      expect.arrayContaining(["Economics", "History", "Letters", "Political Theory"])
    );
    expect(
      graph.edges.find(
        (edge) =>
          edge.source === "thinker::First International::Karl Marx" &&
          edge.target === "subject::Economics"
      )
    ).toBeTruthy();
    expect(graph.edges.every((edge) => !edge.target.endsWith("General"))).toBe(true);
  });
});
