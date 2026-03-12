"use client";

import { useMemo, useState } from "react";
import type { Thinker } from "@/lib/types/thinker";
import { CategoryThinkerGraph } from "@/components/visualizations/CategoryThinkerGraph";
import { WorkCountDistributionChart } from "@/components/visualizations/WorkCountDistributionChart";
import { OverviewNetworkGraph } from "@/components/visualizations/OverviewNetworkGraph";
import {
  buildThinkerOverviewNetwork,
  getThinkersForOverviewSelection,
  type OverviewSelection,
} from "@/lib/visualizations/thinker-overview";
import { buildWorkCountBuckets } from "@/lib/visualizations/work-count-buckets";

type ThinkerExplorerProps = {
  thinkers: Thinker[];
};

type SubjectSummaryRow = {
  name: string;
  thinkerCount: number;
  totalCount: number;
};

type RelatedThinkerRow = {
  id: string;
  name: string;
  workCount: number;
  sharedSubjects: string[];
  score: number;
};

function meaningfulSubjects(thinker: Thinker) {
  return [...(thinker.subjects ?? [])]
    .filter((subject) => subject.name !== "General")
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function buildSelectionSubjectSummary(thinkers: Thinker[]): SubjectSummaryRow[] {
  const subjectMap = new Map<string, SubjectSummaryRow>();

  for (const thinker of thinkers) {
    for (const subject of meaningfulSubjects(thinker)) {
      const existing = subjectMap.get(subject.name);

      if (existing) {
        existing.thinkerCount += 1;
        existing.totalCount += subject.count;
      } else {
        subjectMap.set(subject.name, {
          name: subject.name,
          thinkerCount: 1,
          totalCount: subject.count,
        });
      }
    }
  }

  return [...subjectMap.values()]
    .sort(
      (a, b) =>
        b.thinkerCount - a.thinkerCount ||
        b.totalCount - a.totalCount ||
        a.name.localeCompare(b.name)
    )
    .slice(0, 6);
}

function buildRelatedThinkers(selectedThinker: Thinker, thinkers: Thinker[]): RelatedThinkerRow[] {
  const selectedMap = new Map(
    meaningfulSubjects(selectedThinker).map((subject) => [subject.name, subject.count])
  );

  return thinkers
    .filter(
      (thinker) =>
        !(thinker.name === selectedThinker.name && thinker.category === selectedThinker.category)
    )
    .map((thinker) => {
      const overlaps = meaningfulSubjects(thinker)
        .filter((subject) => selectedMap.has(subject.name))
        .map((subject) => ({
          name: subject.name,
          weight: Math.min(subject.count, selectedMap.get(subject.name) ?? 0),
        }))
        .sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name));

      return {
        id: `${thinker.category}::${thinker.name}`,
        name: thinker.name,
        workCount: thinker.workCount ?? 0,
        sharedSubjects: overlaps.slice(0, 3).map((subject) => subject.name),
        score: overlaps.reduce((sum, overlap) => sum + overlap.weight, 0) + overlaps.length * 8,
      };
    })
    .filter((thinker) => thinker.sharedSubjects.length > 0)
    .sort((a, b) => b.score - a.score || b.workCount - a.workCount || a.name.localeCompare(b.name))
    .slice(0, 5);
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

function SummaryCard({
  label,
  value,
  detail,
  accentClassName = "from-slate-500/30 via-sky-500/25 to-emerald-500/20",
}: {
  label: string;
  value: string;
  detail: string;
  accentClassName?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[1.4rem] border border-border/70 bg-card/90 p-5 shadow-sm">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentClassName}`} />
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-sky-100/35 blur-2xl transition-transform duration-300 group-hover:scale-110" />
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-2 text-sm text-muted-foreground">{detail}</div>
    </div>
  );
}

