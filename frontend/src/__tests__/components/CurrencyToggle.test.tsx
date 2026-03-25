import { render, screen, fireEvent } from '@testing-library/react'
import { CurrencyProvider } from '../../hooks/useCurrency'
import { CurrencyToggle } from '../../components/CurrencyToggle'

function renderWithProvider(): ReturnType<typeof render> {
  return render(
    <CurrencyProvider>
      <CurrencyToggle />
    </CurrencyProvider>
  )
}

describe('CurrencyToggle', () => {
  it('renders INR and USD buttons', () => {
    renderWithProvider()
    expect(screen.getByRole('radio', { name: '₹ INR' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '$ USD' })).toBeInTheDocument()
  })

  it('INR is active by default (aria-checked=true)', () => {
    renderWithProvider()
    expect(screen.getByRole('radio', { name: '₹ INR' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '$ USD' })).toHaveAttribute('aria-checked', 'false')
  })

  it('clicking USD switches active state', () => {
    renderWithProvider()
    const usdButton = screen.getByRole('radio', { name: '$ USD' })
    fireEvent.click(usdButton)
    expect(screen.getByRole('radio', { name: '$ USD' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '₹ INR' })).toHaveAttribute('aria-checked', 'false')
  })

  it('has a radiogroup with correct aria-label', () => {
    renderWithProvider()
    expect(screen.getByRole('radiogroup', { name: 'Currency selection' })).toBeInTheDocument()
  })

  it('clicking INR when INR is already active keeps INR active', () => {
    renderWithProvider()
    const inrButton = screen.getByRole('radio', { name: '₹ INR' })
    fireEvent.click(inrButton)
    expect(inrButton).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '$ USD' })).toHaveAttribute('aria-checked', 'false')
  })

  it('clicking INR after USD switches back to INR active', () => {
    renderWithProvider()
    fireEvent.click(screen.getByRole('radio', { name: '$ USD' }))
    fireEvent.click(screen.getByRole('radio', { name: '₹ INR' }))
    expect(screen.getByRole('radio', { name: '₹ INR' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '$ USD' })).toHaveAttribute('aria-checked', 'false')
  })
})
