import { describe, expect, it } from "vitest";

import {
  combineFunnels,
  combineRevenueSeries,
  deriveBundledOverview,
  deriveOverview,
  describeDirection,
  pickLeadingRegion,
} from "../../src/lib/overview";
import {
  REGIONS,
  funnelByRegion,
  revenueByRegion,
  type FunnelStage,
  type MonthlyRevenuePoint,
  type RegionId,
  type RegionInfo,
} from "../../src/lib/sample-data";

/**
 * The dataset under test is SYNTHETIC sample data bundled with the project.
 * It contains no real customer or personal data: no names, emails, addresses,
 * phone numbers, account or customer IDs, and no payment or health data.
 * Every value is a made-up whole-dollar figure used only to make the local
 * demo charts and metric functions meaningful.
 */

/** All-regions monthly revenue: each month summed across EMEA, APAC, Americas. */
const COMBINED_MONTHLY_REVENUE = [
  420000, 453000, 465000, 474000, 509000, 538000, 555000, 591000, 607000,
  645000, 685000, 724000,
];

/** All-regions funnel totals: each stage summed across the three regions. */
const COMBINED_FUNNEL_COUNTS = [146000, 45000, 21960, 6786];

const EMPTY_REVENUE: Record<RegionId, MonthlyRevenuePoint[]> = {
  emea: [],
  apac: [],
  americas: [],
};

const EMPTY_FUNNEL: Record<RegionId, FunnelStage[]> = {
  emea: [],
  apac: [],
  americas: [],
};

const ZERO_REVENUE: Record<RegionId, MonthlyRevenuePoint[]> = {
  emea: [{ month: "Jan", revenue: 0 }],
  apac: [{ month: "Jan", revenue: 0 }],
  americas: [{ month: "Jan", revenue: 0 }],
};

const ZERO_FUNNEL: Record<RegionId, FunnelStage[]> = {
  emea: [
    { stage: "Visitors", count: 0 },
    { stage: "Paid", count: 0 },
  ],
  apac: [
    { stage: "Visitors", count: 0 },
    { stage: "Paid", count: 0 },
  ],
  americas: [
    { stage: "Visitors", count: 0 },
    { stage: "Paid", count: 0 },
  ],
};

describe("combineRevenueSeries", () => {
  it("sums the bundled per-region series month by month", () => {
    const combined = combineRevenueSeries(revenueByRegion, REGIONS);

    expect(combined.map((point) => point.month)).toEqual([
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]);
    expect(combined.map((point) => point.revenue)).toEqual(
      COMBINED_MONTHLY_REVENUE,
    );
  });

  it("returns an empty series when no region has data without throwing", () => {
    expect(combineRevenueSeries(EMPTY_REVENUE, REGIONS)).toEqual([]);
    expect(combineRevenueSeries(revenueByRegion, [])).toEqual([]);
  });

  it("is pure and deterministic and does not mutate its inputs", () => {
    const data: Record<RegionId, MonthlyRevenuePoint[]> = {
      emea: [
        { month: "Jan", revenue: 100 },
        { month: "Feb", revenue: 200 },
      ],
      apac: [
        { month: "Jan", revenue: 300 },
        { month: "Feb", revenue: 400 },
      ],
      americas: [
        { month: "Jan", revenue: 500 },
        { month: "Feb", revenue: 600 },
      ],
    };
    const regions: RegionInfo[] = REGIONS.map((region) => ({ ...region }));
    const dataSnapshot: Record<RegionId, MonthlyRevenuePoint[]> = {
      emea: [
        { month: "Jan", revenue: 100 },
        { month: "Feb", revenue: 200 },
      ],
      apac: [
        { month: "Jan", revenue: 300 },
        { month: "Feb", revenue: 400 },
      ],
      americas: [
        { month: "Jan", revenue: 500 },
        { month: "Feb", revenue: 600 },
      ],
    };
    const regionsSnapshot = regions.map((region) => ({ ...region }));

    const first = combineRevenueSeries(data, regions);
    const second = combineRevenueSeries(data, regions);

    expect(first).toEqual([
      { month: "Jan", revenue: 900 },
      { month: "Feb", revenue: 1200 },
    ]);
    expect(second).toEqual(first);
    expect(data).toEqual(dataSnapshot);
    expect(regions).toEqual(regionsSnapshot);
  });
});

