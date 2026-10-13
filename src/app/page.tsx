import { KpiTile } from "../components/KpiTile";
import { formatCurrency, formatPercent } from "../lib/format";
import { deriveBundledOverview, describeDirection } from "../lib/overview";

import styles from "./page.module.css";

/**
 * Short, plain-language decisions the team made from the headline numbers.
 * Kept as data so the component only lays them out.
 */
const PROOF_POINTS: readonly string[] = [
  "Revenue climbed in every region, so we moved the budget reserved for a fourth market into the two fastest-growing ones.",
  "Fewer than one visitor in twenty becomes a paying customer, so we shortened the sign-up flow that sat between the two.",
  "The Americas earns the largest share of revenue, so the first two account managers were hired there.",
  "The trend, the funnel and the split all point the same way, so we set one quarterly revenue target instead of separate regional ones.",
];

/**
 * The public Overview page at `/`.
 *
 * It renders the headline story, headline KPI tiles derived by
 * `src/lib/overview.ts` and a plain link to the live demo.
 */
export default function HomePage() {
  const kpis = deriveBundledOverview();
  const direction = describeDirection(kpis.trend.direction);
  const leader = kpis.leadingRegion;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Analytics at work</p>
        <h1>How we use analytics to make critical business decisions</h1>
        <p className={styles.lede}>
          Every number below comes from one small sample dataset and points to a
          decision we actually made. Open the live demo to explore the same data
          yourself.
        </p>
      </header>

      <section aria-labelledby="headline-numbers">
        <h2 id="headline-numbers" className={styles.sectionHeading}>
          Headline numbers
        </h2>
        <ul className={styles.kpiGrid} role="list">
          <KpiTile
            label="Total revenue"
            value={formatCurrency(kpis.totalRevenue)}
            detail="All regions, last 12 months"
          />
          <KpiTile
            label="Revenue growth"
            value={`${direction.symbol} ${formatPercent(kpis.trend.changePct)}`}
            detail={`${direction.label} versus the first month`}
          />
          <KpiTile
            label="Visitor-to-paid conversion"
            value={formatPercent(kpis.visitorToPaidRate)}
            detail="All regions, visitors through to paid"
          />
          <KpiTile
            label="Leading region"
            value={leader === null ? "No data" : leader.label}
            detail={
              leader === null
                ? "No regions in the sample dataset"
                : `${formatPercent(leader.share)} of total revenue`
            }
          />
        </ul>
      </section>

      <section aria-labelledby="proof-points">
        <h2 id="proof-points" className={styles.sectionHeading}>
          Decisions we made from these numbers
        </h2>
        <ul className={styles.proofList}>
          {PROOF_POINTS.map((point) => (
            <li key={point} className={styles.proofItem}>
              {point}
            </li>
          ))}
        </ul>
      </section>

      <p className={styles.demoRow}>
        <a className={styles.demoLink} href="/demo">
          Open the live demo
        </a>
      </p>
    </main>
  );
}
