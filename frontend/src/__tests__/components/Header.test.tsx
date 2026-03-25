import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { CurrencyProvider } from '../../hooks/useCurrency'
import { DarkModeProvider } from '../../hooks/useDarkMode'
import { Header } from '../../components/Header'
import type { AuthUser } from '../../lib/api'

interface MockAuthValue {
  user: AuthUser | null
  isLoading: boolean
  login: ReturnType<typeof vi.fn>
  logout: ReturnType<typeof vi.fn>
}

const mockAuthValue: MockAuthValue = {
  user: null,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
}

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockAuthValue,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

function renderWithProvider(): ReturnType<typeof render> {
  return render(
    <DarkModeProvider>
      <CurrencyProvider>
        <Header />
      </CurrencyProvider>
    </DarkModeProvider>,
  )
}

beforeEach(() => {
  mockAuthValue.user = null
  mockAuthValue.isLoading = false
  mockAuthValue.login = vi.fn()
  mockAuthValue.logout = vi.fn().mockResolvedValue(undefined)
})

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

  it('does not show user greeting when user is null', () => {
    renderWithProvider()
    expect(screen.queryByText(/Hi,/i)).not.toBeInTheDocument()
  })

  it('shows user name greeting when user is logged in', () => {
    mockAuthValue.user = { id: '1', name: 'Akhil' }
    renderWithProvider()
    expect(screen.getByText('Hi, Akhil')).toBeInTheDocument()
  })

  it('does not show logout button when user is null', () => {
    renderWithProvider()
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument()
  })

  it('shows logout button when user is logged in', () => {
    mockAuthValue.user = { id: '1', name: 'Akhil' }
    renderWithProvider()
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()
  })

  it('calls logout when logout button is clicked', () => {
    const logoutMock = vi.fn().mockResolvedValue(undefined)
    mockAuthValue.user = { id: '1', name: 'Akhil' }
    mockAuthValue.logout = logoutMock
    renderWithProvider()
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }))
    expect(logoutMock).toHaveBeenCalledOnce()
  })
})
