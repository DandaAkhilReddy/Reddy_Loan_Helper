import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { LoginPage } from '../../components/LoginPage'
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
  login: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
}

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockAuthValue,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

beforeEach(() => {
  mockAuthValue.user = null
  mockAuthValue.isLoading = false
  mockAuthValue.login = vi.fn().mockResolvedValue(undefined)
  mockAuthValue.logout = vi.fn().mockResolvedValue(undefined)
})

describe('LoginPage', () => {
  it('renders the heading', () => {
    render(<LoginPage />)
    expect(screen.getByRole('heading', { name: 'Reddy Loan Helper' })).toBeInTheDocument()
  })

  it('renders the "Enter your name to get started" text', () => {
    render(<LoginPage />)
    expect(screen.getByText('Enter your name to get started')).toBeInTheDocument()
  })

  it('renders a name text input', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText('Your name')).toBeInTheDocument()
  })

  it('renders a Start button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
  })

  it('Start button is disabled when name is empty', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled()
  })

  it('Start button becomes enabled when name is typed', () => {
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Akhil' } })
    expect(screen.getByRole('button', { name: 'Start' })).not.toBeDisabled()
  })

  it('calls login with trimmed name on submit', async () => {
    const loginMock = vi.fn().mockResolvedValue(undefined)
    mockAuthValue.login = loginMock

    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: '  Akhil  ' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Start' }).closest('form')!)

    await waitFor(() => expect(loginMock).toHaveBeenCalledWith('Akhil'))
  })

  it('shows loading spinner while submitting', async () => {
    let resolveLogin!: () => void
    mockAuthValue.login = vi.fn().mockReturnValue(
      new Promise<void>((resolve) => { resolveLogin = resolve }),
    )

    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Akhil' } })
    fireEvent.submit(screen.getByRole('button').closest('form')!)

    await waitFor(() => expect(screen.getByText('Connecting…')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText(/First start may take/i)).toBeInTheDocument())

    resolveLogin()
  })

  it('shows error message when login fails', async () => {
    mockAuthValue.login = vi.fn().mockRejectedValue(new Error('Server down'))

    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Akhil' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Start' }).closest('form')!)

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Server down'))
  })

  it('shows generic error when rejection is not an Error instance', async () => {
    mockAuthValue.login = vi.fn().mockRejectedValue('bad')

    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Akhil' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Start' }).closest('form')!)

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Login failed. Please try again.'),
    )
  })

  it('does not call login when name is whitespace only', () => {
    const loginMock = vi.fn()
    mockAuthValue.login = loginMock

    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: '   ' } })
    fireEvent.submit(screen.getByLabelText('Your name').closest('form')!)

    expect(loginMock).not.toHaveBeenCalled()
  })
})
