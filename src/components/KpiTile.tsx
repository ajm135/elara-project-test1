import styles from "./KpiTile.module.css";

/** Props for {@link KpiTile}. */
export interface KpiTileProps {
  /** Short name of the measure, e.g. `"Revenue growth"`. */
  label: string;
  /** Formatted headline value, e.g. `"$6,666,000.00"`. */
  value: string;
  /** Optional secondary line giving context for the value. */
  detail?: string;
}

/**
 * One headline KPI: a label, a formatted value and an optional detail line.
 *
 * Renders as a list item so a set of tiles forms a semantic list. All values
 * arrive already formatted, so the component holds no business logic.
 */
export function KpiTile({ label, value, detail }: KpiTileProps) {
  return (
    <li className={styles.tile}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
      {detail ? <p className={styles.detail}>{detail}</p> : null}
    </li>
  );
}
