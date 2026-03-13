import { Thinker } from "@/lib/types/thinker";
import { ThinkerCard } from "./ThinkerCard";
import { FeaturedThinkerCard } from "./FeaturedThinkerCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ThinkerListProps {
  filteredThinkers: Thinker[];
  exactMatches: Thinker[];
  groupedThinkers: Record<string, Thinker[]>;
  handleSelectThinker: (thinker: Thinker | null) => void;
  /** When set, show this thinker in a featured block above the grid and omit from the first occurrence in the grid */
  featuredThinker?: Thinker | null;
}

function sameThinker(a: Thinker, b: Thinker) {
  return a.name === b.name && a.category === b.category;
}

export function ThinkerList({
  filteredThinkers,
  exactMatches,
  groupedThinkers,
  handleSelectThinker,
  featuredThinker,
}: ThinkerListProps) {
  const exactForGrid = featuredThinker
    ? exactMatches.filter((t) => !sameThinker(t, featuredThinker))
    : exactMatches;
  const groupedForGrid = featuredThinker
    ? Object.fromEntries(
        Object.entries(groupedThinkers).map(([cat, list]) => [
          cat,
          list.filter((t) => !sameThinker(t, featuredThinker)),
        ])
      )
    : groupedThinkers;
  const hasGrouped = Object.keys(groupedForGrid).length > 0;
  const hasExact = exactForGrid.length > 0;

  return (
    <div className="space-y-8">
      {filteredThinkers.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground">
          <p className="font-medium">No thinkers found</p>
          <p className="mt-1 text-sm">Try adjusting your search or category filter.</p>
        </div>
      ) : (
        <>
          {/* Featured thinker (when browsing without search) */}
          {featuredThinker && (
            <section aria-label="Featured thinker">
              <FeaturedThinkerCard thinker={featuredThinker} onSelect={handleSelectThinker} />
            </section>
          )}

          {/* Primary Matches Section (when search is active) */}
          {hasExact && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold">Primary Matches</h3>
                <span className="text-sm font-normal text-muted-foreground">({exactForGrid.length})</span>
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {exactForGrid.map((thinker) => (
                  <ThinkerCard
                    key={`${thinker.category}-${thinker.name}`}
                    thinker={thinker}
                    onClick={handleSelectThinker}
                    isPrimaryMatch={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Results by Category */}
          {hasGrouped && (
            <Accordion type="multiple" className="space-y-4" defaultValue={Object.keys(groupedForGrid)}>
              {Object.entries(groupedForGrid).map(([category, categoryThinkers]) => {
                if (categoryThinkers.length === 0) return null;
                return (
                  <AccordionItem key={category} value={category} className="border rounded-xl px-4 bg-card/50">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="text-lg font-semibold">{category}</span>
                        <span className="text-sm font-normal text-muted-foreground">({categoryThinkers.length})</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {categoryThinkers.map((thinker) => (
                          <ThinkerCard
                            key={`${thinker.category}-${thinker.name}`}
                            thinker={thinker}
                            onClick={handleSelectThinker}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </>
      )}
    </div>
  );
}
