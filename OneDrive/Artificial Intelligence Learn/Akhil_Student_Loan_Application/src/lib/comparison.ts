import type { ComparisonResult } from '../types/loan'
import { generateSchedule } from './amortization'

/**
 * Compares a standard loan schedule against an accelerated one with extra
 * monthly prepayments.
 *
 * Guards:
 * - principal <= 0 or emi <= 0 → all-zero result
 * - negative extraMonthly is treated as 0
 */
export function compareScenarios(
  principal: number,
  annualRate: number,
  emi: number,
  extraMonthly: number,
): ComparisonResult {
  const zero: ComparisonResult = {
    originalMonths: 0,
    newMonths: 0,
    monthsSaved: 0,
    originalTotalInterest: 0,
    newTotalInterest: 0,
    interestSaved: 0,
  }

  if (principal <= 0 || emi <= 0) {
    return zero
  }

  const original = generateSchedule({ principal, annualRate, emi })
  const accelerated = generateSchedule({
    principal,
    annualRate,
    emi,
    extraMonthly: Math.max(0, extraMonthly),
  })

  const originalMonths = original.length
  const newMonths = accelerated.length

  const originalTotalInterest =
    original.length > 0 ? (original[original.length - 1]?.cumulativeInterest ?? 0) : 0
  const newTotalInterest =
    accelerated.length > 0
      ? (accelerated[accelerated.length - 1]?.cumulativeInterest ?? 0)
      : 0

  return {
    originalMonths,
    newMonths,
    monthsSaved: originalMonths - newMonths,
    originalTotalInterest,
    newTotalInterest,
    interestSaved: originalTotalInterest - newTotalInterest,
  }
}
