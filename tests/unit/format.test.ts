import { describe, expect, it } from "vitest";

import { formatCurrency, formatPercent } from "../../src/lib/format";

describe("formatCurrency", () => {
  it("formats a normal value with two decimals", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("rounds to two decimals", () => {
    expect(formatCurrency(99.999)).toBe("$100.00");
    expect(formatCurrency(1.239)).toBe("$1.24");
  });

  it("groups thousands", () => {
    expect(formatCurrency(1000)).toBe("$1,000.00");
    expect(formatCurrency(1234567)).toBe("$1,234,567.00");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("puts the sign before the currency symbol for negative values", () => {
    expect(formatCurrency(-1234.5)).toBe("-$1,234.50");
    expect(formatCurrency(-0.5)).toBe("-$0.50");
  });
});

describe("formatPercent", () => {
  it("formats a ratio with a single decimal", () => {
    expect(formatPercent(0.5)).toBe("50.0%");
    expect(formatPercent(1)).toBe("100.0%");
  });

  it("rounds to one decimal place", () => {
    expect(formatPercent(0.1234)).toBe("12.3%");
    expect(formatPercent(0.999)).toBe("99.9%");
  });

  it("formats zero", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });

  it("keeps the sign for negative ratios", () => {
    expect(formatPercent(-0.025)).toBe("-2.5%");
  });
});
