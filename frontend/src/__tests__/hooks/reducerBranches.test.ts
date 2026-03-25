/**
 * Covers the SET_ERRORS and default branches of the internal reducer in
 * useLoanCalculator.ts using vi.mock to shim useReducer.
 *
 * vi.mock calls are hoisted to the top of the file by Vitest, so the mock
 * is active before useLoanCalculator is imported.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _capturedDispatch: ((a: any) => void) | undefined

// Hoist: this runs before any imports are resolved
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useReducer: (reducer: any, initialState: any, ...rest: any[]) => {
      const result = actual.useReducer(reducer, initialState, ...rest)
      // Capture dispatch the first time useReducer is called (from useLoanCalculator)
      if (!_capturedDispatch) {
        _capturedDispatch = result[1]
      }
      return result
    },
  }
})

import { renderHook, act } from '@testing-library/react'
import { useLoanCalculator } from '../../hooks/useLoanCalculator'

describe('useLoanCalculator reducer — internal branches via shimmed useReducer', () => {
  beforeEach(() => {
    _capturedDispatch = undefined
  })

  it('SET_ERRORS branch: dispatching SET_ERRORS replaces errors map', () => {
    const { result } = renderHook(() => useLoanCalculator())

    expect(_capturedDispatch).toBeDefined()

    act(() => {
      _capturedDispatch!({ type: 'SET_ERRORS', errors: { principal: 'forced error' } })
    })

    expect(result.current.errors).toEqual({ principal: 'forced error' })
  })

  it('default branch: unknown action type returns state unchanged', () => {
    const { result } = renderHook(() => useLoanCalculator())
    const inputsBefore = { ...result.current.inputs }

    act(() => {
      _capturedDispatch!({ type: '__UNKNOWN_ACTION_TYPE__' })
    })

    expect(result.current.inputs).toEqual(inputsBefore)
    expect(result.current.errors).toEqual({})
  })
})
