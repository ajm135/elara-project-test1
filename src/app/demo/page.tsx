import type { Metadata } from "next";

import DemoDashboard from "../../components/DemoDashboard";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Live demo | Elara Demo Site",
  description:
    "An interactive dashboard over bundled synthetic sample data: revenue trend, conversion funnel, regional split and the decisions they drive.",
};

/**
 * The public Live Demo page at `/demo`.
 *
 * It is a Server Component: it renders the page shell (`<main>` and the single
 * `<h1>`) and hands the interactive dashboard to the `DemoDashboard` Client
 * Component, which owns the selected-region state. All numbers come from the
 * pure `src/lib/demo.ts` over the bundled synthetic data.
 */
export default function DemoPage() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Live demo</p>
        <h1 className={styles.heading}>
          Explore the numbers behind the decisions
        </h1>
        <p className={styles.lede}>
          Every chart below is built from the same small sample dataset used on
          the overview page. Pick a region to update the revenue trend and the
          conversion funnel; the regional split always shows all three regions.
        </p>
      </header>

      <DemoDashboard />
    </main>
  );
}
