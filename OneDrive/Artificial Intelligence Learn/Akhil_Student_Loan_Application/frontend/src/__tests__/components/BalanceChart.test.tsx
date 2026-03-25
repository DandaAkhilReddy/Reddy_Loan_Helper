import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { CurrencyProvider } from '../../hooks/useCurrency'
import { DarkModeProvider } from '../../hooks/useDarkMode'
import { BalanceChart } from '../../components/charts/BalanceChart'
import type { AmortizationEntry } from '../../types/loan'

// ---------------------------------------------------------------------------
// Recharts mock
// Stubs all chart primitives so tests run in jsdom and formatter callbacks
// (YAxis tickFormatter, Tooltip formatter) are invoked to satisfy v8 coverage.
// ---------------------------------------------------------------------------

vi.mock('recharts', () => {
  const pass = ({ children }: { children?: ReactNode }): ReactNode => children ?? null

  return {
    ResponsiveContainer: ({ children }: { children?: ReactNode }): ReactNode =>
      createElement('div', { className: 'recharts-responsive-container' }, children),
    AreaChart: ({ children }: { children?: ReactNode }): ReactNode =>
      createElement('div', { 'data-testid': 'area-chart' }, children),
    Area: pass,
    XAxis: pass,
    YAxis: ({
      tickFormatter,
    }: {
      tickFormatter?: (v: number) => string
    }): ReactNode => {
      // Invoke the formatter to exercise the inline arrow function in the source file
      if (tickFormatter) tickFormatter(1_000_000)
      return null
    },
    Tooltip: ({
      formatter,
    }: {
      formatter?: (v: unknown) => string
    }): ReactNode => {
      if (formatter) formatter(500_000)
      return null
    },
    Legend: pass,
    ReferenceLine: ({
      x,
      label,
    }: {
      x?: string
      label?: string
    }): ReactNode =>
      createElement('div', {
        className: 'recharts-reference-line',
        'data-x': x,
        'data-label': label,
      }),
    defs: pass,
    linearGradient: pass,
    stop: pass,
  }
})

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: ReactNode }): ReactNode {
  return createElement(DarkModeProvider, null, createElement(CurrencyProvider, null, children))
}

function renderWithProvider(ui: React.JSX.Element): ReturnType<typeof render> {
  return render(ui, { wrapper })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockEntry(month: number, balance: number): AmortizationEntry {
  return {
    month,
    openingBalance: balance + 1000,
    interest: 100,
    principalPaid: 900,
    extraPayment: 0,
    closingBalance: balance,
    cumulativeInterest: month * 100,
  }
}

function makeSchedule(months: number, startBalance: number): AmortizationEntry[] {
  return Array.from({ length: months }, (_, i) => {
    const m = i + 1
    const balance = Math.max(0, startBalance - m * 1000)
    return mockEntry(m, balance)
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BalanceChart', () => {
  it('renders "No data to display" when both schedules are empty', () => {
    renderWithProvider(<BalanceChart originalSchedule={[]} acceleratedSchedule={[]} />)
    expect(screen.getByText('No data to display')).toBeInTheDocument()
  })

  it('renders the chart heading when data is present', () => {
    const orig = makeSchedule(12, 12000)
    const accel = makeSchedule(8, 12000)
    renderWithProvider(<BalanceChart originalSchedule={orig} acceleratedSchedule={accel} />)
    expect(screen.getByText('Balance Over Time')).toBeInTheDocument()
  })

  it('renders a ResponsiveContainer wrapper with data', () => {
    const orig = makeSchedule(12, 12000)
    const accel = makeSchedule(8, 12000)
    const { container } = renderWithProvider(
      <BalanceChart originalSchedule={orig} acceleratedSchedule={accel} />,
    )
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
  })

  it('does not render "No data" when only original schedule has entries', () => {
    const orig = makeSchedule(6, 6000)
    renderWithProvider(<BalanceChart originalSchedule={orig} acceleratedSchedule={[]} />)
    expect(screen.queryByText('No data to display')).not.toBeInTheDocument()
  })

  it('does not render "No data" when only accelerated schedule has entries', () => {
    const accel = makeSchedule(6, 6000)
    renderWithProvider(<BalanceChart originalSchedule={[]} acceleratedSchedule={accel} />)
    expect(screen.queryByText('No data to display')).not.toBeInTheDocument()
  })

  it('renders ReferenceLine when accelerated payoff is before original schedule end', () => {
    // payoffMonth (accel.length=4) > 0 and < orig.length (12) → ReferenceLine branch taken
    const orig = makeSchedule(12, 12000)
    const accel = makeSchedule(4, 12000)
    const { container } = renderWithProvider(
      <BalanceChart originalSchedule={orig} acceleratedSchedule={accel} />,
    )
    expect(container.querySelector('.recharts-reference-line')).toBeInTheDocument()
  })

  it('does not render ReferenceLine when schedules are equal length', () => {
    // payoffMonth === originalSchedule.length → condition false
    const orig = makeSchedule(8, 8000)
    const accel = makeSchedule(8, 8000)
    const { container } = renderWithProvider(
      <BalanceChart originalSchedule={orig} acceleratedSchedule={accel} />,
    )
    expect(container.querySelector('.recharts-reference-line')).not.toBeInTheDocument()
  })

  it('YAxis tickFormatter and Tooltip formatter are invoked without throwing', () => {
    // The mocked YAxis calls tickFormatter(1_000_000) and Tooltip calls formatter(500_000)
    // which exercises the inline formatCompact callbacks in the source
    const orig = makeSchedule(6, 6000)
    const accel = makeSchedule(4, 6000)
    expect(() =>
      renderWithProvider(<BalanceChart originalSchedule={orig} acceleratedSchedule={accel} />),
    ).not.toThrow()
  })

  it('renders correctly in dark mode (covers dark color branches)', () => {
    localStorage.setItem('reddy-loan-dark-mode', 'true')
    try {
      const orig = makeSchedule(6, 6000)
      const accel = makeSchedule(4, 6000)
      expect(() =>
        renderWithProvider(<BalanceChart originalSchedule={orig} acceleratedSchedule={accel} />),
      ).not.toThrow()
      expect(screen.getByText('Balance Over Time')).toBeInTheDocument()
    } finally {
      localStorage.removeItem('reddy-loan-dark-mode')
    }
  })
})
