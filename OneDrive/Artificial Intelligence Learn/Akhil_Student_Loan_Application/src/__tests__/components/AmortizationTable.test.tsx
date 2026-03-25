import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { CurrencyProvider } from '../../hooks/useCurrency'
import { DarkModeProvider } from '../../hooks/useDarkMode'
import { AmortizationTable } from '../../components/tables/AmortizationTable'
import type { AmortizationEntry } from '../../types/loan'

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: ReactNode }): ReactNode {
  return createElement(DarkModeProvider, null, createElement(CurrencyProvider, null, children))
}

function renderWithProviders(ui: React.JSX.Element): ReturnType<typeof render> {
  return render(ui, { wrapper })
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeEntry(month: number, opening: number, closing: number): AmortizationEntry {
  const interest = Math.round(opening * 0.01125)
  const principalPaid = opening - closing - 500
  return {
    month,
    openingBalance: opening,
    interest,
    principalPaid,
    extraPayment: 500,
    closingBalance: closing,
    cumulativeInterest: interest * month,
  }
}

/** Build a schedule of n months, last row closes at 0 */
function buildSchedule(n: number): AmortizationEntry[] {
  const entries: AmortizationEntry[] = []
  let balance = 500000
  for (let i = 1; i <= n; i++) {
    const closing = i === n ? 0 : balance - 5000
    entries.push(makeEntry(i, balance, closing))
    balance = closing
  }
  return entries
}

const shortSchedule = buildSchedule(10)   // < 24 rows — no expand button
const longSchedule = buildSchedule(36)    // > 24 rows — expand button visible

const originalSchedule = buildSchedule(40)
const acceleratedSchedule = buildSchedule(30)
const EFFECTIVE_EMI = 20000

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AmortizationTable', () => {
  it('renders the table with schedule data', () => {
    renderWithProviders(
      <AmortizationTable
        originalSchedule={originalSchedule}
        acceleratedSchedule={acceleratedSchedule}
        effectiveEmi={EFFECTIVE_EMI}
      />
    )
    expect(screen.getByText('Amortization Schedule')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('shows "With Extra" tab active by default', () => {
    renderWithProviders(
      <AmortizationTable
        originalSchedule={originalSchedule}
        acceleratedSchedule={acceleratedSchedule}
        effectiveEmi={EFFECTIVE_EMI}
      />
    )
    const withExtraBtn = screen.getByRole('button', { name: 'With Extra' })
    expect(withExtraBtn.className).toContain('bg-indigo-600')
    const originalBtn = screen.getByRole('button', { name: 'Original' })
    expect(originalBtn.className).not.toContain('bg-indigo-600')
  })

  it('switching to Original tab changes the displayed data', () => {
    renderWithProviders(
      <AmortizationTable
        originalSchedule={originalSchedule}
        acceleratedSchedule={acceleratedSchedule}
        effectiveEmi={EFFECTIVE_EMI}
      />
    )
    const originalBtn = screen.getByRole('button', { name: 'Original' })
    fireEvent.click(originalBtn)
    expect(originalBtn.className).toContain('bg-indigo-600')
    const withExtraBtn = screen.getByRole('button', { name: 'With Extra' })
    expect(withExtraBtn.className).not.toContain('bg-indigo-600')
  })

  it('shows first 24 rows initially for a long schedule', () => {
    renderWithProviders(
      <AmortizationTable
        originalSchedule={originalSchedule}
        acceleratedSchedule={longSchedule}
        effectiveEmi={EFFECTIVE_EMI}
      />
    )
    // Month cells are td elements; row "25" should not be visible
    const cells = screen.queryAllByText('25')
    expect(cells).toHaveLength(0)
    // Row "1" should be visible
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('"Show All" button expands to full schedule', () => {
    renderWithProviders(
      <AmortizationTable
        originalSchedule={originalSchedule}
        acceleratedSchedule={longSchedule}
        effectiveEmi={EFFECTIVE_EMI}
      />
    )
    const showAllBtn = screen.getByRole('button', { name: /Show All 36 Months/ })
    fireEvent.click(showAllBtn)
    // After expansion row 36 should be visible
    expect(screen.getByText('36')).toBeInTheDocument()
  })

  it('"Show Less" button collapses back to 24 rows', () => {
    renderWithProviders(
      <AmortizationTable
        originalSchedule={originalSchedule}
        acceleratedSchedule={longSchedule}
        effectiveEmi={EFFECTIVE_EMI}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Show All 36 Months/ }))
    const showLessBtn = screen.getByRole('button', { name: /Show Less/ })
    fireEvent.click(showLessBtn)
    expect(screen.queryAllByText('36')).toHaveLength(0)
  })

  it('payoff row has bg-emerald class applied', () => {
    renderWithProviders(
      <AmortizationTable
        originalSchedule={originalSchedule}
        acceleratedSchedule={shortSchedule}
        effectiveEmi={EFFECTIVE_EMI}
      />
    )
    // The last entry has closingBalance 0 — it should carry the emerald class
    const rows = document.querySelectorAll('tbody tr')
    const lastRow = rows[rows.length - 1]
    expect(lastRow.className).toContain('bg-emerald')
  })

  it('"Extra" column is visible only in the accelerated tab', () => {
    renderWithProviders(
      <AmortizationTable
        originalSchedule={originalSchedule}
        acceleratedSchedule={acceleratedSchedule}
        effectiveEmi={EFFECTIVE_EMI}
      />
    )
    // Default is accelerated — Extra header should be present
    expect(screen.getByRole('columnheader', { name: 'Extra' })).toBeInTheDocument()

    // Switch to Original — Extra header should disappear
    fireEvent.click(screen.getByRole('button', { name: 'Original' }))
    expect(screen.queryByRole('columnheader', { name: 'Extra' })).not.toBeInTheDocument()
  })

  it('renders "No schedule data" when the accelerated schedule is empty', () => {
    renderWithProviders(
      <AmortizationTable
        originalSchedule={originalSchedule}
        acceleratedSchedule={[]}
        effectiveEmi={EFFECTIVE_EMI}
      />
    )
    expect(screen.getByText('No schedule data')).toBeInTheDocument()
  })

  it('applies currency formatting to cell values', () => {
    renderWithProviders(
      <AmortizationTable
        originalSchedule={originalSchedule}
        acceleratedSchedule={shortSchedule}
        effectiveEmi={EFFECTIVE_EMI}
      />
    )
    // Formatted values should contain ₹ symbol (default INR)
    const rupeeValues = screen.getAllByText(/₹/)
    expect(rupeeValues.length).toBeGreaterThan(0)
  })

  it('displays correct month numbers in rows', () => {
    renderWithProviders(
      <AmortizationTable
        originalSchedule={originalSchedule}
        acceleratedSchedule={shortSchedule}
        effectiveEmi={EFFECTIVE_EMI}
      />
    )
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('does not show expand button when schedule has 24 or fewer rows', () => {
    renderWithProviders(
      <AmortizationTable
        originalSchedule={originalSchedule}
        acceleratedSchedule={shortSchedule}
        effectiveEmi={EFFECTIVE_EMI}
      />
    )
    expect(screen.queryByRole('button', { name: /Show All/ })).not.toBeInTheDocument()
  })

  it('clicking "With Extra" tab after switching to Original returns to accelerated view', () => {
    renderWithProviders(
      <AmortizationTable
        originalSchedule={originalSchedule}
        acceleratedSchedule={acceleratedSchedule}
        effectiveEmi={EFFECTIVE_EMI}
      />
    )
    // First switch away to Original
    fireEvent.click(screen.getByRole('button', { name: 'Original' }))
    const originalBtn = screen.getByRole('button', { name: 'Original' })
    expect(originalBtn.className).toContain('bg-indigo-600')

    // Now click "With Extra" to switch back — exercises the onClick on line 47
    const withExtraBtn = screen.getByRole('button', { name: 'With Extra' })
    fireEvent.click(withExtraBtn)
    expect(withExtraBtn.className).toContain('bg-indigo-600')
    expect(originalBtn.className).not.toContain('bg-indigo-600')
    // Extra column header should be visible again
    expect(screen.getByRole('columnheader', { name: 'Extra' })).toBeInTheDocument()
  })
})
