/**
 * Edge-case tests for SummaryCards covering: negative monthsSaved CSS class,
 * USD formatting, all four icon-bearing cards present in DOM, and the
 * Total Interest / Interest Saved zero-value display.
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { CurrencyProvider, useCurrency } from '../../hooks/useCurrency'
import { SummaryCards } from '../../components/results/SummaryCards'
import type { ComparisonResult } from '../../types/loan'

function wrapper({ children }: { children: ReactNode }): ReactNode {
  return createElement(CurrencyProvider, null, children)
}

function renderWithProvider(
  ui: React.JSX.Element,
): ReturnType<typeof render> {
  return render(ui, { wrapper })
}

const baseComparison: ComparisonResult = {
  originalMonths: 240,
  newMonths: 180,
  monthsSaved: 60,
  originalTotalInterest: 500000,
  newTotalInterest: 350000,
  interestSaved: 150000,
}

describe('SummaryCards — negative monthsSaved CSS class', () => {
  it('Months Saved card has bg-white when monthsSaved is negative', () => {
    const negative: ComparisonResult = { ...baseComparison, monthsSaved: -5 }
    renderWithProvider(<SummaryCards comparison={negative} />)
    const label = screen.getByText('Months Saved')
    const card = label.closest('div[class*="rounded-xl"]')
    expect(card?.className).toContain('bg-white')
    expect(card?.className).not.toContain('bg-emerald-50')
  })

  it('value "−5" is rendered as string "-5" when monthsSaved is negative', () => {
    const negative: ComparisonResult = { ...baseComparison, monthsSaved: -5 }
    renderWithProvider(<SummaryCards comparison={negative} />)
    expect(screen.getByText('-5')).toBeInTheDocument()
  })
})

describe('SummaryCards — zero values', () => {
  it('renders "0 months" for New Payoff Time when newMonths = 0', () => {
    const zero: ComparisonResult = { ...baseComparison, newMonths: 0 }
    renderWithProvider(<SummaryCards comparison={zero} />)
    expect(screen.getByText('0 months')).toBeInTheDocument()
  })

  it('renders formatted zero for Interest Saved when interestSaved = 0', () => {
    const noSavings: ComparisonResult = { ...baseComparison, interestSaved: 0, monthsSaved: 0 }
    renderWithProvider(<SummaryCards comparison={noSavings} />)
    // There may be multiple ₹0 — at least one must be present
    expect(screen.getAllByText('₹0').length).toBeGreaterThanOrEqual(1)
  })
})

describe('SummaryCards — USD mode formatting', () => {
  it('Interest Saved shows $ format after switching to USD', () => {
    function App(): React.JSX.Element {
      const { setCurrency } = useCurrency()
      return (
        <>
          <button onClick={() => setCurrency('USD')}>switch</button>
          <SummaryCards comparison={baseComparison} />
        </>
      )
    }
    render(<CurrencyProvider><App /></CurrencyProvider>)
    fireEvent.click(screen.getByText('switch'))
    // interestSaved = 150000 → $150,000
    expect(screen.getByText('$150,000')).toBeInTheDocument()
  })
})

describe('SummaryCards — all card titles present', () => {
  it('renders all four card title labels', () => {
    renderWithProvider(<SummaryCards comparison={baseComparison} />)
    expect(screen.getByText('New Payoff Time')).toBeInTheDocument()
    expect(screen.getByText('Interest Saved')).toBeInTheDocument()
    expect(screen.getByText('Months Saved')).toBeInTheDocument()
    expect(screen.getByText('Total Interest')).toBeInTheDocument()
  })
})

describe('SummaryCards — Total Interest card has no highlight', () => {
  it('Total Interest card has bg-white (no emerald)', () => {
    renderWithProvider(<SummaryCards comparison={baseComparison} />)
    const label = screen.getByText('Total Interest')
    const card = label.closest('div[class*="rounded-xl"]')
    expect(card?.className).toContain('bg-white')
    expect(card?.className).not.toContain('bg-emerald-50')
  })
})
