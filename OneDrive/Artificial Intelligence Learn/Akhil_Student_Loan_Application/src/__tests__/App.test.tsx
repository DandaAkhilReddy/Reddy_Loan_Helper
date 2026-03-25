import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { CurrencyProvider } from '../hooks/useCurrency'

function renderApp() {
  return render(
    <CurrencyProvider>
      <App />
    </CurrencyProvider>,
  )
}

describe('App', () => {
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
    // Defaults have valid loan data, so results should show
    expect(screen.getByText('New Payoff Time')).toBeInTheDocument()
    expect(screen.getByText('Interest Saved')).toBeInTheDocument()
    expect(screen.getByText('Months Saved')).toBeInTheDocument()
    expect(screen.getByText('Total Interest')).toBeInTheDocument()
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

    // Currency symbol has propagated: result cards now show $-prefixed values
    expect(screen.getAllByText(/\$/).length).toBeGreaterThan(0)
    // No ₹-prefixed monetary values remain in the result cards
    const rupeeValues = screen.queryAllByText(/₹[\d,]/)
    expect(rupeeValues).toHaveLength(0)
  })

  it('updating extra payment shows savings when monthsSaved > 0', () => {
    renderApp()
    const slider = screen.getByLabelText(/extra monthly payment/i)
    // Fire a change event on the range input
    fireEvent.change(slider, { target: { value: '10000' } })
    // With extra payment, there should be savings displayed
    expect(screen.getByText(/debt-free/i)).toBeInTheDocument()
  })
})
