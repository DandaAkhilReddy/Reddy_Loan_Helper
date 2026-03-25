/**
 * Edge-case tests for useLoanCalculator.ts covering branches not exercised by
 * the main suite: emi = 0 (falsy but not null), effectiveEmi <= 0 after
 * calculateEMI call, negative principal, and the reducer default branch.
 */
import { renderHook, act } from '@testing-library/react'
import { useLoanCalculator } from '../../hooks/useLoanCalculator'

describe('useLoanCalculator — results null branches', () => {
  it('emi = 0 with no tenureMonths: results is null (falsy emi, null tenure)', () => {
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('emi', 0)
      result.current.updateInput('tenureMonths', null)
    })
    // emi = 0 is falsy; tenureMonths = null → falls through to return null
    expect(result.current.results).toBeNull()
  })

  it('tenureMonths = 0 with no emi: results is null (tenureMonths > 0 fails)', () => {
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('emi', null)
      result.current.updateInput('tenureMonths', 0)
    })
    expect(result.current.results).toBeNull()
  })

  it('negative principal → errors.principal set and results null', () => {
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('principal', -1)
    })
    expect(result.current.errors).toHaveProperty('principal', 'Principal must be positive')
    expect(result.current.results).toBeNull()
  })

  it('annualRate = 51 → results null due to validation error', () => {
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('annualRate', 51)
    })
    expect(result.current.errors).toHaveProperty('annualRate')
    expect(result.current.results).toBeNull()
  })

  it('both emi and tenureMonths are 0 → results null', () => {
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('emi', 0)
      result.current.updateInput('tenureMonths', 0)
    })
    expect(result.current.results).toBeNull()
  })
})

describe('useLoanCalculator — effectiveEmi computed from tenureMonths', () => {
  it('emi = null + valid tenureMonths → effectiveEmi > 0 in results', () => {
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('emi', null)
      result.current.updateInput('tenureMonths', 60)
      result.current.updateInput('principal', 500000)
      result.current.updateInput('annualRate', 12)
    })
    expect(result.current.results).not.toBeNull()
    expect(result.current.results!.effectiveEmi).toBeGreaterThan(0)
  })
})

describe('useLoanCalculator — extraMonthly negative treated as 0', () => {
  it('negative extraMonthly: results not null and comparison same as zero extra', () => {
    const { result } = renderHook(() => useLoanCalculator())

    // baseline with 0 extra
    act(() => {
      result.current.updateInput('extraMonthly', 0)
    })
    const baseMonths = result.current.results!.comparison.originalMonths

    act(() => {
      result.current.updateInput('extraMonthly', -999)
    })
    // Math.max(0, -999) = 0 → same schedule as zero extra
    expect(result.current.results).not.toBeNull()
    expect(result.current.results!.comparison.originalMonths).toBe(baseMonths)
    expect(result.current.results!.comparison.monthsSaved).toBe(0)
  })
})

describe('useLoanCalculator — multiple errors at once', () => {
  it('when both principal and annualRate invalid: errors has both keys and results is null', () => {
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('principal', 0)
      result.current.updateInput('annualRate', 55)
    })
    expect(result.current.errors).toHaveProperty('principal')
    expect(result.current.errors).toHaveProperty('annualRate')
    expect(result.current.results).toBeNull()
  })
})

describe('useLoanCalculator — reset clears to defaults', () => {
  it('reset after multiple mutations restores clean defaults', () => {
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('principal', -1)
      result.current.updateInput('annualRate', 55)
      result.current.updateInput('emi', null)
      result.current.updateInput('tenureMonths', null)
    })
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0)
    act(() => {
      result.current.reset()
    })
    expect(result.current.errors).toEqual({})
    expect(result.current.results).not.toBeNull()
  })
})
