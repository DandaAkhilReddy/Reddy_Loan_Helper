import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { CurrencyProvider, useCurrency } from '../../hooks/useCurrency'
import { CURRENCY_CONFIGS } from '../../constants/defaults'

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function clearStorage(): void {
  localStorage.removeItem('reddy-loan-currency')
}

function setStorage(value: string): void {
  localStorage.setItem('reddy-loan-currency', value)
}

// ---------------------------------------------------------------------------
// Wrapper factory
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: ReactNode }): ReactNode {
  return createElement(CurrencyProvider, null, children)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCurrency', () => {
  beforeEach(() => {
    clearStorage()
  })

  it('defaults to INR when localStorage is empty', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper })
    expect(result.current.currency).toBe('INR')
  })

  it('setCurrency changes currency to USD', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper })
    act(() => {
      result.current.setCurrency('USD')
    })
    expect(result.current.currency).toBe('USD')
  })

  it('persists selected currency to localStorage', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper })
    act(() => {
      result.current.setCurrency('USD')
    })
    expect(localStorage.getItem('reddy-loan-currency')).toBe('USD')
  })

  it('reads USD from localStorage on init', () => {
    setStorage('USD')
    const { result } = renderHook(() => useCurrency(), { wrapper })
    expect(result.current.currency).toBe('USD')
  })

  it('ignores unrecognised localStorage values and falls back to INR', () => {
    setStorage('GBP')
    const { result } = renderHook(() => useCurrency(), { wrapper })
    expect(result.current.currency).toBe('INR')
  })

  it('provides correct config for INR — symbol ₹ and sliderMax 100000', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper })
    expect(result.current.config).toEqual(CURRENCY_CONFIGS['INR'])
    expect(result.current.config.symbol).toBe('₹')
    expect(result.current.config.sliderMax).toBe(100000)
  })

  it('provides correct config for USD — symbol $ and sliderMax 10000', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper })
    act(() => {
      result.current.setCurrency('USD')
    })
    expect(result.current.config).toEqual(CURRENCY_CONFIGS['USD'])
    expect(result.current.config.symbol).toBe('$')
    expect(result.current.config.sliderMax).toBe(10000)
  })

  it('format() dispatches correctly for INR', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper })
    // 2563163 with INR formatting → ₹25,63,163
    expect(result.current.format(2563163)).toBe('₹25,63,163')
  })

  it('format() dispatches correctly for USD', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper })
    act(() => {
      result.current.setCurrency('USD')
    })
    // 2563163 with USD formatting → $2,563,163
    expect(result.current.format(2563163)).toBe('$2,563,163')
  })

  it('formatCompact() dispatches correctly for INR', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper })
    // 2563163 → ₹25.6L
    expect(result.current.formatCompact(2563163)).toBe('₹25.6L')
  })

  it('formatCompact() dispatches correctly for USD', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper })
    act(() => {
      result.current.setCurrency('USD')
    })
    // 2563163 → $2.6M
    expect(result.current.formatCompact(2563163)).toBe('$2.6M')
  })

  it('throws when used outside CurrencyProvider', () => {
    // renderHook without a wrapper — context is null
    expect(() => renderHook(() => useCurrency())).toThrow(
      'useCurrency must be used within CurrencyProvider',
    )
  })
})
