import { describe, expect, it } from "vitest";

import {
  conversionFunnel,
  regionalSplit,
  revenueTrend,
} from "../../src/lib/metrics";
import {
  REGIONS,
  funnelByRegion,
  revenueByRegion,
  type FunnelStage,
  type MonthlyRevenuePoint,
  type RegionId,
  type RegionInfo,
} from "../../src/lib/sample-data";

describe("revenueTrend", () => {
  it("reports 'up' with first, last and changePct for a rising series", () => {
    const points: MonthlyRevenuePoint[] = [
      { month: "Jan", revenue: 100 },
      { month: "Feb", revenue: 125 },
      { month: "Mar", revenue: 150 },
    ];

    const result = revenueTrend(points);

    expect(result.direction).toBe("up");
    expect(result.first).toBe(100);
    expect(result.last).toBe(150);
    expect(result.changePct).toBeCloseTo(0.5, 10);
    expect(result.points).toEqual(points);
  });

  it("reports 'down' for a falling series", () => {
    const points: MonthlyRevenuePoint[] = [
      { month: "Jan", revenue: 200 },
      { month: "Feb", revenue: 150 },
      { month: "Mar", revenue: 100 },
    ];

    const result = revenueTrend(points);

    expect(result.direction).toBe("down");
    expect(result.first).toBe(200);
    expect(result.last).toBe(100);
    expect(result.changePct).toBeCloseTo(-0.5, 10);
  });

  it("reports 'flat' with changePct 0 for a flat series", () => {
    const points: MonthlyRevenuePoint[] = [
      { month: "Jan", revenue: 100 },
      { month: "Feb", revenue: 100 },
      { month: "Mar", revenue: 100 },
    ];

    const result = revenueTrend(points);

    expect(result.direction).toBe("flat");
    expect(result.first).toBe(100);
    expect(result.last).toBe(100);
    expect(result.changePct).toBe(0);
  });

  it("handles a single point as flat with changePct 0", () => {
    const result = revenueTrend([{ month: "Jan", revenue: 42 }]);

    expect(result.points).toHaveLength(1);
    expect(result.first).toBe(42);
    expect(result.last).toBe(42);
    expect(result.changePct).toBe(0);
    expect(result.direction).toBe("flat");
  });

  it("handles an empty array without NaN", () => {
    const result = revenueTrend([]);

    expect(result.points).toEqual([]);
    expect(result.first).toBe(0);
    expect(result.last).toBe(0);
    expect(result.changePct).toBe(0);
    expect(Number.isNaN(result.changePct)).toBe(false);
    expect(result.direction).toBe("flat");
  });

  it("guards changePct to 0 when the first value is 0", () => {
    const result = revenueTrend([
      { month: "Jan", revenue: 0 },
      { month: "Feb", revenue: 50 },
    ]);

    expect(Number.isNaN(result.changePct)).toBe(false);
    expect(result.changePct).toBe(0);
    expect(result.direction).toBe("flat");
  });

  it("is pure and deterministic and does not mutate its input", () => {
    const points: MonthlyRevenuePoint[] = [
      { month: "Jan", revenue: 100 },
      { month: "Feb", revenue: 150 },
    ];
    const snapshot = points.map((point) => ({ ...point }));

    const first = revenueTrend(points);
    const second = revenueTrend(points);

    expect(second).toEqual(first);
    expect(points).toEqual(snapshot);
  });
});

describe("conversionFunnel", () => {
  const stages: FunnelStage[] = [
    { stage: "Visitors", count: 1000 },
    { stage: "Sign-ups", count: 400 },
    { stage: "Trials", count: 200 },
    { stage: "Paid", count: 100 },
  ];

  it("computes conversionRate as count/first for every stage", () => {
    const result = conversionFunnel(stages);

    expect(result.steps.map((step) => step.conversionRate)).toEqual([
      1, 0.4, 0.2, 0.1,
    ]);
  });

  it("computes overallRate as last/first", () => {
    const result = conversionFunnel(stages);

    expect(result.overallRate).toBeCloseTo(0.1, 10);
  });

  it("preserves stage order and counts", () => {
    const result = conversionFunnel(stages);

    expect(result.steps.map((step) => step.stage)).toEqual([
      "Visitors",
      "Sign-ups",
      "Trials",
      "Paid",
    ]);
    expect(result.steps.map((step) => step.count)).toEqual([
      1000, 400, 200, 100,
    ]);
  });

  it("returns 0 rates for an empty input without NaN", () => {
    const result = conversionFunnel([]);

    expect(result.steps).toEqual([]);
    expect(result.overallRate).toBe(0);
    expect(Number.isNaN(result.overallRate)).toBe(false);
  });

  it("returns 0 rates when the first count is 0 without NaN", () => {
    const result = conversionFunnel([
      { stage: "Visitors", count: 0 },
      { stage: "Sign-ups", count: 10 },
      { stage: "Paid", count: 2 },
    ]);

    expect(result.steps.map((step) => step.conversionRate)).toEqual([0, 0, 0]);
    expect(result.steps.every((step) => !Number.isNaN(step.conversionRate))).toBe(
      true,
    );
    expect(result.overallRate).toBe(0);
    expect(Number.isNaN(result.overallRate)).toBe(false);
  });

  it("is pure and deterministic and does not mutate its input", () => {
    const input: FunnelStage[] = stages.map((stage) => ({ ...stage }));
    const snapshot = input.map((stage) => ({ ...stage }));

    const first = conversionFunnel(input);
    const second = conversionFunnel(input);

    expect(second).toEqual(first);
    expect(input).toEqual(snapshot);
  });
});

