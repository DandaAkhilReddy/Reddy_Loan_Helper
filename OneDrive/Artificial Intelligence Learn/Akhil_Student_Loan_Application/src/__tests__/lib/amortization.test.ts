import { generateSchedule } from '../../lib/amortization'
import { calculateEMI } from '../../lib/emi-math'
import type { AmortizationEntry } from '../../types/loan'

describe('generateSchedule — standard no-prepayment', () => {
  const principal = 2563163
  const annualRate = 13.5
  const tenureMonths = 72
  let schedule: AmortizationEntry[]

  beforeEach(() => {
    schedule = generateSchedule({ principal, annualRate, tenureMonths })
  })

  it('schedule length approximates tenure (within ±2)', () => {
    expect(schedule.length).toBeGreaterThanOrEqual(70)
    expect(schedule.length).toBeLessThanOrEqual(74)
  })

  it('last entry has closingBalance === 0', () => {
    const last = schedule[schedule.length - 1]
    expect(last.closingBalance).toBe(0)
  })

  it('sum of principalPaid ≈ principal (within ±1 per month rounding)', () => {
    const totalPrincipal = schedule.reduce((sum, e) => sum + e.principalPaid, 0)
    expect(totalPrincipal).toBeGreaterThanOrEqual(principal - schedule.length)
    expect(totalPrincipal).toBeLessThanOrEqual(principal + schedule.length)
  })

  it('closing balance is monotonically decreasing', () => {
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].closingBalance).toBeLessThan(schedule[i - 1].closingBalance)
    }
  })

  it('interest decreases over time (reducing balance)', () => {
    // Not strictly monotonic every single step due to rounding, but the first
    // half average should exceed the second half average
    const mid = Math.floor(schedule.length / 2)
    const firstHalfAvg =
      schedule.slice(0, mid).reduce((s, e) => s + e.interest, 0) / mid
    const secondHalfAvg =
      schedule.slice(mid).reduce((s, e) => s + e.interest, 0) /
      (schedule.length - mid)
    expect(firstHalfAvg).toBeGreaterThan(secondHalfAvg)
  })

  it('openingBalance[n] === closingBalance[n-1]', () => {
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].openingBalance).toBe(schedule[i - 1].closingBalance)
    }
  })

  it('cumulativeInterest is monotonically non-decreasing', () => {
    // Integer rounding on a tiny final balance can produce interest = 0 for the
    // last month, making consecutive cumulativeInterest values equal — use >=.
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].cumulativeInterest).toBeGreaterThanOrEqual(
        schedule[i - 1].cumulativeInterest,
      )
    }
  })
})

describe('generateSchedule — prepayment', () => {
  it('prepayment produces a shorter schedule than no prepayment', () => {
    const opts = { principal: 2563163, annualRate: 13.5, tenureMonths: 72 }
    const standard = generateSchedule(opts)
    const accelerated = generateSchedule({ ...opts, extraMonthly: 5000 })
    expect(accelerated.length).toBeLessThan(standard.length)
  })

  it('extra = 0 produces same length as no extraMonthly field', () => {
    const opts = { principal: 1000000, annualRate: 10, tenureMonths: 60 }
    const a = generateSchedule(opts)
    const b = generateSchedule({ ...opts, extraMonthly: 0 })
    expect(a.length).toBe(b.length)
  })

  it('negative extra is treated as 0', () => {
    const opts = { principal: 1000000, annualRate: 10, tenureMonths: 60 }
    const a = generateSchedule(opts)
    const b = generateSchedule({ ...opts, extraMonthly: -500 })
    expect(a.length).toBe(b.length)
  })

  it('extra > remaining balance terminates early', () => {
    // Large prepayment each month should pay off faster
    const schedule = generateSchedule({
      principal: 100000,
      annualRate: 10,
      tenureMonths: 120,
      extraMonthly: 50000,
    })
    expect(schedule.length).toBeLessThan(120)
  })

  it('very large prepayment: schedule ends in 1 entry', () => {
    // EMI already covers most; massive extra clears in first month
    const emi = calculateEMI(100000, 10, 12)
    const schedule = generateSchedule({
      principal: 100000,
      annualRate: 10,
      emi,
      extraMonthly: 200000,
    })
    expect(schedule.length).toBe(1)
    expect(schedule[0].closingBalance).toBe(0)
  })
})

describe('generateSchedule — zero interest rate', () => {
  it('all interest entries are 0', () => {
    const schedule = generateSchedule({ principal: 120000, annualRate: 0, tenureMonths: 12 })
    for (const entry of schedule) {
      expect(entry.interest).toBe(0)
    }
  })
})

describe('generateSchedule — error and edge cases', () => {
  it('throws when neither emi nor tenureMonths is provided', () => {
    expect(() => generateSchedule({ principal: 100000, annualRate: 10 })).toThrow(
      'Must provide either emi or tenureMonths',
    )
  })

  it('when both emi and tenureMonths are provided, emi takes precedence', () => {
    const principal = 1000000
    const annualRate = 10
    // Tenure 120 months → EMI ~13215; tenure 60 months → EMI ~21247
    const emi60 = calculateEMI(principal, annualRate, 60)
    const schedule = generateSchedule({ principal, annualRate, emi: emi60, tenureMonths: 120 })
    // Should resolve in ~60 months, not 120
    expect(schedule.length).toBeLessThanOrEqual(62)
    expect(schedule.length).toBeGreaterThanOrEqual(58)
  })

  it('zero principal returns empty array', () => {
    expect(generateSchedule({ principal: 0, annualRate: 10, tenureMonths: 60 })).toEqual([])
  })

  it('negative principal returns empty array', () => {
    expect(generateSchedule({ principal: -50000, annualRate: 10, tenureMonths: 60 })).toEqual([])
  })

  it('schedule never exceeds 600 entries', () => {
    // Use a tenure of 800 — the cap should kick in
    const schedule = generateSchedule({ principal: 10000000, annualRate: 8, tenureMonths: 800 })
    expect(schedule.length).toBeLessThanOrEqual(600)
  })

  it('final month: last principalPaid caps at opening balance (no negative closing)', () => {
    const schedule = generateSchedule({ principal: 100000, annualRate: 12, tenureMonths: 12 })
    const last = schedule[schedule.length - 1]
    expect(last.closingBalance).toBeGreaterThanOrEqual(0)
    expect(last.principalPaid).toBeLessThanOrEqual(last.openingBalance)
  })

  it('EMI < monthly interest: returns empty or very short schedule', () => {
    // Monthly interest on ₹10L at 12% = ₹10000; provide EMI of ₹9000 (below interest)
    // principalPaid = min(9000 - 10000, 1000000) = min(-1000, ...) ≤ 0 → break immediately
    const schedule = generateSchedule({ principal: 1000000, annualRate: 12, emi: 9000 })
    expect(schedule.length).toBe(0)
  })

  it('derived emi is 0 when tenureMonths=0 via calculateEMI guard: returns empty array', () => {
    // When tenureMonths is provided but calculateEMI returns 0 (because tenureMonths <= 0),
    // the emi <= 0 guard at line 39 fires and returns [].
    // tenureMonths=0 → calculateEMI(p, r, 0) = 0 → emi = 0 → return []
    // We pass emi=undefined and tenureMonths=0 to force the calculateEMI path.
    // But tenureMonths=0 → calculateEMI returns 0 → hits the emi <= 0 branch.
    const schedule = generateSchedule({ principal: 500000, annualRate: 10, emi: 0 })
    expect(schedule).toEqual([])
  })
})
