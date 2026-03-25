/**
 * Persistence edge-case tests for useLoanCalculator.ts.
 *
 * Covers branches not exercised by the main test suite:
 * - skipPersistRef: reset() sets the ref, preventing the useEffect from
 *   re-writing LOAN_DEFAULTS back to localStorage after removeItem
 * - Stored fields with wrong types fall back to LOAN_DEFAULTS
 * - localStorage.setItem throws during updateInput (swallowed silently)
 * - localStorage.removeItem throws during reset (swallowed silently)
 * - loadPreset persists the new inputs to localStorage
 */
import { renderHook, act } from '@testing-library/react'
import { useLoanCalculator } from '../../hooks/useLoanCalculator'
import { LOAN_DEFAULTS } from '../../constants/defaults'

const INPUT_KEY = 'reddy-loan-inputs'

describe('useLoanCalculator — skipPersistRef prevents re-write after reset', () => {
  beforeEach(() => { localStorage.clear() })
  afterEach(() => { localStorage.clear() })

  it('after reset(), localStorage key remains absent (not re-populated with defaults)', () => {
    const { result } = renderHook(() => useLoanCalculator())

    // Ensure a value is stored first
    act(() => {
      result.current.updateInput('principal', 500000)
    })
    expect(localStorage.getItem(INPUT_KEY)).not.toBeNull()

    // reset() removes the key and sets skipPersistRef = true so the effect
    // triggered by the RESET dispatch does not re-write the defaults.
    act(() => {
      result.current.reset()
    })

    expect(localStorage.getItem(INPUT_KEY)).toBeNull()
  })
})

describe('useLoanCalculator — stored field type fallback to LOAN_DEFAULTS', () => {
  beforeEach(() => { localStorage.clear() })
  afterEach(() => { localStorage.clear() })

  it('stored annualRate as string falls back to LOAN_DEFAULTS.annualRate', () => {
    localStorage.setItem(INPUT_KEY, JSON.stringify({ principal: 1000000, annualRate: 'ten' }))
    const { result } = renderHook(() => useLoanCalculator())
    expect(result.current.inputs.annualRate).toBe(LOAN_DEFAULTS.annualRate)
  })

  it('stored emi as string falls back to LOAN_DEFAULTS.emi', () => {
    localStorage.setItem(INPUT_KEY, JSON.stringify({ principal: 1000000, emi: 'auto' }))
    const { result } = renderHook(() => useLoanCalculator())
    expect(result.current.inputs.emi).toBe(LOAN_DEFAULTS.emi)
  })

  it('stored tenureMonths as string falls back to LOAN_DEFAULTS.tenureMonths', () => {
    localStorage.setItem(INPUT_KEY, JSON.stringify({ principal: 1000000, tenureMonths: 'long' }))
    const { result } = renderHook(() => useLoanCalculator())
    expect(result.current.inputs.tenureMonths).toBe(LOAN_DEFAULTS.tenureMonths)
  })

  it('stored extraMonthly as string falls back to LOAN_DEFAULTS.extraMonthly', () => {
    localStorage.setItem(INPUT_KEY, JSON.stringify({ principal: 1000000, extraMonthly: 'none' }))
    const { result } = renderHook(() => useLoanCalculator())
    expect(result.current.inputs.extraMonthly).toBe(LOAN_DEFAULTS.extraMonthly)
  })

  it('stored principal as 0 falls back to LOAN_DEFAULTS.principal', () => {
    localStorage.setItem(INPUT_KEY, JSON.stringify({ principal: 0, annualRate: 10, emi: null, tenureMonths: 60, extraMonthly: 0 }))
    const { result } = renderHook(() => useLoanCalculator())
    expect(result.current.inputs.principal).toBe(LOAN_DEFAULTS.principal)
  })

  it('all stored fields with wrong types fall back entirely to LOAN_DEFAULTS', () => {
    localStorage.setItem(INPUT_KEY, JSON.stringify({
      principal: 'big',
      annualRate: null,
      emi: true,
      tenureMonths: [],
      extraMonthly: {},
    }))
    const { result } = renderHook(() => useLoanCalculator())
    // principal is not a positive number → LOAN_DEFAULTS.principal
    expect(result.current.inputs.principal).toBe(LOAN_DEFAULTS.principal)
    // annualRate null is not typeof 'number' → LOAN_DEFAULTS.annualRate
    expect(result.current.inputs.annualRate).toBe(LOAN_DEFAULTS.annualRate)
  })
})

describe('useLoanCalculator — localStorage.setItem throws during updateInput', () => {
  beforeEach(() => { localStorage.clear() })
  afterEach(() => { localStorage.clear() })

  it('swallows localStorage.setItem error in useEffect without throwing', () => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = () => { throw new Error('quota exceeded') }
    try {
      const { result } = renderHook(() => useLoanCalculator())
      expect(() => {
        act(() => { result.current.updateInput('principal', 800000) })
      }).not.toThrow()
      // State still updated even though persistence failed
      expect(result.current.inputs.principal).toBe(800000)
    } finally {
      Storage.prototype.setItem = original
    }
  })
})

describe('useLoanCalculator — localStorage.removeItem throws during reset', () => {
  beforeEach(() => { localStorage.clear() })
  afterEach(() => { localStorage.clear() })

  it('swallows localStorage.removeItem error during reset without throwing', () => {
    const original = Storage.prototype.removeItem
    Storage.prototype.removeItem = () => { throw new Error('blocked') }
    try {
      const { result } = renderHook(() => useLoanCalculator())
      expect(() => {
        act(() => { result.current.reset() })
      }).not.toThrow()
      // State still reset to defaults
      expect(result.current.inputs).toEqual(LOAN_DEFAULTS)
    } finally {
      Storage.prototype.removeItem = original
    }
  })
})

describe('useLoanCalculator — loadPreset persists inputs to localStorage', () => {
  beforeEach(() => { localStorage.clear() })
  afterEach(() => { localStorage.clear() })

  it('loadPreset writes the preset inputs to localStorage via the useEffect', () => {
    const { result } = renderHook(() => useLoanCalculator())
    const preset = { principal: 1000000, annualRate: 8.5, emi: null, tenureMonths: 84, extraMonthly: 0 }

    act(() => {
      result.current.loadPreset(preset)
    })

    const stored = JSON.parse(localStorage.getItem(INPUT_KEY) ?? '{}') as typeof preset
    expect(stored.principal).toBe(1000000)
    expect(stored.annualRate).toBe(8.5)
    expect(stored.tenureMonths).toBe(84)
  })
})
