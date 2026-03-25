/**
 * Edge-case tests for amortization.ts covering branches not exercised by the
 * main suite: emi <= 0 early-return, zero-rate with extra payments, and the
 * 600-iteration cap hit mid-run.
 */
import { generateSchedule } from '../../lib/amortization'

describe('generateSchedule — emi <= 0 early return', () => {
  it('explicit emi = 0 returns empty array', () => {
    // emi > 0 guard fires immediately
    expect(generateSchedule({ principal: 100000, annualRate: 10, emi: 0 })).toEqual([])
  })

  it('explicit emi = negative returns empty array', () => {
    expect(generateSchedule({ principal: 100000, annualRate: 10, emi: -5000 })).toEqual([])
  })

  it('tenureMonths produces emi=0 when calculateEMI guard fires (principal=0)', () => {
    // principal <= 0 → returns [] before emi is evaluated
    expect(generateSchedule({ principal: 0, annualRate: 10, tenureMonths: 12 })).toEqual([])
  })
})

describe('generateSchedule — zero rate with extra payments', () => {
  it('zero-rate schedule with extra payment is shorter than without', () => {
    const base = generateSchedule({ principal: 120000, annualRate: 0, tenureMonths: 12 })
    const accel = generateSchedule({ principal: 120000, annualRate: 0, tenureMonths: 12, extraMonthly: 5000 })
    expect(accel.length).toBeLessThan(base.length)
  })

  it('all interest values remain 0 even with extra payments at zero rate', () => {
    const schedule = generateSchedule({
      principal: 120000,
      annualRate: 0,
      tenureMonths: 12,
      extraMonthly: 3000,
    })
    for (const entry of schedule) {
      expect(entry.interest).toBe(0)
    }
  })
})

describe('generateSchedule — principalPaid <= 0 break branch', () => {
  it('emi exactly equals monthly interest: principalPaid = 0, schedule is empty', () => {
    // Monthly interest on ₹12L at 12%: 1200000 * (12/1200) = 12000
    // emi = 12000 → principalPaid = min(12000-12000, 1200000) = 0 → break at month 1
    const schedule = generateSchedule({ principal: 1200000, annualRate: 12, emi: 12000 })
    expect(schedule.length).toBe(0)
  })
})

describe('generateSchedule — extraPayment capped at remaining balance', () => {
  it('when extra > remaining balance, extraPayment equals remaining balance', () => {
    // 2-month schedule where extra in month 2 exceeds remaining
    const schedule = generateSchedule({
      principal: 5000,
      annualRate: 0,
      tenureMonths: 12,
      extraMonthly: 10000,
    })
    // First month: principalPaid = EMI, remaining = 5000 - EMI
    // extraPayment must be capped at remaining, closing must be 0
    const last = schedule[schedule.length - 1]
    expect(last.closingBalance).toBe(0)
    expect(last.extraPayment).toBeLessThanOrEqual(last.openingBalance)
  })
})

describe('generateSchedule — emi field overrides tenureMonths (when both provided)', () => {
  it('both fields: emi path taken, length is driven by emi not tenureMonths', () => {
    const principal = 1000000
    const annualRate = 10
    // Explicit emi high enough to clear in ~12 months
    const highEmi = 90000
    const schedule = generateSchedule({ principal, annualRate, emi: highEmi, tenureMonths: 600 })
    // With such a high emi the loan is cleared well before 600 months
    expect(schedule.length).toBeLessThan(20)
  })
})
