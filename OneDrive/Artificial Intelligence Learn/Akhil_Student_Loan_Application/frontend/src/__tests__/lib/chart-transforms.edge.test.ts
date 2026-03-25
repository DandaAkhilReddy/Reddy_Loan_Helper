/**
 * Edge-case tests for chart-transforms.ts covering branches not hit by the
 * main suite: formatMonthLabel short/long paths, only-accelerated principal
 * derivation, accelPayoffMonth = 0 early guard, and downsampling boundary.
 */
import type { AmortizationEntry } from '../../types/loan'
import { transformToChartData } from '../../lib/chart-transforms'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(month: number, opening: number, closing: number): AmortizationEntry {
  return {
    month,
    openingBalance: opening,
    interest: 10,
    principalPaid: opening - closing,
    extraPayment: 0,
    closingBalance: closing,
    cumulativeInterest: month * 10,
  }
}

function makeSchedule(months: number, principal: number): AmortizationEntry[] {
  const stepPerMonth = Math.floor(principal / months)
  const entries: AmortizationEntry[] = []
  let opening = principal
  for (let m = 1; m <= months; m++) {
    const closing = m === months ? 0 : opening - stepPerMonth
    entries.push(makeEntry(m, opening, closing))
    opening = closing
  }
  return entries
}

// ---------------------------------------------------------------------------
// formatMonthLabel — short schedule (<=24): labels use "M{n}"
// ---------------------------------------------------------------------------

describe('transformToChartData — month labels for short schedule (<=24 months)', () => {
  it('all labels use M{n} format when totalMonths <= 24', () => {
    const orig = makeSchedule(12, 12000)
    const accel = makeSchedule(10, 12000)
    const result = transformToChartData(orig, accel)

    // maxLength = 12 → totalMonths <= 24 → every point gets "M{n}"
    result.forEach((pt) => {
      expect(pt.label).toMatch(/^M\d+$/)
    })
  })

  it('label "M1" exists for month 1 on a 24-month schedule', () => {
    const orig = makeSchedule(24, 24000)
    const accel = makeSchedule(20, 24000)
    const result = transformToChartData(orig, accel)
    const first = result.find((pt) => pt.month === 1)
    expect(first?.label).toBe('M1')
  })
})

// ---------------------------------------------------------------------------
// formatMonthLabel — long schedule (>24): only year boundaries get "Y{n}"
// ---------------------------------------------------------------------------

describe('transformToChartData — month labels for long schedule (>24 months)', () => {
  it('non-year-boundary months have empty string label when totalMonths > 24', () => {
    const orig = makeSchedule(36, 36000)
    const accel = makeSchedule(30, 36000)
    const result = transformToChartData(orig, accel)

    const nonYearBoundary = result.filter((pt) => pt.month % 12 !== 0)
    nonYearBoundary.forEach((pt) => {
      expect(pt.label).toBe('')
    })
  })

  it('year-boundary months get "Y{n}" label when totalMonths > 24', () => {
    const orig = makeSchedule(36, 36000)
    const accel = makeSchedule(30, 36000)
    const result = transformToChartData(orig, accel)

    const yearBoundaries = result.filter((pt) => pt.month % 12 === 0)
    yearBoundaries.forEach((pt) => {
      expect(pt.label).toMatch(/^Y\d+$/)
    })
  })

  it('month 24 in a 36-month schedule gets label "Y2" (24/12=2)', () => {
    const orig = makeSchedule(36, 36000)
    const accel = makeSchedule(36, 36000)
    const result = transformToChartData(orig, accel)
    const m24 = result.find((pt) => pt.month === 24)
    expect(m24?.label).toBe('Y2')
  })
})

// ---------------------------------------------------------------------------
// Principal derivation — only accelerated schedule non-empty
// ---------------------------------------------------------------------------

describe('transformToChartData — principal derivation from accelerated only', () => {
  it('cumulativePrincipalAccelerated derived from accel opening balance when original is empty', () => {
    const accel = makeSchedule(6, 6000)
    const result = transformToChartData([], accel)

    // accelPrincipal = accel[0].openingBalance = 6000
    // month 1 accel closingBalance = 5000, so cumulativePrincipalAccelerated = 6000 - 5000 = 1000
    const m1 = result.find((pt) => pt.month === 1)
    expect(m1).toBeDefined()
    expect(m1!.cumulativePrincipalOriginal).toBe(0) // origPrincipal = 0
    expect(m1!.cumulativePrincipalAccelerated).toBe(1000) // 6000 - 5000
  })
})

// ---------------------------------------------------------------------------
// accelPayoffMonth = 0 guard (accelerated schedule is empty but original not)
// ---------------------------------------------------------------------------

describe('transformToChartData — empty accelerated schedule, non-empty original', () => {
  it('returns data points spanning the original schedule length', () => {
    const orig = makeSchedule(6, 6000)
    const result = transformToChartData(orig, [])
    expect(result.length).toBe(6)
  })

  it('all balanceAccelerated values are 0 when accelerated schedule is empty', () => {
    const orig = makeSchedule(6, 6000)
    const result = transformToChartData(orig, [])
    result.forEach((pt) => expect(pt.balanceAccelerated).toBe(0))
  })

  it('cumulativeInterestAccelerated is 0 for all points when accel is empty', () => {
    const orig = makeSchedule(6, 6000)
    const result = transformToChartData(orig, [])
    result.forEach((pt) => expect(pt.cumulativeInterestAccelerated).toBe(0))
  })
})

// ---------------------------------------------------------------------------
// Downsampling — exact 120-month schedule should NOT be downsampled
// ---------------------------------------------------------------------------

describe('transformToChartData — 120-month schedule boundary (no downsampling)', () => {
  it('120-month schedules produce exactly 120 data points', () => {
    const orig = makeSchedule(120, 120000)
    const accel = makeSchedule(120, 120000)
    const result = transformToChartData(orig, accel)
    expect(result.length).toBe(120)
  })
})

// ---------------------------------------------------------------------------
// month field fallback: origEntry?.month ?? accelEntry?.month ?? i + 1
// ---------------------------------------------------------------------------

describe('transformToChartData — month field derivation for tail entries', () => {
  it('points beyond accelerated schedule length still carry correct month numbers', () => {
    const orig = makeSchedule(6, 6000)
    const accel = makeSchedule(3, 6000)
    const result = transformToChartData(orig, accel)

    // After month 3, accelEntry is undefined; month comes from origEntry.month
    const m5 = result.find((pt) => pt.month === 5)
    expect(m5).toBeDefined()
    expect(m5!.month).toBe(5)
  })
})
