/**
 * Edge-case tests for PayoffTimeline covering: singular month/year display,
 * USD formatting, and monthsSaved = 1 boundary.
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { CurrencyProvider, useCurrency } from '../../hooks/useCurrency'
import { PayoffTimeline } from '../../components/results/PayoffTimeline'
import type { ComparisonResult } from '../../types/loan'

function wrapper({ children }: { children: ReactNode }): ReactNode {
  return createElement(CurrencyProvider, null, children)
}

function renderWithProvider(ui: React.JSX.Element): ReturnType<typeof render> {
  return render(ui, { wrapper })
}

describe('PayoffTimeline — monthsSaved = 1 boundary', () => {
  it('renders the banner when monthsSaved = 1 (minimum positive)', () => {
    const comparison: ComparisonResult = {
      originalMonths: 12,
      newMonths: 11,
      monthsSaved: 1,
      originalTotalInterest: 10000,
      newTotalInterest: 9000,
      interestSaved: 1000,
    }
    renderWithProvider(<PayoffTimeline comparison={comparison} />)
    expect(screen.getByText(/Debt-free in/i)).toBeInTheDocument()
  })
})

describe('PayoffTimeline — singular month in newMonths', () => {
  it('shows "1 month" when newMonths = 1', () => {
    const comparison: ComparisonResult = {
      originalMonths: 12,
      newMonths: 1,
      monthsSaved: 11,
      originalTotalInterest: 10000,
      newTotalInterest: 100,
      interestSaved: 9900,
    }
    renderWithProvider(<PayoffTimeline comparison={comparison} />)
    expect(screen.getByText('1 month')).toBeInTheDocument()
  })
})

describe('PayoffTimeline — singular year in originalMonths', () => {
  it('shows "1 year" for originalMonths = 12', () => {
    const comparison: ComparisonResult = {
      originalMonths: 12,
      newMonths: 6,
      monthsSaved: 6,
      originalTotalInterest: 10000,
      newTotalInterest: 5000,
      interestSaved: 5000,
    }
    renderWithProvider(<PayoffTimeline comparison={comparison} />)
    expect(screen.getByText(/1 year/)).toBeInTheDocument()
  })
})

describe('PayoffTimeline — USD mode', () => {
  it('shows $ formatted interestSaved after switching to USD', () => {
    function App(): React.JSX.Element {
      const { setCurrency } = useCurrency()
      const comparison: ComparisonResult = {
        originalMonths: 60,
        newMonths: 48,
        monthsSaved: 12,
        originalTotalInterest: 100000,
        newTotalInterest: 80000,
        interestSaved: 20000,
      }
      return (
        <>
          <button onClick={() => setCurrency('USD')}>switch</button>
          <PayoffTimeline comparison={comparison} />
        </>
      )
    }
    render(<CurrencyProvider><App /></CurrencyProvider>)
    fireEvent.click(screen.getByText('switch'))
    // interestSaved = 20000 → $20,000
    expect(screen.getByText('$20,000')).toBeInTheDocument()
  })
})

describe('PayoffTimeline — compound text content', () => {
  it('contains the word "instead of" linking old and new durations', () => {
    const comparison: ComparisonResult = {
      originalMonths: 24,
      newMonths: 12,
      monthsSaved: 12,
      originalTotalInterest: 50000,
      newTotalInterest: 25000,
      interestSaved: 25000,
    }
    renderWithProvider(<PayoffTimeline comparison={comparison} />)
    expect(screen.getByText(/instead of/i)).toBeInTheDocument()
  })
})
