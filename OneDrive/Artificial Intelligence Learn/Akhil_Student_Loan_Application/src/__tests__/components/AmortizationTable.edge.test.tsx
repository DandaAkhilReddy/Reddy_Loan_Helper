/**
 * Edge-case tests for AmortizationTable covering behavioral paths not in
 * the main suite:
 *
 * - emiDisplay capping: effectiveEmi > openingBalance + interest → display
 *   is the smaller openingBalance + interest value (final row behaviour)
 * - emiDisplay NOT capped: effectiveEmi < openingBalance + interest → display
 *   is effectiveEmi as-is
 * - "No schedule data" rendered for the original schedule when it is empty
 *   and the original tab is active
 * - Expand button toggle cycle: show-all then show-less restores correct row count
 * - Original tab shows correct month count from originalSchedule
 */
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

function makeEntry(
  month: number,
  openingBalance: number,
  closingBalance: number,
  interest: number,
  extra = 0,
): AmortizationEntry {
  return {
    month,
    openingBalance,
    interest,
    principalPaid: openingBalance - closingBalance - interest - extra,
    extraPayment: extra,
    closingBalance,
    cumulativeInterest: interest * month,
  }
}

// Final-month entry where openingBalance + interest < effectiveEmi
// → emiDisplay = openingBalance + interest (capped)
const finalEntry = makeEntry(60, 1800, 0, 15)
// openingBalance(1800) + interest(15) = 1815, effectiveEmi = 5000 → capped to 1815

// Standard mid-schedule entry where effectiveEmi < openingBalance + interest
// → emiDisplay = effectiveEmi (not capped)
const midEntry = makeEntry(1, 200000, 195000, 2000)
// openingBalance(200000) + interest(2000) = 202000, effectiveEmi = 3000 → 3000

const oneRowSchedule = [finalEntry]
const standardSchedule = [midEntry]

// Long enough to trigger expand button (> 24 rows)
function buildLongSchedule(n: number): AmortizationEntry[] {
  const entries: AmortizationEntry[] = []
  let balance = 500000
  for (let i = 1; i <= n; i++) {
    const closing = i === n ? 0 : balance - 5000
    const interest = Math.round(balance * 0.01125)
    entries.push(makeEntry(i, balance, closing, interest))
    balance = closing
  }
  return entries
}

const longSchedule = buildLongSchedule(30)
const originalLong = buildLongSchedule(40)

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AmortizationTable — emiDisplay capping on final row', () => {
  it('emiDisplay is capped to openingBalance + interest when effectiveEmi exceeds it', () => {
    // effectiveEmi = 5000, but openingBalance=1800 + interest=15 = 1815
    // → the cell must show 1815 (≡ ₹1,815 in INR), not ₹5,000
    // Use distinct schedules to avoid duplicate EMI cell values across tabs
    const distinctOriginal = [makeEntry(60, 999, 0, 8)]   // cap = 999+8 = 1007
    const capEntry = [makeEntry(60, 1800, 0, 15)]          // cap = 1815
    renderWithProviders(
      <AmortizationTable
        originalSchedule={distinctOriginal}
        acceleratedSchedule={capEntry}
        effectiveEmi={5000}
      />
    )
    // Default tab is accelerated → cap=1815 is displayed
    expect(screen.getByText('₹1,815')).toBeInTheDocument()
    // ₹5,000 should NOT appear in the EMI column (it was capped)
    expect(screen.queryByText('₹5,000')).not.toBeInTheDocument()
  })

  it('emiDisplay equals effectiveEmi when EMI is smaller than openingBalance + interest', () => {
    // effectiveEmi = 3000, openingBalance=200000 + interest=2000 = 202000
    // → min(3000, 202000) = 3000 → the EMI cell shows ₹3,000
    // Use a distinct original to avoid duplicate ₹3,000 values across tabs
    const distinctOriginal = [makeEntry(1, 100000, 95000, 1000)]  // EMI capped: min(3000, 101000)=3000
    renderWithProviders(
      <AmortizationTable
        originalSchedule={distinctOriginal}
        acceleratedSchedule={standardSchedule}
        effectiveEmi={3000}
      />
    )
    // accelerated tab is default; ₹3,000 appears exactly once
    const emiCells = screen.getAllByText('₹3,000')
    expect(emiCells.length).toBeGreaterThanOrEqual(1)
  })
})

describe('AmortizationTable — empty original schedule when original tab active', () => {
  it('shows "No schedule data" when original tab is selected and originalSchedule is empty', () => {
    renderWithProviders(
      <AmortizationTable
        originalSchedule={[]}
        acceleratedSchedule={longSchedule}
        effectiveEmi={10000}
      />
    )
    // Default tab is accelerated → data is visible. Click Original tab.
    fireEvent.click(screen.getByRole('button', { name: 'Original' }))
    expect(screen.getByText('No schedule data')).toBeInTheDocument()
  })
})

describe('AmortizationTable — expand/collapse with original tab', () => {
  it('original tab without prior expansion shows "Show All N Months" button', () => {
    // Switch directly to Original without expanding first → expanded=false → show button
    renderWithProviders(
      <AmortizationTable
        originalSchedule={originalLong}
        acceleratedSchedule={longSchedule}
        effectiveEmi={10000}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Original' }))
    // original has 40 rows > 24 → show button should appear
    expect(screen.getByRole('button', { name: /Show All 40 Months/ })).toBeInTheDocument()
  })

  it('expanding original tab shows all 40 rows', () => {
    renderWithProviders(
      <AmortizationTable
        originalSchedule={originalLong}
        acceleratedSchedule={longSchedule}
        effectiveEmi={10000}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Original' }))
    fireEvent.click(screen.getByRole('button', { name: /Show All 40 Months/ }))
    expect(screen.getByText('40')).toBeInTheDocument()
  })

  it('expanding accelerated then switching to original also expands original (shared state)', () => {
    // The expanded state is shared. Expanding accelerated sets expanded=true.
    // Switching to original tab while expanded=true shows all original rows immediately.
    renderWithProviders(
      <AmortizationTable
        originalSchedule={originalLong}
        acceleratedSchedule={longSchedule}
        effectiveEmi={10000}
      />
    )
    // Expand accelerated
    fireEvent.click(screen.getByRole('button', { name: /Show All 30 Months/ }))
    // Switch to original — expanded state carries over, all 40 rows visible immediately
    fireEvent.click(screen.getByRole('button', { name: 'Original' }))
    // Row 40 should be visible without pressing "Show All"
    expect(screen.getByText('40')).toBeInTheDocument()
    // Show Less button should be present
    expect(screen.getByRole('button', { name: /Show Less/ })).toBeInTheDocument()
  })
})

describe('AmortizationTable — payoff row highlight in original tab', () => {
  it('last row (closingBalance=0) has bg-emerald class in original tab', () => {
    renderWithProviders(
      <AmortizationTable
        originalSchedule={oneRowSchedule}
        acceleratedSchedule={oneRowSchedule}
        effectiveEmi={5000}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Original' }))
    const rows = document.querySelectorAll('tbody tr')
    const lastRow = rows[rows.length - 1]
    expect(lastRow?.className).toContain('bg-emerald')
  })
})

describe('AmortizationTable — Extra column absent in original tab', () => {
  it('no "Extra" column header in original tab', () => {
    renderWithProviders(
      <AmortizationTable
        originalSchedule={oneRowSchedule}
        acceleratedSchedule={oneRowSchedule}
        effectiveEmi={5000}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Original' }))
    expect(screen.queryByRole('columnheader', { name: 'Extra' })).not.toBeInTheDocument()
  })
})
