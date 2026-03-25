/**
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 * Returns integer amount (Math.round).
 *
 * Guards:
 * - principal <= 0, tenureMonths <= 0, or any non-finite input → 0
 * - annualRate <= 0 → simple division (0% interest or negative)
 */
export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number,
): number {
  if (
    principal <= 0 ||
    tenureMonths <= 0 ||
    !isFinite(principal) ||
    !isFinite(annualRate) ||
    !isFinite(tenureMonths)
  ) {
    return 0
  }

  if (annualRate <= 0) {
    return Math.round(principal / tenureMonths)
  }

  const r = annualRate / 1200
  const factor = Math.pow(1 + r, tenureMonths)
  return Math.round((principal * r * factor) / (factor - 1))
}

/**
 * Solve for n: n = log(EMI / (EMI - P*r)) / log(1+r)
 * Returns integer months (Math.ceil). Returns 0 if impossible.
 *
 * Guards:
 * - principal <= 0, emi <= 0, or any non-finite input → 0
 * - annualRate <= 0 → simple ceiling division
 * - emi <= monthly interest → 0 (EMI can't cover interest)
 */
export function calculateTenure(
  principal: number,
  annualRate: number,
  emi: number,
): number {
  if (
    principal <= 0 ||
    emi <= 0 ||
    !isFinite(principal) ||
    !isFinite(annualRate) ||
    !isFinite(emi)
  ) {
    return 0
  }

  if (annualRate <= 0) {
    return Math.ceil(principal / emi)
  }

  const r = annualRate / 1200
  const monthlyInterest = principal * r

  if (emi <= monthlyInterest) {
    return 0
  }

  const n = Math.log(emi / (emi - monthlyInterest)) / Math.log(1 + r)
  return Math.ceil(n)
}

/**
 * Total interest = EMI * tenure - principal
 * Returns 0 if any guard fails or result would be negative.
 */
export function calculateTotalInterest(
  principal: number,
  annualRate: number,
  tenureMonths: number,
): number {
  if (
    principal <= 0 ||
    tenureMonths <= 0 ||
    !isFinite(principal) ||
    !isFinite(annualRate) ||
    !isFinite(tenureMonths)
  ) {
    return 0
  }

  const emi = calculateEMI(principal, annualRate, tenureMonths)
  return Math.max(0, Math.round(emi * tenureMonths - principal))
}
