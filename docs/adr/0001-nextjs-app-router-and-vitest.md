# 0001. Use the Next.js App Router with Vitest

- Status: Accepted
- Date: 2026-10-13
- Milestone: 1 (Foundation: buildable Next.js app)

## Context

We are building the Elara Demo Site: a public, two-page sales demo (an Overview at
`/` and an interactive Live Demo at `/demo`) that runs locally for demos, with no
sign-in, no database and no external services.

The project blueprint fixes the stack as Node with TypeScript in strict mode using
Next.js. We still had to decide two things before any code could be written:

1. Which Next.js router to build on.
2. Which test runner to use for the pure logic in `src/lib` and for page tests.

## Decision

### App Router

We use the Next.js **App Router** (`src/app/`) rather than the legacy Pages Router.

* Pages and layouts live in `src/app/`: `layout.tsx` for the root layout and
  `page.tsx` for a route such as `/` (`src/app/page.tsx`) or `/demo`
  (`src/app/demo/page.tsx`).
* The root layout renders `<html lang="en">`, which is the single place we can set
  the document language, required for WCAG 2.1 AA conformance.
* Server Components are the default, so charts and tables that just render static
  or pre-computed synthetic data ship with no client-side JavaScript. Only the
  interactive parts (the region control on the Live Demo page) become Client
  Components, which keeps the pages fast and the accessibility surface small.
* Metadata (`title`, `description`) is declared per route through the exported
  `metadata` object, which the App Router turns into static `<head>` tags.

The App Router is the router Next.js documents for new applications, so it keeps us
on the supported path for the current and next major versions.

### Vitest

We use **Vitest** as the test runner for both units and page tests.

* `npm test` runs `vitest run` (single, non-watching run) and
  `npm run test:watch` runs `vitest` in watch mode.
* Business logic lives in `src/lib` with no UI imports, so unit tests there need
  only a Node environment — no jsdom and no testing-library in this milestone.
* Page tests use `react-dom/server`'s `renderToStaticMarkup` to render a page
  component to a string and assert on the markup. This keeps the dependency list
  small while still giving every new route a test, as the project rules require.
* Vitest is configured through `vitest.config.mts` (an ESM config, so Vitest loads
  it without a CommonJS interop warning); the environment is `node`, and
  `passWithNoTests` is enabled so `npm test` stays green while a milestone has no
  test files of its own yet.

## Consequences

* Every new page or route adds a `page.tsx` under `src/app/` plus a test.
* Logic must stay out of components and in `src/lib` to remain cheap to test.
* If we later need DOM interaction tests (for the region control), we can add jsdom
  per-file with a `// @vitest-environment jsdom` comment instead of switching the
  whole project away from the Node environment.
* We do not add a chart library or an ESLint/Prettier configuration in this
  milestone; the dependency list stays at `next`, `react`, `react-dom` plus the
  TypeScript, types and Vitest dev dependencies.
