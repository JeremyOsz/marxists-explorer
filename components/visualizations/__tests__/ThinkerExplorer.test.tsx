import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Thinker } from "@/lib/types/thinker";
import { ThinkerExplorer } from "@/components/visualizations/ThinkerExplorer";

jest.mock("@/components/visualizations/OverviewNetworkGraph", () => ({
  OverviewNetworkGraph: ({
    overview,
    onSelect,
  }: {
    overview: {
      categories: Array<{ label: string }>;
      subjects: Array<{ label: string }>;
    };
    onSelect: (selection: { type: "category" | "subject"; label: string }) => void;
  }) => (
    <div data-testid="overview-network">
      <div data-testid="overview-category-count">{overview.categories.length}</div>
      <div data-testid="overview-subject-count">{overview.subjects.length}</div>
      <button onClick={() => onSelect({ type: "category", label: "First International" })}>
        Pick First International
      </button>
      <button onClick={() => onSelect({ type: "subject", label: "Economics" })}>Pick Economics</button>
    </div>
  ),
}));

jest.mock("@/components/visualizations/CategoryThinkerGraph", () => ({
  CategoryThinkerGraph: ({
    category,
    thinkers,
    selectedThinkerId,
    alternativeCategories,
    onSelectThinker,
    onBackToOverview,
    onSelectCategory,
  }: {
    category: string;
    thinkers: Array<{ name: string }>;
    selectedThinkerId: string | null;
    alternativeCategories: string[];
    onSelectThinker: (id: string) => void;
    onBackToOverview: () => void;
    onSelectCategory: (category: string) => void;
  }) => (
    <div data-testid="category-thinker-graph">
      <div data-testid="category-thinker-title">{category}</div>
      <div data-testid="category-thinker-count">{thinkers.length}</div>
      <div data-testid="category-thinker-selected">{selectedThinkerId ?? "none"}</div>
      <div data-testid="category-thinker-alternatives">{alternativeCategories.join(",")}</div>
      <button onClick={onBackToOverview}>Back To Overview In Graph</button>
      <button onClick={() => onSelectCategory("Bolsheviks")}>Switch To Bolsheviks</button>
      <button onClick={() => onSelectThinker("First International::Karl Marx")}>
        Select Karl Marx In Graph
      </button>
    </div>
  ),
}));

jest.mock("@/components/visualizations/WorkCountDistributionChart", () => ({
  WorkCountDistributionChart: ({ data }: { data: Array<{ label: string; value: number }> }) => (
    <div data-testid="distribution-chart">{data.length}</div>
  ),
}));

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
      { name: "Economics", count: 30 },
      { name: "Philosophy", count: 20 },
    ],
  },
  {
    name: "Friedrich Engels",
    category: "First International",
    description: "Co-author of communist theory",
    bioUrl: "https://example.com/engels",
    imageUrl: "https://example.com/engels.jpg",
    works: [],
    workCount: 100,
    subjects: [
      { name: "Economics", count: 15 },
      { name: "History", count: 12 },
    ],
  },
  {
    name: "Vladimir Lenin",
    category: "Bolsheviks",
    description: "Revolutionary strategist",
    bioUrl: "https://example.com/lenin",
    imageUrl: "https://example.com/lenin.jpg",
    works: [],
    workCount: 90,
    subjects: [
      { name: "Political Theory", count: 25 },
      { name: "Economics", count: 10 },
    ],
  },
];

describe("ThinkerExplorer", () => {
  it("renders an empty state safely when there is no data", () => {
    render(<ThinkerExplorer thinkers={[]} />);

    expect(screen.getByText("No graph data available for this view.")).toBeInTheDocument();
  });

  it("renders the overview network counts", () => {
    render(<ThinkerExplorer thinkers={thinkers} />);

    expect(screen.getByTestId("overview-category-count")).toHaveTextContent("2");
    expect(screen.getByTestId("overview-subject-count")).toHaveTextContent("4");
  });

  it("shows selection detail when a category is chosen", async () => {
    render(<ThinkerExplorer thinkers={thinkers} />);

    fireEvent.click(screen.getByRole("button", { name: "Pick First International" }));

    await waitFor(() => {
      expect(screen.getByText("Selection Detail")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 3, name: "First International" })).toBeInTheDocument();
      expect(screen.getByText("Strongest subjects in this selection")).toBeInTheDocument();
      expect(screen.getByText("Choose a thinker from the drill-down graph")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Friedrich Engels/i })).toBeInTheDocument();
    });
  });

  it("lets search results drill into a thinker", async () => {
    render(<ThinkerExplorer thinkers={thinkers} />);

    fireEvent.click(screen.getByRole("button", { name: "Pick Economics" }));
    fireEvent.change(screen.getByLabelText("Search thinkers"), {
      target: { value: "Lenin" },
    });

    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: /Vladimir Lenin/i }));
      expect(screen.getByText("Selected Thinker")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 3, name: "Vladimir Lenin" })).toBeInTheDocument();
    });
  });

  it("renders a category-to-thinkers drill-down graph when a category is selected", async () => {
    render(<ThinkerExplorer thinkers={thinkers} />);

    fireEvent.click(screen.getByRole("button", { name: "Pick First International" }));

    await waitFor(() => {
      expect(screen.queryByTestId("overview-network")).toBeNull();
      expect(screen.getByTestId("category-thinker-graph")).toBeInTheDocument();
      expect(screen.getByTestId("category-thinker-title")).toHaveTextContent("First International");
      expect(screen.getByTestId("category-thinker-count")).toHaveTextContent("2");
      expect(screen.getByTestId("category-thinker-alternatives")).toHaveTextContent("Bolsheviks");
    });
  });

  it("lets the category drill-down graph set the selected thinker", async () => {
    render(<ThinkerExplorer thinkers={thinkers} />);

    fireEvent.click(screen.getByRole("button", { name: "Pick First International" }));

    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: "Select Karl Marx In Graph" }));
      expect(screen.getByText("Selected Thinker")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 3, name: "Karl Marx" })).toBeInTheDocument();
      expect(screen.getByText("Closest thinkers in this category view")).toBeInTheDocument();
      expect(screen.getByText(/Shared ground:/i)).toBeInTheDocument();
    });
  });

  it("lets the user return to the overview after drilling into a category", async () => {
    render(<ThinkerExplorer thinkers={thinkers} />);

    fireEvent.click(screen.getByRole("button", { name: "Pick First International" }));

    await waitFor(() => {
      expect(screen.getByTestId("category-thinker-graph")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Back to overview" }));

    await waitFor(() => {
      expect(screen.getByTestId("overview-network")).toBeInTheDocument();
      expect(screen.queryByTestId("category-thinker-graph")).toBeNull();
    });
  });

  it("lets the user switch to a ghost category without returning to overview", async () => {
    render(<ThinkerExplorer thinkers={thinkers} />);

    fireEvent.click(screen.getByRole("button", { name: "Pick First International" }));

    await waitFor(() => {
      expect(screen.getByTestId("category-thinker-title")).toHaveTextContent("First International");
    });

    fireEvent.click(screen.getByRole("button", { name: "Switch To Bolsheviks" }));

    await waitFor(() => {
      expect(screen.getByTestId("category-thinker-title")).toHaveTextContent("Bolsheviks");
      expect(screen.getByText("Selection Detail")).toBeInTheDocument();
    });
  });
});
