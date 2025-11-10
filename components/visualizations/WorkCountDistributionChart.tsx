"use client";

import { max } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { scaleBand, scaleLinear, scaleSequential } from "d3-scale";
import { interpolateReds } from "d3-scale-chromatic";
import { select } from "d3-selection";
import type { Selection } from "d3-selection";
import { useEffect, useRef } from "react";

export type WorkCountBucketDatum = {
  label: string;
  value: number;
};

type WorkCountDistributionChartProps = {
  data: WorkCountBucketDatum[];
  className?: string;
};

export function WorkCountDistributionChart({
  data,
  className,
}: WorkCountDistributionChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || data.length === 0) {
      return;
    }

    const render = () => {
      const width = container.clientWidth || 800;
      const height = 360;
      const margin = { top: 24, right: 16, bottom: 48, left: 56 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      select(container).selectAll("svg").remove();

      const svg = select(container)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("role", "img")
        .attr("aria-label", "Distribution of thinkers by work count");

      const root = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      const maxValue = max(data, (datum: WorkCountBucketDatum) => datum.value) ?? 1;

      const x = scaleBand<string>()
        .domain(data.map((datum: WorkCountBucketDatum) => datum.label))
        .range([0, innerWidth])
        .padding(0.2);

      const y = scaleLinear()
        .domain([0, maxValue])
        .nice()
        .range([innerHeight, 0]);

      const color = scaleSequential(interpolateReds).domain([0, maxValue]);

      root
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", (datum: WorkCountBucketDatum) => x(datum.label) ?? 0)
        .attr("y", (datum: WorkCountBucketDatum) => y(datum.value))
        .attr("width", x.bandwidth())
        .attr("height", (datum: WorkCountBucketDatum) => innerHeight - y(datum.value))
        .attr("fill", (datum: WorkCountBucketDatum) => color(datum.value));

      root
        .selectAll("text.value")
        .data(data)
        .join("text")
        .attr("class", "value")
        .attr("text-anchor", "middle")
        .attr("x", (datum: WorkCountBucketDatum) => (x(datum.label) ?? 0) + x.bandwidth() / 2)
        .attr("y", (datum: WorkCountBucketDatum) => y(datum.value) - 6)
        .attr("font-size", 12)
        .attr("fill", "currentColor")
        .text((datum: WorkCountBucketDatum) => datum.value.toString());

      const xAxis = axisBottom(x);
      const yAxis = axisLeft(y).ticks(5);

      root
        .append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .attr("font-size", 11)
        .call(xAxis)
        .call((g: any) => g.select(".domain").attr("stroke", "currentColor"))
        .selectAll("text")
        .attr("text-anchor", "end")
        .attr("dx", "-0.5em")
        .attr("dy", "0.15em")
        .attr("transform", "rotate(-35)")
        .attr("font-size", 10);

      root
        .append("g")
        .attr("font-size", 11)
        .call(yAxis)
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


