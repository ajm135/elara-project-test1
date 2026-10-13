import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import HomePage from "../../src/app/page";
import { formatCurrency, formatPercent } from "../../src/lib/format";
import { deriveBundledOverview } from "../../src/lib/overview";

/**
 * The KPI values are derived from the bundled SYNTHETIC sample dataset and
 * formatted by `src/lib/format.ts`, so these tests assert the page against the
 * same numbers the data produces rather than hard-coded strings.
 */
describe("HomePage (/)", () => {
  const html = renderToStaticMarkup(<HomePage />);
  const kpis = deriveBundledOverview();

  it("renders a <main> landmark", () => {
    expect(html).toContain("<main");
    expect(html).toContain("</main>");
  });

  it("renders the headline in an <h1>", () => {
    expect(html).toContain("<h1");
    expect(html).toContain("</h1>");
    expect(html).toContain(
      "How we use analytics to make critical business decisions",
    );
  });

  it("links to the live demo at /demo", () => {
    expect(html).toContain('href="/demo"');
  });

  it("shows the total revenue KPI formatted from the bundled data", () => {
    expect(html).toContain(formatCurrency(kpis.totalRevenue));
  });

  it("shows the revenue growth KPI formatted from the bundled data", () => {
    expect(html).toContain(formatPercent(kpis.trend.changePct));
  });

  it("shows the visitor-to-paid conversion KPI formatted from the bundled data", () => {
    expect(html).toContain(formatPercent(kpis.visitorToPaidRate));
  });

  it("shows the decision proof points", () => {
    expect(html).toContain("Decisions we made from these numbers");
    expect(html).toContain("Revenue climbed in every region");
  });
});
