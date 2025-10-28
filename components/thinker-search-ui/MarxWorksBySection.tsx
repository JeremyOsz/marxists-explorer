import { useState } from "react";
import { Work } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import marxWorksBySubject from "@/data/marx-works-by-subject.json";

interface MarxWorksBySectionProps {
  thinkerName: string;
}

export function MarxWorksBySection({ thinkerName }: MarxWorksBySectionProps) {
  const [worksBySectionSearchQuery, setWorksBySectionSearchQuery] = useState("");
  const [marxWorksBySubjectData, setMarxWorksBySubjectData] = useState<Record<string, Work[]>>({});

  // This useEffect will load and process the Marx works data once
  // when the component mounts or if thinkerName changes to "Karl Marx"
  useState(() => {
    if (thinkerName === "Karl Marx") {
      const groupedWorks: Record<string, Work[]> = {};
      marxWorksBySubject.forEach(work => {
        if (work.subject) {
          if (!groupedWorks[work.subject]) {
            groupedWorks[work.subject] = [];
          }
          groupedWorks[work.subject].push(work);
        }
      });
      setMarxWorksBySubjectData(groupedWorks);
    } else {
      setMarxWorksBySubjectData({}); // Clear for other thinkers
    }
  }, [thinkerName]);

  if (thinkerName !== "Karl Marx" || Object.keys(marxWorksBySubjectData).length === 0) {
    return null;
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        Works by Section
      </h3>
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Filter works by section..."
          value={worksBySectionSearchQuery}
          onChange={(e) => setWorksBySectionSearchQuery(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <Accordion type="multiple" className="w-full" defaultValue={Object.keys(marxWorksBySubjectData).slice(0, 3)}>
        {Object.entries(marxWorksBySubjectData).map(([subject, works]) => {
          const filteredSubjectWorks = works.filter(work => 
            work.title.toLowerCase().includes(worksBySectionSearchQuery.toLowerCase())
          );  
          if (filteredSubjectWorks.length === 0) return null; // Don't render empty subjects

          return (
            <AccordionItem value={subject} key={subject}>
              <AccordionTrigger className="text-base">
                {subject} ({filteredSubjectWorks.length})
              </AccordionTrigger>
              <AccordionContent className="space-y-2">
                {filteredSubjectWorks.length > 0 ? (
                  filteredSubjectWorks.map((work, index) => (
                    <a
                      key={index}
                      href={work.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 rounded-lg border hover:bg-muted/50 transition-colors group text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium group-hover:text-primary transition-colors">
                          {work.title}
                        </span>
                        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No works found in this section matching your filter.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
