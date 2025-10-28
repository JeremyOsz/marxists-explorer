import { Thinker } from "@/lib/types";
import { ThinkerCard } from "./ThinkerCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ThinkerListProps {
  filteredThinkers: Thinker[];
  exactMatches: Thinker[];
  groupedThinkers: Record<string, Thinker[]>;
  handleSelectThinker: (thinker: Thinker | null) => void;
}

export function ThinkerList({
  filteredThinkers,
  exactMatches,
  groupedThinkers,
  handleSelectThinker,
}: ThinkerListProps) {
  return (
    <div className="space-y-4">
      {filteredThinkers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No thinkers found. Try adjusting your search or category filter.
        </div>
      ) : (
        <>
          {/* Primary Matches Section */}
          {exactMatches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold">Primary Matches</h3>
                <span className="text-sm font-normal text-muted-foreground">
                  ({exactMatches.length})
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {exactMatches.map((thinker) => (
                  <ThinkerCard
                    key={thinker.name}
                    thinker={thinker}
                    onClick={handleSelectThinker}
                    isPrimaryMatch={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Results by Category */}
          {Object.keys(groupedThinkers).length > 0 && (
            <Accordion type="multiple" className="space-y-4" defaultValue={Object.keys(groupedThinkers)}>
              {Object.entries(groupedThinkers).map(([category, categoryThinkers]) => (
                <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="text-lg font-semibold">{category}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        ({categoryThinkers.length})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {categoryThinkers.map((thinker) => (
                        <ThinkerCard
                          key={thinker.name}
                          thinker={thinker}
                          onClick={handleSelectThinker}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </>
      )}
    </div>
  );
}