describe("combineFunnels", () => {
  it("sums the bundled per-region funnels by stage index", () => {
    const combined = combineFunnels(funnelByRegion, REGIONS);

    expect(combined.map((stage) => stage.stage)).toEqual([
      "Visitors",
      "Sign-ups",
      "Trials",
      "Paid",
    ]);
    expect(combined.map((stage) => stage.count)).toEqual(
      COMBINED_FUNNEL_COUNTS,
    );
  });

  it("returns an empty funnel when no region has stages without throwing", () => {
    expect(combineFunnels(EMPTY_FUNNEL, REGIONS)).toEqual([]);
    expect(combineFunnels(funnelByRegion, [])).toEqual([]);
  });

  it("is pure and deterministic and does not mutate its inputs", () => {
    const data: Record<RegionId, FunnelStage[]> = {
      emea: [
        { stage: "Visitors", count: 100 },
        { stage: "Paid", count: 10 },
      ],
      apac: [
        { stage: "Visitors", count: 200 },
        { stage: "Paid", count: 20 },
      ],
      americas: [
        { stage: "Visitors", count: 300 },
        { stage: "Paid", count: 30 },
      ],
    };
    const snapshot: Record<RegionId, FunnelStage[]> = {
      emea: [
        { stage: "Visitors", count: 100 },
        { stage: "Paid", count: 10 },
      ],
      apac: [
        { stage: "Visitors", count: 200 },
        { stage: "Paid", count: 20 },
      ],
      americas: [
        { stage: "Visitors", count: 300 },
        { stage: "Paid", count: 30 },
      ],
    };

    const first = combineFunnels(data, REGIONS);
    const second = combineFunnels(data, REGIONS);

    expect(first).toEqual([
      { stage: "Visitors", count: 600 },
      { stage: "Paid", count: 60 },
    ]);
    expect(second).toEqual(first);
    expect(data).toEqual(snapshot);
  });
});

describe("pickLeadingRegion", () => {
  it("returns null for an empty list", () => {
    expect(pickLeadingRegion([])).toBeNull();
  });

  it("picks the entry with the greatest revenue", () => {
    const leader = pickLeadingRegion([
      { region: "emea", label: "EMEA", revenue: 100, share: 0.25 },
      { region: "americas", label: "Americas", revenue: 200, share: 0.5 },
      { region: "apac", label: "APAC", revenue: 100, share: 0.25 },
    ]);

    expect(leader?.region).toBe("americas");
    expect(leader?.revenue).toBe(200);
  });

  it("breaks ties by input order", () => {
    const leader = pickLeadingRegion([
      { region: "emea", label: "EMEA", revenue: 200, share: 0.5 },
      { region: "apac", label: "APAC", revenue: 200, share: 0.5 },
    ]);

    expect(leader?.region).toBe("emea");
  });
});

describe("describeDirection", () => {
  it("maps up, down and flat to a label and a non-colour symbol", () => {
    expect(describeDirection("up")).toEqual({ label: "Up", symbol: "▲" });
    expect(describeDirection("down")).toEqual({ label: "Down", symbol: "▼" });
    expect(describeDirection("flat")).toEqual({ label: "Flat", symbol: "▬" });
  });
});

describe("deriveBundledOverview", () => {
  it("totals the bundled all-regions revenue", () => {
    const kpis = deriveBundledOverview();

    expect(kpis.totalRevenue).toBe(6666000);
  });

  it("derives the combined revenue trend from the first and last months", () => {
    const kpis = deriveBundledOverview();

    expect(kpis.trend.first).toBe(420000);
    expect(kpis.trend.last).toBe(724000);
    expect(kpis.trend.changePct).toBeCloseTo(304000 / 420000, 10);
    expect(kpis.trend.direction).toBe("up");
  });

  it("derives the combined funnel totals and rates", () => {
    const kpis = deriveBundledOverview();

    expect(kpis.funnel.steps.map((step) => step.count)).toEqual(
      COMBINED_FUNNEL_COUNTS,
    );
    expect(kpis.funnel.overallRate).toBeCloseTo(6786 / 146000, 10);
    expect(kpis.visitorToPaidRate).toBeCloseTo(6786 / 146000, 10);
    expect(Number.isNaN(kpis.visitorToPaidRate)).toBe(false);
  });

  it("splits revenue across the bundled regions and shares sum to 1", () => {
    const kpis = deriveBundledOverview();

    expect(kpis.regions.map((entry) => entry.region)).toEqual([
      "emea",
      "apac",
      "americas",
    ]);
    expect(kpis.regions.map((entry) => entry.revenue)).toEqual([
      1957000, 1532000, 3177000,
    ]);
    const shareSum = kpis.regions.reduce((sum, entry) => sum + entry.share, 0);
    expect(shareSum).toBeCloseTo(1, 10);
  });

  it("names the Americas as the leading region", () => {
    const kpis = deriveBundledOverview();

    expect(kpis.leadingRegion?.region).toBe("americas");
    expect(kpis.leadingRegion?.revenue).toBe(3177000);
    expect(kpis.leadingRegion?.share).toBeCloseTo(3177000 / 6666000, 10);
  });

  it("is deterministic and deep-equal across two calls", () => {
    const first = deriveBundledOverview();
    const second = deriveBundledOverview();

    expect(second).toEqual(first);
  });
});

