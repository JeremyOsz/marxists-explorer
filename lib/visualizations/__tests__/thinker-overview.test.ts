import type { Thinker } from "@/lib/types/thinker";
import {
  buildThinkerOverviewNetwork,
  getThinkersForOverviewSelection,
} from "@/lib/visualizations/thinker-overview";

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
      { name: "General", count: 50 },
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
    name: "Vladimir Lenin",
    category: "Bolsheviks",
    description: "Revolutionary strategist",
    bioUrl: "https://example.com/lenin",
    imageUrl: "https://example.com/lenin.jpg",
    works: [],
    workCount: 100,
    subjects: [
      { name: "Political Theory", count: 20 },
      { name: "Economics", count: 8 },
    ],
  },
];

describe("thinker overview network", () => {
  it("builds a category-subject overview from the strongest subject signals", () => {
    const overview = buildThinkerOverviewNetwork(thinkers, {
      maxCategories: 4,
      maxSubjects: 4,
    });

    expect(overview.categories.map((node) => node.label)).toEqual(
      expect.arrayContaining(["First International", "Bolsheviks"])
    );
    expect(overview.subjects.map((node) => node.label)).toEqual(
      expect.arrayContaining(["Economics", "Political Theory"])
    );
    expect(
      overview.edges.find(
        (edge) =>
          edge.source === "category::First International" &&
          edge.target === "subject::Economics" &&
          edge.weight === 2
      )
    ).toBeTruthy();
  });

  it("filters thinkers from a selected category or subject", () => {
    expect(
      getThinkersForOverviewSelection(thinkers, { type: "category", label: "First International" }).map(
        (thinker) => thinker.name
      )
    ).toEqual(["Karl Marx", "Friedrich Engels"]);

    expect(
      getThinkersForOverviewSelection(thinkers, { type: "subject", label: "Political Theory" }).map(
        (thinker) => thinker.name
      )
    ).toEqual(["Vladimir Lenin"]);
  });
});
