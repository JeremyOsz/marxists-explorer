import { render, screen } from "@testing-library/react";
import type { Thinker } from "@/lib/types/thinker";

const mockThinkers: Thinker[] = [
  {
    name: "Karl Marx",
    category: "First International",
    description: "Political economist",
    bioUrl: "https://example.com/marx",
    imageUrl: "https://example.com/marx.jpg",
    works: [],
    workCount: 120,
    subjects: [{ name: "Economics", count: 30 }],
  },
];

jest.mock("@/lib/data/folder-loader", () => ({
  loadAllThinkersMetadata: jest.fn(async () => mockThinkers),
}));

jest.mock("@/components/visualizations/ThinkerExplorer", () => ({
  ThinkerExplorer: ({ thinkers }: { thinkers: Thinker[] }) => (
    <div data-testid="thinker-explorer">{thinkers.length}</div>
  ),
}));

describe("/visualizations page", () => {
  it("renders the exploration page with server-loaded thinker data", async () => {
    const pageModule = await import("@/app/visualizations/page");
    const Page = pageModule.default;
    const ui = await Page();

    render(ui);

    expect(screen.getByRole("heading", { name: "Catalogue Connections" })).toBeInTheDocument();
    expect(screen.getByTestId("thinker-explorer")).toHaveTextContent("1");
  });
});
