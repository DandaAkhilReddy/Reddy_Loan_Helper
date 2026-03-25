import {
  formatINR,
  formatINRCompact,
  formatUSD,
  formatUSDCompact,
  formatCurrency,
  formatCurrencyCompact,
  formatMonths,
} from '../../lib/format'

describe('formatINR', () => {
  it('formats zero', () => {
    expect(formatINR(0)).toBe('₹0')
  })

  it('formats a value below 1000', () => {
    expect(formatINR(500)).toBe('₹500')
  })

  it('formats exactly 1000', () => {
    expect(formatINR(1000)).toBe('₹1,000')
  })

  it('formats 100000 with Indian grouping (1 lakh)', () => {
    expect(formatINR(100000)).toBe('₹1,00,000')
  })

  it('formats 2563163 with Indian grouping', () => {
    expect(formatINR(2563163)).toBe('₹25,63,163')
  })

  it('formats 10000000 (1 crore) with Indian grouping', () => {
    expect(formatINR(10000000)).toBe('₹1,00,00,000')
  })

  it('formats negative values', () => {
    expect(formatINR(-100000)).toBe('-₹1,00,000')
  })

  it('drops .00 decimal suffix', () => {
    expect(formatINR(1000)).toBe('₹1,000')
  })

  it('preserves non-zero decimals', () => {
    expect(formatINR(1000.5)).toBe('₹1,000.50')
  })

  it('preserves non-zero decimals with both places', () => {
    expect(formatINR(1000.75)).toBe('₹1,000.75')
  })
})

describe('formatINRCompact', () => {
  it('falls back to formatINR for values below 1000', () => {
    expect(formatINRCompact(500)).toBe('₹500')
  })

  it('formats thousands as K', () => {
    expect(formatINRCompact(1000)).toBe('₹1.0K')
  })

  it('formats 500000 as lakhs', () => {
    expect(formatINRCompact(500000)).toBe('₹5.0L')
  })

  it('formats 10000000 as crores', () => {
    expect(formatINRCompact(10000000)).toBe('₹1.0Cr')
  })

  it('formats large crore values', () => {
    expect(formatINRCompact(25631630)).toBe('₹2.6Cr')
  })

  it('formats negative lakh values', () => {
    expect(formatINRCompact(-500000)).toBe('-₹5.0L')
  })

  it('formats negative crore values', () => {
    expect(formatINRCompact(-10000000)).toBe('-₹1.0Cr')
  })
})

describe('formatUSD', () => {
  it('formats zero', () => {
    expect(formatUSD(0)).toBe('$0')
  })

  it('formats 2563163 with standard US grouping', () => {
    expect(formatUSD(2563163)).toBe('$2,563,163')
  })

  it('formats negative values', () => {
    expect(formatUSD(-1000)).toBe('-$1,000')
  })

  it('drops .00 decimal suffix', () => {
    expect(formatUSD(5000)).toBe('$5,000')
  })

  it('preserves non-zero decimals', () => {
    expect(formatUSD(1234.56)).toBe('$1,234.56')
  })

  it('formats values below 1000', () => {
    expect(formatUSD(500)).toBe('$500')
  })
})

describe('formatUSDCompact', () => {
  it('falls back to formatUSD for values below 1000', () => {
    expect(formatUSDCompact(500)).toBe('$500')
  })

  it('formats thousands as K', () => {
    expect(formatUSDCompact(50000)).toBe('$50.0K')
  })

  it('formats millions as M', () => {
    expect(formatUSDCompact(1000000)).toBe('$1.0M')
  })

  it('formats billions as B', () => {
    expect(formatUSDCompact(2000000000)).toBe('$2.0B')
  })

  it('formats negative thousands', () => {
    expect(formatUSDCompact(-50000)).toBe('-$50.0K')
  })

  it('formats negative millions', () => {
    expect(formatUSDCompact(-1000000)).toBe('-$1.0M')
  })
})

describe('formatCurrency', () => {
  it('dispatches to formatINR for INR', () => {
    expect(formatCurrency(2563163, 'INR')).toBe(formatINR(2563163))
  })

  it('dispatches to formatUSD for USD', () => {
    expect(formatCurrency(2563163, 'USD')).toBe(formatUSD(2563163))
  })
})

describe('formatCurrencyCompact', () => {
  it('dispatches to formatINRCompact for INR', () => {
    expect(formatCurrencyCompact(500000, 'INR')).toBe(formatINRCompact(500000))
  })

  it('dispatches to formatUSDCompact for USD', () => {
    expect(formatCurrencyCompact(1000000, 'USD')).toBe(formatUSDCompact(1000000))
  })
})

describe('formatMonths', () => {
  it('formats 0 months', () => {
    expect(formatMonths(0)).toBe('0 months')
  })

  it('formats 1 month (singular)', () => {
    expect(formatMonths(1)).toBe('1 month')
  })

  it('formats 12 months as 1 year (singular)', () => {
    expect(formatMonths(12)).toBe('1 year')
  })

  it('formats 13 months as 1 year 1 month (both singular)', () => {
    expect(formatMonths(13)).toBe('1 year 1 month')
  })

  it('formats 24 months as 2 years (plural)', () => {
    expect(formatMonths(24)).toBe('2 years')
  })

  it('formats 63 months as 5 years 3 months', () => {
    expect(formatMonths(63)).toBe('5 years 3 months')
  })

  it('formats 11 months (plural, no years)', () => {
    expect(formatMonths(11)).toBe('11 months')
  })

  it('formats 25 months as 2 years 1 month (mixed plural/singular)', () => {
    expect(formatMonths(25)).toBe('2 years 1 month')
  })
})
