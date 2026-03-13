"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Thinker } from "@/lib/types/thinker";
import { ThinkerSearchBar, type SortOption } from "./thinker-search-ui/ThinkerSearchBar";
import { ThinkerList } from "./thinker-search-ui/ThinkerList";
import { ThinkerDetailDialog } from "./thinker-search-ui/ThinkerDetailDialog";

interface ThinkerSearchProps {
  thinkers: Thinker[];
}

function sortThinkers(list: Thinker[], sortBy: SortOption): Thinker[] {
  const sorted = [...list];
  if (sortBy === "works") {
    sorted.sort((a, b) => (b.workCount ?? b.works?.length ?? 0) - (a.workCount ?? a.works?.length ?? 0));
  } else {
    sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }
  return sorted;
}

/** Canonical featured thinker name per category (key = category normalized to lowercase). "all" = when All Categories selected. Names must match manifest "n" exactly. */
const FEATURED_THINKER_BY_CATEGORY: Record<string, string> = {
  all: "Karl Marx",
  "first-international": "Karl Marx",
  "first international": "Karl Marx",
  bolsheviks: "Vladimir Lenin",
  "soviet-marxism": "Vladimir Lenin",
  "soviet marxism": "Vladimir Lenin",
  "soviet-science": "Vladimir Lenin",
  anarchists: "Petr Kropotkin",
  "paris commune": "Louise Michel",
  "paris-commune": "Louise Michel",
  comintern: "Josef Stalin",
  maoists: "Mao Zedong",
  "national-liberation": "Ho Chi Minh",
  "national liberation": "Ho Chi Minh",
  "social-democracy": "Rosa Luxemburg",
  "social democracy": "Rosa Luxemburg",
  "marxist-humanism": "Raya Dunayevskaya",
  "marxist humanism": "Raya Dunayevskaya",
  trotskyists: "Leon Trotsky",
  feminists: "Alexandra Kollontai",
};

function normalizeCategoryForFeatured(category: string): string {
  return category.toLowerCase().trim();
}

