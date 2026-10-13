import { describe, expect, it } from "vitest";

import {
  REGIONS,
  funnelByRegion,
  revenueByRegion,
  type RegionId,
} from "../../src/lib/sample-data";

/**
 * The dataset under test is SYNTHETIC sample data bundled with the project.
 * It contains no real customer or personal data: no names, emails, addresses,
 * phone numbers, account or customer IDs, and no payment or health data.
 * Every value is a made-up whole-dollar figure used only to make the local
 * demo charts and metric functions meaningful.
 */

const EXPECTED_REGIONS: RegionId[] = ["emea", "apac", "americas"];

describe("sample-data dataset shape", () => {
  it("lists all three regions", () => {
    expect(REGIONS.map((region) => region.id)).toEqual(EXPECTED_REGIONS);
    expect(REGIONS).toHaveLength(3);
  });

  it("has a non-empty human-readable label for every region", () => {
    for (const region of REGIONS) {
      expect(typeof region.label).toBe("string");
      expect(region.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("has exactly 12 monthly revenue points per region", () => {
    for (const region of EXPECTED_REGIONS) {
      expect(revenueByRegion[region]).toHaveLength(12);
    }
  });

  it("has finite numeric revenue and a month label for every point", () => {
    for (const region of EXPECTED_REGIONS) {
      for (const point of revenueByRegion[region]) {
        expect(typeof point.month).toBe("string");
        expect(point.month.trim().length).toBeGreaterThan(0);
        expect(Number.isFinite(point.revenue)).toBe(true);
      }
    }
  });

  it("has exactly 4 funnel stages per region", () => {
    for (const region of EXPECTED_REGIONS) {
      expect(funnelByRegion[region]).toHaveLength(4);
    }
  });

  it("has strictly decreasing funnel counts per region", () => {
    for (const region of EXPECTED_REGIONS) {
      const stages = funnelByRegion[region];
      for (let i = 1; i < stages.length; i += 1) {
        expect(stages[i].count).toBeLessThan(stages[i - 1].count);
      }
    }
  });

  it("has finite numeric counts and a stage label for every funnel stage", () => {
    for (const region of EXPECTED_REGIONS) {
      for (const stage of funnelByRegion[region]) {
        expect(typeof stage.stage).toBe("string");
        expect(stage.stage.trim().length).toBeGreaterThan(0);
        expect(Number.isFinite(stage.count)).toBe(true);
        expect(stage.count).toBeGreaterThan(0);
      }
    }
  });
});
