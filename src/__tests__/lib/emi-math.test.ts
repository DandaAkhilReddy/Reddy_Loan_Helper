import { calculateEMI, calculateTenure, calculateTotalInterest } from '../../lib/emi-math'

describe('calculateEMI', () => {
  it('real loan: ₹25.6L at 13.5% for 72 months ≈ ₹52,132 (within ±100)', () => {
    const result = calculateEMI(2563163, 13.5, 72)
    expect(result).toBeGreaterThanOrEqual(52032)
    expect(result).toBeLessThanOrEqual(52232)
  })

  it('SBI home loan: ₹50L at 8.5% for 240 months ≈ ₹43,391', () => {
    const result = calculateEMI(5000000, 8.5, 240)
    expect(result).toBeGreaterThanOrEqual(43291)
    expect(result).toBeLessThanOrEqual(43491)
  })

  it('zero rate: returns exact principal / tenure', () => {
    expect(calculateEMI(1200000, 0, 120)).toBe(10000)
  })

  it('single month: EMI ≈ principal + one month interest', () => {
    // 100000 * (0.01) * (1.01)^1 / ((1.01)^1 - 1) = 100000 * 0.01 * 1.01 / 0.01 = 101000
    expect(calculateEMI(100000, 12, 1)).toBe(101000)
  })

  it('zero principal: returns 0', () => {
    expect(calculateEMI(0, 13.5, 60)).toBe(0)
  })

  it('zero tenure: returns 0', () => {
    expect(calculateEMI(2563163, 13.5, 0)).toBe(0)
  })

  it('negative principal: returns 0', () => {
    expect(calculateEMI(-100000, 13.5, 60)).toBe(0)
  })

  it('negative rate: treated as 0% (principal / tenure)', () => {
    const result = calculateEMI(1000000, -5, 60)
    expect(result).toBe(Math.round(1000000 / 60))
  })

  it('negative tenure: returns 0', () => {
    expect(calculateEMI(1000000, 10, -12)).toBe(0)
  })

  it('very high rate 50%: EMI > ₹40,000 on ₹10L for 120 months', () => {
    expect(calculateEMI(1000000, 50, 120)).toBeGreaterThan(40000)
  })

  it('very small principal ₹1: returns 0 or 1', () => {
    const result = calculateEMI(1, 10, 12)
    expect(result === 0 || result === 1).toBe(true)
  })

  it('very long tenure 600 months: returns positive EMI', () => {
    expect(calculateEMI(10000000, 8, 600)).toBeGreaterThan(0)
  })

  it('NaN principal: returns 0', () => {
    expect(calculateEMI(NaN, 13.5, 60)).toBe(0)
  })

  it('Infinity principal: returns 0', () => {
    expect(calculateEMI(Infinity, 10, 60)).toBe(0)
  })
})

describe('calculateTenure', () => {
  it('round-trips with calculateEMI: 72 months within ±2', () => {
    const result = calculateTenure(2563163, 13.5, 51476)
    expect(result).toBeGreaterThanOrEqual(70)
    expect(result).toBeLessThanOrEqual(74)
  })

  it('EMI too small to cover principal: returns 0', () => {
    // Monthly interest = 1000000 * (12/1200) = 10000; EMI 1000 < 10000
    expect(calculateTenure(1000000, 12, 1000)).toBe(0)
  })

  it('EMI exactly equals monthly interest: returns 0', () => {
    // Monthly interest = 1000000 * (12/1200) = 10000; EMI = 10000
    expect(calculateTenure(1000000, 12, 10000)).toBe(0)
  })

  it('zero rate: returns ceiling of principal / EMI', () => {
    expect(calculateTenure(1200000, 0, 10000)).toBe(120)
  })

  it('zero principal: returns 0', () => {
    expect(calculateTenure(0, 10, 5000)).toBe(0)
  })

  it('zero EMI: returns 0', () => {
    expect(calculateTenure(1000000, 10, 0)).toBe(0)
  })
})

describe('calculateTotalInterest', () => {
  it('positive total interest for standard loan', () => {
    const result = calculateTotalInterest(2563163, 13.5, 72)
    expect(result).toBeGreaterThan(0)
  })

  it('zero rate: total interest is 0 (within integer-rounding of 1 per month)', () => {
    // At 0% rate EMI = principal/tenure (integer-rounded), so accumulated rounding
    // can produce a small surplus. Allow up to 1 per month.
    expect(calculateTotalInterest(1000000, 0, 60)).toBeLessThanOrEqual(60)
  })

  it('returns 0 when emi * tenureMonths rounds below principal (Math.max guard)', () => {
    // Craft a scenario where Math.round(emi * tenureMonths) < principal
    // At 0% rate with principal=7 and tenure=3: EMI = round(7/3)=2, total = 2*3=6 < 7
    // Math.max(0, 6-7) = Math.max(0, -1) = 0
    expect(calculateTotalInterest(7, 0, 3)).toBe(0)
  })

  it('zero principal: returns 0', () => {
    expect(calculateTotalInterest(0, 10, 60)).toBe(0)
  })

  it('zero tenure: returns 0', () => {
    expect(calculateTotalInterest(1000000, 10, 0)).toBe(0)
  })

  it('NaN annualRate: returns 0', () => {
    expect(calculateTotalInterest(1000000, NaN, 60)).toBe(0)
  })
})
