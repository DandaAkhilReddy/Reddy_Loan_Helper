/**
 * Edge-case tests for useCurrency.ts not covered by the main suite.
 * Covers: localStorage.getItem exception falls back to default currency,
 * localStorage.setItem exception is swallowed silently, and
 * formatCompact/format helpers update correctly after currency switch.
 */
import { renderHook, act } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { CurrencyProvider, useCurrency } from '../../hooks/useCurrency'

function wrapper({ children }: { children: ReactNode }): ReactNode {
  return createElement(CurrencyProvider, null, children)
}

describe('useCurrency — localStorage.getItem exception fallback', () => {
  it('falls back to INR when localStorage.getItem throws', () => {
    const original = Storage.prototype.getItem
    Storage.prototype.getItem = () => { throw new Error('blocked') }
    try {
      const { result } = renderHook(() => useCurrency(), { wrapper })
      expect(result.current.currency).toBe('INR')
    } finally {
      Storage.prototype.getItem = original
    }
  })
})

describe('useCurrency — localStorage.setItem exception silenced', () => {
  it('setCurrency does not throw when localStorage.setItem throws', () => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = () => { throw new Error('storage full') }
    try {
      const { result } = renderHook(() => useCurrency(), { wrapper })
      expect(() => {
        act(() => { result.current.setCurrency('USD') })
      }).not.toThrow()
      // In-memory state is still updated even though storage failed
      expect(result.current.currency).toBe('USD')
    } finally {
      Storage.prototype.setItem = original
    }
  })
})

describe('useCurrency — formatCompact and format update after currency switch', () => {
  it('formatCompact returns $ notation for 2M after switching to USD', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper })
    act(() => { result.current.setCurrency('USD') })
    expect(result.current.formatCompact(2_000_000)).toBe('$2.0M')
  })

  it('format returns $ notation for 1000 after switching to USD', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper })
    act(() => { result.current.setCurrency('USD') })
    expect(result.current.format(1000)).toBe('$1,000')
  })

  it('formatCompact reverts to ₹ notation after switching back to INR', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper })
    act(() => { result.current.setCurrency('USD') })
    act(() => { result.current.setCurrency('INR') })
    expect(result.current.formatCompact(500_000)).toBe('₹5.0L')
  })
})
