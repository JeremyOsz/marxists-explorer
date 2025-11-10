"use client";

import { max } from "d3-array";
import { axisBottom } from "d3-axis";
import { scaleBand, scaleLinear, scaleSequential } from "d3-scale";
import { interpolateBlues } from "d3-scale-chromatic";
import { select } from "d3-selection";
import { useEffect, useRef } from "react";

export type WorkCountDatum = {
  name: string;
  value: number;
  category?: string;
};

type WorkCountBarChartProps = {
  data: WorkCountDatum[];
  className?: string;
};

export function WorkCountBarChart({ data, className }: WorkCountBarChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || data.length === 0) {
      return;
    }

    const render = () => {
      const width = container.clientWidth || 800;
      const barHeight = 24;
      const margin = { top: 24, right: 16, bottom: 32, left: 220 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = barHeight * data.length;
      const height = innerHeight + margin.top + margin.bottom;

      select(container).selectAll("svg").remove();

      const svg = select(container)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("role", "img")
        .attr("aria-label", "Bar chart of works per thinker");

      const root = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      const maxValue = max(data, (datum: WorkCountDatum) => datum.value) ?? 1;

      const x = scaleLinear()
        .domain([0, maxValue])
        .nice()
        .range([0, innerWidth]);

      const y = scaleBand<string>()
        .domain(data.map((datum: WorkCountDatum) => datum.name))
        .range([0, innerHeight])
        .padding(0.2);

      const color = scaleSequential(interpolateBlues).domain([0, maxValue]);

      const groups = root
        .selectAll("g.bar")
        .data(data)
        .join("g")
        .attr("class", "bar")
        .attr("transform", (datum: WorkCountDatum) => `translate(0, ${y(datum.name) ?? 0})`);

      groups
        .append("rect")
        .attr("height", y.bandwidth())
        .attr("width", (datum: WorkCountDatum) => x(datum.value))
        .attr("fill", (datum: WorkCountDatum) => color(datum.value));

      groups
        .append("text")
        .attr("x", -8)
        .attr("y", y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .attr("font-size", 12)
        .attr("fill", "currentColor")
        .text((datum: WorkCountDatum) => datum.name);

      groups
        .append("text")
        .attr("x", (datum: WorkCountDatum) => x(datum.value) + 8)
        .attr("y", y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("font-size", 12)
        .attr("fill", "currentColor")
        .text((datum: WorkCountDatum) => datum.value.toLocaleString());

      const axis = axisBottom(x).ticks(6);

      root
        .append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .attr("font-size", 11)
        .call(axis)
        .call((g: any) => g.select(".domain").attr("stroke", "currentColor"));
    };

    render();

    const observer = new ResizeObserver(() => render());
    observer.observe(container);

    return () => {
      observer.disconnect();
      select(container).selectAll("svg").remove();
    };
  }, [data]);

  if (!data.length) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground">No data available to display.</p>
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}


