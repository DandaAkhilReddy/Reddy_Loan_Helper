import type { Currency } from '../types/loan'

/**
 * Formats a number using Indian grouping (last 3 digits, then groups of 2).
 * Example: 2563163 → ₹25,63,163
 */
export function formatINR(amount: number): string {
  const negative = amount < 0
  const abs = Math.abs(amount)
  const fixed = abs.toFixed(2)
  const dotIndex = fixed.indexOf('.')
  const intStr = fixed.slice(0, dotIndex)
  const decPart = fixed.slice(dotIndex + 1)

  let formatted: string
  if (intStr.length <= 3) {
    formatted = intStr
  } else {
    const last3 = intStr.slice(-3)
    const rest = intStr.slice(0, -3)
    formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3
  }

  const suffix = decPart === '00' ? '' : `.${decPart}`
  return `${negative ? '-' : ''}₹${formatted}${suffix}`
}

/**
 * Formats a number in compact Indian notation.
 * Example: 2563163 → ₹25.6L, 10000000 → ₹1.0Cr
 * Falls back to formatINR for values below 1,000.
 */
export function formatINRCompact(amount: number): string {
  const abs = Math.abs(amount)
  const negative = amount < 0
  const prefix = negative ? '-' : ''

  if (abs >= 1e7) {
    return `${prefix}₹${(abs / 1e7).toFixed(1)}Cr`
  }
  if (abs >= 1e5) {
    return `${prefix}₹${(abs / 1e5).toFixed(1)}L`
  }
  if (abs >= 1e3) {
    return `${prefix}₹${(abs / 1e3).toFixed(1)}K`
  }
  return formatINR(amount)
}

/**
 * Formats a number using standard US grouping (groups of 3).
 * Example: 2563163 → $2,563,163
 */
export function formatUSD(amount: number): string {
  const negative = amount < 0
  const abs = Math.abs(amount)
  const fixed = abs.toFixed(2)
  const dotIndex = fixed.indexOf('.')
  const intStr = fixed.slice(0, dotIndex)
  const decPart = fixed.slice(dotIndex + 1)

  const formatted = intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const suffix = decPart === '00' ? '' : `.${decPart}`
  return `${negative ? '-' : ''}$${formatted}${suffix}`
}

/**
 * Formats a number in compact US notation.
 * Example: 1000000 → $1.0M, 50000 → $50.0K
 * Falls back to formatUSD for values below 1,000.
 */
export function formatUSDCompact(amount: number): string {
  const abs = Math.abs(amount)
  const negative = amount < 0
  const prefix = negative ? '-' : ''

  if (abs >= 1e9) {
    return `${prefix}$${(abs / 1e9).toFixed(1)}B`
  }
  if (abs >= 1e6) {
    return `${prefix}$${(abs / 1e6).toFixed(1)}M`
  }
  if (abs >= 1e3) {
    return `${prefix}$${(abs / 1e3).toFixed(1)}K`
  }
  return formatUSD(amount)
}

/**
 * Dispatches to the correct full formatter based on currency code.
 */
export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'INR') {
    return formatINR(amount)
  }
  return formatUSD(amount)
}

/**
 * Dispatches to the correct compact formatter based on currency code.
 */
export function formatCurrencyCompact(amount: number, currency: Currency): string {
  if (currency === 'INR') {
    return formatINRCompact(amount)
  }
  return formatUSDCompact(amount)
}

/**
 * Converts a raw month count into a human-readable duration string.
 * Example: 63 → "5 years 3 months", 12 → "1 year", 1 → "1 month"
 */
export function formatMonths(months: number): string {
  if (months === 0) return '0 months'

  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  if (years === 0) {
    return `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`
  }
  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`
  }
  return `${years} ${years === 1 ? 'year' : 'years'} ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`
}