function PulseCard({
  label,
  value,
  detail,
  percent,
  accentClassName,
}: {
  label: string;
  value: string;
  detail: string;
  percent: number;
  accentClassName: string;
}) {
  const boundedPercent = Math.max(4, Math.min(100, percent));

  return (
    <div className="rounded-[1.4rem] border border-border/70 bg-card/90 p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-4xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{detail}</div>
      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${accentClassName}`}
          style={{ width: `${boundedPercent}%` }}
        />
      </div>
    </div>
  );
}

export function ThinkerExplorer({ thinkers }: ThinkerExplorerProps) {
  const [selection, setSelection] = useState<OverviewSelection | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThinkerId, setSelectedThinkerId] = useState<string | null>(null);

  const overview = useMemo(
    () =>
      buildThinkerOverviewNetwork(thinkers, {
        maxCategories: 12,
        maxSubjects: 6,
      }),
    [thinkers]
  );

  const selectionThinkers = useMemo(
    () => getThinkersForOverviewSelection(thinkers, selection),
    [selection, thinkers]
  );

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }

    const source = selectionThinkers.length > 0 ? selectionThinkers : thinkers;
    return source
      .filter((thinker) =>
        `${thinker.name} ${thinker.category} ${thinker.description}`.toLowerCase().includes(query)
      )
      .sort((a, b) => (b.workCount ?? 0) - (a.workCount ?? 0) || a.name.localeCompare(b.name))
      .slice(0, 8);
  }, [searchQuery, selectionThinkers, thinkers]);

  const selectedThinker = useMemo(() => {
    const pool = selectionThinkers.length > 0 ? selectionThinkers : thinkers;
    return pool.find((thinker) => `${thinker.category}::${thinker.name}` === selectedThinkerId) ?? null;
  }, [selectedThinkerId, selectionThinkers, thinkers]);
  const selectionSubjectSummary = useMemo(
    () => buildSelectionSubjectSummary(selectionThinkers),
    [selectionThinkers]
  );
  const selectedThinkerSubjects = useMemo(
    () => (selectedThinker ? meaningfulSubjects(selectedThinker).slice(0, 6) : []),
    [selectedThinker]
  );
  const relatedThinkers = useMemo(
    () => (selectedThinker ? buildRelatedThinkers(selectedThinker, selectionThinkers) : []),
    [selectedThinker, selectionThinkers]
  );

  if (thinkers.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed p-10 text-center">
        <p className="text-base font-medium">No graph data available for this view.</p>
      </div>
    );
  }

  const totalEdges = overview.edges.length;
  const topSubject = overview.subjects[0];
  const strongestEdge = overview.edges[0];
  const counts = thinkers.map((thinker) => thinker.workCount ?? 0).filter((count) => count > 0);
  const distributionData = buildWorkCountBuckets(counts);
  const totalWorks = counts.reduce((sum, count) => sum + count, 0);
  const medianWorks = Math.round(median(counts));
  const avgWorks = Math.round(totalWorks / Math.max(thinkers.length, 1));
  const thinkersWithSubjects = thinkers.filter((thinker) =>
    meaningfulSubjects(thinker).length > 0
  );
  const subjectCoverage = Math.round((thinkersWithSubjects.length / Math.max(thinkers.length, 1)) * 100);
  const avgSubjectBreadth = Math.round(
    thinkers.reduce((sum, thinker) => sum + meaningfulSubjects(thinker).length, 0) /
      Math.max(thinkers.length, 1)
  );
  const categoryRows = overview.categories
    .map((categoryNode) => ({
      label: categoryNode.label,
      thinkerCount: categoryNode.thinkerCount,
      totalWorks: categoryNode.totalWorks,
      avgWorks: Math.round(categoryNode.totalWorks / Math.max(categoryNode.thinkerCount, 1)),
      share: Math.round((categoryNode.thinkerCount / Math.max(thinkers.length, 1)) * 100),
    }))
    .sort((a, b) => b.thinkerCount - a.thinkerCount || b.totalWorks - a.totalWorks || a.label.localeCompare(b.label));
  const topCategoryRows = categoryRows.slice(0, 5);
  const subjectRows = overview.subjects
    .map((subjectNode) => ({
      label: subjectNode.label,
      thinkerCount: subjectNode.thinkerCount,
      share: Math.round((subjectNode.thinkerCount / Math.max(thinkers.length, 1)) * 100),
    }))
    .sort((a, b) => b.thinkerCount - a.thinkerCount || a.label.localeCompare(b.label))
    .slice(0, 6);
  const concentration = Math.round(
    categoryRows.reduce((sum, row) => sum + (row.thinkerCount / Math.max(thinkers.length, 1)) ** 2, 0) * 100
  );
  const activeSelectionSize = selectionThinkers.length || thinkers.length;
  const bridgeCapacity = Math.max(overview.categories.length * Math.max(overview.subjects.length, 1), 1);
  const bridgeDensity = Math.round((totalEdges / bridgeCapacity) * 100);
  const selectionCoverage = Math.round((activeSelectionSize / Math.max(thinkers.length, 1)) * 100);
  const dominantSubjectCoverage = topSubject
    ? Math.round((topSubject.thinkerCount / Math.max(thinkers.length, 1)) * 100)
    : 0;
  const activeJourney = selectedThinker
    ? `${selectedThinker.category} -> ${selectedThinker.name}`
    : selection
      ? `${selection.type}: ${selection.label}`
      : "overview";

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Thinkers"
          value={thinkers.length.toLocaleString()}
          detail="Indexed thinkers available to the overview."
          accentClassName="from-slate-500/35 via-sky-500/30 to-cyan-500/25"
        />
        <SummaryCard
          label="Currents"
          value={overview.categories.length.toLocaleString()}
          detail="Categories with strong links into the visible subject field."
          accentClassName="from-emerald-500/35 via-teal-500/30 to-sky-500/25"
        />
        <SummaryCard
          label="Top Subject"
          value={topSubject?.label ?? "None"}
          detail={topSubject ? `${topSubject.thinkerCount} thinkers touch this subject.` : "No subject signal available."}
          accentClassName="from-cyan-500/35 via-blue-500/30 to-indigo-500/25"
        />
        <SummaryCard
          label="Strongest Bridge"
          value={
            strongestEdge
              ? `${strongestEdge.source.replace("category::", "")} → ${strongestEdge.target.replace("subject::", "")}`
              : "None"
          }
          detail={strongestEdge ? `${strongestEdge.weight} thinkers on this edge.` : "No overview edges available."}
          accentClassName="from-blue-500/35 via-indigo-500/30 to-emerald-500/25"
        />
      </div>

      <section className="rounded-[1.5rem] border border-border/70 bg-[linear-gradient(140deg,rgba(255,255,255,0.95),rgba(239,246,255,0.84),rgba(240,253,250,0.86))] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Journey Status</div>
            <div className="mt-1 text-base font-semibold tracking-tight">{activeJourney}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {
                selectedThinker
                  ? "Focused on a single thinker. Use ghost categories or the breadcrumb controls to pivot."
                  : selection
                    ? "Selection is scoped. Compare with another category or clear to restore full context."
                    : "Start by picking a current or subject edge to reveal the first drill layer."
              }
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-white/80 px-3 py-2">
              <div className="text-muted-foreground">Selection Coverage</div>
              <div className="mt-1 text-sm font-semibold">{selectionCoverage}%</div>
            </div>
            <div className="rounded-lg border border-border/70 bg-white/80 px-3 py-2">
              <div className="text-muted-foreground">Bridge Density</div>
              <div className="mt-1 text-sm font-semibold">{bridgeDensity}%</div>
            </div>
            <div className="rounded-lg border border-border/70 bg-white/80 px-3 py-2 col-span-2 md:col-span-1">
              <div className="text-muted-foreground">Dominant Subject</div>
              <div className="mt-1 text-sm font-semibold">{dominantSubjectCoverage}%</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.02),rgba(15,118,110,0.08),rgba(29,78,216,0.04))] p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Overview First
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Currents to themes</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              The main network now shows category-to-subject structure. Start with a current or a theme,
              then drill into the relevant thinkers instead of forcing the entire catalogue into one
              thinker-level graph.
            </p>
          </div>
          <div className="w-full max-w-md">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Search thinkers inside the current selection</span>
              <input
                aria-label="Search thinkers"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by thinker name or description"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 outline-none transition focus:border-foreground/40"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.72fr)_minmax(380px,0.82fr)]">
          {selection?.type === "category" ? (
            <CategoryThinkerGraph
              category={selection.label}
              thinkers={selectionThinkers}
              selectedThinkerId={selectedThinkerId}
              alternativeCategories={overview.categories
                .map((categoryNode) => categoryNode.label)
                .filter((categoryLabel) => categoryLabel !== selection.label)}
              onSelectThinker={setSelectedThinkerId}
              onBackToOverview={() => {
                setSelection(null);
                setSelectedThinkerId(null);
              }}
              onSelectCategory={(nextCategory) => {
                setSelection({ type: "category", label: nextCategory });
                setSelectedThinkerId(null);
              }}
            />
          ) : (
            <OverviewNetworkGraph
              overview={overview}
              selection={selection}
              onSelect={(nextSelection) => {
                if (!nextSelection.label) {
                  setSelection(null);
                  setSelectedThinkerId(null);
                  return;
                }
                setSelection(nextSelection);
                setSelectedThinkerId(null);
              }}
            />
          )}

          <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {selectedThinker ? "Selected Thinker" : selection ? "Selection Detail" : "How To Read This"}
                </div>
                {selection ? (
                  <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                    <span>Overview</span>
                    <span>/</span>
                    <span>{selection.label}</span>
                    {selectedThinker ? (
                      <>
                        <span>/</span>
                        <span className="font-medium text-foreground">{selectedThinker.name}</span>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {selection ? (
                <div className="flex flex-wrap gap-2">
                  {selectedThinker ? (
                    <button
                      type="button"
                      onClick={() => setSelectedThinkerId(null)}
                      className="rounded-full border border-border/70 bg-background/80 px-3 py-2 text-xs font-medium transition hover:bg-background"
                    >
                      Back to category
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setSelection(null);
                      setSelectedThinkerId(null);
                    }}
                    className="rounded-full border border-border/70 bg-background/80 px-3 py-2 text-xs font-medium transition hover:bg-background"
                  >
                    Back to overview
                  </button>
                </div>
              ) : null}
            </div>

            {selectedThinker ? (
              <div className="mt-4 space-y-5">
                <div>
                  <h3 className="text-2xl font-semibold">{selectedThinker.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedThinker.category}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{selectedThinker.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Works</div>
                    <div className="mt-1 text-xl font-semibold">
                      {(selectedThinker.workCount ?? 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">In Selection</div>
                    <div className="mt-1 text-xl font-semibold">{selectionThinkers.length || thinkers.length}</div>
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-sm font-medium">Subject profile</div>
                  <div className="space-y-3">
                    {selectedThinkerSubjects.map((subject) => {
                      const width = Math.max(
                        16,
                        (subject.count / Math.max(selectedThinkerSubjects[0]?.count ?? 1, 1)) * 100
                      );

                      return (
                        <div key={subject.name}>
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="font-medium">{subject.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {subject.count.toLocaleString()} texts
                            </span>
                          </div>
                          <div className="mt-1 h-2 rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,#0f766e,#38bdf8)]"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {relatedThinkers.length > 0 ? (
                  <div>
                    <div className="mb-2 text-sm font-medium">Closest thinkers in this category view</div>
                    <div className="space-y-2">
                      {relatedThinkers.map((thinker) => (
                        <button
                          key={thinker.id}
                          type="button"
                          onClick={() => setSelectedThinkerId(thinker.id)}
                          className="w-full rounded-xl border border-border/70 bg-background/70 px-3 py-3 text-left transition hover:bg-background"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium">{thinker.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {thinker.workCount.toLocaleString()} works
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Shared ground: {thinker.sharedSubjects.join(", ")}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {selection?.type === "category" && selectionSubjectSummary.length > 0 ? (
                  <div>
                    <div className="mb-2 text-sm font-medium">Category currents</div>
                    <div className="flex flex-wrap gap-2">
                      {selectionSubjectSummary.slice(0, 5).map((subject) => (
                        <span
                          key={subject.name}
                          className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs"
                        >
                          {subject.name} · {subject.thinkerCount}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : selection ? (
              <div className="mt-4 space-y-5">
                <div>
                  <h3 className="text-2xl font-semibold">{selection.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground capitalize">{selection.type}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {selection.type === "category"
                      ? "Use the graph to move through the current: start at the category, inspect the ranked thinkers, then follow the subject branch of the active thinker."
                      : "This subject stays at overview level. Use the thinker list below to inspect who is carrying it."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Thinkers</div>
                    <div className="mt-1 text-xl font-semibold">{selectionThinkers.length}</div>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Works</div>
                    <div className="mt-1 text-xl font-semibold">
                      {selectionThinkers.reduce((sum, thinker) => sum + (thinker.workCount ?? 0), 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                {selectionSubjectSummary.length > 0 ? (
                  <div>
                    <div className="mb-2 text-sm font-medium">Strongest subjects in this selection</div>
                    <div className="space-y-3">
                      {selectionSubjectSummary.map((subject) => {
                        const width = Math.max(
                          16,
                          (subject.thinkerCount / Math.max(selectionSubjectSummary[0]?.thinkerCount ?? 1, 1)) * 100
                        );

                        return (
                          <div key={subject.name}>
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium">{subject.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {subject.thinkerCount} thinkers
                              </span>
                            </div>
                            <div className="mt-1 h-2 rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-[linear-gradient(90deg,#2563eb,#38bdf8)]"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {searchResults.length > 0 ? (
                  <div>
                    <div className="mb-2 text-sm font-medium">Search matches</div>
                    <div className="space-y-2">
                      {searchResults.map((thinker) => (
                        <button
                          key={`${thinker.category}::${thinker.name}`}
                          type="button"
                          onClick={() => setSelectedThinkerId(`${thinker.category}::${thinker.name}`)}
                          className="w-full rounded-xl border border-border/70 bg-background/70 px-3 py-3 text-left transition hover:bg-background"
                        >
                          <div className="font-medium">{thinker.name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{thinker.category}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-2 text-sm font-medium">
                      {selection.type === "category" ? "Choose a thinker from the drill-down graph" : "Representative thinkers"}
                    </div>
                    <div className="space-y-2">
                      {selectionThinkers
                        .slice()
                        .sort((a, b) => (b.workCount ?? 0) - (a.workCount ?? 0) || a.name.localeCompare(b.name))
                        .slice(0, 8)
                        .map((thinker) => (
                          <button
                            key={`${thinker.category}::${thinker.name}`}
                            type="button"
                            onClick={() => setSelectedThinkerId(`${thinker.category}::${thinker.name}`)}
                            className="w-full rounded-xl border border-border/70 bg-background/70 px-3 py-3 text-left transition hover:bg-background"
                          >
                            <div className="font-medium">{thinker.name}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {(thinker.workCount ?? 0).toLocaleString()} works
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>Start at the network, not the thinker graph.</p>
                <p>Click a category to replace the overview with a category to thinkers to subjects drill-down.</p>
                <p>Use the sidebar to inspect the active category first, then click an individual thinker for details.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <PulseCard
          label="Overview Edges"
          value={totalEdges.toLocaleString()}
          detail="Category-subject bridges visible in the main graph."
          percent={bridgeDensity}
          accentClassName="from-sky-500 to-indigo-500"
        />
        <PulseCard
          label="Dominant Subject"
          value={topSubject?.label ?? "None"}
          detail={topSubject ? `${topSubject.thinkerCount} thinkers` : "No dominant subject available."}
          percent={dominantSubjectCoverage}
          accentClassName="from-teal-500 to-sky-500"
        />
        <PulseCard
          label="Selection Size"
          value={activeSelectionSize.toLocaleString()}
          detail={selection ? "Thinkers in the active category or subject selection." : "No selection yet."}
          percent={selectionCoverage}
          accentClassName="from-indigo-500 to-emerald-500"
        />
      </section>

      <section className="rounded-[1.8rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,250,252,0.94))] p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Catalogue Scale</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Work counts are grouped into broad ranges so the biggest catalogues do not dominate the rest of the corpus.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-white/80 px-3 py-2">
              <div className="text-muted-foreground">Buckets</div>
              <div className="mt-1 text-sm font-semibold">{distributionData.length}</div>
            </div>
            <div className="rounded-lg border border-border/70 bg-white/80 px-3 py-2">
              <div className="text-muted-foreground">Largest Bucket</div>
              <div className="mt-1 text-sm font-semibold">
                {(distributionData.reduce((max, datum) => Math.max(max, datum.value), 0)).toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg border border-border/70 bg-white/80 px-3 py-2 col-span-2 md:col-span-1">
              <div className="text-muted-foreground">Current Selection</div>
              <div className="mt-1 text-sm font-semibold">{selection ? selection.label : "All thinkers"}</div>
            </div>
          </div>
        </div>
        <WorkCountDistributionChart data={distributionData} />
      </section>

      <section className="rounded-[1.8rem] border border-border/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(241,245,249,0.93),rgba(240,253,250,0.86))] p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Corpus Analytics</div>
            <h3 className="mt-1 text-xl font-semibold tracking-tight">Whole-corpus profile</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Baseline signals across the full archive: productivity, subject coverage, and concentration.
            </p>
          </div>
          <div className="rounded-full border border-border/70 bg-white/80 px-3 py-1 text-xs text-muted-foreground">
            Scope: all {thinkers.length.toLocaleString()} indexed thinkers
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <PulseCard
            label="Total Works"
            value={totalWorks.toLocaleString()}
            detail={`${avgWorks.toLocaleString()} average works per thinker`}
            percent={Math.min(100, Math.round((avgWorks / Math.max(medianWorks, 1)) * 50))}
            accentClassName="from-indigo-500 to-cyan-500"
          />
          <PulseCard
            label="Median Works"
            value={medianWorks.toLocaleString()}
            detail="Typical catalogue size across thinkers"
            percent={Math.min(100, Math.round((medianWorks / Math.max(avgWorks, 1)) * 70))}
            accentClassName="from-sky-500 to-emerald-500"
          />
          <PulseCard
            label="Subject Coverage"
            value={`${subjectCoverage}%`}
            detail={`${thinkersWithSubjects.length.toLocaleString()} thinkers with indexed subjects`}
            percent={subjectCoverage}
            accentClassName="from-teal-500 to-cyan-500"
          />
          <PulseCard
            label="Concentration"
            value={`${concentration}%`}
            detail="Category concentration index (higher means more concentrated)"
            percent={concentration}
            accentClassName="from-amber-500 to-rose-500"
          />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[1.2rem] border border-border/70 bg-white/80 p-4">
            <div className="text-sm font-semibold">Largest currents by thinker share</div>
            <div className="mt-3 space-y-3">
              {topCategoryRows.map((categoryRow) => (
                <div key={categoryRow.label}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{categoryRow.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {categoryRow.thinkerCount} thinkers · {categoryRow.share}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#2563eb,#14b8a6)]"
                      style={{ width: `${Math.max(6, categoryRow.share)}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {categoryRow.totalWorks.toLocaleString()} works total · {categoryRow.avgWorks.toLocaleString()} avg
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.2rem] border border-border/70 bg-white/80 p-4">
            <div className="text-sm font-semibold">Subject field reach</div>
            <div className="mt-2 text-xs text-muted-foreground">
              Average subject breadth: {avgSubjectBreadth} subjects per thinker
            </div>
            <div className="mt-3 space-y-3">
              {subjectRows.map((subjectRow) => (
                <div key={subjectRow.label}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{subjectRow.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {subjectRow.thinkerCount} thinkers · {subjectRow.share}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#0f766e,#38bdf8)]"
                      style={{ width: `${Math.max(6, subjectRow.share)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
