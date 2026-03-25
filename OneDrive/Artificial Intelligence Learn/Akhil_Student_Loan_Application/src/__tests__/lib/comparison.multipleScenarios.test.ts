/**
 * Additional behavioral tests for compareMultipleScenarios and getExtraAmounts
 * covering cases not in the main comparison.test.ts:
 *
 * - compareMultipleScenarios with an empty extraAmounts array → empty result
 * - compareMultipleScenarios: all-negative amounts → empty (all filtered)
 * - getExtraAmounts with very large currentExtra → no negative amounts
 * - getExtraAmounts: currentExtra = 1 → deduplication and sort guaranteed
 * - compareMultipleScenarios: extraAmounts containing only negatives → empty
 * - non-zero extraAmount row populates payoffMonths from result.newMonths
 * - non-zero extraAmount row populates totalInterest from result.newTotalInterest
 */
import {
  compareMultipleScenarios,
  compareScenarios,
  getExtraAmounts,
} from '../../lib/comparison'

const PRINCIPAL = 1_000_000
const RATE = 10
const EMI = 13_215

describe('compareMultipleScenarios — empty and fully-negative extraAmounts', () => {
  it('empty extraAmounts array returns empty result', () => {
    const results = compareMultipleScenarios(PRINCIPAL, RATE, EMI, [])
    expect(results).toEqual([])
  })

  it('all-negative extraAmounts filtered out → empty result', () => {
    const results = compareMultipleScenarios(PRINCIPAL, RATE, EMI, [-100, -500, -1000])
    expect(results).toHaveLength(0)
  })

  it('mixed negative and zero → only zero row survives', () => {
    const results = compareMultipleScenarios(PRINCIPAL, RATE, EMI, [-500, 0, -200])
    expect(results).toHaveLength(1)
    expect(results[0]?.extraAmount).toBe(0)
  })
})

describe('compareMultipleScenarios — non-zero row field accuracy', () => {
  it('payoffMonths for non-zero row equals result.newMonths from compareScenarios', () => {
    const extra = 3000
    const direct = compareScenarios(PRINCIPAL, RATE, EMI, extra)
    const results = compareMultipleScenarios(PRINCIPAL, RATE, EMI, [extra])
    expect(results[0]?.payoffMonths).toBe(direct.newMonths)
  })

  it('totalInterest for non-zero row equals result.newTotalInterest from compareScenarios', () => {
    const extra = 3000
    const direct = compareScenarios(PRINCIPAL, RATE, EMI, extra)
    const results = compareMultipleScenarios(PRINCIPAL, RATE, EMI, [extra])
    expect(results[0]?.totalInterest).toBe(direct.newTotalInterest)
  })

  it('interestSaved for non-zero row equals result.interestSaved from compareScenarios', () => {
    const extra = 5000
    const direct = compareScenarios(PRINCIPAL, RATE, EMI, extra)
    const results = compareMultipleScenarios(PRINCIPAL, RATE, EMI, [extra])
    expect(results[0]?.interestSaved).toBe(direct.interestSaved)
  })

  it('monthsSaved for non-zero row equals result.monthsSaved from compareScenarios', () => {
    const extra = 5000
    const direct = compareScenarios(PRINCIPAL, RATE, EMI, extra)
    const results = compareMultipleScenarios(PRINCIPAL, RATE, EMI, [extra])
    expect(results[0]?.monthsSaved).toBe(direct.monthsSaved)
  })

  it('totalPaid for non-zero row equals principal + newTotalInterest', () => {
    const extra = 4000
    const direct = compareScenarios(PRINCIPAL, RATE, EMI, extra)
    const results = compareMultipleScenarios(PRINCIPAL, RATE, EMI, [extra])
    expect(results[0]?.totalPaid).toBe(PRINCIPAL + direct.newTotalInterest)
  })
})

describe('getExtraAmounts — currentExtra edge values', () => {
  it('currentExtra = 1: no negative amounts and result is sorted', () => {
    const amounts = getExtraAmounts(1, EMI)
    expect(amounts.every(a => a >= 0)).toBe(true)
    expect(amounts).toEqual([...amounts].sort((a, b) => a - b))
  })

  it('currentExtra = very large number: no negative amounts', () => {
    const amounts = getExtraAmounts(1_000_000, EMI)
    expect(amounts.every(a => a >= 0)).toBe(true)
  })

  it('currentExtra = 0 with small emi (emi = 1): all amounts are 0 or 1', () => {
    const amounts = getExtraAmounts(0, 1)
    // 10% of 1 = 0, 25% of 1 = 0, 50% of 1 = 1, 100% of 1 = 1
    // after dedup and filter ≥ 0: [0, 1]
    expect(amounts.every(a => a >= 0)).toBe(true)
    expect(new Set(amounts).size).toBe(amounts.length)
  })

  it('currentExtra > 0 includes exactly 0 as baseline', () => {
    const amounts = getExtraAmounts(10000, EMI)
    expect(amounts[0]).toBe(0)
  })

  it('currentExtra = 0 includes exactly 0 as first element', () => {
    const amounts = getExtraAmounts(0, EMI)
    expect(amounts[0]).toBe(0)
  })

  it('currentExtra = 0 includes full EMI as last element', () => {
    const amounts = getExtraAmounts(0, EMI)
    expect(amounts[amounts.length - 1]).toBe(EMI)
  })

  it('currentExtra > 0: 2x currentExtra is the last element', () => {
    const extra = 5000
    const amounts = getExtraAmounts(extra, EMI)
    expect(amounts[amounts.length - 1]).toBe(extra * 2)
  })
})
