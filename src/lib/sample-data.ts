/**
 * Synthetic sample data for the local Sales Demo.
 *
 * This module holds a SMALL, hand-written synthetic dataset only. It contains
 * no real customer or personal data: no names, emails, addresses, phone
 * numbers, account or customer IDs, and no payment or health data. Every value
 * is a round, made-up whole-dollar figure that exists purely to make the demo
 * charts and metric functions meaningful when the site runs locally.
 *
 * The data is intentionally kept per region so the Live Demo's region control
 * can reuse the same series to slice revenue trend, conversion funnel and
 * regional split without touching any network, database or external service.
 *
 * Dependency-free: this module imports nothing.
 */

/** Identifiers for the three demo regions. */
export type RegionId = "emea" | "apac" | "americas";

/** Human-readable metadata for a region, used by labels and controls. */
export interface RegionInfo {
  id: RegionId;
  label: string;
}

/** The demo regions, in the order they should be presented. */
export const REGIONS: readonly RegionInfo[] = [
  { id: "emea", label: "EMEA" },
  { id: "apac", label: "APAC" },
  { id: "americas", label: "Americas" },
];

/** A single month of revenue for one region. */
export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
}

/** One stage of the sign-up conversion funnel for one region. */
export interface FunnelStage {
  stage: string;
  count: number;
}

/** Twelve months of synthetic revenue for each region. */
export const revenueByRegion: Record<RegionId, MonthlyRevenuePoint[]> = {
  emea: [
    { month: "Jan", revenue: 120000 },
    { month: "Feb", revenue: 132000 },
    { month: "Mar", revenue: 128000 },
    { month: "Apr", revenue: 145000 },
    { month: "May", revenue: 152000 },
    { month: "Jun", revenue: 160000 },
    { month: "Jul", revenue: 158000 },
    { month: "Aug", revenue: 171000 },
    { month: "Sep", revenue: 180000 },
    { month: "Oct", revenue: 192000 },
    { month: "Nov", revenue: 205000 },
    { month: "Dec", revenue: 214000 },
  ],
  apac: [
    { month: "Jan", revenue: 90000 },
    { month: "Feb", revenue: 96000 },
    { month: "Mar", revenue: 105000 },
    { month: "Apr", revenue: 101000 },
    { month: "May", revenue: 112000 },
    { month: "Jun", revenue: 120000 },
    { month: "Jul", revenue: 133000 },
    { month: "Aug", revenue: 141000 },
    { month: "Sep", revenue: 139000 },
    { month: "Oct", revenue: 152000 },
    { month: "Nov", revenue: 165000 },
    { month: "Dec", revenue: 178000 },
  ],
  americas: [
    { month: "Jan", revenue: 210000 },
    { month: "Feb", revenue: 225000 },
    { month: "Mar", revenue: 232000 },
    { month: "Apr", revenue: 228000 },
    { month: "May", revenue: 245000 },
    { month: "Jun", revenue: 258000 },
    { month: "Jul", revenue: 264000 },
    { month: "Aug", revenue: 279000 },
    { month: "Sep", revenue: 288000 },
    { month: "Oct", revenue: 301000 },
    { month: "Nov", revenue: 315000 },
    { month: "Dec", revenue: 332000 },
  ],
};

/** Four funnel stages per region; counts decrease from Visitors to Paid. */
export const funnelByRegion: Record<RegionId, FunnelStage[]> = {
  emea: [
    { stage: "Visitors", count: 48000 },
    { stage: "Sign-ups", count: 14400 },
    { stage: "Trials", count: 7200 },
    { stage: "Paid", count: 2160 },
  ],
  apac: [
    { stage: "Visitors", count: 36000 },
    { stage: "Sign-ups", count: 10800 },
    { stage: "Trials", count: 4860 },
    { stage: "Paid", count: 1458 },
  ],
  americas: [
    { stage: "Visitors", count: 62000 },
    { stage: "Sign-ups", count: 19800 },
    { stage: "Trials", count: 9900 },
    { stage: "Paid", count: 3168 },
  ],
};
