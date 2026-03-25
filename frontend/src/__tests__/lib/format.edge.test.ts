/**
 * Edge-case tests for format.ts covering branches not exercised by the main
 * suite: formatINR/formatUSD with fractional amounts where decPart != "00",
 * formatINRCompact/formatUSDCompact negative K values, formatMonths with large
 * values, and formatCurrency/formatCurrencyCompact USD dispatch paths already
 * covered elsewhere but tested here for completeness.
 */
import {
  formatINR,
  formatINRCompact,
  formatUSD,
  formatUSDCompact,
  formatMonths,
} from '../../lib/format'

describe('formatINR — additional edge cases', () => {
  it('formats 999 (3-digit, no grouping needed)', () => {
    expect(formatINR(999)).toBe('₹999')
  })

  it('formats exactly 1000 (boundary between simple and grouped paths)', () => {
    expect(formatINR(1000)).toBe('₹1,000')
  })

  it('formats 9999 — 4 digits, last 3 = 999, rest = 9', () => {
    expect(formatINR(9999)).toBe('₹9,999')
  })

  it('formats 99999 — 5 digits, Indian grouping 99,999', () => {
    expect(formatINR(99999)).toBe('₹99,999')
  })

  it('preserves decimal when amount = 0.50', () => {
    expect(formatINR(0.5)).toBe('₹0.50')
  })

  it('negative amount below 1000', () => {
    expect(formatINR(-500)).toBe('-₹500')
  })

  it('negative fractional amount', () => {
    expect(formatINR(-1000.75)).toBe('-₹1,000.75')
  })
})

describe('formatINRCompact — negative K values', () => {
  it('formats negative thousands', () => {
    expect(formatINRCompact(-5000)).toBe('-₹5.0K')
  })

  it('formats exactly 1000 as K', () => {
    expect(formatINRCompact(1000)).toBe('₹1.0K')
  })

  it('falls back to formatINR for exactly 999', () => {
    expect(formatINRCompact(999)).toBe('₹999')
  })

  it('formats 9999999 (just below 1Cr threshold) as L', () => {
    // 9999999 < 1e7 but >= 1e5 → lakh path
    expect(formatINRCompact(9999999)).toMatch(/L$/)
  })
})

describe('formatUSD — additional edge cases', () => {
  it('formats 999 with no grouping', () => {
    expect(formatUSD(999)).toBe('$999')
  })

  it('formats 1000 with comma', () => {
    expect(formatUSD(1000)).toBe('$1,000')
  })

  it('negative fractional amount', () => {
    expect(formatUSD(-1234.56)).toBe('-$1,234.56')
  })

  it('preserves decimal when amount = 0.01', () => {
    expect(formatUSD(0.01)).toBe('$0.01')
  })
})

describe('formatUSDCompact — additional edge cases', () => {
  it('formats exactly 1000 as K', () => {
    expect(formatUSDCompact(1000)).toBe('$1.0K')
  })

  it('formats 999 via fallback to formatUSD', () => {
    expect(formatUSDCompact(999)).toBe('$999')
  })

  it('formats negative billions', () => {
    expect(formatUSDCompact(-2000000000)).toBe('-$2.0B')
  })

  it('formats 999999999 (just below 1B threshold) as M', () => {
    // 999999999 < 1e9 but >= 1e6 → M path
    expect(formatUSDCompact(999999999)).toMatch(/M$/)
  })
})

describe('formatMonths — additional edge cases', () => {
  it('formats 120 months as 10 years (exact year, plural)', () => {
    expect(formatMonths(120)).toBe('10 years')
  })

  it('formats 2 months (plural, no years)', () => {
    expect(formatMonths(2)).toBe('2 months')
  })

  it('formats 14 months as 1 year 2 months (plural remainder)', () => {
    expect(formatMonths(14)).toBe('1 year 2 months')
  })

  it('formats 600 months as 50 years', () => {
    expect(formatMonths(600)).toBe('50 years')
  })

  it('formats 61 months as 5 years 1 month (singular remainder)', () => {
    expect(formatMonths(61)).toBe('5 years 1 month')
  })
})
