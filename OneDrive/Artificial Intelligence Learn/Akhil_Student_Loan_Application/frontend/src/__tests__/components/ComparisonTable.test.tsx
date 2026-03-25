import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { CurrencyProvider } from '../../hooks/useCurrency'
import { DarkModeProvider } from '../../hooks/useDarkMode'
import { ComparisonTable } from '../../components/results/ComparisonTable'
import { getExtraAmounts } from '../../lib/comparison'

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

// Standard loan: ₹10L at 10%, EMI ≈ ₹13,215 for 120 months
const PRINCIPAL = 1_000_000
const RATE = 10
const EMI = 13_215

// ---------------------------------------------------------------------------
// Tests: ComparisonTable rendering
// ---------------------------------------------------------------------------

describe('ComparisonTable', () => {
  beforeEach(() => {
    localStorage.removeItem('reddy-loan-dark-mode')
    document.documentElement.classList.remove('dark')
  })

  it('renders the section heading', () => {
    renderWithProviders(
      <ComparisonTable principal={PRINCIPAL} annualRate={RATE} emi={EMI} currentExtra={2000} />,
    )
    expect(screen.getByText('Compare Extra Payment Scenarios')).toBeInTheDocument()
  })

  it('renders table with comparison data rows', () => {
    renderWithProviders(
      <ComparisonTable principal={PRINCIPAL} annualRate={RATE} emi={EMI} currentExtra={2000} />,
    )
    // Should have multiple rows (one per extra amount)
    const rows = screen.getAllByRole('row')
    // thead row + at least 2 data rows
    expect(rows.length).toBeGreaterThan(2)
  })

  it('highlights the current extra row with bg-indigo-50 class', () => {
    renderWithProviders(
      <ComparisonTable principal={PRINCIPAL} annualRate={RATE} emi={EMI} currentExtra={2000} />,
    )
    const currentLabel = screen.getByText('current')
    const row = currentLabel.closest('tr')
    expect(row?.className).toContain('bg-indigo-50')
  })

  it('shows "current" label on the highlighted row', () => {
    renderWithProviders(
      <ComparisonTable principal={PRINCIPAL} annualRate={RATE} emi={EMI} currentExtra={2000} />,
    )
    expect(screen.getByText('current')).toBeInTheDocument()
  })

  it('shows "—" for interest saved on zero-extra row', () => {
    renderWithProviders(
      <ComparisonTable principal={PRINCIPAL} annualRate={RATE} emi={EMI} currentExtra={2000} />,
    )
    // The em-dash appears in both Interest Saved and Months Saved for the 0-extra row
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('applies INR currency formatting to extra amounts', () => {
    renderWithProviders(
      <ComparisonTable principal={PRINCIPAL} annualRate={RATE} emi={EMI} currentExtra={2000} />,
    )
    // ₹0 is always present in the table (zero-extra baseline)
    expect(screen.getByText('₹0')).toBeInTheDocument()
  })

  it('returns empty fragment when principal is 0', () => {
    const { container } = renderWithProviders(
      <ComparisonTable principal={0} annualRate={RATE} emi={EMI} currentExtra={0} />,
    )
    // Empty fragment renders nothing meaningful (no table)
    expect(container.querySelector('table')).toBeNull()
  })

  it('returns empty fragment when emi is 0', () => {
    const { container } = renderWithProviders(
      <ComparisonTable principal={PRINCIPAL} annualRate={RATE} emi={0} currentExtra={0} />,
    )
    expect(container.querySelector('table')).toBeNull()
  })

  it('shows preset EMI percentages when currentExtra is 0', () => {
    renderWithProviders(
      <ComparisonTable principal={PRINCIPAL} annualRate={RATE} emi={EMI} currentExtra={0} />,
    )
    // The table should render — there will be a row for ₹0
    expect(screen.getByText('₹0')).toBeInTheDocument()
    // Full EMI row (₹13,215) is one of the preset amounts
    expect(screen.getByText('₹13,215')).toBeInTheDocument()
  })

  it('renders column headers', () => {
    renderWithProviders(
      <ComparisonTable principal={PRINCIPAL} annualRate={RATE} emi={EMI} currentExtra={1000} />,
    )
    expect(screen.getByText('Extra/month')).toBeInTheDocument()
    expect(screen.getByText('Payoff Time')).toBeInTheDocument()
    expect(screen.getByText('Total Interest')).toBeInTheDocument()
    expect(screen.getByText('Interest Saved')).toBeInTheDocument()
    expect(screen.getByText('Months Saved')).toBeInTheDocument()
  })

  it('non-zero interest saved rows show currency formatted values not "—"', () => {
    renderWithProviders(
      <ComparisonTable principal={PRINCIPAL} annualRate={RATE} emi={EMI} currentExtra={5000} />,
    )
    // There should be at least one ₹ value in the Interest Saved column
    const rupeeValues = screen.getAllByText(/^₹\d/)
    expect(rupeeValues.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Tests: getExtraAmounts helper
// ---------------------------------------------------------------------------

describe('getExtraAmounts', () => {
  it('when currentExtra is 0, returns preset EMI percentages including 0 and full EMI', () => {
    const amounts = getExtraAmounts(0, 10_000)
    expect(amounts).toContain(0)
    expect(amounts).toContain(10_000)
    expect(amounts).toContain(Math.round(10_000 * 0.5))
  })

  it('when currentExtra is 0, result is sorted ascending', () => {
    const amounts = getExtraAmounts(0, 10_000)
    const sorted = [...amounts].sort((a, b) => a - b)
    expect(amounts).toEqual(sorted)
  })

  it('when currentExtra > 0, anchors around currentExtra', () => {
    const amounts = getExtraAmounts(4_000, 10_000)
    expect(amounts).toContain(0)
    expect(amounts).toContain(4_000)
    expect(amounts).toContain(8_000) // currentExtra * 2
  })

  it('when currentExtra > 0, result is sorted ascending', () => {
    const amounts = getExtraAmounts(3_000, 12_000)
    const sorted = [...amounts].sort((a, b) => a - b)
    expect(amounts).toEqual(sorted)
  })

  it('no negative amounts in output', () => {
    const amounts = getExtraAmounts(0, 500)
    expect(amounts.every(a => a >= 0)).toBe(true)
  })

  it('no duplicate amounts in output', () => {
    const amounts = getExtraAmounts(0, 1_000)
    expect(new Set(amounts).size).toBe(amounts.length)
  })

  it('deduplicates when rounding causes collisions', () => {
    // Very small EMI — rounding may collapse 10% and 25% to the same value
    const amounts = getExtraAmounts(0, 3)
    expect(new Set(amounts).size).toBe(amounts.length)
  })
})
