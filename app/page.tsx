import { ThinkerSearch } from "@/components/thinker-search";
import { Thinker } from "@/lib/types/thinker";
import { loadAllThinkersMetadata } from "@/lib/data/folder-loader";
import { Suspense } from "react";

export default async function Home() {
  // Load metadata without works for faster initial page load
  const thinkers: Thinker[] = await loadAllThinkersMetadata();

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Marxists Explorer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover and explore the works of Marxist thinkers from around the world. 
            Search through biographies, major works, and access original texts from Marxists.org.
          </p>
        </div>
        
        <Suspense fallback={<div>Loading search...</div>}>
          <ThinkerSearch thinkers={thinkers} />
        </Suspense>
        
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Data sourced from{" "}
            <a 
              href="https://www.marxists.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Marxists.org
            </a>
            {" "}— The Marxists Internet Archive
          </p>
        </div>
      </main>
    </div>
  );
}