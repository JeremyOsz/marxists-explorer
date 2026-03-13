import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";

export type SortOption = "name" | "works";

interface ThinkerSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryList: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  filteredThinkerCount: number;
  totalThinkerCount: number;
  sortBy?: SortOption;
  onSortChange?: (sort: SortOption) => void;
  onClearFilters?: () => void;
}

const DynamicClientCommandInputWrapper = dynamic(
  () => import("./ClientCommandInputWrapper").then((mod) => mod.ClientCommandInputWrapper),
  { ssr: false }
);

export function ThinkerSearchBar({
  searchQuery,
  setSearchQuery,
  categoryList,
  selectedCategory,
  setSelectedCategory,
  filteredThinkerCount,
  totalThinkerCount,
  sortBy = "name",
  onSortChange,
  onClearFilters,
}: ThinkerSearchBarProps) {
  const hasActiveFilters = searchQuery.trim() !== "" || selectedCategory !== "all";

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
        <DynamicClientCommandInputWrapper
          placeholder="Search by name, category, or description..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          commandClassName="h-full w-full flex-col overflow-hidden rounded-md"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {categoryList.map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className="cursor-pointer px-3 py-1 transition-colors"
            onClick={() => setSelectedCategory(category)}
          >
            {category === "all" ? "All Categories" : category}
          </Badge>
        ))}
        {onSortChange && (
          <div className="ml-2 flex items-center gap-2 border-l border-border pl-2">
            <span className="text-xs text-muted-foreground font-medium">Sort:</span>
            <select
              aria-label="Sort thinkers"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="name">Name A–Z</option>
              <option value="works">Most works</option>
            </select>
          </div>
        )}
        {hasActiveFilters && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="ml-auto text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing <strong className="text-foreground font-medium">{filteredThinkerCount.toLocaleString()}</strong> of {totalThinkerCount.toLocaleString()} thinkers
        </span>
      </div>
    </div>
  );
}
