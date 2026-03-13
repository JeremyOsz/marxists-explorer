"use client";

import * as d3 from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Thinker } from "@/lib/types/thinker";

type ThinkerBubbleChartProps = {
  thinkers: Thinker[];
  selectedThinkerId: string | null;
  onSelectThinker: (id: string) => void;
  /** Optional title when shown in a scoped context (e.g. category name) */
  title?: string;
};

/** Red-centric palette for categories; aligns with Marxist site theme and dashboard. */
const BUBBLE_PALETTE = [
  "#b91c1c",
  "#dc2626",
  "#991b1b",
  "#e11d48",
  "#be123c",
  "#9f1239",
  "#7f1d1d",
  "#f87171",
  "#fca5a5",
  "#b91c1c",
  "#dc2626",
  "#991b1b",
];

function thinkerId(thinker: Thinker): string {
  return `${thinker.category}::${thinker.name}`;
}

/** One thinker with value for pack layout, plus layout result (x, y, r). */
type PackedNode = Thinker & {
  value: number;
  categoryIndex: number;
  x: number;
  y: number;
  r: number;
};

export function ThinkerBubbleChart({
  thinkers,
  selectedThinkerId,
  onSelectThinker,
  title,
}: ThinkerBubbleChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const activeId = hoveredId ?? selectedThinkerId;

  const packed = useMemo((): PackedNode[] => {
    if (thinkers.length === 0) return [];
    const byCategory = new Map<string, number>();
    thinkers.forEach((t) => {
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + 1);
    });
    const categories = Array.from(byCategory.keys()).sort((a, b) => a.localeCompare(b));
    const categoryIndex = new Map(categories.map((c, i) => [c, i]));

    type LeafDatum = Thinker & { value: number; categoryIndex: number };
    const nodes: LeafDatum[] = thinkers.map((t) => ({
      ...t,
      value: Math.max(1, t.workCount ?? 1),
      categoryIndex: categoryIndex.get(t.category) ?? 0,
    }));

    type PackDatum = { children: LeafDatum[] } | LeafDatum;
    const rootData: PackDatum = { children: nodes };
    const root = d3
      .hierarchy(rootData, (d): PackDatum[] | undefined => ("children" in d ? d.children : undefined))
      .sum((d) => ("value" in d ? d.value : 0))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const width = 960;
    const height = 640;
    d3.pack<PackDatum>().size([width, height]).padding(4)(root);

    const leaves = root.leaves() as Array<d3.HierarchyPointNode<LeafDatum> & { r: number }>;
    return leaves.map((leaf) => ({
      ...leaf.data,
      x: leaf.x,
      y: leaf.y,
      r: leaf.r,
    }));
  }, [thinkers]);

  useEffect(() => {
    const svgEl = svgRef.current;
    const tooltipEl = tooltipRef.current;
    if (!svgEl || !tooltipEl || packed.length === 0) return;

    const width = 960;
    const height = 640;
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();
    const container = svg.attr("viewBox", `0 0 ${width} ${height}`).append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 4]).on("zoom", (event) => {
      container.attr("transform", event.transform.toString());
    });
    svg.call(zoom);

    container
      .selectAll("circle")
      .data(packed)
      .enter()
      .append("circle")
      .attr("cx", (d: PackedNode) => d.x)
      .attr("cy", (d: PackedNode) => d.y)
      .attr("r", (d: PackedNode) => d.r)
      .attr("fill", (d: PackedNode) => BUBBLE_PALETTE[d.categoryIndex % BUBBLE_PALETTE.length])
      .attr("stroke", (d: PackedNode) => (thinkerId(d) === activeId ? "#0f172a" : "rgba(255,255,255,0.9)"))
      .attr("stroke-width", (d: PackedNode) => (thinkerId(d) === activeId ? 3 : 1.5))
      .attr("opacity", (d: PackedNode) => (activeId ? (thinkerId(d) === activeId ? 1 : 0.45) : 1))
      .style("cursor", "pointer")
      .on("click", (_event: MouseEvent, d: PackedNode) => onSelectThinker(thinkerId(d)))
      .on("mouseenter", (event: MouseEvent, d: PackedNode) => {
        setHoveredId(thinkerId(d));
        tooltipEl.style.opacity = "1";
        tooltipEl.innerHTML = `
          <div class="font-semibold">${d.name}</div>
          <div class="text-slate-600">${d.category}</div>
          <div>${(d.workCount ?? 0).toLocaleString()} works</div>
        `;
        tooltipEl.style.left = `${event.offsetX + 14}px`;
        tooltipEl.style.top = `${event.offsetY + 14}px`;
      })
      .on("mouseleave", () => {
        setHoveredId(null);
        tooltipEl.style.opacity = "0";
      });

    container
      .selectAll("text")
      .data(packed.filter((d: PackedNode) => d.r >= 14))
      .enter()
      .append("text")
      .attr("x", (d: PackedNode) => d.x)
      .attr("y", (d: PackedNode) => d.y)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", (d: PackedNode) => Math.max(9, Math.min(14, d.r * 0.9)))
      .attr("fill", "#fff")
      .attr("paint-order", "stroke")
      .attr("stroke", "rgba(15,23,42,0.4)")
      .attr("stroke-width", 2)
      .style("pointer-events", "none")
      .style("opacity", (d: PackedNode) => (activeId ? (thinkerId(d) === activeId ? 1 : 0.5) : 1))
      .text((d: PackedNode) => {
        const maxChars = Math.floor((d.r * 2) / 7);
        return d.name.length <= maxChars ? d.name : d.name.slice(0, maxChars - 2) + "…";
      });
  }, [packed, activeId, onSelectThinker]);

  if (thinkers.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50">
        <p className="text-slate-500">No thinkers to display.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] p-4 shadow-sm">
      {title ? (
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Thinkers · Bubble
          </div>
          <h3 className="mt-1 text-lg font-semibold">{title}</h3>
        </div>
      ) : (
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Thinkers · Bubble
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Each bubble is a thinker; size = work count. Click to select. Colors by current/category.
          </p>
        </div>
      )}
      <div className="relative">
        <svg ref={svgRef} className="w-full overflow-hidden rounded-xl" />
        <div
          ref={tooltipRef}
          className="pointer-events-none fixed z-50 max-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg transition-opacity"
          style={{ opacity: 0 }}
        />
      </div>
    </div>
  );
}
