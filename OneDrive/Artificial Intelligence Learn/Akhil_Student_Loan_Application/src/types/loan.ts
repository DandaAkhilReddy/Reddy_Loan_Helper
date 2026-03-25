export type Currency = 'INR' | 'USD'

export interface CurrencyConfig {
  code: Currency
  symbol: string
  locale: string
  sliderMax: number
  sliderStep: number
  compactUnits: { threshold: number; suffix: string; divisor: number }[]
}

export interface LoanInput {
  principal: number
  annualRate: number
  emi: number | null
  tenureMonths: number | null
  extraMonthly: number
}

export interface AmortizationEntry {
  month: number
  openingBalance: number
  interest: number
  principalPaid: number
  extraPayment: number
  closingBalance: number
  cumulativeInterest: number
}

export interface ComparisonResult {
  originalMonths: number
  newMonths: number
  monthsSaved: number
  originalTotalInterest: number
  newTotalInterest: number
  interestSaved: number
}

export interface LoanResult {
  originalSchedule: AmortizationEntry[]
  acceleratedSchedule: AmortizationEntry[]
  comparison: ComparisonResult
  effectiveEmi: number
}

export interface ChartDataPoint {
  month: number
  label: string
  balanceOriginal: number
  balanceAccelerated: number
  cumulativeInterestOriginal: number
  cumulativePrincipalOriginal: number
  cumulativeInterestAccelerated: number
  cumulativePrincipalAccelerated: number
}