describe("deriveOverview", () => {
  it("does not mutate the inputs it is given", () => {
    const data: Record<RegionId, MonthlyRevenuePoint[]> = {
      emea: [
        { month: "Jan", revenue: 100 },
        { month: "Feb", revenue: 200 },
      ],
      apac: [
        { month: "Jan", revenue: 300 },
        { month: "Feb", revenue: 400 },
      ],
      americas: [
        { month: "Jan", revenue: 500 },
        { month: "Feb", revenue: 600 },
      ],
    };
    const funnels: Record<RegionId, FunnelStage[]> = {
      emea: [
        { stage: "Visitors", count: 100 },
        { stage: "Paid", count: 10 },
      ],
      apac: [
        { stage: "Visitors", count: 200 },
        { stage: "Paid", count: 20 },
      ],
      americas: [
        { stage: "Visitors", count: 300 },
        { stage: "Paid", count: 30 },
      ],
    };
    const regions: RegionInfo[] = REGIONS.map((region) => ({ ...region }));
    const dataSnapshot: Record<RegionId, MonthlyRevenuePoint[]> = {
      emea: [
        { month: "Jan", revenue: 100 },
        { month: "Feb", revenue: 200 },
      ],
      apac: [
        { month: "Jan", revenue: 300 },
        { month: "Feb", revenue: 400 },
      ],
      americas: [
        { month: "Jan", revenue: 500 },
        { month: "Feb", revenue: 600 },
      ],
    };
    const funnelsSnapshot: Record<RegionId, FunnelStage[]> = {
      emea: [
        { stage: "Visitors", count: 100 },
        { stage: "Paid", count: 10 },
      ],
      apac: [
        { stage: "Visitors", count: 200 },
        { stage: "Paid", count: 20 },
      ],
      americas: [
        { stage: "Visitors", count: 300 },
        { stage: "Paid", count: 30 },
      ],
    };
    const regionsSnapshot = regions.map((region) => ({ ...region }));

    const first = deriveOverview(data, funnels, regions);
    const second = deriveOverview(data, funnels, regions);

    expect(second).toEqual(first);
    expect(data).toEqual(dataSnapshot);
    expect(funnels).toEqual(funnelsSnapshot);
    expect(regions).toEqual(regionsSnapshot);
  });

  it("returns zero totals and rates, never NaN, for all-zero inputs", () => {
    const kpis = deriveOverview(ZERO_REVENUE, ZERO_FUNNEL, REGIONS);

    expect(kpis.totalRevenue).toBe(0);
    expect(kpis.trend.changePct).toBe(0);
    expect(Number.isNaN(kpis.trend.changePct)).toBe(false);
    expect(kpis.visitorToPaidRate).toBe(0);
    expect(Number.isNaN(kpis.visitorToPaidRate)).toBe(false);
    expect(kpis.regions.map((entry) => entry.share)).toEqual([0, 0, 0]);
    expect(kpis.regions.every((entry) => !Number.isNaN(entry.share))).toBe(
      true,
    );
  });

  it("degrades gracefully for empty regions without NaN", () => {
    const kpis = deriveOverview(EMPTY_REVENUE, EMPTY_FUNNEL, [] as RegionInfo[]);

    expect(kpis.totalRevenue).toBe(0);
    expect(kpis.trend.changePct).toBe(0);
    expect(kpis.trend.direction).toBe("flat");
    expect(kpis.funnel.steps).toEqual([]);
    expect(kpis.visitorToPaidRate).toBe(0);
    expect(kpis.regions).toEqual([]);
    expect(kpis.leadingRegion).toBeNull();
    expect(Number.isNaN(kpis.totalRevenue)).toBe(false);
    expect(Number.isNaN(kpis.visitorToPaidRate)).toBe(false);
  });
});
