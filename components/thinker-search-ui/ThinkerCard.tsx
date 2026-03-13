import { Thinker } from "@/lib/types/thinker";

interface ThinkerCardProps {
  thinker: Thinker;
  onClick: (thinker: Thinker) => void;
  isPrimaryMatch?: boolean;
}

const MAX_NAME_LENGTH = 36;
const MAX_DESC_LENGTH = 80;

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1).trim() + "…";
}

export function ThinkerCard({ thinker, onClick, isPrimaryMatch = false }: ThinkerCardProps) {
  const workCount = thinker.workCount ?? thinker.works?.length ?? 0;
  const subjectPills = (thinker.subjects ?? [])
    .filter((s) => s.name !== "General")
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((s) => s.name);

  return (
    <div
      role="button"
      tabIndex={0}
      key={thinker.name}
      onClick={() => onClick(thinker)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(thinker);
        }
      }}
      title={thinker.name}
      className={`rounded-xl border bg-card p-4 cursor-pointer transition-all duration-200 min-h-[120px] flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:border-primary/30 hover:shadow-md group ${
        isPrimaryMatch ? "bg-primary/5 border-primary/30" : "hover:bg-muted/30"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Portrait */}
        {(thinker.thumbnailUrl || thinker.imageUrl) && !(thinker.thumbnailUrl || thinker.imageUrl)?.match(/\.(pdf|djvu)$/i) && (
          <div className="w-14 h-14 rounded-full overflow-hidden border border-border flex-shrink-0 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
            <img
              src={thinker.thumbnailUrl || thinker.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors truncate" title={thinker.name}>
            {truncate(thinker.name, MAX_NAME_LENGTH)}
          </h4>
          <p className="text-xs text-muted-foreground font-medium mb-1" title={thinker.category}>
            {thinker.category}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2" title={thinker.description}>
            {truncate(thinker.description, MAX_DESC_LENGTH)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {subjectPills.length > 0 && (
          <div className="flex flex-wrap gap-1" aria-label="Top subjects">
            {subjectPills.map((name) => (
              <span
                key={name}
                className="inline-block max-w-[100px] truncate rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                title={name}
              >
                {name}
              </span>
            ))}
          </div>
        )}
        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
          {workCount} works
        </span>
      </div>
    </div>
  );
}
