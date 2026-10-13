# 0002. Build the Live Demo dashboard with client-side state and no chart library

- Status: Accepted
- Date: 2026-10-13
- Milestone: 4 (Live demo dashboard, `/demo`)

## Context

Milestone 4 adds the public Live Demo at `/demo`: an interactive dashboard over
the same small synthetic dataset bundled with the project. It must show a
revenue trend, a conversion funnel and a regional split, plus a decision
callout, and it must let the visitor pick a region (`EMEA`, `APAC`, `Americas`)
that updates the trend and the funnel while the regional split keeps showing
every region.

The project runs locally for demos with no external hosting, no sign-in, no
database and no external services, and it must stay responsive from 375px up and
meet WCAG 2.1 AA. `src/lib/demo.ts` already derives all the numbers as pure
functions over `src/lib/sample-data.ts`.

Two decisions were still open:

1. How the selected region is held and re-derived.
2. How the charts are drawn.

## Decision

### Client component with `useState` for the selected region

`src/components/DemoDashboard.tsx` is a Client Component (`'use client'`) that
holds one piece of state:

* `selectedRegion` starts at `DEFAULT_REGION_ID` (the leading region of the
  bundled data, `"americas"`) imported from `src/lib/demo.ts`.
* Every change calls `deriveRegionDashboard(selectedRegion)` and renders the
  returned `RegionDashboard`, so the revenue trend and conversion funnel redraw
  for the new region and the regional split re-renders with the new selection
  highlighted.

The surrounding route, `src/app/demo/page.tsx`, stays a Server Component: it
owns the `<main>` landmark, the single `<h1>` and the static copy, so only the
interactive island ships client JavaScript. This follows the App Router
guidance in ADR 0001 (server by default, client only where interactivity
requires it) and keeps the derivation logic in `src/lib`, where it is testable
on its own.

The region controls are native `<button type="button">` elements inside a
`role="group"` labelled "Region", with ids `region-${id}` derived from `REGIONS`
and `aria-pressed` on the selected one. The selection is never signalled by
colour alone: the selected button is `aria-pressed` and shows a check mark, a
visible line reads "Showing data for …", and the regional split marks the
selected row with "(selected)" text and a table status column.

### No chart dependency: inline SVG and CSS only

We draw every chart ourselves rather than adding a chart or icon library:

* The revenue trend is an inline `<svg>` with a `viewBox` scaled by
  `width: 100%`, so it resizes without forcing the page sideways.
* The conversion funnel and the regional split are CSS bars whose widths are
  percentages (`width: …%`).
* Each chart carries a `role="img"` text alternative (`aria-label`) with a
  plain-language summary, and repeats its underlying numbers as a real table
  inside an `overflow-x: auto` wrapper, so the data is available as text.
* The page root sets a system font stack, `box-sizing: border-box`, a
  `max-width` of `72rem`, `padding: 2rem 1rem`, `clamp()` headings and
  `overflow-wrap: anywhere`.

This keeps the dependency list at `next`, `react` and `react-dom` (as recorded
in ADR 0001), removes a whole category of supply-chain and version risk, and
means the charts render identically on the server and in every supported
browser without extra CSS or JavaScript to load.

## Consequences

* The dashboard's interactivity is confined to one Client Component; the route
  and both chart components remain server-renderable.
* The derivation stays in `src/lib/demo.ts` and is unit tested there.
* If a future milestone needs richer charts (zoom, tooltips, many series), we
  would revisit this decision and evaluate a chart library deliberately, rather
  than inherit one now.
* Every chart must keep its text alternative and its text copy of the numbers
  when it changes, because colour and bars alone are not accessible.
