import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { CurrencyProvider } from '../../hooks/useCurrency'
import { PayoffTimeline } from '../../components/results/PayoffTimeline'
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

describe('PayoffTimeline', () => {
  it('renders nothing when comparison is null', () => {
    const { container } = renderWithProvider(<PayoffTimeline comparison={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when monthsSaved is 0', () => {
    const noSavings: ComparisonResult = { ...baseComparison, monthsSaved: 0 }
    const { container } = renderWithProvider(<PayoffTimeline comparison={noSavings} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when monthsSaved is negative', () => {
    const negative: ComparisonResult = { ...baseComparison, monthsSaved: -5 }
    const { container } = renderWithProvider(<PayoffTimeline comparison={negative} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the timeline banner when monthsSaved > 0', () => {
    renderWithProvider(<PayoffTimeline comparison={baseComparison} />)
    expect(screen.getByText(/Debt-free in/i)).toBeInTheDocument()
  })

  it('shows the new payoff duration — 180 months → 15 years', () => {
    renderWithProvider(<PayoffTimeline comparison={baseComparison} />)
    expect(screen.getByText('15 years')).toBeInTheDocument()
  })

  it('shows the original duration — 240 months → 20 years', () => {
    renderWithProvider(<PayoffTimeline comparison={baseComparison} />)
    expect(screen.getByText(/20 years/)).toBeInTheDocument()
  })

  it('shows the INR-formatted interest saved — 150000 → ₹1,50,000', () => {
    renderWithProvider(<PayoffTimeline comparison={baseComparison} />)
    expect(screen.getByText('₹1,50,000')).toBeInTheDocument()
  })

  it('contains "in interest!" text', () => {
    renderWithProvider(<PayoffTimeline comparison={baseComparison} />)
    expect(screen.getByText(/in\s+interest!/i)).toBeInTheDocument()
  })
})
