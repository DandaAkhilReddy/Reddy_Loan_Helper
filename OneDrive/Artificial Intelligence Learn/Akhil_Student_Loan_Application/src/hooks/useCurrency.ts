import { createElement, createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Currency, CurrencyConfig } from '../types/loan'
import { CURRENCY_CONFIGS, DEFAULT_CURRENCY } from '../constants/defaults'
import { formatCurrency, formatCurrencyCompact } from '../lib/format'

interface CurrencyContextValue {
  currency: Currency
  setCurrency: (c: Currency) => void
  config: CurrencyConfig
  format: (amount: number) => string
  formatCompact: (amount: number) => string
}

const STORAGE_KEY = 'reddy-loan-currency'

function getInitialCurrency(): Currency {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'INR' || stored === 'USD') return stored
  } catch { /* SSR or blocked localStorage */ }
  return DEFAULT_CURRENCY
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

/**
 * Provides currency selection state with localStorage persistence.
 * Wrap the component tree that needs currency formatting with this provider.
 */
export function CurrencyProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [currency, setCurrencyState] = useState<Currency>(getInitialCurrency)

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c)
    try { localStorage.setItem(STORAGE_KEY, c) } catch { /* ignore */ }
  }, [])

  const config = CURRENCY_CONFIGS[currency]
  const format = useCallback((amount: number) => formatCurrency(amount, currency), [currency])
  const formatCompact = useCallback((amount: number) => formatCurrencyCompact(amount, currency), [currency])

  const value: CurrencyContextValue = { currency, setCurrency, config, format, formatCompact }
  return createElement(CurrencyContext.Provider, { value }, children)
}

/**
 * Returns the current currency selection and formatting helpers.
 * Must be called within a CurrencyProvider subtree.
 *
 * @throws {Error} When used outside CurrencyProvider
 */
export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
