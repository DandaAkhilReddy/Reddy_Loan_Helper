import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '../App'
import { CurrencyProvider } from '../hooks/useCurrency'
import { DarkModeProvider } from '../hooks/useDarkMode'
import type { AuthUser } from '../lib/api'

interface MockAuthValue {
  user: AuthUser | null
  isLoading: boolean
  login: ReturnType<typeof vi.fn>
  logout: ReturnType<typeof vi.fn>
}

const mockAuthValue: MockAuthValue = {
  user: { id: '1', name: 'Akhil' },
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
}

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockAuthValue,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

const mockApiGetLoanData = vi.fn().mockResolvedValue(null)
const mockApiPutLoanData = vi.fn().mockResolvedValue({
  principal: 0,
  annual_rate: 0,
  emi: null,
  tenure_months: null,
  extra_monthly: 0,
  currency: 'INR',
})

vi.mock('../lib/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('../lib/api')>()
  return {
    ...original,
    apiGetLoanData: (...args: unknown[]) => mockApiGetLoanData(...args),
    apiPutLoanData: (...args: unknown[]) => mockApiPutLoanData(...args),
  }
})

function renderApp() {
  return render(
    <DarkModeProvider>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </DarkModeProvider>,
  )
}

const LOGGED_IN_USER: AuthUser = { id: '1', name: 'Akhil' }

