"use client";

import { useMemo, useState } from "react";
import type {
  OverviewEdge,
  OverviewNetwork,
  OverviewSelection,
} from "@/lib/visualizations/thinker-overview";

type OverviewNetworkGraphProps = {
  overview: OverviewNetwork;
  selection: OverviewSelection | null;
  onSelect: (selection: OverviewSelection) => void;
};

function selectionId(selection: OverviewSelection | null): string | null {
  return selection ? `${selection.type}::${selection.label}` : null;
}

function edgePath(startX: number, startY: number, endX: number, endY: number): string {
  const curve = Math.abs(endX - startX) * 0.42;
  return `M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`;
}

export function OverviewNetworkGraph({
  overview,
  selection,
  onSelect,
}: OverviewNetworkGraphProps) {
  const width = 1040;
  const rowCount = Math.max(overview.categories.length, overview.subjects.length);
  const height = Math.max(540, rowCount * 52 + 140);
  const [hoveredSelection, setHoveredSelection] = useState<OverviewSelection | null>(null);
  const activeSelection = hoveredSelection ?? selection;
  const activeNodeId = selectionId(activeSelection);

  const layout = useMemo(() => {
    const leftX = 56;
    const rightX = 704;
    const top = 84;
    const cardWidth = 280;
    const cardHeight = 44;
    const leftStep = Math.max(50, Math.floor((height - top * 2) / Math.max(overview.categories.length, 1)));
    const rightStep = Math.max(60, Math.floor((height - top * 2) / Math.max(overview.subjects.length, 1)));

    const categoryPositions = new Map(
      overview.categories.map((node, index) => [
        node.id,
        { x: leftX, y: top + index * leftStep, node },
      ])
    );
    const subjectPositions = new Map(
      overview.subjects.map((node, index) => [
        node.id,
        { x: rightX, y: top + index * rightStep, node },
      ])
    );

    return { categoryPositions, subjectPositions, cardHeight, cardWidth };
  }, [height, overview.categories, overview.subjects]);

  const highlightedNodeIds = useMemo(() => {
    if (!activeSelection) {
      return new Set<string>();
    }

    const nodeId = `${activeSelection.type}::${activeSelection.label}`;
    const ids = new Set<string>([nodeId]);
    for (const edge of overview.edges) {
      if (edge.source === nodeId) {
        ids.add(edge.target);
      }
      if (edge.target === nodeId) {
        ids.add(edge.source);
      }
    }
    return ids;
  }, [activeSelection, overview.edges]);

  const visibleEdges = useMemo(() => {
    if (activeNodeId) {
      return overview.edges.filter((edge) => edge.source === activeNodeId || edge.target === activeNodeId);
    }

    const kept = new Set<string>();
    const byCategory = new Map<string, OverviewEdge[]>();
    for (const edge of overview.edges) {
      const current = byCategory.get(edge.source) ?? [];
      current.push(edge);
      byCategory.set(edge.source, current);
    }

    for (const [, edges] of byCategory.entries()) {
      edges
        .sort((a, b) => b.weight - a.weight || a.target.localeCompare(b.target))
        .slice(0, 3)
        .forEach((edge) => kept.add(`${edge.source}-${edge.target}`));
    }

    return overview.edges.filter((edge) => kept.has(`${edge.source}-${edge.target}`));
  }, [activeNodeId, overview.edges]);

  const activeEdgeCount = visibleEdges.length;
  const activeLabel = activeSelection?.label;

  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Overview Network
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Categories on the left, subjects on the right. Click a node to focus its strongest bridges.
          </div>
          <div className="mt-3 inline-flex rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
            {activeLabel
              ? `Focused on ${activeLabel} · ${activeEdgeCount} visible bridges`
              : "Showing the top bridges for each category to keep the overview readable"}
          </div>
        </div>
        {selection ? (
          <button
            type="button"
            onClick={() => onSelect({ type: "category", label: "" })}
            className="rounded-full border border-border px-3 py-1 text-xs"
          >
            Clear
          </button>
        ) : null}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[680px] w-full" role="img" aria-label="Category and subject overview network">
        <text x="56" y="32" className="fill-slate-500 text-[12px] uppercase tracking-[0.28em]">
          Categories
        </text>
        <text x="704" y="32" className="fill-slate-500 text-[12px] uppercase tracking-[0.28em]">
          Subjects
        </text>

        {visibleEdges.map((edge) => {
          const source = layout.categoryPositions.get(edge.source);
          const target = layout.subjectPositions.get(edge.target);
          if (!source || !target) {
            return null;
          }

          const highlighted = !activeNodeId || edge.source === activeNodeId || edge.target === activeNodeId;
          return (
            <path
              key={`${edge.source}-${edge.target}`}
              d={edgePath(
                source.x + layout.cardWidth,
                source.y,
                target.x,
                target.y
              )}
              fill="none"
              stroke={highlighted ? "#2563eb" : "#cbd5e1"}
              strokeOpacity={highlighted ? 0.52 : 0.12}
              strokeWidth={Math.max(2, edge.weight * 1.25)}
            />
          );
        })}

        {overview.categories.map((node) => {
          const position = layout.categoryPositions.get(node.id);
          if (!position) {
            return null;
          }

          const active = selection?.type === "category" && selection.label === node.label;
          const previewed = hoveredSelection?.type === "category" && hoveredSelection.label === node.label;
          const muted = highlightedNodeIds.size > 0 && !highlightedNodeIds.has(node.id);
          const averageWorks = Math.round(node.totalWorks / Math.max(node.thinkerCount, 1));

          return (
            <g
              key={node.id}
              transform={`translate(${position.x},${position.y})`}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredSelection({ type: "category", label: node.label })}
              onMouseLeave={() => setHoveredSelection(null)}
              onClick={() => onSelect({ type: "category", label: node.label })}
            >
              <rect
                x={0}
                y={-layout.cardHeight / 2}
                width={layout.cardWidth}
                height={layout.cardHeight}
                rx={18}
                fill={active ? "#0f172a" : previewed ? "#eff6ff" : "#ffffff"}
                stroke={active ? "#0f172a" : previewed ? "#60a5fa" : "#cbd5e1"}
                strokeWidth={active ? 2 : 1.2}
                opacity={muted ? 0.28 : 1}
              />
              <circle
                cx={18}
                cy={0}
                r={Math.max(6, Math.min(11, 5 + node.thinkerCount * 0.18))}
                fill={active ? "#93c5fd" : "#0f172a"}
                opacity={muted ? 0.28 : 1}
              />
              <text
                x={36}
                y={-2}
                className={active ? "fill-white text-[15px] font-semibold" : "fill-slate-900 text-[15px] font-semibold"}
              >
                {node.label}
              </text>
              <text
                x={36}
                y={15}
                className={active ? "fill-slate-200 text-[11px]" : "fill-slate-500 text-[11px]"}
              >
                {node.thinkerCount} thinkers · {averageWorks} avg works
              </text>
            </g>
          );
        })}

        {overview.subjects.map((node) => {
          const position = layout.subjectPositions.get(node.id);
          if (!position) {
            return null;
          }

          const active = selection?.type === "subject" && selection.label === node.label;
          const previewed = hoveredSelection?.type === "subject" && hoveredSelection.label === node.label;
          const muted = highlightedNodeIds.size > 0 && !highlightedNodeIds.has(node.id);

          return (
            <g
              key={node.id}
              transform={`translate(${position.x},${position.y})`}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredSelection({ type: "subject", label: node.label })}
              onMouseLeave={() => setHoveredSelection(null)}
              onClick={() => onSelect({ type: "subject", label: node.label })}
            >
              <rect
                x={0}
                y={-layout.cardHeight / 2}
                width={layout.cardWidth}
                height={layout.cardHeight}
                rx={18}
                fill={active ? "#0f766e" : previewed ? "#ecfeff" : "#ffffff"}
                stroke={active ? "#0f766e" : previewed ? "#14b8a6" : "#99f6e4"}
                strokeWidth={active ? 2 : 1.2}
                opacity={muted ? 0.28 : 1}
              />
              <text
                x={18}
                y={-2}
                className={active ? "fill-white text-[15px] font-semibold" : "fill-slate-900 text-[15px] font-semibold"}
              >
                {node.label}
              </text>
              <text
                x={18}
                y={15}
                className={active ? "fill-teal-50 text-[11px]" : "fill-slate-500 text-[11px]"}
              >
                {node.thinkerCount} thinkers
              </text>
              <circle
                cx={layout.cardWidth - 18}
                cy={0}
                r={Math.max(6, Math.min(11, 5 + node.thinkerCount * 0.12))}
                fill={active ? "#ccfbf1" : "#0f766e"}
                opacity={muted ? 0.28 : 1}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
