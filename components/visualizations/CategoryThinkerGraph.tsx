"use client";

import { useMemo, useState } from "react";
import type { Thinker } from "@/lib/types/thinker";

type CategoryThinkerGraphProps = {
  category: string;
  thinkers: Thinker[];
  selectedThinkerId: string | null;
  alternativeCategories: string[];
  onSelectThinker: (id: string) => void;
  onBackToOverview: () => void;
  onSelectCategory: (category: string) => void;
};

function edgePath(startX: number, startY: number, endX: number, endY: number): string {
  const curve = Math.abs(endX - startX) * 0.4;
  return `M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`;
}

function rankedSubjects(thinker: Thinker) {
  return [...(thinker.subjects ?? [])]
    .filter((subject) => subject.name !== "General")
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function topSubjects(thinker: Thinker): string {
  return rankedSubjects(thinker)
    .slice(0, 2)
    .map((subject) => subject.name)
    .join(", ");
}

export function CategoryThinkerGraph({
  category,
  thinkers,
  selectedThinkerId,
  alternativeCategories,
  onSelectThinker,
  onBackToOverview,
  onSelectCategory,
}: CategoryThinkerGraphProps) {
  const [hoveredThinkerId, setHoveredThinkerId] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState(false);

  const rankedThinkers = useMemo(
    () => {
      const ranked = [...thinkers]
        .sort((a, b) => (b.workCount ?? 0) - (a.workCount ?? 0) || a.name.localeCompare(b.name))
        .slice(0, 14);
      if (!selectedThinkerId) {
        return ranked;
      }

      const selected = thinkers.find((thinker) => `${thinker.category}::${thinker.name}` === selectedThinkerId);
      if (!selected || ranked.some((thinker) => thinker.name === selected.name && thinker.category === selected.category)) {
        return ranked;
      }

      return [...ranked.slice(0, 13), selected].sort(
        (a, b) => (b.workCount ?? 0) - (a.workCount ?? 0) || a.name.localeCompare(b.name)
      );
    },
    [thinkers, selectedThinkerId]
  );
  const previewThinker =
    rankedThinkers.find((thinker) => `${thinker.category}::${thinker.name}` === hoveredThinkerId) ??
    rankedThinkers.find((thinker) => `${thinker.category}::${thinker.name}` === selectedThinkerId) ??
    rankedThinkers[0] ??
    null;
  const activeThinkerId = previewThinker ? `${previewThinker.category}::${previewThinker.name}` : null;
  const activeThinkerIndex = previewThinker
    ? rankedThinkers.findIndex(
        (thinker) => thinker.name === previewThinker.name && thinker.category === previewThinker.category
      )
    : -1;

  const width = 1460;
  const rowCount = Math.max(rankedThinkers.length, 1);
  const height = Math.max(620, rowCount * 58 + 150);
  const categoryX = 44;
  const thinkerX = 400;
  const subjectX = 1036;
  const top = 86;
  const categoryCardWidth = 270;
  const thinkerCardWidth = 370;
  const subjectCardWidth = 330;
  const cardHeight = 54;
  const thinkerStep = Math.max(58, Math.floor((height - top * 2) / Math.max(rankedThinkers.length, 1)));
  const categoryY = top + Math.floor(((rankedThinkers.length - 1) * thinkerStep) / 2);
  const activeThinkerY = activeThinkerIndex >= 0 ? top + activeThinkerIndex * thinkerStep : categoryY;
  const previewSubjects = previewThinker ? rankedSubjects(previewThinker).slice(0, 6) : [];
  const subjectStep = 62;
  const subjectTop = previewSubjects.length > 0
    ? categoryY - Math.floor(((previewSubjects.length - 1) * subjectStep) / 2)
    : categoryY;
  const visibleAlternatives = alternativeCategories.slice(0, 5);

  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Drill Down
          </div>
          <div className="mt-1 text-xl font-semibold">{category}</div>
          <div className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Follow the category into its thinkers, then inspect the active thinker's strongest indexed subjects.
          </div>
          {previewThinker ? (
            <div className="mt-3 inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-900">
              {selectedThinkerId === activeThinkerId
                ? `Selected thinker: ${previewThinker.name}`
                : `Previewing: ${previewThinker.name}`}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onBackToOverview}
          className="inline-flex items-center justify-center rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm font-medium transition hover:bg-background"
        >
          Back to overview
        </button>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[720px] w-full xl:h-[760px]"
        role="img"
        aria-label="Category to thinkers to subjects graph"
      >
        <text x="56" y="32" className="fill-slate-500 text-[12px] uppercase tracking-[0.28em]">
          Category
        </text>
        <text x="420" y="32" className="fill-slate-500 text-[12px] uppercase tracking-[0.28em]">
          Thinkers
        </text>
        <text x="980" y="32" className="fill-slate-500 text-[12px] uppercase tracking-[0.28em]">
          Subjects
        </text>

        {rankedThinkers.map((thinker, index) => {
          const thinkerId = `${thinker.category}::${thinker.name}`;
          const y = top + index * thinkerStep;
          const highlighted = !activeThinkerId || activeThinkerId === thinkerId;
          const strokeWidth = Math.max(2, Math.min(10, ((thinker.workCount ?? 0) / Math.max(rankedThinkers[0]?.workCount ?? 1, 1)) * 8));

          return (
            <path
              key={`edge-${thinkerId}`}
              d={edgePath(categoryX + categoryCardWidth, categoryY, thinkerX, y)}
              fill="none"
              stroke={highlighted ? "#b91c1c" : "#cbd5e1"}
              strokeOpacity={highlighted ? 0.5 : 0.16}
              strokeWidth={strokeWidth}
            />
          );
        })}

        <g transform={`translate(${categoryX},${categoryY})`}>
          <g
            data-testid="selected-category-node"
            onMouseEnter={() => setHoveredCategory(true)}
            onMouseLeave={() => setHoveredCategory(false)}
          >
            <rect
              x={0}
              y={-cardHeight / 2}
              width={categoryCardWidth}
              height={cardHeight}
              rx={18}
              fill="#7f1d1d"
              stroke="#7f1d1d"
              strokeWidth={2}
            />
            <circle cx={18} cy={0} r={9} fill="#fca5a5" />
            <text x={40} y={-3} className="fill-white text-[17px] font-semibold">
              {category}
            </text>
            <text x={40} y={17} className="fill-slate-200 text-[12px]">
              {thinkers.length} thinkers in selection
            </text>
            {hoveredCategory ? (
              <g
                data-testid="category-clear-selection"
                className="cursor-pointer"
                onClick={onBackToOverview}
              >
                <circle
                  cx={categoryCardWidth - 18}
                  cy={0}
                  r={12}
                  fill="#1e293b"
                  stroke="#fca5a5"
                  strokeWidth={1.3}
                />
                <text
                  x={categoryCardWidth - 18}
                  y={5}
                  textAnchor="middle"
                  className="fill-slate-100 text-[14px] font-semibold"
                >
                  x
                </text>
              </g>
            ) : null}
          </g>
        </g>

        {visibleAlternatives.map((alternative, index) => {
          const y = categoryY + (index + 1) * 62;
          return (
            <g
              key={alternative}
              transform={`translate(${categoryX},${y})`}
              className="cursor-pointer"
              onClick={() => onSelectCategory(alternative)}
            >
              <rect
                x={0}
                y={-cardHeight / 2}
                width={categoryCardWidth}
                height={cardHeight}
                rx={18}
                fill="#ffffff"
                fillOpacity={0.75}
                stroke="#cbd5e1"
                strokeDasharray="6 5"
                strokeWidth={1.3}
              />
              <circle cx={18} cy={0} r={8} fill="#94a3b8" />
              <text x={40} y={5} className="fill-slate-700 text-[14px] font-medium">
                {alternative}
              </text>
            </g>
          );
        })}

        {rankedThinkers.map((thinker, index) => {
          const thinkerId = `${thinker.category}::${thinker.name}`;
          const y = top + index * thinkerStep;
          const active = selectedThinkerId === thinkerId;
          const previewed = hoveredThinkerId === thinkerId;
          const subjectSummary = topSubjects(thinker);

          return (
            <g
              key={thinkerId}
              transform={`translate(${thinkerX},${y})`}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredThinkerId(thinkerId)}
              onMouseLeave={() => setHoveredThinkerId(null)}
              onClick={() => onSelectThinker(thinkerId)}
            >
              <rect
                x={0}
                y={-cardHeight / 2}
                width={thinkerCardWidth}
                height={cardHeight}
                rx={18}
                fill={active ? "#7f1d1d" : previewed ? "#fef2f2" : "#ffffff"}
                stroke={active ? "#7f1d1d" : previewed ? "#f87171" : "#cbd5e1"}
                strokeWidth={active ? 2 : 1.2}
              />
              <circle cx={18} cy={0} r={7} fill={active ? "#fca5a5" : "#7f1d1d"} />
              <text
                x={40}
                y={-3}
                className={active ? "fill-white text-[16px] font-semibold" : "fill-slate-900 text-[16px] font-semibold"}
              >
                {thinker.name}
              </text>
              <text
                x={40}
                y={17}
                className={active ? "fill-slate-200 text-[12px]" : "fill-slate-500 text-[12px]"}
              >
                {(thinker.workCount ?? 0).toLocaleString()} works{subjectSummary ? ` · ${subjectSummary}` : ""}
              </text>
            </g>
          );
        })}

        {previewThinker && previewSubjects.length > 0
          ? previewSubjects.map((subject, index) => {
              const y = subjectTop + index * subjectStep;
              const strokeWidth = Math.max(
                2,
                Math.min(10, (subject.count / Math.max(previewSubjects[0]?.count ?? 1, 1)) * 8)
              );

              return (
                <g key={`${previewThinker.name}-${subject.name}`}>
                  <path
                    d={edgePath(thinkerX + thinkerCardWidth, activeThinkerY, subjectX, y)}
                    fill="none"
                    stroke="#b91c1c"
                    strokeOpacity={0.42}
                    strokeWidth={strokeWidth}
                  />
                  <g transform={`translate(${subjectX},${y})`}>
                    <rect
                      x={0}
                      y={-cardHeight / 2}
                      width={subjectCardWidth}
                      height={cardHeight}
                      rx={18}
                      fill="#fef2f2"
                      stroke="#fca5a5"
                      strokeWidth={1.5}
                    />
                    <circle cx={subjectCardWidth - 18} cy={0} r={7} fill="#b91c1c" />
                    <text x={24} y={-3} className="fill-slate-900 text-[16px] font-semibold">
                      {subject.name}
                    </text>
                    <text x={24} y={17} className="fill-slate-500 text-[12px]">
                      {subject.count.toLocaleString()} indexed texts
                    </text>
                  </g>
                </g>
              );
            })
          : (
            <g transform={`translate(${subjectX},${categoryY})`}>
              <rect
                x={0}
                y={-cardHeight / 2}
                width={subjectCardWidth}
                height={cardHeight}
                rx={18}
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth={1.2}
              />
              <text x={22} y={5} className="fill-slate-500 text-[13px]">
                No indexed subjects for this thinker
              </text>
            </g>
          )}
      </svg>
    </div>
  );
}
