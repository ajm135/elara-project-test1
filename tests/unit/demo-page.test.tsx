import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import DemoPage from "../../src/app/demo/page";
import { deriveBundledDashboard } from "../../src/lib/demo";
import { formatCurrency, formatPercent } from "../../src/lib/format";

/**
 * The Live Demo page renders its numbers from the bundled SYNTHETIC sample
 * dataset through `src/lib/demo.ts` and formats them with `src/lib/format.ts`,
 * so these tests assert the page against the same derived values the data
 * produces rather than hard-coded strings. The page is rendered to static
 * markup in the node environment, which exercises the server render and the
 * Client Component's initial region; the browser click behaviour is covered by
 * Elara's own live check.
 */
describe("DemoPage (/demo)", () => {
  const html = renderToStaticMarkup(<DemoPage />);
  const dashboard = deriveBundledDashboard();

  /** The rendered `<section id="...">` for one labelled view. */
  function sectionById(id: string): string {
    const match = html.match(
      new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`),
    );

    if (match === null) {
      throw new Error(`No <section id="${id}"> was rendered.`);
    }

    return match[0];
  }

  it("renders a <main> landmark", () => {
    expect(html).toContain("<main");
    expect(html).toContain("</main>");
  });

  it("renders the revenue trend view with the text 'Revenue trend'", () => {
    const view = sectionById("revenue-trend");

    expect(view).toContain("<h2");
    expect(view).toContain("Revenue trend");
  });

  it("renders the conversion funnel view with the text 'Conversion funnel'", () => {
    const view = sectionById("conversion-funnel");

    expect(view).toContain("<h2");
    expect(view).toContain("Conversion funnel");
  });

  it("renders the regional split view with the text 'Regional split'", () => {
    const view = sectionById("regional-split");

    expect(view).toContain("<h2");
    expect(view).toContain("Regional split");
  });

  it("renders the decision callout containing 'Decision'", () => {
    const view = sectionById("decision-callout");

    expect(view).toContain("<h2");
    expect(view).toContain("Decision");
  });

  it("renders the region controls as buttons with the exact ids", () => {
    expect(html).toMatch(/<button[^>]*id="region-emea"/);
    expect(html).toMatch(/<button[^>]*id="region-apac"/);
    expect(html).toMatch(/<button[^>]*id="region-americas"/);
  });

  it("renders a plain link back to the overview at /", () => {
    expect(html).toMatch(/<a[^>]*href="\/"/);
    expect(html).toContain("Back to the overview");
  });

  it("shows the decision sentence derived from the bundled dashboard", () => {
    expect(html).toContain(dashboard.decision);
  });

  it("starts on the leading bundled region", () => {
    expect(html).toContain(`Showing data for ${dashboard.region.label}`);
    expect(html).toContain(`>${dashboard.region.label}</button>`);
  });

  it("shows KPI-like values formatted from the derived dashboard, not literals", () => {
    expect(html).toContain(formatCurrency(dashboard.trend.first));
    expect(html).toContain(formatPercent(dashboard.trend.changePct));
    expect(html).toContain(formatPercent(dashboard.funnel.overallRate));

    for (const entry of dashboard.split.entries) {
      expect(html).toContain(formatCurrency(entry.revenue));
      expect(html).toContain(formatPercent(entry.share));
    }
  });
});
