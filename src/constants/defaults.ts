import type { Currency, CurrencyConfig, LoanInput } from '../types/loan'

export const CURRENCY_CONFIGS: Record<Currency, CurrencyConfig> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    locale: 'en-IN',
    sliderMax: 100000,
    sliderStep: 1000,
    compactUnits: [
      { threshold: 1e7, suffix: 'Cr', divisor: 1e7 },
      { threshold: 1e5, suffix: 'L', divisor: 1e5 },
      { threshold: 1e3, suffix: 'K', divisor: 1e3 },
    ],
  },
  USD: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
    sliderMax: 10000,
    sliderStep: 100,
    compactUnits: [
      { threshold: 1e9, suffix: 'B', divisor: 1e9 },
      { threshold: 1e6, suffix: 'M', divisor: 1e6 },
      { threshold: 1e3, suffix: 'K', divisor: 1e3 },
    ],
  },
}

export const DEFAULT_CURRENCY: Currency = 'INR'

export const LOAN_DEFAULTS: LoanInput = {
  principal: 2563163,
  annualRate: 13.5,
  emi: 51476,
  tenureMonths: 111,
  extraMonthly: 0,
}

export const RATE_MIN = 0
export const RATE_MAX = 50
export const MAX_SCHEDULE_MONTHS = 600
