import { useState } from "react";
import { Work } from "@/lib/types";

interface ThinkerWorksListProps {
  works: Work[];
  loading: boolean;
}

export function ThinkerWorksList({ works, loading }: ThinkerWorksListProps) {
  const [majorWorksSearchQuery, setMajorWorksSearchQuery] = useState("");

  const filteredMajorWorks = works.filter((work) =>
    work.title.toLowerCase().includes(majorWorksSearchQuery.toLowerCase())
  );

  return (
    <div className="bg-card border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        Major Works
      </h3>
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Filter major works..."
          value={majorWorksSearchQuery}
          onChange={(e) => setMajorWorksSearchQuery(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading works...</p>
            </div>
          </div>
        ) : filteredMajorWorks.length > 0 ? (
          filteredMajorWorks.map((work, index) => (
            <a
              key={index}
              href={work.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {work.title}
                  </span>
                  <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                {work.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {work.description}
                  </p>
                )}
              </div>
            </a>
          ))
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">No major works found matching your filter.</p>
        )}
      </div>
    </div>
  );
}
