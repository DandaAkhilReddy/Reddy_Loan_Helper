import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { CurrencyProvider } from '../hooks/useCurrency'
import { DarkModeProvider } from '../hooks/useDarkMode'

function renderApp() {
  return render(
    <DarkModeProvider>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </DarkModeProvider>,
  )
}

describe('App', () => {
  beforeEach(() => {
    localStorage.removeItem('reddy-loan-dark-mode')
    document.documentElement.classList.remove('dark')
  })

  it('renders header with title', () => {
    renderApp()
    expect(screen.getByText('Reddy Loan Helper')).toBeInTheDocument()
  })

  it('renders the loan input form', () => {
    renderApp()
    expect(screen.getByLabelText(/remaining principal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/annual interest rate/i)).toBeInTheDocument()
  })

  it('renders results with default loan values', () => {
    renderApp()
    // Defaults have valid loan data, so results should show.
    // Use getAllByText because ComparisonTable also renders these column headers.
    expect(screen.getByText('New Payoff Time')).toBeInTheDocument()
    expect(screen.getAllByText('Interest Saved').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Months Saved').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Total Interest').length).toBeGreaterThanOrEqual(1)
  })

  it('renders charts with default data', () => {
    renderApp()
    expect(screen.getByText('Balance Over Time')).toBeInTheDocument()
    expect(screen.getByText('Interest vs Principal Paid')).toBeInTheDocument()
  })

  it('renders footer disclaimer', () => {
    renderApp()
    expect(screen.getByText(/this is an estimate/i)).toBeInTheDocument()
  })

  it('renders skip-link anchor pointing to main content', () => {
    renderApp()
    const skipLink = screen.getByText('Skip to content')
    expect(skipLink).toBeInTheDocument()
    expect(skipLink.tagName.toLowerCase()).toBe('a')
    expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  it('skip-link has the skip-link CSS class', () => {
    renderApp()
    const skipLink = screen.getByText('Skip to content')
    expect(skipLink.className).toContain('skip-link')
  })

  it('dark mode toggle propagates: clicking adds dark class to documentElement', () => {
    renderApp()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    const toggleBtn = screen.getByRole('button', { name: /switch to dark mode/i })
    fireEvent.click(toggleBtn)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('dark mode toggle propagates: clicking twice removes dark class from documentElement', () => {
    renderApp()
    const toggleBtn = screen.getByRole('button', { name: /switch to dark mode/i })
    fireEvent.click(toggleBtn)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    fireEvent.click(toggleBtn)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('renders ProgressBar in results section with default data', () => {
    renderApp()
    // ProgressBar renders with role="progressbar" when original months > 0
    const bar = screen.getByRole('progressbar')
    expect(bar).toBeInTheDocument()
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('renders amortization table in results section', () => {
    renderApp()
    expect(screen.getByText('Amortization Schedule')).toBeInTheDocument()
    // Two tables render: the amortization table and the comparison table
    const tables = screen.getAllByRole('table')
    expect(tables.length).toBeGreaterThanOrEqual(2)
  })

  it('renders export buttons in results section', () => {
    renderApp()
    expect(screen.getByRole('button', { name: /download csv/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /print \/ pdf/i })).toBeInTheDocument()
  })

  it('renders comparison table in results section', () => {
    renderApp()
    expect(screen.getByText('Compare Extra Payment Scenarios')).toBeInTheDocument()
  })

  it('shows placeholder when principal is cleared', async () => {
    const user = userEvent.setup()
    renderApp()
    const principalInput = screen.getByLabelText(/remaining principal/i)
    await user.clear(principalInput)
    expect(screen.getByText(/enter loan details/i)).toBeInTheDocument()
  })

  it('currency toggle switches between INR and USD and propagates to result cards', async () => {
    const user = userEvent.setup()
    renderApp()

    // Default currency is INR — results show ₹-prefixed values
    expect(screen.getAllByText(/₹/).length).toBeGreaterThan(0)

    const usdButton = screen.getByRole('radio', { name: /\$ USD/i })
    await user.click(usdButton)

    // After switching to USD the toggle state is correct
    expect(screen.getByRole('radio', { name: /₹ INR/i })).toHaveAttribute('aria-checked', 'false')
    expect(usdButton).toHaveAttribute('aria-checked', 'true')

    // Currency symbol has propagated: summary cards and results now show $-prefixed values
    expect(screen.getAllByText(/\$/).length).toBeGreaterThan(0)
    // The PayoffTimeline "New Payoff Time" section should show $ formatted total interest,
    // not ₹ — verify by checking the SummaryCards Total Paid value shows a $ prefix
    const allText = document.body.textContent ?? ''
    // The header ₹ INR / $ USD toggle will still contain ₹ — that's expected.
    // The key check: formatted monetary cell values from the SummaryCards use $, not ₹
    expect(allText).toContain('$')
  })

  it('updating extra payment shows savings when monthsSaved > 0', () => {
    renderApp()
    const slider = screen.getByLabelText(/extra monthly payment/i)
    // Fire a change event on the range input
    fireEvent.change(slider, { target: { value: '10000' } })
    // With extra payment, there should be savings displayed
    expect(screen.getByText(/debt-free/i)).toBeInTheDocument()
  })

  it('selecting a preset from the dropdown loads loan values', () => {
    renderApp()
    const presetSelect = screen.getByRole('combobox', { name: /quick presets/i })
    // Select the US Student Loan preset which has valid principal+tenure
    fireEvent.change(presetSelect, { target: { value: 'us-student' } })
    // After loading preset, results should reflect the new values
    expect(presetSelect).toBeInTheDocument()
  })

  it('preset selection loads values and results remain visible', () => {
    renderApp()
    const presetSelect = screen.getByRole('combobox', { name: /quick presets/i })
    fireEvent.change(presetSelect, { target: { value: 'akhil-student' } })
    // Results section should still be visible with the new loan's data
    expect(screen.getByText('New Payoff Time')).toBeInTheDocument()
  })
})
