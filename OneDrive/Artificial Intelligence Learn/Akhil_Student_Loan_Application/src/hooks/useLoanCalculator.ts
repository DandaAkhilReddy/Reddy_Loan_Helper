import { useReducer, useMemo } from 'react'
import type { LoanInput, LoanResult } from '../types/loan'
import { LOAN_DEFAULTS } from '../constants/defaults'
import { calculateEMI } from '../lib/emi-math'
import { generateSchedule } from '../lib/amortization'
import { compareScenarios } from '../lib/comparison'

interface LoanState {
  inputs: LoanInput
  errors: Record<string, string>
}

type LoanAction =
  | { type: 'UPDATE_INPUT'; field: keyof LoanInput; value: number | null }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
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
} {
  const [state, dispatch] = useReducer(reducer, {
    inputs: { ...LOAN_DEFAULTS },
    errors: {},
  })

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

  const reset = (): void => dispatch({ type: 'RESET' })

  return { inputs: state.inputs, errors: state.errors, results, updateInput, reset }
}
