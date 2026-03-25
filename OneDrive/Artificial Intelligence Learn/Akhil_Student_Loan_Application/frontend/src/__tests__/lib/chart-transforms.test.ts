import type { AmortizationEntry } from '../../types/loan'
import { transformToChartData } from '../../lib/chart-transforms'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal amortization schedule where each month reduces the balance
 * by a fixed principal payment and charges simple (non-compounding) interest.
 *
 * openingBalance[1] = principal
 * principalPaid = fixed per month
 * interest = openingBalance * (rate/1200), rounded
 * closingBalance = openingBalance - principalPaid
 * cumulativeInterest accumulates interest
 */
function makeSchedule(
  principal: number,
  months: number,
  monthlyPrincipal: number,
  monthlyRate: number = 0,
): AmortizationEntry[] {
  const entries: AmortizationEntry[] = []
  let opening = principal
  let cumInterest = 0

  for (let m = 1; m <= months; m++) {
    const interest = Math.round(opening * monthlyRate)
    const paid = Math.min(monthlyPrincipal, opening)
    const extra = 0
    const closing = Math.max(0, opening - paid)
    cumInterest += interest

    entries.push({
      month: m,
      openingBalance: opening,
      interest,
      principalPaid: paid,
      extraPayment: extra,
      closingBalance: closing,
      cumulativeInterest: cumInterest,
    })

    if (closing === 0) break
    opening = closing
  }

  return entries
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('transformToChartData', () => {
  it('equal-length schedules: output length matches schedule length', () => {
    const orig = makeSchedule(12_000, 12, 1_000)
    const accel = makeSchedule(12_000, 12, 1_000)
    const result = transformToChartData(orig, accel)
    expect(result.length).toBe(12)
  })

  it('shorter accelerated schedule: padded entries have balanceAccelerated = 0', () => {
    const orig = makeSchedule(12_000, 12, 1_000)
    const accel = makeSchedule(12_000, 6, 2_000) // pays off in 6 months
    const result = transformToChartData(orig, accel)

    // Output should span 12 months (the longer schedule)
    expect(result.length).toBe(12)

    // Entries after month 6 (index 6+) should have balanceAccelerated = 0
    const tail = result.filter((pt) => pt.month > 6)
    expect(tail.length).toBeGreaterThan(0)
    tail.forEach((pt) => {
      expect(pt.balanceAccelerated).toBe(0)
    })
  })

  it('both schedules empty: returns []', () => {
    expect(transformToChartData([], [])).toEqual([])
  })

  it('single-month schedule: returns exactly 1 data point', () => {
    const orig = makeSchedule(1_000, 1, 1_000)
    const accel = makeSchedule(1_000, 1, 1_000)
    const result = transformToChartData(orig, accel)
    expect(result.length).toBe(1)
  })

  it('schedule > 120 months: output has at most 120 data points', () => {
    // 240-month loan at ₹10,000/month principal
    const orig = makeSchedule(2_400_000, 240, 10_000)
    const accel = makeSchedule(2_400_000, 200, 12_000)
    const result = transformToChartData(orig, accel)
    expect(result.length).toBeLessThanOrEqual(120)
  })

  it('downsampling always preserves month 1, accelerated payoff month, and last month', () => {
    const orig = makeSchedule(2_400_000, 240, 10_000)
    const accel = makeSchedule(2_400_000, 200, 12_000) // payoff at month 200
    const result = transformToChartData(orig, accel)

    const months = result.map((pt) => pt.month)
    expect(months).toContain(1)           // first month
    expect(months).toContain(200)         // accelerated payoff month
    expect(months).toContain(240)         // last month of original
  })

  it('all data points have no undefined fields', () => {
    const orig = makeSchedule(12_000, 12, 1_000)
    const accel = makeSchedule(12_000, 8, 1_500)
    const result = transformToChartData(orig, accel)

    result.forEach((pt) => {
      expect(pt.month).toBeDefined()
      expect(pt.label).toBeDefined()
      expect(pt.balanceOriginal).toBeDefined()
      expect(pt.balanceAccelerated).toBeDefined()
      expect(pt.cumulativeInterestOriginal).toBeDefined()
      expect(pt.cumulativePrincipalOriginal).toBeDefined()
      expect(pt.cumulativeInterestAccelerated).toBeDefined()
      expect(pt.cumulativePrincipalAccelerated).toBeDefined()
    })
  })

  it('correct math: cumulativeInterest and balances match the input entries', () => {
    // Zero-rate schedule: all interest = 0
    const orig = makeSchedule(6_000, 6, 1_000, 0)
    const accel = makeSchedule(6_000, 3, 2_000, 0)
    const result = transformToChartData(orig, accel)

    // Month 1: orig balance = 5000, accel balance = 4000
    const month1 = result.find((pt) => pt.month === 1)
    expect(month1).toBeDefined()
    expect(month1?.balanceOriginal).toBe(5_000)
    expect(month1?.balanceAccelerated).toBe(4_000)
    expect(month1?.cumulativeInterestOriginal).toBe(0)
    expect(month1?.cumulativeInterestAccelerated).toBe(0)

    // Month 3: orig balance = 3000, accel balance = 0 (paid off)
    const month3 = result.find((pt) => pt.month === 3)
    expect(month3).toBeDefined()
    expect(month3?.balanceOriginal).toBe(3_000)
    expect(month3?.balanceAccelerated).toBe(0)

    // cumulativePrincipal = principal - closingBalance
    expect(month1?.cumulativePrincipalOriginal).toBe(1_000)  // 6000 - 5000
    expect(month1?.cumulativePrincipalAccelerated).toBe(2_000) // 6000 - 4000
  })

  it('origPrincipal falls back to 0 when originalSchedule is empty but accelerated is non-empty', () => {
    // originalSchedule.length === 0 → ternary false branch → origPrincipal = 0
    const accel = makeSchedule(6_000, 6, 1_000, 0)
    const result = transformToChartData([], accel)
    expect(result.length).toBeGreaterThan(0)
    // cumulativePrincipalOriginal = 0 - 0 = 0 for all points
    result.forEach((pt) => {
      expect(pt.cumulativePrincipalOriginal).toBe(0)
    })
  })

  it('accelPrincipal falls back to 0 when acceleratedSchedule is empty but original is non-empty', () => {
    // acceleratedSchedule.length === 0 → ternary false branch → accelPrincipal = 0
    const orig = makeSchedule(6_000, 6, 1_000, 0)
    const result = transformToChartData(orig, [])
    expect(result.length).toBeGreaterThan(0)
    // cumulativePrincipalAccelerated = 0 - 0 = 0 for all points
    result.forEach((pt) => {
      expect(pt.cumulativePrincipalAccelerated).toBe(0)
    })
  })

  it('origPrincipal openingBalance ?? 0 fallback: sparse array first element undefined', () => {
    // originalSchedule[0] is explicitly undefined → openingBalance ?? 0 fires
    // Build a sparse array: length=1 but index 0 is undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sparse: any[] = new Array(1)  // length=1, element at 0 is undefined
    const accel = makeSchedule(1_000, 1, 1_000, 0)
    const result = transformToChartData(sparse, accel)
    // Should not throw; origPrincipal = 0 via ?? 0
    expect(result.length).toBeGreaterThan(0)
  })

  it('month falls back to i+1 when both origEntry and accelEntry are undefined at an index', () => {
    // Both entries undefined at some index → month = i + 1 fallback
    // Create two sparse arrays where index 0 is undefined but length is 1
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sparseOrig: any[] = new Array(1)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sparseAccel: any[] = new Array(1)
    const result = transformToChartData(sparseOrig, sparseAccel)
    // month should be i+1 = 1 for the single point
    expect(result.length).toBe(1)
    expect(result[0].month).toBe(1)
  })
})
