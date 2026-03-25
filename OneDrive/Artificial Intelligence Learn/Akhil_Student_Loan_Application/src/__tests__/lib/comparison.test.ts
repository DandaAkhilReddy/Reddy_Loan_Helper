import { compareScenarios } from '../../lib/comparison'
import * as amortization from '../../lib/amortization'

// Standard loan used across multiple tests:
// ₹10,00,000 at 10% annual, EMI ≈ ₹13,215 for 120 months
const PRINCIPAL = 1_000_000
const RATE = 10
const EMI = 13_215

describe('compareScenarios', () => {
  it('standard with extra payment: monthsSaved > 0 and interestSaved > 0', () => {
    const result = compareScenarios(PRINCIPAL, RATE, EMI, 5_000)
    expect(result.monthsSaved).toBeGreaterThan(0)
    expect(result.interestSaved).toBeGreaterThan(0)
  })

  it('zero extra payment: all *Saved fields are 0', () => {
    const result = compareScenarios(PRINCIPAL, RATE, EMI, 0)
    expect(result.monthsSaved).toBe(0)
    expect(result.interestSaved).toBe(0)
    expect(result.originalMonths).toBe(result.newMonths)
    expect(result.originalTotalInterest).toBe(result.newTotalInterest)
  })

  it('negative extra payment: treated as 0, same as zero extra', () => {
    const withZero = compareScenarios(PRINCIPAL, RATE, EMI, 0)
    const withNegative = compareScenarios(PRINCIPAL, RATE, EMI, -5_000)
    expect(withNegative.monthsSaved).toBe(withZero.monthsSaved)
    expect(withNegative.interestSaved).toBe(withZero.interestSaved)
    expect(withNegative.originalMonths).toBe(withZero.originalMonths)
    expect(withNegative.newMonths).toBe(withZero.newMonths)
  })

  it('interestSaved <= originalTotalInterest', () => {
    const result = compareScenarios(PRINCIPAL, RATE, EMI, 5_000)
    expect(result.interestSaved).toBeLessThanOrEqual(result.originalTotalInterest)
  })

  it('newMonths <= originalMonths when extra > 0', () => {
    const result = compareScenarios(PRINCIPAL, RATE, EMI, 2_000)
    expect(result.newMonths).toBeLessThanOrEqual(result.originalMonths)
  })

  it('larger extra payment saves more than smaller extra payment', () => {
    const small = compareScenarios(PRINCIPAL, RATE, EMI, 1_000)
    const large = compareScenarios(PRINCIPAL, RATE, EMI, 10_000)
    expect(large.monthsSaved).toBeGreaterThan(small.monthsSaved)
    expect(large.interestSaved).toBeGreaterThan(small.interestSaved)
  })

  it('extra exceeding EMI: still produces valid result with faster payoff', () => {
    // extra > EMI — effectively paying more than 2x each month
    const result = compareScenarios(PRINCIPAL, RATE, EMI, EMI * 2)
    expect(result.newMonths).toBeGreaterThan(0)
    expect(result.newMonths).toBeLessThan(result.originalMonths)
    expect(result.interestSaved).toBeGreaterThan(0)
  })

  it('zero principal: returns all-zero ComparisonResult', () => {
    const result = compareScenarios(0, RATE, EMI, 5_000)
    expect(result.originalMonths).toBe(0)
    expect(result.newMonths).toBe(0)
    expect(result.monthsSaved).toBe(0)
    expect(result.originalTotalInterest).toBe(0)
    expect(result.newTotalInterest).toBe(0)
    expect(result.interestSaved).toBe(0)
  })

  it('zero rate: interest fields are 0', () => {
    const result = compareScenarios(PRINCIPAL, 0, EMI, 0)
    expect(result.originalTotalInterest).toBe(0)
    expect(result.newTotalInterest).toBe(0)
    expect(result.interestSaved).toBe(0)
  })

  it('originalTotalInterest ?? 0 branch: last entry has undefined cumulativeInterest', () => {
    // Mock generateSchedule so the returned schedule's last entry has
    // cumulativeInterest = undefined to exercise the ?? 0 fallback on line 43.
    const spy = vi.spyOn(amortization, 'generateSchedule').mockReturnValueOnce([
      { month: 1, openingBalance: PRINCIPAL, interest: 0, principalPaid: PRINCIPAL,
        extraPayment: 0, closingBalance: 0, cumulativeInterest: undefined as unknown as number },
    ]).mockReturnValueOnce([
      { month: 1, openingBalance: PRINCIPAL, interest: 0, principalPaid: PRINCIPAL,
        extraPayment: 0, closingBalance: 0, cumulativeInterest: 0 },
    ])
    const result = compareScenarios(PRINCIPAL, RATE, EMI, 0)
    expect(result.originalTotalInterest).toBe(0)
    spy.mockRestore()
  })

  it('newTotalInterest ?? 0 branch: last entry has undefined cumulativeInterest', () => {
    // Mock the second generateSchedule call (accelerated) to return an entry
    // with cumulativeInterest = undefined to exercise the ?? 0 fallback on line 46.
    const spy = vi.spyOn(amortization, 'generateSchedule').mockReturnValueOnce([
      { month: 1, openingBalance: PRINCIPAL, interest: 0, principalPaid: PRINCIPAL,
        extraPayment: 0, closingBalance: 0, cumulativeInterest: 100 },
    ]).mockReturnValueOnce([
      { month: 1, openingBalance: PRINCIPAL, interest: 0, principalPaid: PRINCIPAL,
        extraPayment: 0, closingBalance: 0, cumulativeInterest: undefined as unknown as number },
    ])
    const result = compareScenarios(PRINCIPAL, RATE, EMI, 0)
    expect(result.newTotalInterest).toBe(0)
    spy.mockRestore()
  })
})
