"use client";

import { useMemo, useState } from "react";
import type { ThinkerSubjectEdge, ThinkerSubjectNetwork } from "@/lib/visualizations/thinker-subject";

type ThinkerSubjectGraphProps = {
  title: string;
  graph: ThinkerSubjectNetwork;
  selectedThinkerId: string | null;
  onSelectThinker: (id: string) => void;
};

function edgePath(startX: number, startY: number, endX: number, endY: number): string {
  const curve = Math.abs(endX - startX) * 0.42;
  return `M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`;
}

export function ThinkerSubjectGraph({
  title,
  graph,
  selectedThinkerId,
  onSelectThinker,
}: ThinkerSubjectGraphProps) {
  const width = 1040;
  const rowCount = Math.max(graph.thinkers.length, graph.subjects.length);
  const height = Math.max(460, rowCount * 52 + 140);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const activeNodeId = hoveredNodeId ?? selectedThinkerId;

  const layout = useMemo(() => {
    const leftX = 56;
    const rightX = 704;
    const top = 84;
    const cardWidth = 280;
    const cardHeight = 44;
    const leftStep = Math.max(50, Math.floor((height - top * 2) / Math.max(graph.thinkers.length, 1)));
    const rightStep = Math.max(60, Math.floor((height - top * 2) / Math.max(graph.subjects.length, 1)));

    const thinkerPositions = new Map(
      graph.thinkers.map((node, index) => [node.id, { x: leftX, y: top + index * leftStep }])
    );
    const subjectPositions = new Map(
      graph.subjects.map((node, index) => [node.id, { x: rightX, y: top + index * rightStep }])
    );

    return { thinkerPositions, subjectPositions, cardWidth, cardHeight };
  }, [graph.subjects, graph.thinkers, height]);

  const visibleEdges = useMemo(() => {
    if (activeNodeId) {
      return graph.edges.filter((edge) => edge.source === activeNodeId || edge.target === activeNodeId);
    }

    const keep = new Set<string>();
    const byThinker = new Map<string, ThinkerSubjectEdge[]>();
    for (const edge of graph.edges) {
      const current = byThinker.get(edge.source) ?? [];
      current.push(edge);
      byThinker.set(edge.source, current);
    }

    for (const edges of byThinker.values()) {
      edges
        .sort((a, b) => b.subjectCount - a.subjectCount || a.target.localeCompare(b.target))
        .slice(0, 3)
        .forEach((edge) => keep.add(`${edge.source}-${edge.target}`));
    }

    return graph.edges.filter((edge) => keep.has(`${edge.source}-${edge.target}`));
  }, [activeNodeId, graph.edges]);

  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] p-4 shadow-sm">
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Drill Down
        </div>
        <div className="mt-1 text-lg font-semibold">{title}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Thinkers on the left, their strongest indexed subjects on the right.
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[620px] w-full" role="img" aria-label="Thinker to subject graph">
        <text x="56" y="32" className="fill-slate-500 text-[12px] uppercase tracking-[0.28em]">
          Thinkers
        </text>
        <text x="704" y="32" className="fill-slate-500 text-[12px] uppercase tracking-[0.28em]">
          Subjects
        </text>

        {visibleEdges.map((edge) => {
          const source = layout.thinkerPositions.get(edge.source);
          const target = layout.subjectPositions.get(edge.target);
          if (!source || !target) {
            return null;
          }

          const highlighted = !activeNodeId || edge.source === activeNodeId || edge.target === activeNodeId;
          return (
            <path
              key={`${edge.source}-${edge.target}`}
              d={edgePath(source.x + layout.cardWidth, source.y, target.x, target.y)}
              fill="none"
              stroke={highlighted ? "#b91c1c" : "#cbd5e1"}
              strokeOpacity={highlighted ? 0.52 : 0.12}
              strokeWidth={Math.max(2, edge.weight * 1.4)}
            />
          );
        })}

        {graph.thinkers.map((node) => {
          const position = layout.thinkerPositions.get(node.id);
          if (!position) {
            return null;
          }

          const active = selectedThinkerId === node.id;
          const previewed = hoveredNodeId === node.id;
          return (
            <g
              key={node.id}
              transform={`translate(${position.x},${position.y})`}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              onClick={() => onSelectThinker(node.id)}
            >
              <rect
                x={0}
                y={-layout.cardHeight / 2}
                width={layout.cardWidth}
                height={layout.cardHeight}
                rx={18}
                fill={active ? "#7f1d1d" : previewed ? "#fef2f2" : "#ffffff"}
                stroke={active ? "#7f1d1d" : previewed ? "#f87171" : "#cbd5e1"}
                strokeWidth={active ? 2 : 1.2}
              />
              <circle cx={18} cy={0} r={8} fill={active ? "#fca5a5" : "#7f1d1d"} />
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
                {(node.workCount ?? 0).toLocaleString()} works · {node.totalSubjectCount ?? 0} subjects
              </text>
            </g>
          );
        })}

        {graph.subjects.map((node) => {
          const position = layout.subjectPositions.get(node.id);
          if (!position) {
            return null;
          }

          const active = hoveredNodeId === node.id;
          return (
            <g
              key={node.id}
              transform={`translate(${position.x},${position.y})`}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
            >
              <rect
                x={0}
                y={-layout.cardHeight / 2}
                width={layout.cardWidth}
                height={layout.cardHeight}
                rx={18}
                fill={active ? "#fef2f2" : "#ffffff"}
                stroke={active ? "#dc2626" : "#fecaca"}
                strokeWidth={active ? 2 : 1.2}
              />
              <text x={18} y={-2} className="fill-slate-900 text-[15px] font-semibold">
                {node.label}
              </text>
              <text x={18} y={15} className="fill-slate-500 text-[11px]">
                {node.thinkerCount ?? 0} thinkers
              </text>
              <circle cx={layout.cardWidth - 18} cy={0} r={8} fill="#b91c1c" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
