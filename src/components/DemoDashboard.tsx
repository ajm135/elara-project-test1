"use client";

import { useState } from "react";

import { DEFAULT_REGION_ID, deriveRegionDashboard } from "../lib/demo";
import { REGIONS, type RegionId, type RegionInfo } from "../lib/sample-data";

import FunnelChart from "./FunnelChart";
import RegionalSplitChart from "./RegionalSplitChart";
import RevenueTrendChart from "./RevenueTrendChart";

import styles from "./DemoDashboard.module.css";

/** Region ids come from the data, so the control ids stay `region-${id}`. */
function regionControlId(region: RegionInfo): string {
  return `region-${region.id}`;
}

/**
 * The interactive Live Demo dashboard.
 *
 * It is a Client Component because it owns one piece of state: the selected
 * region id, which starts at {@link DEFAULT_REGION_ID} (the leading region of
 * the bundled synthetic data). Every change re-derives the whole dashboard with
 * the pure {@link deriveRegionDashboard}, so the revenue trend and the
 * conversion funnel redraw for the new region while the regional split keeps
 * listing every region and highlights the selected one.
 *
 * All numbers are computed in `src/lib`, so this component only lays them out.
 * The region is never signalled by colour alone: the selected `<button>` is
 * `aria-pressed`, shows a check mark, and a visible line names the region.
 */
export default function DemoDashboard() {
  const [selectedRegion, setSelectedRegion] = useState<RegionId>(
    DEFAULT_REGION_ID,
  );
  const dashboard = deriveRegionDashboard(selectedRegion);

  return (
    <div className={styles.dashboard}>
      <section aria-labelledby="region-heading" className={styles.controls}>
        <h2 id="region-heading" className={styles.controlHeading}>
          Region
        </h2>
        <p className={styles.controlHint}>
          Choose a region to update the revenue trend and conversion funnel.
        </p>
        <div className={styles.controlGroup} role="group" aria-label="Region">
          {REGIONS.map((region) => {
            const isSelected = region.id === selectedRegion;
            return (
              <button
                key={region.id}
                type="button"
                id={regionControlId(region)}
                className={styles.regionButton}
                aria-pressed={isSelected}
                onClick={() => setSelectedRegion(region.id)}
              >
                {isSelected ? (
                  <span className={styles.check} aria-hidden="true">
                    ✓{" "}
                  </span>
                ) : null}
                {region.label}
              </button>
            );
          })}
        </div>
        <p className={styles.currentRegion}>
          Showing data for {dashboard.region.label}
        </p>
      </section>

      <section id="revenue-trend" className={styles.card}>
        <h2 className={styles.cardHeading}>Revenue trend</h2>
        <RevenueTrendChart
          trend={dashboard.trend}
          regionLabel={dashboard.region.label}
        />
      </section>

      <section id="conversion-funnel" className={styles.card}>
        <h2 className={styles.cardHeading}>Conversion funnel</h2>
        <FunnelChart
          funnel={dashboard.funnel}
          regionLabel={dashboard.region.label}
        />
      </section>

      <section id="regional-split" className={styles.card}>
        <h2 className={styles.cardHeading}>Regional split</h2>
        <RegionalSplitChart
          split={dashboard.split}
          selectedRegionId={dashboard.region.id}
        />
      </section>

      <section id="decision-callout" className={styles.card}>
        <h2 className={styles.cardHeading}>Decision</h2>
        <p className={styles.decision}>{dashboard.decision}</p>
      </section>

      <p className={styles.linkRow}>
        <a className={styles.overviewLink} href="/">
          Back to the overview
        </a>
      </p>
    </div>
  );
}
