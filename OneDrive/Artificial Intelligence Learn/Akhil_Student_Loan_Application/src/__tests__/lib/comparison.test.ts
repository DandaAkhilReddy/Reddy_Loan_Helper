import { compareScenarios, compareMultipleScenarios } from '../../lib/comparison'
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

// ---------------------------------------------------------------------------
// compareMultipleScenarios
// ---------------------------------------------------------------------------

describe('compareMultipleScenarios', () => {
  it('returns an array of ScenarioComparison objects', () => {
    const results = compareMultipleScenarios(PRINCIPAL, RATE, EMI, [0, 2000, 5000])
    expect(results).toHaveLength(3)
    expect(results[0]).toMatchObject({ extraAmount: 0 })
    expect(results[1]).toMatchObject({ extraAmount: 2000 })
    expect(results[2]).toMatchObject({ extraAmount: 5000 })
  })

  it('zero extra row has interestSaved=0 and monthsSaved=0', () => {
    const results = compareMultipleScenarios(PRINCIPAL, RATE, EMI, [0, 3000])
    const baseline = results.find(r => r.extraAmount === 0)
    expect(baseline).toBeDefined()
    expect(baseline?.interestSaved).toBe(0)
    expect(baseline?.monthsSaved).toBe(0)
  })

  it('zero extra row payoffMonths matches baseline originalMonths', () => {
    const baseline = compareScenarios(PRINCIPAL, RATE, EMI, 0)
    const results = compareMultipleScenarios(PRINCIPAL, RATE, EMI, [0])
    expect(results[0]?.payoffMonths).toBe(baseline.originalMonths)
  })

  it('zero extra row totalPaid equals principal plus baseline totalInterest', () => {
    const baseline = compareScenarios(PRINCIPAL, RATE, EMI, 0)
    const results = compareMultipleScenarios(PRINCIPAL, RATE, EMI, [0])
    expect(results[0]?.totalPaid).toBe(PRINCIPAL + baseline.originalTotalInterest)
  })

  it('more extra payment produces more savings', () => {
    const results = compareMultipleScenarios(PRINCIPAL, RATE, EMI, [0, 2000, 8000])
    const small = results.find(r => r.extraAmount === 2000)!
    const large = results.find(r => r.extraAmount === 8000)!
    expect(large.interestSaved).toBeGreaterThan(small.interestSaved)
    expect(large.monthsSaved).toBeGreaterThan(small.monthsSaved)
  })

  it('returns empty array when principal <= 0', () => {
    const results = compareMultipleScenarios(0, RATE, EMI, [0, 5000])
    expect(results).toHaveLength(0)
  })

  it('returns empty array when emi <= 0', () => {
    const results = compareMultipleScenarios(PRINCIPAL, RATE, 0, [0, 5000])
    expect(results).toHaveLength(0)
  })

  it('negative extra amounts are filtered out', () => {
    const results = compareMultipleScenarios(PRINCIPAL, RATE, EMI, [-1000, 0, 2000])
    expect(results.some(r => r.extraAmount < 0)).toBe(false)
    expect(results).toHaveLength(2)
  })

  it('duplicate amounts in input produce deduplicated output when passed as unique', () => {
    // compareMultipleScenarios does not deduplicate — caller is responsible.
    // But getExtraAmounts (tested separately) does. Here we verify that passing
    // a pre-deduplicated array with no duplicates produces the correct length.
    const results = compareMultipleScenarios(PRINCIPAL, RATE, EMI, [0, 3000, 6000])
    expect(results).toHaveLength(3)
    const amounts = results.map(r => r.extraAmount)
    expect(new Set(amounts).size).toBe(amounts.length)
  })

  it('totalPaid for non-zero extra equals principal plus newTotalInterest', () => {
    const results = compareMultipleScenarios(PRINCIPAL, RATE, EMI, [5000])
    const row = results[0]!
    const scenario = compareScenarios(PRINCIPAL, RATE, EMI, 5000)
    expect(row.totalPaid).toBe(PRINCIPAL + scenario.newTotalInterest)
  })
})
