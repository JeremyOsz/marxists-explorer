"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Thinker, Work } from "@/lib/types";
import { loadThinkerWorks } from "@/lib/data/folder-loader";
import { ThinkerSearchBar } from "./thinker-search-ui/ThinkerSearchBar";
import { ThinkerList } from "./thinker-search-ui/ThinkerList";
import { ThinkerDetailDialog } from "./thinker-search-ui/ThinkerDetailDialog";

interface ThinkerSearchProps {
  thinkers: Thinker[];
}

export function ThinkerSearch({ thinkers }: ThinkerSearchProps) {
  const [selectedThinker, setSelectedThinker] = useState<Thinker | null>(null);
  const [selectedThinkerWorks, setSelectedThinkerWorks] = useState<Work[]>([]);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [mounted, setMounted] = useState(false);
  const [selectedThinkerNameForRouter, setSelectedThinkerNameForRouter] = useState<string | null>(null);

  const router = typeof window !== 'undefined' ? useRouter() : null;
  const searchParams = typeof window !== 'undefined' ? useSearchParams() : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedThinker) {
      setLoadingWorks(true);
      loadThinkerWorks(selectedThinker.category, selectedThinker.name).then((works) => {
        setSelectedThinkerWorks(works);
        setLoadingWorks(false);
      });
    }
  }, [selectedThinker]);

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

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      
      const scoredThinkers = filtered.map((thinker) => {
        const name = thinker.name.toLowerCase();
        const category = thinker.category.toLowerCase();
        const description = thinker.description.toLowerCase();
        
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
        } else if (description.includes(query)) {
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

    return filtered;
  }, [thinkers, searchQuery, selectedCategory]);

  const getLastName = (name: string): string => {
    const cleanName = name.replace(/\([^)]*\)/g, '').trim();
    const parts = cleanName.split(/\s+/);
    return parts[parts.length - 1] || name;
  };

  const { exactMatches, otherResults } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { exactMatches: [], otherResults: filteredThinkers };
    }

    const query = searchQuery.toLowerCase();
    const exactMatches = filteredThinkers.filter((thinker) => {
      const name = thinker.name.toLowerCase();
      return name === query || name.startsWith(query + ' ') || name.endsWith(' ' + query);
    });
    const otherResults = filteredThinkers.filter((thinker) => {
      const name = thinker.name.toLowerCase();
      return name !== query && !name.startsWith(query + ' ') && !name.endsWith(' ' + query);
    });

    return { exactMatches, otherResults };
  }, [filteredThinkers, searchQuery]);

  const groupedThinkers = useMemo(() => {
    const grouped = otherResults.reduce((acc, thinker) => {
      if (!acc[thinker.category]) {
        acc[thinker.category] = [];
      }
      acc[thinker.category].push(thinker);
      return acc;
    }, {} as Record<string, Thinker[]>);
    
    Object.keys(grouped).forEach((category) => {
      if (searchQuery.trim()) {
      } else {
        grouped[category].sort((a, b) => 
          getLastName(a.name).localeCompare(getLastName(b.name))
        );
      }
    });
    
    const sortedEntries = Object.entries(grouped).sort(([a], [b]) => 
      a.localeCompare(b)
    );
    
    return Object.fromEntries(sortedEntries);
  }, [otherResults, searchQuery]);

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
      />

      <ThinkerList
        filteredThinkers={filteredThinkers}
        exactMatches={exactMatches}
        groupedThinkers={groupedThinkers}
        handleSelectThinker={handleSelectThinker}
      />

      <ThinkerDetailDialog
        selectedThinker={selectedThinker}
        onOpenChange={handleDialogChange}
        selectedThinkerWorks={selectedThinkerWorks}
        loadingWorks={loadingWorks}
      />
    </div>
  );
}
