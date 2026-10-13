/**
 * UI-free, dependency-free helpers for formatting KPI values.
 *
 * These live in `src/lib` so they can be unit tested on their own and reused by
 * the Overview and Live Demo pages once those milestones arrive. They are
 * deliberately deterministic: no `Intl`, no locales and no environment input, so
 * the same value always produces the same string in every browser and in tests.
 */

/** Insert thousands separators into a run of digits: "1234567" -> "1,234,567". */
function groupThousands(wholeDigits: string): string {
  return wholeDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Format a number as US dollars with two decimals and thousands grouping.
 *
 * The sign, when negative, is placed before the currency symbol (`-$1,234.50`).
 *
 * @example
 * formatCurrency(1234.5); // "$1,234.50"
 * formatCurrency(0); // "$0.00"
 * formatCurrency(-1234.5); // "-$1,234.50"
 */
export function formatCurrency(value: number): string {
  const isNegative = value < 0;
  const [whole, fraction] = Math.abs(value).toFixed(2).split(".");
  return `${isNegative ? "-" : ""}$${groupThousands(whole)}.${fraction}`;
}

/**
 * Format a ratio as a percentage with a single decimal place.
 *
 * The input is a ratio, so `0.5` becomes `"50.0%"` and `0.1234` becomes `"12.3%"`.
 * Negative ratios keep their sign (`-0.025` -> `"-2.5%"`).
 *
 * @example
 * formatPercent(0.5); // "50.0%"
 * formatPercent(0); // "0.0%"
 * formatPercent(-0.025); // "-2.5%"
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