describe("regionalSplit", () => {
  it("sums revenue per region and totals the sum", () => {
    const data: Record<RegionId, MonthlyRevenuePoint[]> = {
      emea: [
        { month: "Jan", revenue: 100 },
        { month: "Feb", revenue: 200 },
      ],
      apac: [{ month: "Jan", revenue: 300 }],
      americas: [{ month: "Jan", revenue: 400 }],
    };

    const result = regionalSplit(data, REGIONS);

    expect(result.entries.map((entry) => entry.region)).toEqual([
      "emea",
      "apac",
      "americas",
    ]);
    expect(result.entries.map((entry) => entry.revenue)).toEqual([
      300, 300, 400,
    ]);
    expect(result.total).toBe(1000);
  });

  it("makes regional shares sum to 1", () => {
    const result = regionalSplit(revenueByRegion, REGIONS);

    const shareSum = result.entries.reduce((sum, entry) => sum + entry.share, 0);
    expect(shareSum).toBeCloseTo(1, 10);
  });

  it("keeps the total equal to the sum of the regional revenues", () => {
    const result = regionalSplit(revenueByRegion, REGIONS);

    const revenueSum = result.entries.reduce(
      (sum, entry) => sum + entry.revenue,
      0,
    );
    expect(result.total).toBe(revenueSum);
  });

  it("returns 0 shares for zero revenue input without NaN", () => {
    const zeroed: Record<RegionId, MonthlyRevenuePoint[]> = {
      emea: [{ month: "Jan", revenue: 0 }],
      apac: [{ month: "Jan", revenue: 0 }],
      americas: [{ month: "Jan", revenue: 0 }],
    };

    const result = regionalSplit(zeroed, REGIONS);

    expect(result.total).toBe(0);
    expect(result.entries.map((entry) => entry.share)).toEqual([0, 0, 0]);
    expect(result.entries.every((entry) => !Number.isNaN(entry.share))).toBe(
      true,
    );
  });

  it("returns an empty split when there are no regions without NaN", () => {
    const result = regionalSplit({}, [] as RegionInfo[]);

    expect(result.entries).toEqual([]);
    expect(result.total).toBe(0);
    expect(Number.isNaN(result.total)).toBe(false);
  });

  it("is pure and deterministic and does not mutate its inputs", () => {
    const data: Record<RegionId, MonthlyRevenuePoint[]> = {
      emea: [{ month: "Jan", revenue: 100 }],
      apac: [{ month: "Jan", revenue: 200 }],
      americas: [{ month: "Jan", revenue: 300 }],
    };
    const regions: RegionInfo[] = REGIONS.map((region) => ({ ...region }));
    const dataSnapshot: Record<RegionId, MonthlyRevenuePoint[]> = {
      emea: [{ month: "Jan", revenue: 100 }],
      apac: [{ month: "Jan", revenue: 200 }],
      americas: [{ month: "Jan", revenue: 300 }],
    };
    const regionsSnapshot = regions.map((region) => ({ ...region }));

    const first = regionalSplit(data, regions);
    const second = regionalSplit(data, regions);

    expect(second).toEqual(first);
    expect(data).toEqual(dataSnapshot);
    expect(regions).toEqual(regionsSnapshot);
  });

  it("covers the bundled funnel data through the funnel metric", () => {
    // Sanity check that the bundled regions remain wireable end to end.
    for (const region of REGIONS) {
      const result = conversionFunnel(funnelByRegion[region.id]);
      expect(result.steps).toHaveLength(4);
      expect(Number.isNaN(result.overallRate)).toBe(false);
    }
  });
});
