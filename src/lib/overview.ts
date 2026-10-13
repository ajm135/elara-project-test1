/**
 * Pure derivation of the Overview page's headline KPIs.
 *
 * This module turns the bundled synthetic data into the handful of numbers the
 * Overview page tells its story with. It reuses the metric functions in
 * `src/lib/metrics.ts` and the typed dataset in `src/lib/sample-data.ts`; it
 * performs no I/O, never reads the clock or randomness, never touches the
 * environment and never mutates its inputs, so the same inputs always produce
 * the same outputs and it can be unit tested on its own.
 *
 * It returns raw numbers and ratios only: display formatting stays in
 * `src/lib/format.ts`.
 */

import {
  conversionFunnel,
  regionalSplit,
  revenueTrend,
  type ConversionFunnel,
  type RegionalShare,
  type RevenueTrend,
} from "./metrics";
import {
  REGIONS,
  funnelByRegion,
  revenueByRegion,
  type FunnelStage,
  type MonthlyRevenuePoint,
  type RegionId,
  type RegionInfo,
} from "./sample-data";

/** Monthly revenue series keyed by region. */
export type RevenueByRegion = Readonly<
  Record<RegionId, readonly MonthlyRevenuePoint[]>
>;

/** Funnel stage lists keyed by region. */
export type FunnelByRegion = Readonly<Record<RegionId, readonly FunnelStage[]>>;

/** The headline numbers shown as KPI tiles on the Overview page. */
export interface OverviewKpis {
  /** Revenue trend for the combined all-regions series. */
  trend: RevenueTrend;
  /** Total revenue across every region, from {@link regionalSplit}. */
  totalRevenue: number;
  /** Visitor-to-paid funnel for the combined all-regions funnel. */
  funnel: ConversionFunnel;
  /** Visitor-to-paid conversion ratio (`funnel.overallRate`). */
  visitorToPaidRate: number;
  /** Per-region revenue and share, from {@link regionalSplit}. */
  regions: readonly RegionalShare[];
  /** The region with the highest revenue, or `null` when there is none. */
  leadingRegion: RegionalShare | null;
}

/** A text label and arrow symbol describing a trend direction. */
export interface DirectionDescriptor {
  /** Word form of the direction, e.g. `"Up"`. */
  label: string;
  /** Non-colour symbol for the direction, e.g. `"▲"`. */
  symbol: string;
}

/**
 * Combine the per-region monthly series into one all-regions series.
 *
 * Month labels come from the first region that has data and each month's
 * revenue is the sum across regions. Regions with fewer points than that first
 * one contribute `0` for the missing months, so a ragged record never throws.
 */
export function combineRevenueSeries(
  revenueByRegion: RevenueByRegion,
  regions: readonly RegionInfo[],
): MonthlyRevenuePoint[] {
  const series = regions
    .map((region) => revenueByRegion[region.id])
    .filter(
      (points): points is readonly MonthlyRevenuePoint[] =>
        Array.isArray(points) && points.length > 0,
    );

  const template = series.at(0);
  if (template === undefined) {
    return [];
  }

  return template.map((point, index) => {
    let revenue = 0;
    for (const points of series) {
      revenue += points.at(index)?.revenue ?? 0;
    }
    return { month: point.month, revenue };
  });
}

/**
 * Combine the per-region funnel stage lists into one all-regions funnel.
 *
 * Stage labels come from the first region that has stages and each stage's
 * count is the sum across regions by stage index. Regions with fewer stages
 * contribute `0` for the missing stages, so a ragged record never throws.
 */
export function combineFunnels(
  funnelByRegion: FunnelByRegion,
  regions: readonly RegionInfo[],
): FunnelStage[] {
  const series = regions
    .map((region) => funnelByRegion[region.id])
    .filter(
      (stages): stages is readonly FunnelStage[] =>
        Array.isArray(stages) && stages.length > 0,
    );

  const template = series.at(0);
  if (template === undefined) {
    return [];
  }

  return template.map((stage, index) => {
    let count = 0;
    for (const stages of series) {
      count += stages.at(index)?.count ?? 0;
    }
    return { stage: stage.stage, count };
  });
}

/**
 * Pick the region with the highest revenue.
 *
 * Returns `null` for an empty list and otherwise the first entry with the
 * greatest revenue, so ties are broken by the input order.
 */
export function pickLeadingRegion(
  entries: readonly RegionalShare[],
): RegionalShare | null {
  let leader: RegionalShare | null = null;
  for (const entry of entries) {
    if (leader === null || entry.revenue > leader.revenue) {
      leader = entry;
    }
  }
  return leader;
}

/**
 * Map a trend direction to a text label and a non-colour arrow symbol.
 *
 * Direction is never signalled by colour alone; callers pair the colour with
 * this label and symbol.
 */
export function describeDirection(
  direction: RevenueTrend["direction"],
): DirectionDescriptor {
  switch (direction) {
    case "up":
      return { label: "Up", symbol: "▲" };
    case "down":
      return { label: "Down", symbol: "▼" };
    default:
      return { label: "Flat", symbol: "▬" };
  }
}

/**
 * Derive the Overview headline KPIs from per-region inputs.
 *
 * Regions are only passed to {@link regionalSplit} when the revenue record
 * actually has a series for them, so a partial record degrades gracefully
 * instead of throwing.
 */
export function deriveOverview(
  revenueByRegion: RevenueByRegion,
  funnelByRegion: FunnelByRegion,
  regions: readonly RegionInfo[],
): OverviewKpis {
  const trend = revenueTrend(combineRevenueSeries(revenueByRegion, regions));
  const funnel = conversionFunnel(combineFunnels(funnelByRegion, regions));
  const presentRegions = regions.filter((region) =>
    Array.isArray(revenueByRegion[region.id]),
  );
  const split = regionalSplit(revenueByRegion, presentRegions);

  return {
    trend,
    totalRevenue: split.total,
    funnel,
    visitorToPaidRate: funnel.overallRate,
    regions: split.entries,
    leadingRegion: pickLeadingRegion(split.entries),
  };
}

/** Derive the Overview headline KPIs from the bundled synthetic dataset. */
export function deriveBundledOverview(): OverviewKpis {
  return deriveOverview(revenueByRegion, funnelByRegion, REGIONS);
}
