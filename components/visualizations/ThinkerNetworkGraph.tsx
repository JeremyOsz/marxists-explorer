"use client";

import * as d3 from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ThinkerClusterLens,
  ThinkerGraph,
  ThinkerGraphCluster,
  ThinkerGraphLink,
  ThinkerGraphMode,
  ThinkerGraphNode,
  ThinkerNodeSizeMetric,
} from "@/lib/visualizations/thinker-graph";
import { summarizeGraphClusters } from "@/lib/visualizations/thinker-graph";

type ThinkerNetworkGraphProps = {
  graph: ThinkerGraph;
  mode: ThinkerGraphMode;
  clusterLens: ThinkerClusterLens;
  selectedNodeId: string | null;
  highlightedNodeIds: string[];
  nodeSizeMetric: ThinkerNodeSizeMetric;
  onSelectNode: (id: string) => void;
};

type SimNode = ThinkerGraphNode & d3.SimulationNodeDatum;
type SimLink = ThinkerGraphLink & d3.SimulationLinkDatum<SimNode>;

const EDGE_COLORS: Record<ThinkerGraphLink["primaryType"], string> = {
  subject: "#8f2d2d",
  category: "#b91c1c",
  hybrid: "#475569",
};

const NODE_PALETTE = [
  "#b91c1c",
  "#be123c",
  "#dc2626",
  "#991b1b",
  "#7f1d1d",
  "#b45309",
  "#374151",
  "#7c2d12",
  "#9f1239",
  "#be185d",
  "#a16207",
  "#4d7c0f",
];

function getEndpointId(endpoint: string | ThinkerGraphNode): string {
  return typeof endpoint === "string" ? endpoint : endpoint.id;
}

function getNodeRadius(node: ThinkerGraphNode, metric: ThinkerNodeSizeMetric): number {
  if (metric === "workCount") {
    return Math.max(5, Math.min(18, 5 + Math.sqrt(node.workCount) / 3));
  }
  if (metric === "subjectBreadth") {
    return Math.max(5, Math.min(18, 5 + node.subjectCount * 1.2));
  }
  return Math.max(5, Math.min(18, 5 + node.degree * 1.8));
}

