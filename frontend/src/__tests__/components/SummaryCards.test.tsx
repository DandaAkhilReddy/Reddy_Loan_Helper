import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { CurrencyProvider } from '../../hooks/useCurrency'
import { SummaryCards } from '../../components/results/SummaryCards'
import type { ComparisonResult } from '../../types/loan'

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: ReactNode }): ReactNode {
  return createElement(CurrencyProvider, null, children)
}

function renderWithProvider(ui: React.JSX.Element): ReturnType<typeof render> {
  return render(ui, { wrapper })
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseComparison: ComparisonResult = {
  originalMonths: 240,
  newMonths: 180,
  monthsSaved: 60,
  originalTotalInterest: 500000,
  newTotalInterest: 350000,
  interestSaved: 150000,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SummaryCards', () => {
  it('renders placeholder text when comparison is null', () => {
    renderWithProvider(<SummaryCards comparison={null} />)
    expect(screen.getByText('Enter loan details to see results')).toBeInTheDocument()
  })

  it('renders 4 cards when comparison data is provided', () => {
    renderWithProvider(<SummaryCards comparison={baseComparison} />)
    expect(screen.getByText('New Payoff Time')).toBeInTheDocument()
    expect(screen.getByText('Interest Saved')).toBeInTheDocument()
    expect(screen.getByText('Months Saved')).toBeInTheDocument()
    expect(screen.getByText('Total Interest')).toBeInTheDocument()
  })

  it('Interest Saved card has emerald highlight classes', () => {
    const { container } = renderWithProvider(<SummaryCards comparison={baseComparison} />)
    // The card wrapping "Interest Saved" must carry the emerald background
    const interestSavedLabel = screen.getByText('Interest Saved')
    const card = interestSavedLabel.closest('div[class*="rounded-xl"]')
    expect(card?.className).toContain('bg-emerald-50')
    expect(card?.className).toContain('border-emerald-200')
    // Suppress unused variable warning from destructure
    void container
  })

  it('shows formatted months for New Payoff Time — 180 months → 15 years', () => {
    renderWithProvider(<SummaryCards comparison={baseComparison} />)
    // 180 months = 15 years exactly
    expect(screen.getByText('15 years')).toBeInTheDocument()
  })

  it('shows the monthsSaved value as a plain number string', () => {
    renderWithProvider(<SummaryCards comparison={baseComparison} />)
    expect(screen.getByText('60')).toBeInTheDocument()
  })

  it('Months Saved card has emerald highlight when monthsSaved > 0', () => {
    renderWithProvider(<SummaryCards comparison={baseComparison} />)
    const monthsSavedLabel = screen.getByText('Months Saved')
    const card = monthsSavedLabel.closest('div[class*="rounded-xl"]')
    expect(card?.className).toContain('bg-emerald-50')
  })

  it('Months Saved card has no highlight when monthsSaved is 0', () => {
    const noSavings: ComparisonResult = { ...baseComparison, monthsSaved: 0 }
    renderWithProvider(<SummaryCards comparison={noSavings} />)
    const monthsSavedLabel = screen.getByText('Months Saved')
    const card = monthsSavedLabel.closest('div[class*="rounded-xl"]')
    expect(card?.className).toContain('bg-white')
    expect(card?.className).not.toContain('bg-emerald-50')
  })

  it('New Payoff Time card does not carry emerald highlight', () => {
    renderWithProvider(<SummaryCards comparison={baseComparison} />)
    const label = screen.getByText('New Payoff Time')
    const card = label.closest('div[class*="rounded-xl"]')
    expect(card?.className).toContain('bg-white')
  })

  it('displays INR-formatted Total Interest value', () => {
    renderWithProvider(<SummaryCards comparison={baseComparison} />)
    // newTotalInterest = 350000 → ₹3,50,000
    expect(screen.getByText('₹3,50,000')).toBeInTheDocument()
  })

  it('displays INR-formatted Interest Saved value', () => {
    renderWithProvider(<SummaryCards comparison={baseComparison} />)
    // interestSaved = 150000 → ₹1,50,000
    expect(screen.getByText('₹1,50,000')).toBeInTheDocument()
  })
})
