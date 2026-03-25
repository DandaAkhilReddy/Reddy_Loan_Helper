/**
 * Covers SET_ERRORS and default branches of useLoanCalculator.ts.
 *
 * Both branches are TypeScript-unreachable via the public API. We reach them
 * at runtime by capturing the internal dispatch through a module-level
 * vi.mock of React that wraps useReducer. The mock is file-scoped and
 * isolated from other test files via vitest's module registry.
 */

// ─── Hoist capture store before any imports ─────────────────────────────────
const captureStore = vi.hoisted(() => ({
  dispatch: null as ((action: Record<string, unknown>) => void) | null,
}))

// ─── Wrap React.useReducer at import time ────────────────────────────────────
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useReducer: <S, A, I>(
      reducer: (s: S, a: A) => S,
      initArg: I,
      init?: (i: I) => S,
    ): [S, (a: A) => void] => {
      // Support both 2-arg and 3-arg forms
      const initialState = init ? init(initArg) : (initArg as unknown as S)
      const [state, dispatch] = actual.useReducer(reducer, initialState)
      captureStore.dispatch = dispatch as (action: Record<string, unknown>) => void
      return [state, dispatch]
    },
  }
})

// ─── Import after mock registration (vitest processes this after hoisting) ───
import { renderHook, act } from '@testing-library/react'
import { useLoanCalculator } from '../../hooks/useLoanCalculator'

describe('useLoanCalculator reducer — SET_ERRORS branch', () => {
  beforeEach(() => {
    captureStore.dispatch = null
  })

  it('SET_ERRORS sets errors state with the provided map', () => {
    const { result } = renderHook(() => useLoanCalculator())

    expect(captureStore.dispatch).not.toBeNull()

    act(() => {
      captureStore.dispatch!({ type: 'SET_ERRORS', errors: { principal: 'forced' } })
    })

    expect(result.current.errors).toHaveProperty('principal', 'forced')
  })
})

describe('useLoanCalculator reducer — default branch', () => {
  beforeEach(() => {
    captureStore.dispatch = null
  })

  it('unknown action type returns state unchanged', () => {
    const { result } = renderHook(() => useLoanCalculator())
    const inputsBefore = JSON.stringify(result.current.inputs)

    act(() => {
      captureStore.dispatch!({ type: '__NEVER__' })
    })

    expect(JSON.stringify(result.current.inputs)).toBe(inputsBefore)
  })
})
