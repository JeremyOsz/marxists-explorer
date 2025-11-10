import { WorkCountBarChart } from "@/components/visualizations/WorkCountBarChart";
import { WorkCountDistributionChart } from "@/components/visualizations/WorkCountDistributionChart";
import { loadAllThinkersMetadata } from "@/lib/data/folder-loader";

export const dynamic = "force-dynamic";

type WorkCountBucket = {
  rangeLabel: string;
  thinkers: number;
};

function buildBuckets(counts: number[]): WorkCountBucket[] {
  if (!counts.length) {
    return [];
  }

  const max = Math.max(...counts);
  const step = Math.max(5, Math.ceil(max / 10));
  const buckets: WorkCountBucket[] = [];

  for (let start = 0; start <= max; start += step) {
    const end = start + step - 1;
    const label = end >= max ? `${start}+` : `${start}-${end}`;
    const thinkers = counts.filter(
      (count) => (count >= start && count <= end) || (end >= max && count >= start)
    ).length;
    buckets.push({ rangeLabel: label, thinkers });
  }

  return buckets;
}

export default async function VisualizationsPage() {
  const thinkers = await loadAllThinkersMetadata();
  const sorted = thinkers
    .filter((thinker) => typeof thinker.workCount === "number")
    .sort((a, b) => (b.workCount ?? 0) - (a.workCount ?? 0));

  const topThinkers = sorted.slice(0, 50);
  const buckets = buildBuckets(sorted.map((thinker) => thinker.workCount ?? 0));
  const totalThinkers = sorted.length;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-10 space-y-12">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Catalogue Visualisations</h1>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Explore the distribution of works across the Marxists Explorer catalogue.
            This first view highlights which thinkers have the largest collections
            and how the broader catalogue spreads across work counts.
          </p>
        </header>

        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Top 50 Thinkers by Work Count</h2>
            <p className="text-sm text-muted-foreground">
              Horizontal bars scale with D3 relative to the thinker with the most indexed works.
            </p>
          </div>
          <WorkCountBarChart
            data={topThinkers.map((thinker) => ({
              name: thinker.name,
              value: thinker.workCount ?? 0,
              category: thinker.category,
            }))}
            className="rounded-lg border bg-card px-4 py-6 shadow-sm"
          />
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Catalogue Spread</h2>
            <p className="text-sm text-muted-foreground">
              Number of thinkers grouped by their work counts (total analysed: {totalThinkers}).
            </p>
          </div>
          <WorkCountDistributionChart
            data={buckets.map((bucket) => ({
              label: bucket.rangeLabel,
              value: bucket.thinkers,
            }))}
            className="rounded-lg border bg-card px-4 py-6 shadow-sm"
          />
        </section>
      </main>
    </div>
  );
}


