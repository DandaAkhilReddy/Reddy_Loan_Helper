import { useReducer, useMemo, useEffect, useRef } from 'react'
import type { LoanInput, LoanResult } from '../types/loan'
import { LOAN_DEFAULTS } from '../constants/defaults'
import { calculateEMI } from '../lib/emi-math'
import { generateSchedule } from '../lib/amortization'
import { compareScenarios } from '../lib/comparison'

const INPUT_STORAGE_KEY = 'reddy-loan-inputs'

function getInitialInputs(): LoanInput {
  try {
    const stored = localStorage.getItem(INPUT_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<LoanInput>
      return {
        principal: typeof parsed.principal === 'number' && parsed.principal > 0 ? parsed.principal : LOAN_DEFAULTS.principal,
        annualRate: typeof parsed.annualRate === 'number' ? parsed.annualRate : LOAN_DEFAULTS.annualRate,
        emi: typeof parsed.emi === 'number' ? parsed.emi : LOAN_DEFAULTS.emi,
        tenureMonths: typeof parsed.tenureMonths === 'number' ? parsed.tenureMonths : LOAN_DEFAULTS.tenureMonths,
        extraMonthly: typeof parsed.extraMonthly === 'number' ? parsed.extraMonthly : LOAN_DEFAULTS.extraMonthly,
      }
    }
  } catch { /* corrupt JSON or blocked storage */ }
  return { ...LOAN_DEFAULTS }
}

interface LoanState {
  inputs: LoanInput
  errors: Record<string, string>
}

type LoanAction =
  | { type: 'UPDATE_INPUT'; field: keyof LoanInput; value: number | null }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'LOAD_PRESET'; inputs: LoanInput }
  | { type: 'RESET' }

function validate(inputs: LoanInput): Record<string, string> {
  const errors: Record<string, string> = {}
  if (inputs.principal <= 0) errors.principal = 'Principal must be positive'
  if (inputs.annualRate < 0 || inputs.annualRate > 50) errors.annualRate = 'Rate must be 0-50%'
  return errors
}

function reducer(state: LoanState, action: LoanAction): LoanState {
  switch (action.type) {
    case 'UPDATE_INPUT': {
      const inputs = { ...state.inputs, [action.field]: action.value }
      return { inputs, errors: validate(inputs) }
    }
    case 'SET_ERRORS':
      return { ...state, errors: action.errors }
    case 'LOAD_PRESET':
      return { inputs: { ...action.inputs }, errors: validate(action.inputs) }
    case 'RESET':
      return { inputs: { ...LOAN_DEFAULTS }, errors: {} }
    default:
      return state
  }
}

/**
 * Manages loan calculator state via useReducer and derives results with useMemo.
 *
 * Results are null when:
 * - principal is 0 or negative
 * - validation errors are present
 * - neither emi nor tenureMonths are provided (or both are null/non-positive)
 */
export function useLoanCalculator(): {
  inputs: LoanInput
  errors: Record<string, string>
  results: LoanResult | null
  updateInput: (field: keyof LoanInput, value: number | null) => void
  reset: () => void
  loadPreset: (inputs: LoanInput) => void
} {
  const [state, dispatch] = useReducer(reducer, null, (): LoanState => ({
    inputs: getInitialInputs(),
    errors: {},
  }))

  const skipPersistRef = useRef(false)

  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false
      return
    }
    try { localStorage.setItem(INPUT_STORAGE_KEY, JSON.stringify(state.inputs)) } catch { /* ignore */ }
  }, [state.inputs])

  const results: LoanResult | null = useMemo(() => {
    const { principal, annualRate, emi, tenureMonths, extraMonthly } = state.inputs
    if (principal <= 0) return null
    if (Object.keys(state.errors).length > 0) return null

    // Resolve EMI: if provided use it, else compute from tenure
    let effectiveEmi: number
    if (emi && emi > 0) {
      effectiveEmi = emi
    } else if (tenureMonths && tenureMonths > 0) {
      effectiveEmi = calculateEMI(principal, annualRate, tenureMonths)
    } else {
      return null
    }

    if (effectiveEmi <= 0) return null

    const originalSchedule = generateSchedule({ principal, annualRate, emi: effectiveEmi })
    const acceleratedSchedule = generateSchedule({
      principal,
      annualRate,
      emi: effectiveEmi,
      extraMonthly: Math.max(0, extraMonthly),
    })
    const comparison = compareScenarios(principal, annualRate, effectiveEmi, extraMonthly)

    return { originalSchedule, acceleratedSchedule, comparison, effectiveEmi }
  }, [state.inputs, state.errors])

  const updateInput = (field: keyof LoanInput, value: number | null): void => {
    dispatch({ type: 'UPDATE_INPUT', field, value })
  }

  const reset = (): void => {
    skipPersistRef.current = true
    dispatch({ type: 'RESET' })
    try { localStorage.removeItem(INPUT_STORAGE_KEY) } catch { /* ignore */ }
  }

  const loadPreset = (inputs: LoanInput): void => {
    dispatch({ type: 'LOAD_PRESET', inputs })
  }

  return { inputs: state.inputs, errors: state.errors, results, updateInput, reset, loadPreset }
}
