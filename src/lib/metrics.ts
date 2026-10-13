/**
 * Pure, deterministic metric functions for the Sales Demo.
 *
 * Revenue trend, conversion funnel and regional split are computed here as
 * plain functions over the bundled synthetic data. They perform no I/O, never
 * read the clock or randomness, never touch the environment and never mutate
 * their inputs, so the same inputs always produce the same outputs and they can
 * be unit tested on their own.
 *
 * They return raw numbers and ratios only: display formatting stays in
 * `src/lib/format.ts`.
 */

import type {
  FunnelStage,
  MonthlyRevenuePoint,
  RegionId,
  RegionInfo,
} from "./sample-data";

/** Result of {@link revenueTrend}. */
export interface RevenueTrend {
  points: MonthlyRevenuePoint[];
  first: number;
  last: number;
  changePct: number;
  direction: "up" | "down" | "flat";
}

/** One funnel stage with its conversion ratio relative to the first stage. */
export interface FunnelStep {
  stage: string;
  count: number;
  conversionRate: number;
}

/** Result of {@link conversionFunnel}. */
export interface ConversionFunnel {
  steps: FunnelStep[];
  overallRate: number;
}

/** One region's revenue and its share of the total. */
export interface RegionalShare {
  region: RegionId;
  label: string;
  revenue: number;
  share: number;
}

/** Result of {@link regionalSplit}. */
export interface RegionalSplit {
  entries: RegionalShare[];
  total: number;
}

/**
 * Summarise a monthly revenue series.
 *
 * `changePct` is a ratio (`(last - first) / first`), not a percentage, and is
 * `0` when the series is empty or the first value is zero (so it is never
 * `NaN`). `direction` is `'flat'` when `changePct` is `0`.
 */
export function revenueTrend(
  points: readonly MonthlyRevenuePoint[],
): RevenueTrend {
  if (points.length === 0) {
    return { points: [], first: 0, last: 0, changePct: 0, direction: "flat" };
  }

  const copied = points.map((point) => ({
    month: point.month,
    revenue: point.revenue,
  }));
  const first = copied[0].revenue;
  const last = copied[copied.length - 1].revenue;
  const changePct = first === 0 ? 0 : (last - first) / first;
  const direction: RevenueTrend["direction"] =
    changePct > 0 ? "up" : changePct < 0 ? "down" : "flat";

  return { points: copied, first, last, changePct, direction };
}

/**
 * Turn funnel stages into per-stage conversion ratios.
 *
 * Each `conversionRate` is that stage's count divided by the first stage's
 * count, and `overallRate` is the last stage divided by the first. When the
 * first count is `0` or the input is empty every rate is `0`, never `NaN`.
 */
export function conversionFunnel(
  stages: readonly FunnelStage[],
): ConversionFunnel {
  if (stages.length === 0) {
    return { steps: [], overallRate: 0 };
  }

  const firstCount = stages[0].count;
  const steps = stages.map((stage) => ({
    stage: stage.stage,
    count: stage.count,
    conversionRate: firstCount === 0 ? 0 : stage.count / firstCount,
  }));
  const lastCount = stages[stages.length - 1].count;
  const overallRate = firstCount === 0 ? 0 : lastCount / firstCount;

  return { steps, overallRate };
}

/** Sum the monthly revenue of a single region. */
function sumRevenue(points: readonly MonthlyRevenuePoint[]): number {
  return points.reduce((total, point) => total + point.revenue, 0);
}

/**
 * Split total revenue across regions.
 *
 * Each region's `revenue` is the sum of its monthly points and its `share` is
 * that revenue divided by the grand total. When the total is `0` or the input
 * is empty, every share is `0`, never `NaN`.
 */
export function regionalSplit(
  revenueByRegion: Readonly<Record<RegionId, readonly MonthlyRevenuePoint[]>>,
  regions: readonly RegionInfo[],
): RegionalSplit {
  const revenues = regions.map((region) => ({
    region: region.id,
    label: region.label,
    revenue: sumRevenue(revenueByRegion[region.id]),
  }));
  const total = revenues.reduce((sum, entry) => sum + entry.revenue, 0);
  const entries = revenues.map((entry) => ({
    region: entry.region,
    label: entry.label,
    revenue: entry.revenue,
    share: total === 0 ? 0 : entry.revenue / total,
  }));

  return { entries, total };
}
