import { render, screen, fireEvent } from '@testing-library/react'
import { DarkModeProvider } from '../../hooks/useDarkMode'
import { DarkModeToggle } from '../../components/DarkModeToggle'

function renderWithProvider(): ReturnType<typeof render> {
  return render(
    <DarkModeProvider>
      <DarkModeToggle />
    </DarkModeProvider>
  )
}

describe('DarkModeToggle', () => {
  beforeEach(() => {
    localStorage.removeItem('reddy-loan-dark-mode')
    document.documentElement.classList.remove('dark')
  })

  it('renders a button', () => {
    renderWithProvider()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('shows "Switch to dark mode" aria-label in light mode (default)', () => {
    renderWithProvider()
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to dark mode')
  })

  it('clicking toggles aria-label to "Switch to light mode"', () => {
    renderWithProvider()
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode')
  })

  it('clicking again toggles aria-label back to "Switch to dark mode"', () => {
    renderWithProvider()
    const button = screen.getByRole('button')
    fireEvent.click(button)
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')
  })

  it('shows "Switch to light mode" aria-label when initialised in dark mode', () => {
    localStorage.setItem('reddy-loan-dark-mode', 'true')
    renderWithProvider()
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to light mode')
  })
})
