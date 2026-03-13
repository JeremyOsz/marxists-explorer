import { Thinker } from "@/lib/types/thinker";

interface FeaturedThinkerCardProps {
  thinker: Thinker;
  onSelect: (thinker: Thinker) => void;
}

export function FeaturedThinkerCard({ thinker, onSelect }: FeaturedThinkerCardProps) {
  const workCount = thinker.workCount ?? thinker.works?.length ?? 0;
  const topSubjects = (thinker.subjects ?? [])
    .filter((s) => s.name !== "General")
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return (
    <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted/20 overflow-hidden shadow-lg">
      <div className="flex flex-col sm:flex-row">
        {(thinker.thumbnailUrl || thinker.imageUrl) && !(thinker.thumbnailUrl || thinker.imageUrl)?.match(/\.(pdf|djvu)$/i) && (
          <div className="sm:w-56 sm:min-h-[240px] w-full aspect-[4/3] sm:aspect-auto overflow-hidden bg-muted">
            <img
              src={thinker.thumbnailUrl || thinker.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}
        <div className="flex-1 p-6 flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            {thinker.category}
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            {thinker.name}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4">
            {thinker.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              <strong className="text-foreground">{workCount.toLocaleString()}</strong> works
            </span>
            {topSubjects.length > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground" title={topSubjects.map((s) => s.name).join(", ")}>
                  {topSubjects.map((s) => s.name).join(", ")}
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => onSelect(thinker)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            View details
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
