"use client";

import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Thinker } from "@/lib/types";

interface ThinkerSearchProps {
  thinkers: Thinker[];
}

export function ThinkerSearch({ thinkers }: ThinkerSearchProps) {
  const [open, setOpen] = useState(false);
  const [selectedThinker, setSelectedThinker] = useState<Thinker | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const filteredThinkers = thinkers.filter(thinker =>
    thinker.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    thinker.category.toLowerCase().includes(searchValue.toLowerCase()) ||
    thinker.description.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Command className="rounded-lg border shadow-md">
        <CommandInput
          placeholder="Search Marxist thinkers..."
          value={searchValue}
          onValueChange={setSearchValue}
          onFocus={() => setOpen(true)}
        />
        {open && (
          <CommandList className="max-h-64">
            <CommandEmpty>No thinkers found.</CommandEmpty>
            {Object.entries(
              filteredThinkers.reduce((acc, thinker) => {
                if (!acc[thinker.category]) {
                  acc[thinker.category] = [];
                }
                acc[thinker.category].push(thinker);
                return acc;
              }, {} as Record<string, Thinker[]>)
            ).map(([category, categoryThinkers]) => (
              <CommandGroup key={category} heading={category}>
                {categoryThinkers.map((thinker) => (
                  <Accordion key={thinker.name} type="single" collapsible className="w-full">
                    <AccordionItem value={`${category}-${thinker.name}`} className="border-none">
                      <div className="flex items-center gap-2 w-full">
                        {/* Portrait thumbnail */}
                        {thinker.imageUrl && (
                          <div className="w-12 h-12 rounded-full overflow-hidden border flex-shrink-0">
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
                        <CommandItem
                          value={thinker.name}
                          onSelect={() => {
                            setSelectedThinker(thinker);
                            setOpen(false);
                            setSearchValue(thinker.name);
                          }}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{thinker.name}</span>
                            <span className="text-sm text-muted-foreground">{thinker.description}</span>
                          </div>
                        </CommandItem>
                        <AccordionTrigger className="p-2 hover:bg-transparent" onClick={(e) => e.stopPropagation()}>
                          <span className="text-xs text-muted-foreground">{thinker.works.length} works</span>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent className="pb-2 pt-0">
                        <div className="pl-6 space-y-1">
                          {thinker.works.slice(0, 3).map((work, index) => (
                            <a
                              key={index}
                              href={`https://www.marxists.org${work.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm py-1 text-muted-foreground hover:text-primary transition-colors"
                            >
                              {work.title}
                            </a>
                          ))}
                          {thinker.works.length > 3 && (
                            <button
                              onClick={() => {
                                setSelectedThinker(thinker);
                                setOpen(false);
                                setSearchValue(thinker.name);
                              }}
                              className="text-xs text-primary hover:underline"
                            >
                              +{thinker.works.length - 3} more works
                            </button>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        )}
      </Command>

      <Dialog open={!!selectedThinker} onOpenChange={() => setSelectedThinker(null)} > 
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto" style={{ maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto" }}>
          <DialogHeader className="border-b pb-4 mb-6">
            <DialogTitle className="text-3xl font-bold">{selectedThinker?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedThinker && (
            <div className="space-y-6">
              {/* Two-column layout for bio info */}
              <div className="grid grid-cols-1  gap-6">
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
