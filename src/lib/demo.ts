/**
 * Pure derivation of the Live Demo dashboard's numbers.
 *
 * This module turns the bundled synthetic data into the numbers the `/demo`
 * page shows for one selected region: its revenue trend, its conversion funnel,
 * the cross-region revenue split and one plain-language decision sentence. It
 * reuses the metric functions in `src/lib/metrics.ts`, the helpers in
 * `src/lib/overview.ts`, the typed dataset in `src/lib/sample-data.ts` and the
 * percent formatter in `src/lib/format.ts`.
 *
 * It is deterministic and side-effect free: no UI, no I/O, no clock, no
 * randomness, no environment and no third-party dependency. It never mutates
 * its inputs, so the same inputs always produce the same outputs and the module
 * can be unit tested on its own. Apart from the decision sentence, which is
 * text by definition, the values it returns are raw numbers and ratios.
 */

import { formatPercent } from "./format";
import {
  conversionFunnel,
  regionalSplit,
  revenueTrend,
  type ConversionFunnel,
  type RegionalShare,
  type RegionalSplit,
  type RevenueTrend,
} from "./metrics";
import { describeDirection, pickLeadingRegion } from "./overview";
import {
  REGIONS,
  funnelByRegion,
  revenueByRegion,
  type FunnelStage,
  type MonthlyRevenuePoint,
  type RegionId,
  type RegionInfo,
} from "./sample-data";

/**
 * The region the Live Demo opens on: the leading region of the bundled data
 * (the highest total revenue, `"americas"`).
 *
 * It is derived from the data rather than hard-coded so it stays correct if the
 * sample dataset changes, and it falls back to {@link FALLBACK_REGION_ID} when
 * the data names no leader. It is computed once at module load and is safe to
 * compare against `useState` initial values without re-deriving.
 */
export const DEFAULT_REGION_ID: RegionId = bundledLeadingRegionId();

/** The numbers the Live Demo shows for one selected region. */
export interface RegionDashboard {
  /** Metadata (id and human-readable label) for the selected region. */
  region: RegionInfo;
  /** Monthly revenue trend for the selected region. */
  trend: RevenueTrend;
  /** Conversion funnel for the selected region. */
  funnel: ConversionFunnel;
  /** Cross-region revenue split, always covering every bundled region. */
  split: RegionalSplit;
  /** The region with the highest revenue, or `null` when there is none. */
  leader: RegionalShare | null;
  /** One plain-language sentence describing the decision this region implies. */
  decision: string;
}

/**
 * Derive the dashboard for one region from the bundled synthetic data.
 *
 * The trend comes from {@link revenueTrend} over that region's monthly series,
 * the funnel from {@link conversionFunnel} over that region's stages, and the
 * split from {@link regionalSplit} across every bundled region (the regional
 * view always shows all regions and highlights the selected one). The leader is
 * picked with {@link pickLeadingRegion}.
 *
 * A region id that is missing or unknown degrades instead of throwing: it keeps
 * a label derived from the id, gets empty trend and funnel inputs (so every
 * metric is `0` and never `NaN`) and still receives the full cross-region split.
 */
export function deriveRegionDashboard(regionId: RegionId): RegionDashboard {
  const region = resolveRegion(regionId);
  const trend = revenueTrend(revenueFor(region.id));
  const funnel = conversionFunnel(funnelFor(region.id));
  const split = regionalSplit(revenueByRegion, REGIONS);
  const leader = pickLeadingRegion(split.entries);

  return {
    region,
    trend,
    funnel,
    split,
    leader,
    decision: buildDecision(region, trend, funnel, leader),
  };
}

/** Derive the dashboard the `/demo` page opens on, for {@link DEFAULT_REGION_ID}. */
export function deriveBundledDashboard(): RegionDashboard {
  return deriveRegionDashboard(DEFAULT_REGION_ID);
}

/**
 * Build one short, plain-language decision sentence for a region.
 *
 * The sentence names the region label, its trend direction and percentage
 * change, its visitor-to-paid rate and the leading region (or the absence of
 * one). It is pure: it reads only its arguments and mutates nothing.
 *
 * It degrades without throwing and never yields `NaN`: a blank or missing
 * region label falls back to the region id, an unknown region id falls back to
 * the bundled list, and any non-finite ratio is read as `0`.
 *
 * The word "Decision" is the page's heading and is intentionally not part of
 * this string.
 */
export function buildDecision(
  region: RegionInfo,
  trend: RevenueTrend,
  funnel: ConversionFunnel,
  leader: RegionalShare | null,
): string {
  const label = isNonEmptyString(region.label)
    ? region.label
    : resolveRegion(region.id).label;
  const direction = describeDirection(trend.direction).label.toLowerCase();
  const change = formatPercent(finite(trend.changePct));
  const rate = formatPercent(finite(funnel.overallRate));
  const leaderClause =
    leader === null || !isNonEmptyString(leader.label)
      ? "so we are holding the growth budget until one region clearly leads"
      : `so we are keeping the growth budget with ${leader.label}, the region that earns the most`;

  return `${label} revenue is ${direction} ${change} and ${rate} of visitors become paying customers, ${leaderClause}.`;
}

/** Used when the bundled data names no leading region. */
const FALLBACK_REGION_ID: RegionId = "americas";

/** The id of the bundled region with the highest revenue, or the fallback. */
function bundledLeadingRegionId(): RegionId {
  const entries = regionalSplit(revenueByRegion, REGIONS).entries;
  const leader = pickLeadingRegion(entries);
  return leader === null ? FALLBACK_REGION_ID : leader.region;
}

/** True when a value is a non-blank string. */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Resolve region metadata, tolerating an id that is not in the bundled list.
 *
 * Known ids get the bundled label; unknown ones keep their own id with an
 * uppercase label so a dashboard can still name what it was asked for. The
 * returned object is always a fresh copy, so callers cannot mutate {@link REGIONS}.
 */
function resolveRegion(regionId: RegionId): RegionInfo {
  const known = REGIONS.find((region) => region.id === regionId);
  if (known !== undefined) {
    return { id: known.id, label: known.label };
  }

  return {
    id: isNonEmptyString(regionId) ? regionId : FALLBACK_REGION_ID,
    label: isNonEmptyString(regionId)
      ? regionId.trim().toUpperCase()
      : "Unknown region",
  };
}

/** The bundled monthly revenue for a region, or an empty series when absent. */
function revenueFor(regionId: RegionId): readonly MonthlyRevenuePoint[] {
  const points = revenueByRegion[regionId];
  return Array.isArray(points) ? points : [];
}

/** The bundled funnel stages for a region, or an empty list when absent. */
function funnelFor(regionId: RegionId): readonly FunnelStage[] {
  const stages = funnelByRegion[regionId];
  return Array.isArray(stages) ? stages : [];
}

/** A finite number, or `0`, so a derived metric or sentence is never `NaN`. */
function finite(value: number): number {
  return Number.isFinite(value) ? value : 0;
}