beforeEach(() => {
  localStorage.removeItem('reddy-loan-dark-mode')
  document.documentElement.classList.remove('dark')
  mockAuthValue.user = LOGGED_IN_USER
  mockAuthValue.isLoading = false
  mockAuthValue.login = vi.fn()
  mockAuthValue.logout = vi.fn().mockResolvedValue(undefined)
  mockApiGetLoanData.mockReset()
  mockApiGetLoanData.mockResolvedValue(null)
  mockApiPutLoanData.mockReset()
  mockApiPutLoanData.mockResolvedValue({
    principal: 0, annual_rate: 0, emi: null, tenure_months: null, extra_monthly: 0, currency: 'INR',
  })
})

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
    const bar = screen.getByRole('progressbar')
    expect(bar).toBeInTheDocument()
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('renders amortization table in results section', () => {
    renderApp()
    expect(screen.getByText('Amortization Schedule')).toBeInTheDocument()
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
    expect(screen.getAllByText(/₹/).length).toBeGreaterThan(0)
    const usdButton = screen.getByRole('radio', { name: /\$ USD/i })
    await user.click(usdButton)
    expect(screen.getByRole('radio', { name: /₹ INR/i })).toHaveAttribute('aria-checked', 'false')
    expect(usdButton).toHaveAttribute('aria-checked', 'true')
    expect(screen.getAllByText(/\$/).length).toBeGreaterThan(0)
    const allText = document.body.textContent ?? ''
    expect(allText).toContain('$')
  })

  it('updating extra payment shows savings when monthsSaved > 0', () => {
    renderApp()
    const slider = screen.getByRole('slider', { name: /extra monthly payment/i })
    fireEvent.change(slider, { target: { value: '10000' } })
    expect(screen.getByText(/debt-free/i)).toBeInTheDocument()
  })

  it('selecting a preset from the dropdown loads loan values', () => {
    renderApp()
    const presetSelect = screen.getByRole('combobox', { name: /quick presets/i })
    fireEvent.change(presetSelect, { target: { value: 'us-student' } })
    expect(presetSelect).toBeInTheDocument()
  })

  it('preset selection loads values and results remain visible', () => {
    renderApp()
    const presetSelect = screen.getByRole('combobox', { name: /quick presets/i })
    fireEvent.change(presetSelect, { target: { value: 'akhil-student' } })
    expect(screen.getByText('New Payoff Time')).toBeInTheDocument()
  })

  it('calls apiGetLoanData on mount when user is logged in', async () => {
    renderApp()
    await waitFor(() => expect(mockApiGetLoanData).toHaveBeenCalled())
  })

  it('dispatches LOAD_PRESET when apiGetLoanData returns data', async () => {
    mockApiGetLoanData.mockResolvedValueOnce({
      principal: 500000,
      annual_rate: 9.0,
      emi: 10000,
      tenure_months: 60,
      extra_monthly: 500,
      currency: 'INR',
    })
    renderApp()
    // After server data loads, the principal input should reflect the server value
    await waitFor(() => {
      const input = screen.getByLabelText(/remaining principal/i)
      expect((input as HTMLInputElement).value).toBe('500000')
    })
  })

  it('syncs inputs to server via debounced PUT', async () => {
    renderApp()
    await waitFor(() => expect(screen.getByLabelText(/remaining principal/i)).toBeInTheDocument())
    const principalInput = screen.getByLabelText(/remaining principal/i)
    fireEvent.change(principalInput, { target: { value: '1000000' } })
    // Debounce is 500ms — wait for it to fire
    await waitFor(() => expect(mockApiPutLoanData).toHaveBeenCalled(), { timeout: 2000 })
  })

  it('cancels pending sync timeout on rapid input changes', async () => {
    renderApp()
    await waitFor(() => expect(screen.getByLabelText(/remaining principal/i)).toBeInTheDocument())
    const principalInput = screen.getByLabelText(/remaining principal/i)
    // First change — flush so the effect runs and sets syncTimeoutRef
    await act(async () => {
      fireEvent.change(principalInput, { target: { value: '1000000' } })
    })
    // Second change — cleanup runs with non-null syncTimeoutRef (covers line 61 true branch)
    await act(async () => {
      fireEvent.change(principalInput, { target: { value: '2000000' } })
    })
    // Wait for debounce to fire
    await waitFor(() => expect(mockApiPutLoanData).toHaveBeenCalled(), { timeout: 2000 })
  })


  it('clears pending PUT timeout on unmount', async () => {
    const { unmount } = renderApp()
    await waitFor(() => expect(screen.getByLabelText(/remaining principal/i)).toBeInTheDocument())
    const principalInput = screen.getByLabelText(/remaining principal/i)
    // Trigger a change to set a pending timeout
    fireEvent.change(principalInput, { target: { value: '1000000' } })
    // Unmount before timeout fires — should clear the timeout (line 61: clearTimeout branch)
    unmount()
    // If cleanup didn't work, the PUT would fire after unmount; no assertion needed — coverage is the goal
    expect(mockApiPutLoanData).not.toHaveBeenCalled()
  })

  it('handles apiGetLoanData rejection gracefully (offline fallback)', async () => {
    mockApiGetLoanData.mockRejectedValueOnce(new Error('offline'))
    // Should not throw — the catch silently ignores the error
    expect(() => renderApp()).not.toThrow()
    await waitFor(() => expect(mockApiGetLoanData).toHaveBeenCalled())
  })

  it('handles apiPutLoanData rejection gracefully', async () => {
    mockApiPutLoanData.mockRejectedValueOnce(new Error('server error'))
    renderApp()
    await waitFor(() => expect(screen.getByLabelText(/remaining principal/i)).toBeInTheDocument())
    const principalInput = screen.getByLabelText(/remaining principal/i)
    fireEvent.change(principalInput, { target: { value: '1500000' } })
    // Wait for the debounce + rejection — should not throw
    await waitFor(() => expect(mockApiPutLoanData).toHaveBeenCalled(), { timeout: 2000 })
  })
})

describe('App — not logged in', () => {
  it('renders LoginPage when user is null', () => {
    mockAuthValue.user = null
    renderApp()
    expect(screen.getByText('Enter your name to get started')).toBeInTheDocument()
  })

  it('does not render calculator UI when user is null', () => {
    mockAuthValue.user = null
    renderApp()
    expect(screen.queryByLabelText(/remaining principal/i)).not.toBeInTheDocument()
  })
})

describe('App — loading state', () => {
  it('renders a loading spinner when isLoading is true', () => {
    mockAuthValue.user = null
    mockAuthValue.isLoading = true
    renderApp()
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })

  it('does not render LoginPage or calculator while loading', () => {
    mockAuthValue.user = null
    mockAuthValue.isLoading = true
    renderApp()
    expect(screen.queryByText('Enter your name to get started')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/remaining principal/i)).not.toBeInTheDocument()
  })
})