export function ThinkerSearch({ thinkers }: ThinkerSearchProps) {
  const [selectedThinker, setSelectedThinker] = useState<Thinker | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [mounted, setMounted] = useState(false);
  const [selectedThinkerNameForRouter, setSelectedThinkerNameForRouter] = useState<string | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const router = typeof window !== 'undefined' ? useRouter() : null;
  const searchParams = typeof window !== 'undefined' ? useSearchParams() : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && searchParams) {
      // Ensure searchParams is not null before using it
      const thinkerNameFromUrl = searchParams.get("thinker");
      if (thinkerNameFromUrl && !selectedThinker) {
        const thinkerFromUrl = thinkers.find(
          (t) => t.name === thinkerNameFromUrl
        );
        if (thinkerFromUrl) {
          setSelectedThinker(thinkerFromUrl);
        }
      }
    }
  }, [searchParams, thinkers, selectedThinker, mounted]);

  const handleSelectThinker = (thinker: Thinker | null) => {
    setSelectedThinker(thinker);
    setSelectedThinkerNameForRouter(thinker ? thinker.name : null);
  };

  useEffect(() => {
    if (router && selectedThinkerNameForRouter !== null) {
      router.push(`?thinker=${encodeURIComponent(selectedThinkerNameForRouter)}`);
    } else if (router && selectedThinkerNameForRouter === null) {
      router.push("/");
    }
  }, [selectedThinkerNameForRouter, router]);

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      handleSelectThinker(null);
    }
  };

  const categoryList = useMemo(() => {
    const cats = Array.from(new Set(thinkers.map((t) => t.category))) as string[];
    const sortedCategories = cats.sort((a, b) => a.localeCompare(b));
    return ['all', ...sortedCategories];
  }, [thinkers]);

  const filteredThinkers = useMemo(() => {
    let filtered = thinkers;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (thinker) => thinker.category === selectedCategory
      );
    }

    if (deferredSearchQuery.trim()) {
      const query = deferredSearchQuery.toLowerCase();
      
      const scoredThinkers = filtered.map((thinker) => {
        const name = thinker.name.toLowerCase();
        const category = thinker.category.toLowerCase();
        const searchText = thinker.searchText ?? `${name} ${category} ${thinker.description.toLowerCase()}`;
        
        let score = 0;
        let hasMatch = false;
        
        if (name === query) {
          score = 1000;
          hasMatch = true;
        } else if (name.startsWith(query)) {
          score = 800;
          hasMatch = true;
        } else if (name.includes(query)) {
          score = 600;
          hasMatch = true;
        } else if (category.includes(query)) {
          score = 400;
          hasMatch = true;
        } else if (searchText.includes(query)) {
          score = 200;
          hasMatch = true;
        }
        
        return { thinker, score, hasMatch };
      });
      
      filtered = scoredThinkers
        .filter((item) => item.hasMatch)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.thinker);
    }

    return sortThinkers(filtered, sortBy);
  }, [deferredSearchQuery, selectedCategory, thinkers, sortBy]);

  const getLastName = (name: string): string => {
    const cleanName = name.replace(/\([^)]*\)/g, '').trim();
    const parts = cleanName.split(/\s+/);
    return parts[parts.length - 1] || name;
  };

  const { exactMatches, otherResults } = useMemo(() => {
    if (!deferredSearchQuery.trim()) {
      return { exactMatches: [], otherResults: filteredThinkers };
    }

    const query = deferredSearchQuery.toLowerCase();
    const exactMatches = filteredThinkers.filter((thinker) => {
      const name = thinker.name.toLowerCase();
      return name === query || name.startsWith(query + ' ') || name.endsWith(' ' + query);
    });
    const otherResults = filteredThinkers.filter((thinker) => {
      const name = thinker.name.toLowerCase();
      return name !== query && !name.startsWith(query + ' ') && !name.endsWith(' ' + query);
    });

    return { exactMatches, otherResults };
  }, [deferredSearchQuery, filteredThinkers]);

  const groupedThinkers = useMemo(() => {
    const grouped = otherResults.reduce((acc, thinker) => {
      if (!acc[thinker.category]) {
        acc[thinker.category] = [];
      }
      acc[thinker.category].push(thinker);
      return acc;
    }, {} as Record<string, Thinker[]>);

    Object.keys(grouped).forEach((category) => {
      grouped[category] = sortThinkers(grouped[category], sortBy);
    });

    const sortedEntries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(sortedEntries);
  }, [deferredSearchQuery, otherResults, sortBy]);

  const featuredThinker = useMemo(() => {
    if (deferredSearchQuery.trim() || filteredThinkers.length === 0) return null;
    const key = selectedCategory === "all" ? "all" : normalizeCategoryForFeatured(selectedCategory);
    const preferredName = FEATURED_THINKER_BY_CATEGORY[key];
    if (preferredName) {
      const inFiltered = filteredThinkers.find((t) => t.name === preferredName);
      if (inFiltered) return inFiltered;
      // e.g. Trotsky is in Bolsheviks but we want him when Trotskyists is selected
      const inAll = thinkers.find((t) => t.name === preferredName);
      if (inAll) return inAll;
    }
    return filteredThinkers[0];
  }, [deferredSearchQuery, selectedCategory, filteredThinkers, thinkers]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  return (
    <div className="w-full space-y-4">
      <ThinkerSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryList={categoryList}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        filteredThinkerCount={filteredThinkers.length}
        totalThinkerCount={thinkers.length}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onClearFilters={handleClearFilters}
      />

      <ThinkerList
        filteredThinkers={filteredThinkers}
        exactMatches={exactMatches}
        groupedThinkers={groupedThinkers}
        handleSelectThinker={handleSelectThinker}
        featuredThinker={featuredThinker}
      />

      <ThinkerDetailDialog
        selectedThinker={selectedThinker}
        onOpenChange={handleDialogChange}
      />
    </div>
  );
}
