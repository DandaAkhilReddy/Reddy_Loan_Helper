import type { Currency, LoanInput } from '../types/loan'

export interface LoanPreset {
  id: string
  label: string
  description: string
  currency: Currency
  inputs: LoanInput
}

export const LOAN_PRESETS: readonly LoanPreset[] = [
  {
    id: 'example-inr',
    label: 'Example: ₹30L at 13.5%',
    description: '₹30,00,000 at 13.5% — 10 years',
    currency: 'INR',
    inputs: { principal: 3000000, annualRate: 13.5, emi: null, tenureMonths: 120, extraMonthly: 0 },
  },
  {
    id: 'example-usd',
    label: 'Example: $30K at 5.5%',
    description: '$30,000 at 5.5% — 10 years',
    currency: 'USD',
    inputs: { principal: 30000, annualRate: 5.5, emi: null, tenureMonths: 120, extraMonthly: 0 },
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Enter your own values',
    currency: 'INR',
    inputs: { principal: 0, annualRate: 0, emi: null, tenureMonths: null, extraMonthly: 0 },
  },
]