export function ThinkerNetworkGraph({
  graph,
  mode,
  clusterLens,
  selectedNodeId,
  highlightedNodeIds,
  nodeSizeMetric,
  onSelectNode,
}: ThinkerNetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const highlightedSet = useMemo(() => new Set(highlightedNodeIds), [highlightedNodeIds]);
  const [zoomScale, setZoomScale] = useState(1);
  const clusters = useMemo(() => summarizeGraphClusters(graph, clusterLens), [clusterLens, graph]);
  const clusterModeActive = zoomScale < 0.7;

  useEffect(() => {
    const svgElement = svgRef.current;
    const tooltipElement = tooltipRef.current;

    if (!svgElement || !tooltipElement) {
      return;
    }

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();

    if (graph.nodes.length === 0) {
      return;
    }

    const width = 960;
    const height = 640;
    const isSearching = highlightedSet.size > 0;
    const simNodes = graph.nodes.map((node) => ({ ...node })) as SimNode[];
    const simLinks = graph.links.map((link) => ({ ...link })) as SimLink[];
    const container = svg.attr("viewBox", `0 0 ${width} ${height}`).append("g");
    const categories = Array.from(new Set(simNodes.map((node) => node.category))).sort((a, b) =>
      a.localeCompare(b)
    );
    const categoryCenters = new Map<string, { x: number; y: number }>();
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;

    categories.forEach((category, index) => {
      const angle = (index / Math.max(categories.length, 1)) * Math.PI * 2 - Math.PI / 2;
      categoryCenters.set(category, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius * 0.72,
      });
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.25, 3]).on("zoom", (event) => {
      container.attr("transform", event.transform.toString());
      setZoomScale(event.transform.k);
    });
    svg.call(zoom);

    const simulation = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(simLinks)
          .id((node) => node.id)
          .distance((link) => Math.max(55, 120 - link.strength * 10))
          .strength((link) => Math.min(0.7, 0.08 + link.strength * 0.06))
      )
      .force("charge", d3.forceManyBody().strength(mode === "categories" ? -300 : -260))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "x",
        d3.forceX<SimNode>((node) => categoryCenters.get(node.category)?.x ?? centerX).strength(
          mode === "categories" ? 0.3 : 0.16
        )
      )
      .force(
        "y",
        d3.forceY<SimNode>((node) => categoryCenters.get(node.category)?.y ?? centerY).strength(
          mode === "categories" ? 0.3 : 0.14
        )
      )
      .force("collision", d3.forceCollide<SimNode>().radius((node) => getNodeRadius(node, nodeSizeMetric) + 6));

    const linkSelection = container
      .append("g")
      .selectAll("line")
      .data(simLinks)
      .enter()
      .append("line")
      .attr("stroke", (link: SimLink) => EDGE_COLORS[link.primaryType])
      .attr("stroke-opacity", (link: SimLink) => {
        if (!isSearching) {
          return Math.min(0.6, 0.15 + link.strength * 0.06);
        }
        return highlightedSet.has(getEndpointId(link.source)) || highlightedSet.has(getEndpointId(link.target))
          ? 0.75
          : 0.08;
      })
      .attr("stroke-width", (link: SimLink) => Math.max(1.2, link.strength / 2.2))
      .attr("stroke-linecap", "round");

    const nodeSelection = container
      .append("g")
      .selectAll("circle")
      .data(simNodes)
      .enter()
      .append("circle")
      .attr("r", (node: SimNode) => getNodeRadius(node, nodeSizeMetric))
      .attr("fill", (node: SimNode) => NODE_PALETTE[node.group % NODE_PALETTE.length])
      .attr("stroke", (node: SimNode) => (node.id === selectedNodeId ? "#111827" : "#f8fafc"))
      .attr("stroke-width", (node: SimNode) => (node.id === selectedNodeId ? 3 : 1.6))
      .style("cursor", "pointer")
      .style("opacity", (node: SimNode) => {
        if (!isSearching) {
          return 1;
        }
        return highlightedSet.has(node.id) ? 1 : 0.22;
      })
      .on("click", (_event: MouseEvent, node: SimNode) => onSelectNode(node.id))
      .on("mouseenter", (event: MouseEvent, node: SimNode) => {
        const strongestReason = graph.links.find((link) => link.source === node.id || link.target === node.id)?.reasons[0];
        tooltipElement.style.opacity = "1";
        tooltipElement.innerHTML = `
          <div class="font-semibold">${node.name}</div>
          <div>${node.category}</div>
          <div>${node.workCount.toLocaleString()} works</div>
          <div>${strongestReason?.label ?? "Standalone cluster node"}</div>
        `;
        tooltipElement.style.left = `${event.offsetX + 18}px`;
        tooltipElement.style.top = `${event.offsetY + 18}px`;
      })
      .on("mouseleave", () => {
        tooltipElement.style.opacity = "0";
      })
      .call(
        d3
          .drag<SVGCircleElement, SimNode>()
          .on("start", (event: d3.D3DragEvent<SVGCircleElement, SimNode, SimNode>) => {
            if (!event.active) {
              simulation.alphaTarget(0.3).restart();
            }
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
          })
          .on("drag", (event: d3.D3DragEvent<SVGCircleElement, SimNode, SimNode>) => {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
          })
          .on("end", (event: d3.D3DragEvent<SVGCircleElement, SimNode, SimNode>) => {
            if (!event.active) {
              simulation.alphaTarget(0);
            }
            event.subject.fx = null;
            event.subject.fy = null;
          })
      );

    const labelSelection = container
      .append("g")
      .selectAll("text")
      .data(simNodes)
      .enter()
      .append("text")
      .text((node: SimNode) => node.name)
      .attr("font-size", 11)
      .attr("fill", "#111827")
      .attr("paint-order", "stroke")
      .attr("stroke", "#f8fafc")
      .attr("stroke-width", 3)
      .style("pointer-events", "none")
      .style("opacity", (node: SimNode) => {
        if (node.id === selectedNodeId) {
          return 1;
        }
        if (isSearching) {
          return highlightedSet.has(node.id) ? 1 : 0;
        }
        return 0;
      });

    const clusterGroups = container
      .append("g")
      .selectAll("g.cluster")
      .data(clusters)
      .enter()
      .append("g")
      .attr("class", "cluster")
      .style("pointer-events", "none");

    clusterGroups
      .append("circle")
      .attr("r", (cluster: ThinkerGraphCluster) => Math.max(24, Math.min(54, 18 + cluster.nodeCount * 2.2)))
      .attr("fill", "rgba(255,255,255,0.92)")
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 1.4)
      .attr("stroke-dasharray", "3 3")
      .style("opacity", clusterModeActive ? 1 : 0);

    clusterGroups
      .append("text")
      .text((cluster: ThinkerGraphCluster) => cluster.label)
      .attr("text-anchor", "middle")
      .attr("y", -4)
      .attr("font-size", 12)
      .attr("font-weight", 600)
      .attr("fill", "#0f172a")
      .style("opacity", clusterModeActive ? 1 : 0);

    clusterGroups
      .append("text")
      .text((cluster: ThinkerGraphCluster) => `${cluster.nodeCount} thinkers`)
      .attr("text-anchor", "middle")
      .attr("y", 12)
      .attr("font-size", 10)
      .attr("fill", "#475569")
      .style("opacity", clusterModeActive ? 1 : 0);

    clusterGroups
      .append("text")
      .text((cluster: ThinkerGraphCluster) =>
        cluster.lens === "categories"
          ? `${cluster.averageWorks.toLocaleString()} avg works`
          : cluster.subjects.slice(0, 2).join(" · ")
      )
      .attr("text-anchor", "middle")
      .attr("y", 26)
      .attr("font-size", 9)
      .attr("fill", "#64748b")
      .style("opacity", clusterModeActive ? 1 : 0);

    simulation.on("tick", () => {
      linkSelection
        .attr("x1", (link: SimLink) => (link.source as SimNode).x ?? 0)
        .attr("y1", (link: SimLink) => (link.source as SimNode).y ?? 0)
        .attr("x2", (link: SimLink) => (link.target as SimNode).x ?? 0)
        .attr("y2", (link: SimLink) => (link.target as SimNode).y ?? 0);

      nodeSelection
        .attr("cx", (node: SimNode) => node.x ?? 0)
        .attr("cy", (node: SimNode) => node.y ?? 0);

      labelSelection
        .attr("x", (node: SimNode) => (node.x ?? 0) + 10)
        .attr("y", (node: SimNode) => (node.y ?? 0) + 4);

      clusterGroups.attr("transform", (cluster: ThinkerGraphCluster) => {
        if (clusterLens === "categories") {
          const center = categoryCenters.get(cluster.label) ?? { x: centerX, y: centerY };
          return `translate(${center.x},${center.y})`;
        }

        const matchingNodes = simNodes.filter(
          (node) => (node.topSubjects[0] ?? "Unclassified") === cluster.label
        );
        const averageX =
          matchingNodes.reduce((sum, node) => sum + (node.x ?? centerX), 0) /
          Math.max(matchingNodes.length, 1);
        const averageY =
          matchingNodes.reduce((sum, node) => sum + (node.y ?? centerY), 0) /
          Math.max(matchingNodes.length, 1);
        return `translate(${averageX},${averageY})`;
      });

      const thinkerOpacity = clusterModeActive ? 0.08 : 1;
      const linkOpacityMultiplier = clusterModeActive ? 0.05 : 1;
      nodeSelection.style("opacity", (node: SimNode) => {
        if (clusterModeActive) {
          if (isSearching) {
            return highlightedSet.has(node.id) ? 0.28 : 0.06;
          }
          return thinkerOpacity;
        }
        if (!isSearching) {
          return 1;
        }
        return highlightedSet.has(node.id) ? 1 : 0.22;
      });
      linkSelection.style("opacity", (link: SimLink) => {
        const base = !isSearching
          ? Math.min(0.6, 0.15 + link.strength * 0.06)
          : highlightedSet.has(getEndpointId(link.source)) || highlightedSet.has(getEndpointId(link.target))
            ? 0.75
            : 0.08;
        return base * linkOpacityMultiplier;
      });
      labelSelection.style("opacity", (node: SimNode) => {
        if (clusterModeActive) {
          return 0;
        }
        if (node.id === selectedNodeId) {
          return 1;
        }
        if (isSearching) {
          return highlightedSet.has(node.id) ? 1 : 0;
        }
        return 0;
      });
      clusterGroups.style("opacity", clusterModeActive ? 1 : 0);
    });

    return () => {
      simulation.stop();
      svg.selectAll("*").remove();
    };
  }, [clusterLens, clusterModeActive, clusters, graph, highlightedSet, mode, nodeSizeMetric, onSelectNode, selectedNodeId]);

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.96))]">
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-full border border-border/70 bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm">
        {clusterModeActive
          ? `Zoomed out: ${clusterLens === "categories" ? "category" : "subject"} clusters`
          : "Zoom in for thinker-level detail"}
      </div>
      <svg ref={svgRef} className="h-[640px] w-full" role="img" aria-label="Thinker connection network" />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-10 max-w-xs rounded-md border bg-background/95 px-3 py-2 text-xs text-foreground shadow-lg transition-opacity"
        style={{ opacity: 0 }}
      />
    </div>
  );
}
