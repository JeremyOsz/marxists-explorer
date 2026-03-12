import { ThinkerExplorer } from "@/components/visualizations/ThinkerExplorer";
import { loadAllThinkersMetadata } from "@/lib/data/folder-loader";

export default async function VisualizationsPage() {
  const thinkers = await loadAllThinkersMetadata();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(248,250,252,1),rgba(239,246,255,0.75)_28%,rgba(255,255,255,1))]">
      <main className="container mx-auto space-y-10 px-4 py-10">
        <header className="rounded-[2rem] border border-border/70 bg-background/80 p-8 shadow-sm backdrop-blur">
          <div className="max-w-4xl space-y-4">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Catalogue Connections
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Catalogue Connections
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
              Examine how thinkers align across schools, subjects, and corpus scale. The network
              foregrounds bridges between traditions, while the supporting panels expose topic
              trends and dense ideological clusters.
            </p>
          </div>
        </header>

        <ThinkerExplorer thinkers={thinkers} />
      </main>
    </div>
  );
}
