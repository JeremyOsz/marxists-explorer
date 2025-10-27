"use client";

import { useState, useEffect } from "react";
import { ThinkerSearch } from "@/components/thinker-search";
import { Thinker } from "@/lib/types";
import { loadAllThinkers } from "@/lib/data/thinker-loader";

export function DynamicThinkerSearch() {
  const [thinkers, setThinkers] = useState<Thinker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await loadAllThinkers();
        setThinkers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading thinkers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Error loading data: {error}</p>
        <p className="text-sm text-muted-foreground">
          Falling back to static data. Please refresh the page.
        </p>
      </div>
    );
  }

  return <ThinkerSearch thinkers={thinkers} />;
}
