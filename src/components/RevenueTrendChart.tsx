import { formatCurrency, formatPercent } from "../lib/format";
import type { RevenueTrend } from "../lib/metrics";
import { describeDirection } from "../lib/overview";

import styles from "./RevenueTrendChart.module.css";

/** Props for {@link RevenueTrendChart}. */
export interface RevenueTrendChartProps {
  /** The monthly revenue trend for the currently selected region. */
  trend: RevenueTrend;
  /** Human-readable label of the selected region, used in the text alternative. */
  regionLabel: string;
}

/** Internal drawing area of the inline SVG, scaled to the container by `viewBox`. */
const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 240;
const PAD_X = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;
const PLOT_WIDTH = VIEW_WIDTH - PAD_X * 2;
const PLOT_HEIGHT = VIEW_HEIGHT - PAD_TOP - PAD_BOTTOM;
const BASELINE_Y = PAD_TOP + PLOT_HEIGHT;

/**
 * Presentational revenue trend chart for one region.
 *
 * The trend is drawn as an inline SVG (a `viewBox` scaled with `width: 100%`,
 * so it never forces the page sideways) whose `role="img"` text alternative
 * summarises the movement. The same numbers are repeated as a real table so
 * every value is available as text, inside an `overflow-x: auto` wrapper.
 *
 * It is a pure function of its props and holds no state, so it can be rendered
 * on the server and re-rendered on each region change.
 */
export default function RevenueTrendChart({
  trend,
  regionLabel,
}: RevenueTrendChartProps) {
  const points = trend.points;
  const direction = describeDirection(trend.direction);
  const summary =
    points.length === 0
      ? `No monthly revenue to show for ${regionLabel}.`
      : `${regionLabel} revenue trend. From ${points[0].month} to ${
          points[points.length - 1].month
        }, revenue moved from ${formatCurrency(
          trend.first,
        )} to ${formatCurrency(trend.last)}, ${direction.label.toLowerCase()} ${formatPercent(
          trend.changePct,
        )}.`;

  // A flat or empty series still gets a sensible scale, so the chart is never
  // divided by zero.
  const max = points.reduce(
    (highest, point) => Math.max(highest, point.revenue),
    0,
  );
  const safeMax = max > 0 ? max : 1;
  const stepX = points.length > 1 ? PLOT_WIDTH / (points.length - 1) : 0;
  const coords = points.map((point, index) => ({
    x: PAD_X + (points.length > 1 ? index * stepX : PLOT_WIDTH / 2),
    y:
      PAD_TOP +
      PLOT_HEIGHT -
      (Math.max(point.revenue, 0) / safeMax) * PLOT_HEIGHT,
  }));
  const line = coords
    .map(
      (coord, index) =>
        `${index === 0 ? "M" : "L"}${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`,
    )
    .join(" ");

  return (
    <figure className={styles.figure}>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-label={summary}
      >
        <line
          className={styles.axis}
          x1={PAD_X}
          y1={BASELINE_Y}
          x2={VIEW_WIDTH - PAD_X}
          y2={BASELINE_Y}
        />
        {coords.length > 0 ? (
          <path className={styles.line} d={line} fill="none" />
        ) : null}
        {coords.map((coord, index) => (
          <circle
            key={points[index].month}
            className={styles.point}
            cx={coord.x}
            cy={coord.y}
            r={4}
          />
        ))}
      </svg>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.caption}>
            Monthly revenue for {regionLabel}
          </caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.month}>
                <th scope="row">{point.month}</th>
                <td>{formatCurrency(point.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
