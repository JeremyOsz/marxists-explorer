export type WorkCountBucket = {
  label: string;
  value: number;
};

const WORK_COUNT_BANDS: Array<{ min: number; max: number | null }> = [
  { min: 1, max: 4 },
  { min: 5, max: 9 },
  { min: 10, max: 24 },
  { min: 25, max: 49 },
  { min: 50, max: 99 },
  { min: 100, max: 249 },
  { min: 250, max: 499 },
  { min: 500, max: 999 },
  { min: 1000, max: null },
];

function formatBandLabel(min: number, max: number | null): string {
  return max === null ? `${min}+` : `${min}-${max}`;
}

export function buildWorkCountBuckets(counts: number[]): WorkCountBucket[] {
  if (counts.length === 0) {
    return [];
  }

  return WORK_COUNT_BANDS
    .map(({ min, max }) => ({
      label: formatBandLabel(min, max),
      value: counts.filter((count) => count >= min && (max === null || count <= max)).length,
    }))
    .filter((bucket) => bucket.value > 0);
}
