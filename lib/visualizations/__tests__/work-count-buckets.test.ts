import { buildWorkCountBuckets } from "@/lib/visualizations/work-count-buckets";

describe("buildWorkCountBuckets", () => {
  it("uses compact logarithmic-style bands for skewed catalogues", () => {
    const counts = [
      1, 1, 2, 3, 4,
      5, 7, 9,
      10, 12, 20, 24,
      25, 40, 49,
      50, 75, 99,
      100, 163, 218, 320, 412, 892, 1509, 2162,
    ];

    expect(buildWorkCountBuckets(counts)).toEqual([
      { label: "1-4", value: 5 },
      { label: "5-9", value: 3 },
      { label: "10-24", value: 4 },
      { label: "25-49", value: 3 },
      { label: "50-99", value: 3 },
      { label: "100-249", value: 3 },
      { label: "250-499", value: 2 },
      { label: "500-999", value: 1 },
      { label: "1000+", value: 2 },
    ]);
  });

  it("drops empty bands when there are no values in that range", () => {
    expect(buildWorkCountBuckets([2, 3, 1200])).toEqual([
      { label: "1-4", value: 2 },
      { label: "1000+", value: 1 },
    ]);
  });

  it("returns an empty array when there are no positive counts", () => {
    expect(buildWorkCountBuckets([])).toEqual([]);
  });
});
