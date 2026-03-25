import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { CurrencyProvider } from '../../hooks/useCurrency'
import { InterestBreakdownChart } from '../../components/charts/InterestBreakdownChart'
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
      if (tickFormatter) tickFormatter(2_000_000)
      return null
    },
    Tooltip: ({
      formatter,
    }: {
      formatter?: (v: unknown) => string
    }): ReactNode => {
      if (formatter) formatter(750_000)
      return null
    },
    Legend: pass,
    defs: pass,
    linearGradient: pass,
    stop: pass,
  }
})

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: ReactNode }): ReactNode {
  return createElement(CurrencyProvider, null, children)
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

describe('InterestBreakdownChart', () => {
  it('renders "No data to display" when both schedules are empty', () => {
    renderWithProvider(
      <InterestBreakdownChart originalSchedule={[]} acceleratedSchedule={[]} />,
    )
    expect(screen.getByText('No data to display')).toBeInTheDocument()
  })

  it('renders the chart heading when data is present', () => {
    const orig = makeSchedule(12, 12000)
    const accel = makeSchedule(8, 12000)
    renderWithProvider(
      <InterestBreakdownChart originalSchedule={orig} acceleratedSchedule={accel} />,
    )
    expect(screen.getByText('Interest vs Principal Paid')).toBeInTheDocument()
  })

  it('renders a ResponsiveContainer wrapper with data', () => {
    const orig = makeSchedule(12, 12000)
    const accel = makeSchedule(8, 12000)
    const { container } = renderWithProvider(
      <InterestBreakdownChart originalSchedule={orig} acceleratedSchedule={accel} />,
    )
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
  })

  it('does not render "No data" when only original schedule has entries', () => {
    const orig = makeSchedule(6, 6000)
    renderWithProvider(
      <InterestBreakdownChart originalSchedule={orig} acceleratedSchedule={[]} />,
    )
    expect(screen.queryByText('No data to display')).not.toBeInTheDocument()
  })

  it('does not render "No data" when only accelerated schedule has entries', () => {
    const accel = makeSchedule(6, 6000)
    renderWithProvider(
      <InterestBreakdownChart originalSchedule={[]} acceleratedSchedule={accel} />,
    )
    expect(screen.queryByText('No data to display')).not.toBeInTheDocument()
  })

  it('YAxis tickFormatter and Tooltip formatter are invoked without throwing', () => {
    // The mocked YAxis calls tickFormatter(2_000_000) and Tooltip calls formatter(750_000)
    // which exercises the inline formatCompact callbacks in the source
    const orig = makeSchedule(6, 6000)
    const accel = makeSchedule(4, 6000)
    expect(() =>
      renderWithProvider(
        <InterestBreakdownChart originalSchedule={orig} acceleratedSchedule={accel} />,
      ),
    ).not.toThrow()
  })
})
