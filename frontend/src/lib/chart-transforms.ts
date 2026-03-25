import type { AmortizationEntry, ChartDataPoint } from '../types/loan'

/**
 * Returns a label for a given month index within a chart.
 *
 * - totalMonths <= 24: every month labelled "M{n}"
 * - totalMonths > 24: only year boundaries labelled "Y{n}", others ""
 */
function formatMonthLabel(month: number, totalMonths: number): string {
  if (totalMonths <= 24) {
    return `M${month}`
  }
  if (month % 12 === 0) {
    return `Y${month / 12}`
  }
  return ''
}

/**
 * Transforms two amortization schedules (original and accelerated) into a
 * unified array of ChartDataPoints suitable for rendering.
 *
 * Rules:
 * - If both schedules are empty, returns [].
 * - The output spans max(original.length, accelerated.length) months; once a
 *   schedule has paid off, its balance/interest fields are padded with 0.
 * - If the combined length exceeds 120 months, the output is downsampled:
 *   every N = ceil(maxLength / 120) months is kept. Month 1, the accelerated
 *   payoff month, and the final month are always included.
 */
export function transformToChartData(
  originalSchedule: AmortizationEntry[],
  acceleratedSchedule: AmortizationEntry[],
): ChartDataPoint[] {
  if (originalSchedule.length === 0 && acceleratedSchedule.length === 0) {
    return []
  }

  const maxLength = Math.max(originalSchedule.length, acceleratedSchedule.length)

  // Derive the principal from the first entry's openingBalance of whichever
  // schedule is non-empty (prefer original).
  const origPrincipal =
    originalSchedule.length > 0 ? (originalSchedule[0]?.openingBalance ?? 0) : 0
  const accelPrincipal =
    acceleratedSchedule.length > 0 ? (acceleratedSchedule[0]?.openingBalance ?? 0) : 0

  // Build an index of all months we want to keep before downsampling.
  const accelPayoffMonth = acceleratedSchedule.length // 1-based last month index

  // Determine which indices (0-based) to include after potential downsampling.
  // We reserve 3 slots for the mandatory points (first, payoff, last) and fit
  // the remaining sampled points into 120 - 3 = 117 slots at most.
  const LIMIT = 120
  const RESERVED = 3
  const step = maxLength > LIMIT ? Math.ceil(maxLength / (LIMIT - RESERVED)) : 1

  const includedIndices = new Set<number>()
  for (let i = 0; i < maxLength; i += step) {
    includedIndices.add(i)
  }
  // Always include index 0 (month 1), the accelerated payoff index, and the last index.
  includedIndices.add(0)
  if (accelPayoffMonth > 0) {
    includedIndices.add(accelPayoffMonth - 1)
  }
  includedIndices.add(maxLength - 1)

  const sortedIndices = Array.from(includedIndices).sort((a, b) => a - b)

  return sortedIndices.map((i) => {
    const origEntry: AmortizationEntry | undefined = originalSchedule[i]
    const accelEntry: AmortizationEntry | undefined = acceleratedSchedule[i]

    const month = origEntry?.month ?? accelEntry?.month ?? i + 1

    const balanceOriginal = origEntry?.closingBalance ?? 0
    const balanceAccelerated = accelEntry?.closingBalance ?? 0

    const cumulativeInterestOriginal = origEntry?.cumulativeInterest ?? 0
    const cumulativeInterestAccelerated = accelEntry?.cumulativeInterest ?? 0

    // cumulativePrincipal = initial principal − remaining balance
    const cumulativePrincipalOriginal = origPrincipal - balanceOriginal
    const cumulativePrincipalAccelerated = accelPrincipal - balanceAccelerated

    return {
      month,
      label: formatMonthLabel(month, maxLength),
      balanceOriginal,
      balanceAccelerated,
      cumulativeInterestOriginal,
      cumulativePrincipalOriginal,
      cumulativeInterestAccelerated,
      cumulativePrincipalAccelerated,
    }
  })
}
