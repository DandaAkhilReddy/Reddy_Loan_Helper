import { renderHook, act } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { DarkModeProvider, useDarkMode } from '../../hooks/useDarkMode'

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'reddy-loan-dark-mode'

function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}

function setStorage(value: string): void {
  localStorage.setItem(STORAGE_KEY, value)
}

// ---------------------------------------------------------------------------
// matchMedia helper
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Wrapper factory
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: ReactNode }): ReactNode {
  return createElement(DarkModeProvider, null, children)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useDarkMode', () => {
  beforeEach(() => {
    clearStorage()
    // Reset to non-dark system preference (setup.ts sets matches: false)
    setMatchMedia(false)
    // Remove any lingering dark class
    document.documentElement.classList.remove('dark')
  })

  it('defaults to false when localStorage is empty and prefers-color-scheme is light', () => {
    setMatchMedia(false)
    const { result } = renderHook(() => useDarkMode(), { wrapper })
    expect(result.current.isDark).toBe(false)
  })

  it('defaults to true when localStorage is empty and prefers-color-scheme is dark', () => {
    setMatchMedia(true)
    const { result } = renderHook(() => useDarkMode(), { wrapper })
    expect(result.current.isDark).toBe(true)
  })

  it('reads true from localStorage on init', () => {
    setStorage('true')
    const { result } = renderHook(() => useDarkMode(), { wrapper })
    expect(result.current.isDark).toBe(true)
  })

  it('reads false from localStorage on init', () => {
    setStorage('false')
    const { result } = renderHook(() => useDarkMode(), { wrapper })
    expect(result.current.isDark).toBe(false)
  })

  it('toggle() flips isDark from false to true', () => {
    setStorage('false')
    const { result } = renderHook(() => useDarkMode(), { wrapper })
    act(() => {
      result.current.toggle()
    })
    expect(result.current.isDark).toBe(true)
  })

  it('toggle() flips isDark from true to false', () => {
    setStorage('true')
    const { result } = renderHook(() => useDarkMode(), { wrapper })
    act(() => {
      result.current.toggle()
    })
    expect(result.current.isDark).toBe(false)
  })

  it('persists to localStorage after toggle', () => {
    setStorage('false')
    const { result } = renderHook(() => useDarkMode(), { wrapper })
    act(() => {
      result.current.toggle()
    })
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true')
  })

  it('sets dark class on document.documentElement when isDark is true', () => {
    setStorage('true')
    renderHook(() => useDarkMode(), { wrapper })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes dark class from document.documentElement when toggling off', () => {
    setStorage('true')
    const { result } = renderHook(() => useDarkMode(), { wrapper })
    act(() => {
      result.current.toggle()
    })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('swallows localStorage.getItem exception and falls back to matchMedia', () => {
    setMatchMedia(true)
    const original = Storage.prototype.getItem
    Storage.prototype.getItem = () => { throw new Error('blocked') }
    try {
      const { result } = renderHook(() => useDarkMode(), { wrapper })
      expect(result.current.isDark).toBe(true)
    } finally {
      Storage.prototype.getItem = original
    }
  })

  it('swallows localStorage.setItem exception without throwing during toggle', () => {
    setStorage('false')
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = () => { throw new Error('storage full') }
    try {
      const { result } = renderHook(() => useDarkMode(), { wrapper })
      expect(() => {
        act(() => { result.current.toggle() })
      }).not.toThrow()
      expect(result.current.isDark).toBe(true)
    } finally {
      Storage.prototype.setItem = original
    }
  })

  it('throws when used outside DarkModeProvider', () => {
    expect(() => renderHook(() => useDarkMode())).toThrow(
      'useDarkMode must be used within DarkModeProvider',
    )
  })

})
