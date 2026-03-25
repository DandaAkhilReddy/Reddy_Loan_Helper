import type { AmortizationEntry } from '../types/loan'
import { calculateEMI } from './emi-math'

export interface ScheduleOptions {
  principal: number
  annualRate: number
  emi?: number
  tenureMonths?: number
  extraMonthly?: number
}

/**
 * Generates a full amortization schedule for a reducing-balance loan.
 *
 * Providing neither emi nor tenureMonths throws an Error.
 * When both are provided, emi takes precedence.
 * Extra monthly prepayments are applied after the regular principal payment each
 * period and are capped at the remaining balance.
 *
 * The loop is capped at 600 iterations to guard against pathological inputs.
 */
export function generateSchedule(options: ScheduleOptions): AmortizationEntry[] {
  const { principal, annualRate, extraMonthly } = options

  if (options.emi === undefined && options.tenureMonths === undefined) {
    throw new Error('Must provide either emi or tenureMonths')
  }

  if (principal <= 0) {
    return []
  }

  const emi =
    options.emi !== undefined
      ? options.emi
      : calculateEMI(principal, annualRate, options.tenureMonths!)

  if (emi <= 0) {
    return []
  }

  const r = annualRate > 0 ? annualRate / 1200 : 0
  const extra = Math.max(0, extraMonthly ?? 0)

  const schedule: AmortizationEntry[] = []
  let openingBalance = principal
  let cumulativeInterest = 0

  for (let month = 1; month <= 600; month++) {
    const interest = Math.round(openingBalance * r)
    const principalPaid = Math.min(emi - interest, openingBalance)

    if (principalPaid <= 0) {
      break
    }

    const remaining = openingBalance - principalPaid
    const extraPayment = Math.min(extra, remaining)
    const closingBalance = Math.max(0, remaining - extraPayment)

    cumulativeInterest += interest

    schedule.push({
      month,
      openingBalance,
      interest,
      principalPaid,
      extraPayment,
      closingBalance,
      cumulativeInterest,
    })

    if (closingBalance === 0) {
      break
    }

    openingBalance = closingBalance
  }

  return schedule
}
