import { Thinker } from "@/lib/types/thinker";

interface ThinkerCardProps {
  thinker: Thinker;
  onClick: (thinker: Thinker) => void;
  isPrimaryMatch?: boolean;
}

export function ThinkerCard({ thinker, onClick, isPrimaryMatch = false }: ThinkerCardProps) {
  return (
    <div
      key={thinker.name}
      onClick={() => onClick(thinker)}
      className={`p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group ${
        isPrimaryMatch ? "bg-primary/5 border-primary/20" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Portrait */}
        {(thinker.thumbnailUrl || thinker.imageUrl) && !(thinker.thumbnailUrl || thinker.imageUrl)?.match(/\.(pdf|djvu)$/i) && (
          <div className="w-14 h-14 rounded-full overflow-hidden border flex-shrink-0">
            <img
              src={thinker.thumbnailUrl || thinker.imageUrl}
              alt={thinker.name}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
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
              {thinker.workCount ?? thinker.works.length} works
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-primary hover:underline">
              View details →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
