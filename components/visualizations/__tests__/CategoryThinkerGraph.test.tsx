import { fireEvent, render, screen } from "@testing-library/react";
import type { Thinker } from "@/lib/types/thinker";
import { CategoryThinkerGraph } from "@/components/visualizations/CategoryThinkerGraph";

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
      { name: "General", count: 100 },
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
      { name: "History", count: 18 },
      { name: "Criticism", count: 12 },
    ],
  },
];

describe("CategoryThinkerGraph", () => {
  it("shows a three-stage category to thinkers to subjects drill-down", () => {
    render(
      <CategoryThinkerGraph
        category="First International"
        thinkers={thinkers}
        selectedThinkerId={null}
        alternativeCategories={["Bolsheviks", "Social Democracy"]}
        onSelectThinker={() => undefined}
        onBackToOverview={() => undefined}
        onSelectCategory={() => undefined}
      />
    );

    expect(screen.getByRole("img", { name: "Category to thinkers to subjects graph" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to overview" })).toBeInTheDocument();
    expect(screen.getByText("Previewing: Karl Marx")).toBeInTheDocument();
    expect(screen.getByText("Subjects")).toBeInTheDocument();
    expect(screen.getByText("Economics")).toBeInTheDocument();
    expect(screen.getByText("Philosophy")).toBeInTheDocument();
    expect(screen.getByText("Bolsheviks")).toBeInTheDocument();
    expect(screen.queryByText("General")).toBeNull();
  });

  it("updates the active branch when a thinker is selected", () => {
    const handleSelect = jest.fn();
    const { rerender } = render(
      <CategoryThinkerGraph
        category="First International"
        thinkers={thinkers}
        selectedThinkerId={null}
        alternativeCategories={[]}
        onSelectThinker={handleSelect}
        onBackToOverview={() => undefined}
        onSelectCategory={() => undefined}
      />
    );

    fireEvent.click(screen.getByText("Friedrich Engels"));
    expect(handleSelect).toHaveBeenCalledWith("First International::Friedrich Engels");

    rerender(
      <CategoryThinkerGraph
        category="First International"
        thinkers={thinkers}
        selectedThinkerId="First International::Friedrich Engels"
        alternativeCategories={[]}
        onSelectThinker={handleSelect}
        onBackToOverview={() => undefined}
        onSelectCategory={() => undefined}
      />
    );

    expect(screen.getByText("Selected thinker: Friedrich Engels")).toBeInTheDocument();
    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText("Criticism")).toBeInTheDocument();
  });

  it("calls the back handler from the drill-down header", () => {
    const handleBack = jest.fn();

    render(
      <CategoryThinkerGraph
        category="First International"
        thinkers={thinkers}
        selectedThinkerId={null}
        alternativeCategories={[]}
        onSelectThinker={() => undefined}
        onBackToOverview={handleBack}
        onSelectCategory={() => undefined}
      />
    );

    fireEvent.mouseEnter(screen.getByTestId("selected-category-node"));
    fireEvent.click(screen.getByTestId("category-clear-selection"));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it("switches to an alternative ghost category", () => {
    const handleSelectCategory = jest.fn();

    render(
      <CategoryThinkerGraph
        category="First International"
        thinkers={thinkers}
        selectedThinkerId={null}
        alternativeCategories={["Bolsheviks"]}
        onSelectThinker={() => undefined}
        onBackToOverview={() => undefined}
        onSelectCategory={handleSelectCategory}
      />
    );

    fireEvent.click(screen.getByText("Bolsheviks"));
    expect(handleSelectCategory).toHaveBeenCalledWith("Bolsheviks");
  });
});
