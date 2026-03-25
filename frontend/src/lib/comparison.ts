import type { ComparisonResult } from '../types/loan'
import { generateSchedule } from './amortization'

export interface ScenarioComparison {
  extraAmount: number
  payoffMonths: number
  totalInterest: number
  totalPaid: number
  interestSaved: number
  monthsSaved: number
}

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

/**
 * Derives the set of extra-payment amounts to display.
 *
 * When `currentExtra` is 0, shows preset percentages of the EMI (0%, 10%, 25%, 50%, 100%).
 * Otherwise anchors the table around the current extra amount
 * (50%, 100%, 150%, 200% of `currentExtra`, plus the 0 baseline).
 */
export function getExtraAmounts(
  currentExtra: number,
  emi: number,
  customAmounts: number[] = [],
): number[] {
  let amounts: number[]
  if (currentExtra <= 0) {
    amounts = [0, Math.round(emi * 0.1), Math.round(emi * 0.25), Math.round(emi * 0.5), emi]
  } else {
    amounts = [0, Math.round(currentExtra * 0.5), currentExtra, Math.round(currentExtra * 1.5), currentExtra * 2]
  }
  amounts.push(...customAmounts)
  return [...new Set(amounts)].filter(a => a >= 0).sort((a, b) => a - b)
}

/**
 * Builds a comparison table for multiple extra-payment scenarios against a
 * baseline (no extra payment).
 *
 * @param principal   - Loan principal in currency units
 * @param annualRate  - Annual interest rate as a percentage (e.g. 10 for 10%)
 * @param emi         - Monthly EMI amount
 * @param extraAmounts - Array of extra monthly payment amounts to compare
 * @returns Array of ScenarioComparison objects, one per unique non-negative amount
 */
export function compareMultipleScenarios(
  principal: number,
  annualRate: number,
  emi: number,
  extraAmounts: number[],
): ScenarioComparison[] {
  if (principal <= 0 || emi <= 0) return []

  const baseline = compareScenarios(principal, annualRate, emi, 0)

  return extraAmounts
    .filter(amount => amount >= 0)
    .map(extraAmount => {
      if (extraAmount === 0) {
        return {
          extraAmount: 0,
          payoffMonths: baseline.originalMonths,
          totalInterest: baseline.originalTotalInterest,
          totalPaid: principal + baseline.originalTotalInterest,
          interestSaved: 0,
          monthsSaved: 0,
        }
      }
      const result = compareScenarios(principal, annualRate, emi, extraAmount)
      return {
        extraAmount,
        payoffMonths: result.newMonths,
        totalInterest: result.newTotalInterest,
        totalPaid: principal + result.newTotalInterest,
        interestSaved: result.interestSaved,
        monthsSaved: result.monthsSaved,
      }
    })
}
