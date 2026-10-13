import { formatPercent } from "../lib/format";
import type { ConversionFunnel } from "../lib/metrics";

import styles from "./FunnelChart.module.css";

/** Props for {@link FunnelChart}. */
export interface FunnelChartProps {
  /** The conversion funnel stages for the currently selected region. */
  funnel: ConversionFunnel;
  /** Human-readable label of the selected region, used in the text alternative. */
  regionLabel: string;
}

/** Group thousands without pulling in `Intl`, which would vary by environment. */
function formatCount(value: number): string {
  const safe = Number.isFinite(value) ? Math.round(value) : 0;
  return String(safe).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** A stage's ratio as a width percentage, clamped to `0`–`100` and never `NaN`. */
function toWidth(rate: number): string {
  const percent = Number.isFinite(rate) ? rate * 100 : 0;
  const clamped = Math.min(Math.max(percent, 0), 100);
  return `${clamped.toFixed(2)}%`;
}

/**
 * Presentational conversion funnel for one region.
 *
 * Each stage is a CSS bar whose width is the stage's conversion ratio, so the
 * funnel redraws whenever the selected region changes. The bars are purely
 * decorative (`aria-hidden`), so they never swallow the visible stage names
 * and values into one image. The funnel's programmatic description sits on its
 * own visually hidden `role="img"` element, and every stage's count and rate is
 * repeated in a real table inside an `overflow-x: auto` wrapper. State is not
 * signalled by colour alone: the value text sits beside every bar.
 *
 * It is a pure function of its props and holds no state.
 */
export default function FunnelChart({ funnel, regionLabel }: FunnelChartProps) {
  const steps = funnel.steps;
  const summary =
    steps.length === 0
      ? `No conversion funnel stages to show for ${regionLabel}.`
      : `${regionLabel} conversion funnel. ${steps
          .map((step) => `${step.stage}: ${formatCount(step.count)}`)
          .join(", ")}. ${formatPercent(
          funnel.overallRate,
        )} of visitors become paying customers.`;

  return (
    <figure className={styles.figure}>
      <span
        className={styles.visuallyHidden}
        role="img"
        aria-label={summary}
      />
      <div className={styles.bars} aria-hidden="true">
        {steps.map((step) => (
          <div key={step.stage} className={styles.row}>
            <span className={styles.stage}>{step.stage}</span>
            <span className={styles.track}>
              <span
                className={styles.fill}
                style={{ width: toWidth(step.conversionRate) }}
              />
            </span>
            <span className={styles.value}>
              {formatPercent(step.conversionRate)}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.caption}>
            Conversion funnel for {regionLabel}
          </caption>
          <thead>
            <tr>
              <th scope="col">Stage</th>
              <th scope="col">People</th>
              <th scope="col">Conversion</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step) => (
              <tr key={step.stage}>
                <th scope="row">{step.stage}</th>
                <td>{formatCount(step.count)}</td>
                <td>{formatPercent(step.conversionRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
