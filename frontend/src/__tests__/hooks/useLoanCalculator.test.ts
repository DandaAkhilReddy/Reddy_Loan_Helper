import { renderHook, act } from '@testing-library/react'
import { useLoanCalculator } from '../../hooks/useLoanCalculator'
import { LOAN_DEFAULTS } from '../../constants/defaults'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useLoanCalculator', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('initial state matches LOAN_DEFAULTS', () => {
    const { result } = renderHook(() => useLoanCalculator())
    expect(result.current.inputs).toEqual(LOAN_DEFAULTS)
    expect(result.current.errors).toEqual({})
  })

  it('UPDATE_INPUT changes a field', () => {
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('principal', 5_000_000)
    })
    expect(result.current.inputs.principal).toBe(5_000_000)
  })

  it('results are computed (non-null) from LOAN_DEFAULTS', () => {
    const { result } = renderHook(() => useLoanCalculator())
    expect(result.current.results).not.toBeNull()
    expect(result.current.results?.effectiveEmi).toBeGreaterThan(0)
    expect(result.current.results?.originalSchedule.length).toBeGreaterThan(0)
  })

  it('SET_ERRORS injects arbitrary error map', () => {
    const { result } = renderHook(() => useLoanCalculator())
    // Access dispatch directly via the hook — we test via updateInput driving errors
    // SET_ERRORS is not exposed; verify validate() sets errors via an invalid update
    act(() => {
      result.current.updateInput('annualRate', -5)
    })
    expect(result.current.errors).toHaveProperty('annualRate')
  })

  it('RESET returns inputs to LOAN_DEFAULTS and clears errors', () => {
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('principal', 0)
    })
    expect(result.current.errors).toHaveProperty('principal')
    act(() => {
      result.current.reset()
    })
    expect(result.current.inputs).toEqual(LOAN_DEFAULTS)
    expect(result.current.errors).toEqual({})
  })

  it('principal = 0 → results is null', () => {
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('principal', 0)
    })
    expect(result.current.results).toBeNull()
  })

  it('annualRate = -1 → errors contain annualRate', () => {
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('annualRate', -1)
    })
    expect(result.current.errors).toHaveProperty('annualRate', 'Rate must be 0-50%')
  })

  it('annualRate > 50 → errors contain annualRate', () => {
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('annualRate', 51)
    })
    expect(result.current.errors).toHaveProperty('annualRate', 'Rate must be 0-50%')
  })

  it('when emi is null but valid tenureMonths provided → computes results via EMI formula', () => {
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('emi', null)
      result.current.updateInput('tenureMonths', 120)
      result.current.updateInput('principal', 1_000_000)
      result.current.updateInput('annualRate', 10)
    })
    expect(result.current.errors).toEqual({})
    expect(result.current.results).not.toBeNull()
    expect(result.current.results?.effectiveEmi).toBeGreaterThan(0)
  })

  it('when both emi and tenureMonths are null → results is null', () => {
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('emi', null)
      result.current.updateInput('tenureMonths', null)
    })
    expect(result.current.results).toBeNull()
  })

  it('extraMonthly > 0 produces monthsSaved > 0 in comparison', () => {
    const { result } = renderHook(() => useLoanCalculator())
    // Start from defaults (emi = 51476, tenureMonths = 111, principal = 2563163)
    act(() => {
      result.current.updateInput('extraMonthly', 10_000)
    })
    expect(result.current.results).not.toBeNull()
    expect(result.current.results?.comparison.monthsSaved).toBeGreaterThan(0)
    expect(result.current.results?.comparison.interestSaved).toBeGreaterThan(0)
  })

  it('annualRate = 50 is valid (boundary)', () => {
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('annualRate', 50)
    })
    expect(result.current.errors).not.toHaveProperty('annualRate')
  })

  it('annualRate = 0 is valid (boundary)', () => {
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('annualRate', 0)
    })
    expect(result.current.errors).not.toHaveProperty('annualRate')
  })

  it('results include both originalSchedule and acceleratedSchedule arrays', () => {
    const { result } = renderHook(() => useLoanCalculator())
    expect(Array.isArray(result.current.results?.originalSchedule)).toBe(true)
    expect(Array.isArray(result.current.results?.acceleratedSchedule)).toBe(true)
  })

  it('acceleratedSchedule is shorter than originalSchedule when extraMonthly > 0', () => {
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('extraMonthly', 20_000)
    })
    const { originalSchedule, acceleratedSchedule } = result.current.results!
    expect(acceleratedSchedule.length).toBeLessThan(originalSchedule.length)
  })

  it('errors object is replaced (not merged) on successive invalid updates', () => {
    // Validates that a new errors map replaces the previous one each time
    // validate() runs inside UPDATE_INPUT.
    const { result } = renderHook(() => useLoanCalculator())

    act(() => {
      result.current.updateInput('principal', 0)        // adds principal error
    })
    expect(result.current.errors).toHaveProperty('principal')

    act(() => {
      result.current.updateInput('principal', 1000000)  // clears principal error
      result.current.updateInput('annualRate', 55)      // adds annualRate error
    })
    expect(result.current.errors).not.toHaveProperty('principal')
    expect(result.current.errors).toHaveProperty('annualRate')
  })

  it('state is unchanged after RESET when inputs are already at defaults', () => {
    // Calling reset twice from default state should produce identical output.
    const { result } = renderHook(() => useLoanCalculator())
    act(() => { result.current.reset() })
    const afterFirst = { ...result.current.inputs }
    act(() => { result.current.reset() })
    expect(result.current.inputs).toEqual(afterFirst)
  })

  it('effectiveEmi <= 0 guard: tenureMonths=Infinity causes calculateEMI to return 0 → null', () => {
    // emi = null, tenureMonths = Infinity → calculateEMI returns 0 (non-finite guard)
    // → effectiveEmi <= 0 → results is null
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('emi', null)
      result.current.updateInput('tenureMonths', Infinity)
    })
    // No validation error for tenureMonths (validator only checks principal and annualRate)
    expect(result.current.errors).not.toHaveProperty('tenureMonths')
    expect(result.current.results).toBeNull()
  })

  // ── localStorage persistence ──────────────────────────────────────────────

  it('loads from localStorage on init when valid JSON is stored', () => {
    const stored = { principal: 500000, annualRate: 9, emi: 10000, tenureMonths: 60, extraMonthly: 500 }
    localStorage.setItem('reddy-loan-inputs', JSON.stringify(stored))
    const { result } = renderHook(() => useLoanCalculator())
    expect(result.current.inputs.principal).toBe(500000)
    expect(result.current.inputs.annualRate).toBe(9)
    expect(result.current.inputs.emi).toBe(10000)
    expect(result.current.inputs.tenureMonths).toBe(60)
    expect(result.current.inputs.extraMonthly).toBe(500)
  })

  it('persists inputs to localStorage when a field is updated', () => {
    localStorage.removeItem('reddy-loan-inputs')
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.updateInput('principal', 999999)
    })
    const stored = JSON.parse(localStorage.getItem('reddy-loan-inputs') ?? '{}') as { principal: number }
    expect(stored.principal).toBe(999999)
  })

  it('reset removes localStorage entry', () => {
    localStorage.setItem('reddy-loan-inputs', JSON.stringify({ principal: 100000 }))
    const { result } = renderHook(() => useLoanCalculator())
    act(() => {
      result.current.reset()
    })
    expect(localStorage.getItem('reddy-loan-inputs')).toBeNull()
  })

  it('falls back to LOAN_DEFAULTS when localStorage contains corrupt JSON', () => {
    localStorage.setItem('reddy-loan-inputs', 'not-valid-json{{{')
    const { result } = renderHook(() => useLoanCalculator())
    expect(result.current.inputs).toEqual(LOAN_DEFAULTS)
  })

  it('merges partial stored data with LOAN_DEFAULTS for missing fields', () => {
    localStorage.setItem('reddy-loan-inputs', JSON.stringify({ principal: 750000 }))
    const { result } = renderHook(() => useLoanCalculator())
    expect(result.current.inputs.principal).toBe(750000)
    expect(result.current.inputs.annualRate).toBe(LOAN_DEFAULTS.annualRate)
    expect(result.current.inputs.emi).toBe(LOAN_DEFAULTS.emi)
    expect(result.current.inputs.tenureMonths).toBe(LOAN_DEFAULTS.tenureMonths)
    expect(result.current.inputs.extraMonthly).toBe(LOAN_DEFAULTS.extraMonthly)
  })

  it('falls back to LOAN_DEFAULTS when stored principal is 0 or negative', () => {
    localStorage.setItem('reddy-loan-inputs', JSON.stringify({ principal: -500, annualRate: 10, emi: null, tenureMonths: 60, extraMonthly: 0 }))
    const { result } = renderHook(() => useLoanCalculator())
    expect(result.current.inputs.principal).toBe(LOAN_DEFAULTS.principal)
  })

  // ── LOAD_PRESET ──────────────────────────────────────────────────────────

  it('loadPreset sets inputs and re-validates', () => {
    const { result } = renderHook(() => useLoanCalculator())
    const presetInputs = { principal: 1000000, annualRate: 8.5, emi: null, tenureMonths: 84, extraMonthly: 0 }
    act(() => {
      result.current.loadPreset(presetInputs)
    })
    expect(result.current.inputs.principal).toBe(1000000)
    expect(result.current.inputs.annualRate).toBe(8.5)
    expect(result.current.inputs.tenureMonths).toBe(84)
    expect(result.current.errors).toEqual({})
  })

  it('loadPreset with invalid principal sets validation error', () => {
    const { result } = renderHook(() => useLoanCalculator())
    const badPreset = { principal: 0, annualRate: 0, emi: null, tenureMonths: null, extraMonthly: 0 }
    act(() => {
      result.current.loadPreset(badPreset)
    })
    expect(result.current.errors).toHaveProperty('principal')
  })
})

