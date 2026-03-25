/**
 * Edge-case tests for useDarkMode.ts covering paths not exercised by the
 * main useDarkMode.test.ts suite:
 *
 * - localStorage contains an unrecognised value (neither 'true' nor 'false')
 *   → falls through to matchMedia
 * - localStorage contains an empty string → falls through to matchMedia
 * - multiple toggle calls persist the final value correctly
 */
import { renderHook, act } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { DarkModeProvider, useDarkMode } from '../../hooks/useDarkMode'

const STORAGE_KEY = 'reddy-loan-dark-mode'

function setMatchMedia(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

function wrapper({ children }: { children: ReactNode }): ReactNode {
  return createElement(DarkModeProvider, null, children)
}

describe('useDarkMode — unrecognised localStorage value falls through to matchMedia', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    document.documentElement.classList.remove('dark')
  })

  it('stored value "maybe" falls through to matchMedia (light system preference → false)', () => {
    localStorage.setItem(STORAGE_KEY, 'maybe')
    setMatchMedia(false)
    const { result } = renderHook(() => useDarkMode(), { wrapper })
    // Neither 'true' nor 'false' → matchMedia checked, which returns false
    expect(result.current.isDark).toBe(false)
  })

  it('stored value "maybe" falls through to matchMedia (dark system preference → true)', () => {
    localStorage.setItem(STORAGE_KEY, 'maybe')
    setMatchMedia(true)
    const { result } = renderHook(() => useDarkMode(), { wrapper })
    expect(result.current.isDark).toBe(true)
  })

  it('empty string in localStorage falls through to matchMedia', () => {
    localStorage.setItem(STORAGE_KEY, '')
    setMatchMedia(false)
    const { result } = renderHook(() => useDarkMode(), { wrapper })
    expect(result.current.isDark).toBe(false)
  })

  it('null in localStorage (removeItem result) falls through to matchMedia', () => {
    // localStorage.getItem returns null when key is absent → falls through
    localStorage.removeItem(STORAGE_KEY)
    setMatchMedia(true)
    const { result } = renderHook(() => useDarkMode(), { wrapper })
    expect(result.current.isDark).toBe(true)
  })
})

describe('useDarkMode — multiple toggles persist correctly', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    document.documentElement.classList.remove('dark')
    setMatchMedia(false)
  })

  it('three toggles from light → persists "true" after odd count', () => {
    const { result } = renderHook(() => useDarkMode(), { wrapper })

    act(() => { result.current.toggle() }) // false → true
    act(() => { result.current.toggle() }) // true → false
    act(() => { result.current.toggle() }) // false → true

    expect(result.current.isDark).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('two toggles from light → persists "false" after even count', () => {
    const { result } = renderHook(() => useDarkMode(), { wrapper })

    act(() => { result.current.toggle() }) // false → true
    act(() => { result.current.toggle() }) // true → false

    expect(result.current.isDark).toBe(false)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
