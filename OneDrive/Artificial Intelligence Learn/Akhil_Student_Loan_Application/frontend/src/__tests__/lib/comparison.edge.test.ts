/**
 * Edge-case tests for comparison.ts.
 * Covers: emi <= 0 guard, negative principal guard, empty schedule paths,
 * and extra payment that fully pays off in first month.
 */
import { compareScenarios } from '../../lib/comparison'

describe('compareScenarios — guard branches', () => {
  it('emi = 0 returns all-zero result', () => {
    const result = compareScenarios(1000000, 10, 0, 5000)
    expect(result.originalMonths).toBe(0)
    expect(result.newMonths).toBe(0)
    expect(result.monthsSaved).toBe(0)
    expect(result.originalTotalInterest).toBe(0)
    expect(result.interestSaved).toBe(0)
  })

  it('negative emi returns all-zero result', () => {
    const result = compareScenarios(1000000, 10, -5000, 1000)
    expect(result.originalMonths).toBe(0)
    expect(result.newMonths).toBe(0)
    expect(result.monthsSaved).toBe(0)
  })

  it('negative principal returns all-zero result', () => {
    const result = compareScenarios(-500000, 10, 13000, 5000)
    expect(result.originalMonths).toBe(0)
    expect(result.newMonths).toBe(0)
    expect(result.interestSaved).toBe(0)
  })
})

describe('compareScenarios — empty schedule cumulativeInterest fallback', () => {
  it('emi too small to cover interest produces 0 for both interest totals', () => {
    // Monthly interest on ₹10L at 12% = 10000; emi 5000 < 10000 → empty schedules
    const result = compareScenarios(1000000, 12, 5000, 0)
    expect(result.originalTotalInterest).toBe(0)
    expect(result.newTotalInterest).toBe(0)
    expect(result.originalMonths).toBe(0)
  })
})

describe('compareScenarios — extra fully pays off in 1 month', () => {
  it('enormous extra payment results in newMonths = 1', () => {
    // Principal ₹1L, EMI ₹10K, extra ₹500K → clears in month 1
    const result = compareScenarios(100000, 10, 10000, 500000)
    expect(result.newMonths).toBe(1)
    expect(result.monthsSaved).toBeGreaterThan(0)
  })
})

describe('compareScenarios — interestSaved is never negative', () => {
  it('newTotalInterest <= originalTotalInterest for any valid extra >= 0', () => {
    const result = compareScenarios(2000000, 9, 20000, 3000)
    expect(result.newTotalInterest).toBeLessThanOrEqual(result.originalTotalInterest)
    expect(result.interestSaved).toBeGreaterThanOrEqual(0)
  })
})
