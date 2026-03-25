/**
 * Edge-case tests for emi-math.ts that complement the main test suite.
 * Focuses on branches not covered: non-finite guards in calculateTenure /
 * calculateTotalInterest, and boundary inputs.
 */
import { calculateEMI, calculateTenure, calculateTotalInterest } from '../../lib/emi-math'

describe('calculateTenure — non-finite / boundary guards', () => {
  it('NaN principal: returns 0', () => {
    expect(calculateTenure(NaN, 10, 5000)).toBe(0)
  })

  it('Infinity principal: returns 0', () => {
    expect(calculateTenure(Infinity, 10, 5000)).toBe(0)
  })

  it('NaN annualRate: returns 0', () => {
    // !isFinite(NaN) is true — guard fires
    expect(calculateTenure(1000000, NaN, 5000)).toBe(0)
  })

  it('Infinity annualRate: returns 0', () => {
    expect(calculateTenure(1000000, Infinity, 5000)).toBe(0)
  })

  it('NaN emi: returns 0', () => {
    expect(calculateTenure(1000000, 10, NaN)).toBe(0)
  })

  it('Infinity emi: returns 0', () => {
    expect(calculateTenure(1000000, 10, Infinity)).toBe(0)
  })

  it('negative principal: returns 0', () => {
    expect(calculateTenure(-500000, 10, 5000)).toBe(0)
  })

  it('negative emi: returns 0', () => {
    expect(calculateTenure(1000000, 10, -100)).toBe(0)
  })

  it('negative rate (annualRate <= 0): uses ceiling division', () => {
    // ceil(1200000 / 10001) = 120 (principal/emi ceiling)
    expect(calculateTenure(1200000, -3, 10000)).toBe(Math.ceil(1200000 / 10000))
  })

  it('large EMI far above monthly interest: resolves in 1 month', () => {
    // EMI > principal guarantees single month resolution
    const result = calculateTenure(100000, 10, 200000)
    expect(result).toBe(1)
  })
})

describe('calculateTotalInterest — non-finite / boundary guards', () => {
  it('NaN principal: returns 0', () => {
    expect(calculateTotalInterest(NaN, 10, 60)).toBe(0)
  })

  it('Infinity principal: returns 0', () => {
    expect(calculateTotalInterest(Infinity, 10, 60)).toBe(0)
  })

  it('NaN annualRate: returns 0', () => {
    expect(calculateTotalInterest(1000000, NaN, 60)).toBe(0)
  })

  it('Infinity annualRate: returns 0', () => {
    expect(calculateTotalInterest(1000000, Infinity, 60)).toBe(0)
  })

  it('NaN tenureMonths: returns 0', () => {
    expect(calculateTotalInterest(1000000, 10, NaN)).toBe(0)
  })

  it('Infinity tenureMonths: returns 0', () => {
    expect(calculateTotalInterest(1000000, 10, Infinity)).toBe(0)
  })

  it('negative tenureMonths: returns 0', () => {
    expect(calculateTotalInterest(1000000, 10, -12)).toBe(0)
  })

  it('negative principal: returns 0', () => {
    expect(calculateTotalInterest(-1000000, 10, 60)).toBe(0)
  })

  it('result can never go below 0 (Math.max guard)', () => {
    // 0% rate: EMI*tenure rounds to at most principal, difference ≥ 0
    const result = calculateTotalInterest(1000000, 0, 60)
    expect(result).toBeGreaterThanOrEqual(0)
  })
})

describe('calculateEMI — additional non-finite guards', () => {
  it('NaN tenureMonths: returns 0', () => {
    expect(calculateEMI(1000000, 10, NaN)).toBe(0)
  })

  it('Infinity tenureMonths: returns 0', () => {
    expect(calculateEMI(1000000, 10, Infinity)).toBe(0)
  })

  it('NaN annualRate with valid inputs: returns 0 (non-finite guard)', () => {
    expect(calculateEMI(1000000, NaN, 60)).toBe(0)
  })

  it('Infinity annualRate: returns 0', () => {
    expect(calculateEMI(1000000, Infinity, 60)).toBe(0)
  })
})
