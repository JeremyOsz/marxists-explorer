"use client";

import { useState, useMemo } from "react";
import { Command, CommandEmpty, CommandInput, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Thinker } from "@/lib/types";
import { Badge } from "./ui/badge";
import { categories } from "@/lib/data/categories";

interface ThinkerSearchProps {
  thinkers: Thinker[];
}

export function ThinkerSearch({ thinkers }: ThinkerSearchProps) {
  const [selectedThinker, setSelectedThinker] = useState<Thinker | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Get unique categories sorted alphabetically
  const categoryList = useMemo(() => {
    const cats = Array.from(new Set(thinkers.map(t => t.category))) as string[];
    const sortedCategories = cats.sort((a, b) => a.localeCompare(b));
    return ['all', ...sortedCategories];
  }, [thinkers]);

  // Filter and score thinkers based on search and category
  const filteredThinkers = useMemo(() => {
    let filtered = thinkers;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(thinker => thinker.category === selectedCategory);
    }

    // Filter and score by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      
      // Create a scoring system to prioritize matches
      const scoredThinkers = filtered.map(thinker => {
        const name = thinker.name.toLowerCase();
        const category = thinker.category.toLowerCase();
        const description = thinker.description.toLowerCase();
        
        let score = 0;
        let hasMatch = false;
        
        // Exact name match (highest priority)
        if (name === query) {
          score = 1000;
          hasMatch = true;
        }
        // Name starts with query
        else if (name.startsWith(query)) {
          score = 800;
          hasMatch = true;
        }
        // Name contains query
        else if (name.includes(query)) {
          score = 600;
          hasMatch = true;
        }
        // Category match
        else if (category.includes(query)) {
          score = 400;
          hasMatch = true;
        }
        // Description match (lowest priority)
        else if (description.includes(query)) {
          score = 200;
          hasMatch = true;
        }
        
        return { thinker, score, hasMatch };
      });
      
      // Filter only thinkers that have matches and sort by score
      filtered = scoredThinkers
        .filter(item => item.hasMatch)
        .sort((a, b) => b.score - a.score)
        .map(item => item.thinker);
    }

    return filtered;
  }, [thinkers, searchQuery, selectedCategory]);

  // Helper function to get last name for sorting (ignores parenthetical names)
  const getLastName = (name: string): string => {
    // Remove content in parentheses for sorting purposes
    const cleanName = name.replace(/\([^)]*\)/g, '').trim();
    const parts = cleanName.split(/\s+/);
    return parts[parts.length - 1] || name;
  };

  // Separate exact/primary name matches from other results
  const { exactMatches, otherResults } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { exactMatches: [], otherResults: filteredThinkers };
    }

    const query = searchQuery.toLowerCase();
    const exactMatches = filteredThinkers.filter(thinker => {
      const name = thinker.name.toLowerCase();
      // Include exact matches and name starts with query (e.g., "Marx" matches "Karl Marx")
      return name === query || name.startsWith(query + ' ') || name.endsWith(' ' + query);
    });
    const otherResults = filteredThinkers.filter(thinker => {
      const name = thinker.name.toLowerCase();
      return name !== query && !name.startsWith(query + ' ') && !name.endsWith(' ' + query);
    });

    return { exactMatches, otherResults };
  }, [filteredThinkers, searchQuery]);

  // Group other results by category
  const groupedThinkers = useMemo(() => {
    const grouped = otherResults.reduce((acc, thinker) => {
      if (!acc[thinker.category]) {
        acc[thinker.category] = [];
      }
      acc[thinker.category].push(thinker);
      return acc;
    }, {} as Record<string, Thinker[]>);
    
    // Sort each category: if there's a search query, maintain search score order;
    // otherwise sort by last name
    Object.keys(grouped).forEach(category => {
      if (searchQuery.trim()) {
        // Keep the search score order (already sorted by score in filteredThinkers)
        // No additional sorting needed
      } else {
        // Sort by last name when no search query
        grouped[category].sort((a, b) => 
          getLastName(a.name).localeCompare(getLastName(b.name))
        );
      }
    });
    
    // Sort categories alphabetically
    const sortedEntries = Object.entries(grouped).sort(([a], [b]) => 
      a.localeCompare(b)
    );
    
    // Convert back to object
    return Object.fromEntries(sortedEntries);
  }, [otherResults, searchQuery]);

  return (
    <div className="w-full space-y-4">
      {/* Search and Filter Controls */}
      <div className="space-y-3">
        <Command className="rounded-lg border shadow-md">
          <CommandInput
            placeholder="Search by name, category, or description..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
        </Command>

        {/* Category Filter */}
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

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredThinkers.length} of {thinkers.length} thinkers
        </div>
      </div>

      {/* Thinker List */}
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
                    <div
                      key={thinker.name}
                      onClick={() => setSelectedThinker(thinker)}
                      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group bg-primary/5 border-primary/20"
                    >
                      <div className="flex items-start gap-3">
                        {/* Portrait */}
                        {thinker.imageUrl && (
                          <div className="w-14 h-14 rounded-full overflow-hidden border flex-shrink-0">
                            <img
                              src={thinker.imageUrl}
                              alt={thinker.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                            {thinker.name}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {thinker.description}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {thinker.works.length} works
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-xs text-primary hover:underline">
                              View details →
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
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
                          <div
                            key={thinker.name}
                            onClick={() => setSelectedThinker(thinker)}
                            className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-start gap-3">
                              {/* Portrait */}
                              {thinker.imageUrl && (
                                <div className="w-14 h-14 rounded-full overflow-hidden border flex-shrink-0">
                                  <img
                                    src={thinker.imageUrl}
                                    alt={thinker.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                                  {thinker.name}
                                </h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {thinker.description}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {thinker.works.length} works
                                  </span>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-xs text-primary hover:underline">
                                    View details →
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedThinker} onOpenChange={() => setSelectedThinker(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto" style={{ maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto" }}>
          <DialogHeader className="border-b pb-4 mb-6">
            <DialogTitle className="text-3xl font-bold">{selectedThinker?.name}</DialogTitle>
          </DialogHeader>

          {selectedThinker && (
            <div className="space-y-6">
              {/* Two-column layout for bio info */}
              <div className="grid grid-cols-1 gap-6">
                {/* Left section - Thinker Info Card with Image */}
                <div className="md:col-span-2">
                  <div className="bg-card border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      About the Thinker
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Image */}
                      <div className="md:col-span-1">
                        {selectedThinker.imageUrl && (
                          <div className="aspect-square overflow-hidden rounded-lg border">
                            <img
                              src={selectedThinker.imageUrl}
                              alt={selectedThinker.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = `https://via.placeholder.com/300/cccccc/666666?text=${encodeURIComponent(selectedThinker.name)}`;
                              }}
                            />
                          </div>
                        )}
                      </div>
                      {/* Description */}
                      <div className="md:col-span-2 space-y-4">
                        <div>
                          <p className="text-muted-foreground leading-relaxed">{selectedThinker.description}</p>
                        </div>
                        <div className="pt-4 border-t">
                          <div className="flex items-start gap-3 text-sm">
                            <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <div>
                              <span className="text-muted-foreground">Category: </span>
                              <span className="font-medium">{selectedThinker.category}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right section - Works Card */}
                <div className="bg-card border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Major Works
                  </h3>
                  <div className="space-y-3">
                    {selectedThinker.works.map((work, index) => (
                      <a
                        key={index}
                        href={`https://www.marxists.org${work.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium group-hover:text-primary transition-colors">
                            {work.title}
                          </span>
                          <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </a>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <a
                      href={`https://www.marxists.org${selectedThinker.bioUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-2"
                    >
                      View full biography →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
