import { formatCurrency, formatPercent } from "../lib/format";
import type { RegionalSplit } from "../lib/metrics";
import type { RegionId } from "../lib/sample-data";

import styles from "./RegionalSplitChart.module.css";

/** Props for {@link RegionalSplitChart}. */
export interface RegionalSplitChartProps {
  /** The cross-region split, always covering every bundled region. */
  split: RegionalSplit;
  /** Id of the region the dashboard is currently showing. */
  selectedRegionId: RegionId;
}

/** A share as a width percentage, clamped to `0`–`100` and never `NaN`. */
function toWidth(share: number): string {
  const percent = Number.isFinite(share) ? share * 100 : 0;
  const clamped = Math.min(Math.max(percent, 0), 100);
  return `${clamped.toFixed(2)}%`;
}

/**
 * Presentational regional revenue split.
 *
 * It always lists every bundled region regardless of which one is selected and
 * marks the selected one with text (never colour alone), so a reader who cannot
 * see the bars still knows which region the dashboard is showing. Each bar is a
 * CSS bar whose width is the region's revenue share; the bars are purely
 * decorative (`aria-hidden`), so they never swallow the visible region names
 * and values into one image. The split's programmatic description sits on its
 * own visually hidden `role="img"` element, and every region's revenue and
 * share is repeated in a table inside an `overflow-x: auto` wrapper.
 *
 * It is a pure function of its props and holds no state.
 */
export default function RegionalSplitChart({
  split,
  selectedRegionId,
}: RegionalSplitChartProps) {
  const entries = split.entries;
  const selected = entries.find((entry) => entry.region === selectedRegionId);
  const summary =
    entries.length === 0
      ? "No regional revenue to show."
      : `Regional revenue split. ${entries
          .map(
            (entry) =>
              `${entry.label}: ${formatCurrency(
                entry.revenue,
              )} (${formatPercent(entry.share)})`,
          )
          .join(", ")}.${
          selected === undefined
            ? ""
            : ` The selected region is ${selected.label}.`
        }`;

  return (
    <figure className={styles.figure}>
      <span
        className={styles.visuallyHidden}
        role="img"
        aria-label={summary}
      />
      <div className={styles.bars} aria-hidden="true">
        {entries.map((entry) => {
          const isSelected = entry.region === selectedRegionId;
          return (
            <div
              key={entry.region}
              className={
                isSelected ? `${styles.row} ${styles.rowSelected}` : styles.row
              }
            >
              <span className={styles.label}>
                {entry.label}
                {isSelected ? (
                  <span className={styles.selectedMark}> (selected)</span>
                ) : null}
              </span>
              <span className={styles.track}>
                <span
                  className={styles.fill}
                  style={{ width: toWidth(entry.share) }}
                />
              </span>
              <span className={styles.value}>
                {formatCurrency(entry.revenue)}
                <span className={styles.share}> · {formatPercent(entry.share)}</span>
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.caption}>
            Revenue by region, all regions
          </caption>
          <thead>
            <tr>
              <th scope="col">Region</th>
              <th scope="col">Revenue</th>
              <th scope="col">Share</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isSelected = entry.region === selectedRegionId;
              return (
                <tr key={entry.region} aria-current={isSelected || undefined}>
                  <th scope="row">{entry.label}</th>
                  <td>{formatCurrency(entry.revenue)}</td>
                  <td>{formatPercent(entry.share)}</td>
                  <td>{isSelected ? "Selected" : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
