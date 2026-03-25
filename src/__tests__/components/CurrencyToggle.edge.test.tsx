/**
 * Edge-case tests for CurrencyToggle covering CSS class branches:
 * active (bg-white text-indigo-600) vs inactive (text-indigo-200).
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { CurrencyProvider } from '../../hooks/useCurrency'
import { CurrencyToggle } from '../../components/CurrencyToggle'

function renderWithProvider(): ReturnType<typeof render> {
  return render(
    <CurrencyProvider>
      <CurrencyToggle />
    </CurrencyProvider>,
  )
}

describe('CurrencyToggle — active/inactive CSS classes', () => {
  it('INR button has active class (bg-white) by default', () => {
    renderWithProvider()
    const inrBtn = screen.getByRole('radio', { name: '₹ INR' })
    expect(inrBtn.className).toContain('bg-white')
    expect(inrBtn.className).toContain('text-indigo-600')
  })

  it('USD button has inactive class (text-indigo-200) by default', () => {
    renderWithProvider()
    const usdBtn = screen.getByRole('radio', { name: '$ USD' })
    expect(usdBtn.className).toContain('text-indigo-200')
    expect(usdBtn.className).not.toContain('bg-white')
  })

  it('clicking USD: USD button gets active class, INR button gets inactive class', () => {
    renderWithProvider()
    const usdBtn = screen.getByRole('radio', { name: '$ USD' })
    const inrBtn = screen.getByRole('radio', { name: '₹ INR' })
    fireEvent.click(usdBtn)
    expect(usdBtn.className).toContain('bg-white')
    expect(usdBtn.className).toContain('text-indigo-600')
    expect(inrBtn.className).toContain('text-indigo-200')
    expect(inrBtn.className).not.toContain('bg-white')
  })

  it('clicking INR when already INR keeps active class unchanged', () => {
    renderWithProvider()
    const inrBtn = screen.getByRole('radio', { name: '₹ INR' })
    fireEvent.click(inrBtn)
    expect(inrBtn.className).toContain('bg-white')
  })

  it('toggling from USD back to INR: INR regains active class', () => {
    renderWithProvider()
    const usdBtn = screen.getByRole('radio', { name: '$ USD' })
    const inrBtn = screen.getByRole('radio', { name: '₹ INR' })
    fireEvent.click(usdBtn)
    fireEvent.click(inrBtn)
    expect(inrBtn.className).toContain('bg-white')
    expect(usdBtn.className).toContain('text-indigo-200')
  })
})
