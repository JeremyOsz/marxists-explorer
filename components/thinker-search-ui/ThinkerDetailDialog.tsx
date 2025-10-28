import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Thinker } from "@/lib/types";
import { ThinkerWorksList } from "./ThinkerWorksList";
import { MarxWorksBySection } from "./MarxWorksBySection";

interface ThinkerDetailDialogProps {
  selectedThinker: Thinker | null;
  onOpenChange: (open: boolean) => void; // Reverted to (open: boolean) => void
  selectedThinkerWorks: Thinker["works"];
  loadingWorks: boolean;
}

export function ThinkerDetailDialog({
  selectedThinker,
  onOpenChange,
  selectedThinkerWorks,
  loadingWorks,
}: ThinkerDetailDialogProps) {
  return (
    <Dialog open={!!selectedThinker} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[90vw] max-h-[90vh] overflow-y-auto"
        style={{
          maxWidth: "90vw",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <DialogHeader className="border-b pb-4 mb-6">
          <DialogTitle className="text-3xl font-bold">
            {selectedThinker?.name}
          </DialogTitle>
        </DialogHeader>

        {selectedThinker && (
          <div className="space-y-6">
            {/* About the Thinker section (always full width) */}
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
                  {selectedThinker.imageUrl &&
                    !selectedThinker.imageUrl.match(/\.(pdf|djvu)$/i) && (
                      <div className="aspect-square overflow-hidden rounded-lg border">
                        <img
                          src={selectedThinker.imageUrl}
                          alt={selectedThinker.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.src = `https://via.placeholder.com/300/cccccc/666666?text=${encodeURIComponent(
                              selectedThinker.name
                            )}`;
                          }}
                        />
                      </div>
                    )}
                </div>
                {/* Description */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedThinker.description}
                    </p>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-start gap-3 text-sm">
                      <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <div>
                        <span className="text-muted-foreground">Category: </span>
                        <span className="font-medium">
                          {selectedThinker.category}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <a
                        href={selectedThinker.bioUrl}
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
            </div>

            {/* Works sections (two-column layout on md screens when both sections exist) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className={`${
                  selectedThinker.name !== "Karl Marx" 
                    ? "md:col-span-2"
                    : ""
                }`}
              >
                <ThinkerWorksList
                  works={selectedThinkerWorks}
                  loading={loadingWorks}
                />
              </div>

              {selectedThinker.name === "Karl Marx" && (
                <MarxWorksBySection thinkerName={selectedThinker.name} />
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
