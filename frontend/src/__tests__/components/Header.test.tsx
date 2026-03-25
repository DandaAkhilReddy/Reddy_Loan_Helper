import { render, screen } from '@testing-library/react'
import { CurrencyProvider } from '../../hooks/useCurrency'
import { DarkModeProvider } from '../../hooks/useDarkMode'
import { Header } from '../../components/Header'

function renderWithProvider(): ReturnType<typeof render> {
  return render(
    <DarkModeProvider>
      <CurrencyProvider>
        <Header />
      </CurrencyProvider>
    </DarkModeProvider>
  )
}

describe('Header', () => {
  it('renders the title "Reddy Loan Helper"', () => {
    renderWithProvider()
    expect(screen.getByRole('heading', { name: 'Reddy Loan Helper' })).toBeInTheDocument()
  })

  it('renders the subtitle "Student Loan Payoff Estimator"', () => {
    renderWithProvider()
    expect(screen.getByText('Student Loan Payoff Estimator')).toBeInTheDocument()
  })

  it('renders the CurrencyToggle with ₹ INR button', () => {
    renderWithProvider()
    expect(screen.getByRole('radio', { name: '₹ INR' })).toBeInTheDocument()
  })
})
