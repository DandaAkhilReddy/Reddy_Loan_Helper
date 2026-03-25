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
    id: 'akhil-student',
    label: "Akhil's Student Loan",
    description: '₹25.6L at 13.5% — 111 months',
    currency: 'INR',
    inputs: { principal: 2563163, annualRate: 13.5, emi: 51476, tenureMonths: 111, extraMonthly: 0 },
  },
  {
    id: 'indian-education',
    label: 'Indian Education Loan',
    description: '₹10L at 8.5% — 7 years',
    currency: 'INR',
    inputs: { principal: 1000000, annualRate: 8.5, emi: null, tenureMonths: 84, extraMonthly: 0 },
  },
  {
    id: 'us-student',
    label: 'US Student Loan',
    description: '$30K at 5.5% — 10 years',
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
