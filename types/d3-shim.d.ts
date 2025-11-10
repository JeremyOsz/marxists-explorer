declare module "d3-array" {
  export function max<T>(
    array: Iterable<T>,
    accessor: (value: T) => number | null | undefined
  ): number | undefined;
}

declare module "d3-axis" {
  import type { Selection } from "d3-selection";
  export type Axis<Domain> = (context: Selection<SVGGElement, unknown, null, undefined>) => void;
  export function axisBottom<Domain>(
    scale: any
  ): Axis<Domain> & {
    ticks: (count: number) => Axis<Domain>;
    tickFormat: (formatter: (value: Domain) => string) => Axis<Domain>;
  };
  export function axisLeft<Domain>(
    scale: any
  ): Axis<Domain> & {
    ticks: (count: number) => Axis<Domain>;
    tickFormat: (formatter: (value: Domain) => string) => Axis<Domain>;
  };
}

declare module "d3-scale" {
  export function scaleLinear(): any;
  export function scaleBand<Domain>(): any;
  export function scaleSequential<Range>(interpolator: (value: number) => Range): any;
}

declare module "d3-scale-chromatic" {
  export function interpolateBlues(value: number): string;
  export function interpolateReds(value: number): string;
}

declare module "d3-selection" {
  export type Selection<GElement extends Element | null, Datum, PElement extends Element | null, PDatum> = any;
  export function select(element: Element | null): any;
}

