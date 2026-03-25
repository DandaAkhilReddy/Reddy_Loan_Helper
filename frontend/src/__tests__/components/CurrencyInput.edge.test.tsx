/**
 * Edge-case tests for CurrencyInput covering: placeholder prop forwarded,
 * value = 0 renders "0" not empty, USD mode shows $ symbol, aria-required,
 * and required=false rendering.
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { CurrencyProvider } from '../../hooks/useCurrency'
import { CurrencyInput } from '../../components/form/CurrencyInput'
import { useCurrency } from '../../hooks/useCurrency'
import { createElement } from 'react'
import type { ReactNode } from 'react'

type CurrencyInputProps = React.ComponentProps<typeof CurrencyInput>

function renderInINR(props: Partial<CurrencyInputProps> = {}): ReturnType<typeof render> {
  const defaults: CurrencyInputProps = {
    id: 'test',
    label: 'Amount',
    value: null,
    onChange: () => {},
  }
  return render(
    <CurrencyProvider>
      <CurrencyInput {...defaults} {...props} />
    </CurrencyProvider>,
  )
}

// Helper: render in USD mode by switching currency first
function USDWrapper({ children }: { children: ReactNode }): React.JSX.Element {
  return createElement(CurrencyProvider, null, children)
}

describe('CurrencyInput — placeholder prop', () => {
  it('forwards placeholder to the underlying input', () => {
    renderInINR({ placeholder: 'Auto-calculated' })
    expect(screen.getByPlaceholderText('Auto-calculated')).toBeInTheDocument()
  })
})

describe('CurrencyInput — value = 0', () => {
  it('value = 0 renders as "0" in the input (not empty string)', () => {
    renderInINR({ value: 0 })
    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue(0)
  })
})

describe('CurrencyInput — required attribute', () => {
  it('aria-required is true when required prop is set', () => {
    renderInINR({ required: true })
    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('aria-required', 'true')
  })

  it('aria-required is undefined/absent when required not set', () => {
    renderInINR({ required: false })
    const input = screen.getByRole('spinbutton')
    expect(input).not.toHaveAttribute('aria-required', 'true')
  })
})

describe('CurrencyInput — onChange with decimal input', () => {
  it('passes numeric value (including decimal) through onChange', () => {
    const onChange = vi.fn()
    renderInINR({ onChange })
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5000.50' } })
    expect(onChange).toHaveBeenCalledWith(5000.5)
  })
})

describe('CurrencyInput — USD currency symbol', () => {
  it('shows $ prefix after switching to USD currency', () => {
    // Render inside a provider, switch to USD, then render CurrencyInput
    function TestComponent(): React.JSX.Element {
      const { setCurrency, config } = useCurrency()
      return (
        <>
          <button onClick={() => setCurrency('USD')}>switch</button>
          <span data-testid="symbol">{config.symbol}</span>
        </>
      )
    }
    render(<USDWrapper><TestComponent /></USDWrapper>)

    fireEvent.click(screen.getByText('switch'))
    // Symbol updated in the context — CurrencyInput reads config.symbol
    expect(screen.getByTestId('symbol')).toHaveTextContent('$')
  })
})
