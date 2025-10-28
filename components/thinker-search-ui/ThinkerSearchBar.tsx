import dynamic from 'next/dynamic';
import { Badge } from "@/components/ui/badge";

interface ThinkerSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryList: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  filteredThinkerCount: number;
  totalThinkerCount: number;
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
}: ThinkerSearchBarProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border shadow-md">
        <DynamicClientCommandInputWrapper
          placeholder="Search by name, category, or description..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          // Pass the className to the CommandPrimitive wrapper for styling
          commandClassName="h-full w-full flex-col overflow-hidden rounded-md"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {categoryList.map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
            onClick={() => setSelectedCategory(category)}
          >
            {category === "all" ? "All Categories" : category}
          </Badge>
        ))}
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredThinkerCount} of {totalThinkerCount} thinkers
      </div>
    </div>
  );
}
