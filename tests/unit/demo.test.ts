import { describe, expect, it } from "vitest";

import {
  DEFAULT_REGION_ID,
  buildDecision,
  deriveBundledDashboard,
  deriveRegionDashboard,
} from "../../src/lib/demo";
import { conversionFunnel, revenueTrend } from "../../src/lib/metrics";
import {
  REGIONS,
  funnelByRegion,
  revenueByRegion,
} from "../../src/lib/sample-data";

/**
 * The dataset under test is SYNTHETIC sample data bundled with the project.
 * It contains no real customer or personal data: no names, emails, addresses,
 * phone numbers, account or customer IDs, and no payment or health data.
 * Every value is a made-up whole-dollar figure used only to make the local
 * demo charts and metric functions meaningful.
 */

/** Every number reachable in a value, walking arrays and object properties. */
function collectNumbers(value: unknown, found: number[] = []): number[] {
  if (typeof value === "number") {
    found.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectNumbers(item, found));
  } else if (value !== null && typeof value === "object") {
    Object.values(value).forEach((item) => collectNumbers(item, found));
  }

  return found;
}

/** Assert a derived value carries numbers and that none of them is NaN. */
function expectNoNaN(value: unknown): void {
  const numbers = collectNumbers(value);

  expect(numbers.length).toBeGreaterThan(0);
  expect(numbers.filter((number) => Number.isNaN(number))).toEqual([]);
  expect(numbers.every((number) => Number.isFinite(number))).toBe(true);
}

describe("deriveRegionDashboard", () => {
  it("derives APAC from the bundled APAC series and funnel", () => {
    const dashboard = deriveRegionDashboard("apac");

    expect(dashboard.region).toEqual({ id: "apac", label: "APAC" });
    expect(dashboard.trend).toEqual(revenueTrend(revenueByRegion.apac));
    expect(dashboard.funnel).toEqual(conversionFunnel(funnelByRegion.apac));

    // Guard the wiring itself, not only equality with the metric functions.
    expect(dashboard.trend.first).toBe(revenueByRegion.apac[0].revenue);
    expect(dashboard.trend.last).toBe(
      revenueByRegion.apac[revenueByRegion.apac.length - 1].revenue,
    );
    expect(dashboard.funnel.steps.map((step) => step.count)).toEqual(
      funnelByRegion.apac.map((stage) => stage.count),
    );
    expect(dashboard.funnel.overallRate).toBeCloseTo(1458 / 36000, 10);
  });

  it("changes the numbers when another region is chosen", () => {
    const apac = deriveRegionDashboard("apac");
    const emea = deriveRegionDashboard("emea");

    expect(emea.region).toEqual({ id: "emea", label: "EMEA" });
    expect(emea.trend.points).not.toEqual(apac.trend.points);
    expect(emea.trend.first).not.toBe(apac.trend.first);
    expect(emea.trend.last).not.toBe(apac.trend.last);
    expect(emea.trend.changePct).not.toBe(apac.trend.changePct);
    expect(emea.funnel.overallRate).not.toBe(apac.funnel.overallRate);
    expect(emea.decision).not.toBe(apac.decision);
    expect(emea.trend.changePct).toBeCloseTo(94000 / 120000, 10);
    expect(emea.funnel.overallRate).toBeCloseTo(2160 / 48000, 10);
  });

  it("splits the bundled revenue across every region with shares summing to 1", () => {
    const dashboard = deriveRegionDashboard("apac");

    expect(dashboard.split.total).toBe(6666000);
    expect(dashboard.split.entries.map((entry) => entry.region)).toEqual([
      "emea",
      "apac",
      "americas",
    ]);
    expect(dashboard.split.entries.map((entry) => entry.revenue)).toEqual([
      1957000, 1532000, 3177000,
    ]);

    const shareSum = dashboard.split.entries.reduce(
      (sum, entry) => sum + entry.share,
      0,
    );
    expect(shareSum).toBeCloseTo(1, 10);
  });

  it("names the Americas as the leading region", () => {
    const dashboard = deriveRegionDashboard("apac");

    expect(dashboard.leader?.region).toBe("americas");
    expect(dashboard.leader?.label).toBe("Americas");
    expect(dashboard.leader?.revenue).toBe(3177000);
    expect(dashboard.leader?.share).toBeCloseTo(3177000 / 6666000, 10);
  });

  it("derives no NaN for any chosen region", () => {
    for (const region of REGIONS) {
      expectNoNaN(deriveRegionDashboard(region.id));
    }
  });
});

describe("deriveBundledDashboard", () => {
  it("opens on the leading bundled region", () => {
    const dashboard = deriveBundledDashboard();

    expect(DEFAULT_REGION_ID).toBe("americas");
    expect(dashboard).toEqual(deriveRegionDashboard(DEFAULT_REGION_ID));
    expect(dashboard.region.label).toBe("Americas");
  });
});

describe("buildDecision", () => {
  it("returns one non-empty, deterministic sentence that names the region", () => {
    const dashboard = deriveRegionDashboard("apac");

    const first = buildDecision(
      dashboard.region,
      dashboard.trend,
      dashboard.funnel,
      dashboard.leader,
    );
    const second = buildDecision(
      dashboard.region,
      dashboard.trend,
      dashboard.funnel,
      dashboard.leader,
    );

    expect(first.length).toBeGreaterThan(0);
    expect(first.trim().length).toBeGreaterThan(0);
    expect(second).toBe(first);
    expect(first).toContain("APAC");
    expect(first).not.toContain("NaN");
  });

  it("does not mutate its inputs", () => {
    const region = { ...REGIONS[0] };
    const trend = { ...revenueTrend(revenueByRegion.emea) };
    const funnel = { ...conversionFunnel(funnelByRegion.emea) };
    const leader = {
      region: "americas" as const,
      label: "Americas",
      revenue: 3177000,
      share: 3177000 / 6666000,
    };

    const regionSnapshot = { ...region };
    const trendSnapshot = {
      ...trend,
      points: trend.points.map((point) => ({ ...point })),
    };
    const funnelSnapshot = {
      ...funnel,
      steps: funnel.steps.map((step) => ({ ...step })),
    };
    const leaderSnapshot = { ...leader };

    const first = buildDecision(region, trend, funnel, leader);
    const second = buildDecision(region, trend, funnel, leader);

    expect(second).toBe(first);
    expect(first).toContain("EMEA");
    expect(first).toContain("Americas");
    expect(region).toEqual(regionSnapshot);
    expect(trend).toEqual(trendSnapshot);
    expect(funnel).toEqual(funnelSnapshot);
    expect(leader).toEqual(leaderSnapshot);
  });

  it("names the region that leads without saying NaN", () => {
    const dashboard = deriveRegionDashboard("americas");

    const sentence = buildDecision(
      dashboard.region,
      dashboard.trend,
      dashboard.funnel,
      dashboard.leader,
    );

    expect(sentence).toContain("Americas");
    expect(sentence).not.toContain("NaN");
  });
});
