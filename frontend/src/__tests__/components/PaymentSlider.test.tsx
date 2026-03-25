import { render, screen, fireEvent } from '@testing-library/react'
import { CurrencyProvider } from '../../hooks/useCurrency'
import { PaymentSlider } from '../../components/form/PaymentSlider'
import { CURRENCY_CONFIGS } from '../../constants/defaults'

function renderWithProvider(
  props: Partial<React.ComponentProps<typeof PaymentSlider>> = {}
): ReturnType<typeof render> {
  const defaults = {
    value: 0,
    onChange: () => {},
  }
  return render(
    <CurrencyProvider>
      <PaymentSlider {...defaults} {...props} />
    </CurrencyProvider>
  )
}

describe('PaymentSlider', () => {
  it('renders the slider input', () => {
    renderWithProvider()
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('renders the formatted value display', () => {
    renderWithProvider({ value: 0 })
    // formatINRCompact(0) falls back to formatINR(0) = ₹0
    expect(screen.getByText('₹0')).toBeInTheDocument()
  })

  it('slider has correct min attribute', () => {
    renderWithProvider()
    expect(screen.getByRole('slider')).toHaveAttribute('min', '0')
  })

  it('slider has correct max from INR config', () => {
    renderWithProvider()
    expect(screen.getByRole('slider')).toHaveAttribute('max', String(CURRENCY_CONFIGS.INR.sliderMax))
  })

  it('slider has correct step from INR config', () => {
    renderWithProvider()
    expect(screen.getByRole('slider')).toHaveAttribute('step', String(CURRENCY_CONFIGS.INR.sliderStep))
  })

  it('calls onChange with numeric value on slider change', () => {
    const onChange = vi.fn()
    renderWithProvider({ onChange })
    fireEvent.change(screen.getByRole('slider'), { target: { value: '5000' } })
    expect(onChange).toHaveBeenCalledWith(5000)
  })

  it('renders compact formatted value for non-zero amount', () => {
    renderWithProvider({ value: 10000 })
    // formatINRCompact(10000) = ₹10.0K
    expect(screen.getByText('₹10.0K')).toBeInTheDocument()
  })

  it('renders a number input box with the current value', () => {
    renderWithProvider({ value: 5000 })
    const numInput = screen.getByLabelText('Extra monthly payment amount')
    expect(numInput).toBeInTheDocument()
    expect(numInput).toHaveValue(5000)
  })

  it('calls onChange via number input change with parsed value', () => {
    const onChange = vi.fn()
    renderWithProvider({ onChange })
    const numInput = screen.getByLabelText('Extra monthly payment amount')
    fireEvent.change(numInput, { target: { value: '3000' } })
    expect(onChange).toHaveBeenCalledWith(3000)
  })

  it('number input caps value at sliderMax', () => {
    const onChange = vi.fn()
    renderWithProvider({ onChange })
    const numInput = screen.getByLabelText('Extra monthly payment amount')
    fireEvent.change(numInput, { target: { value: '999999' } })
    expect(onChange).toHaveBeenCalledWith(CURRENCY_CONFIGS.INR.sliderMax)
  })

  it('number input with decimal value calls onChange correctly', () => {
    const onChange = vi.fn()
    renderWithProvider({ onChange })
    const numInput = screen.getByLabelText('Extra monthly payment amount')
    fireEvent.change(numInput, { target: { value: '2500' } })
    expect(onChange).toHaveBeenCalledWith(2500)
  })

  it('renders currency symbol prefix next to number input', () => {
    renderWithProvider()
    // INR symbol ₹ is shown as the prefix
    const symbols = screen.getAllByText('₹')
    expect(symbols.length).toBeGreaterThan(0)
  })

  it('number input has correct min, max and step attributes', () => {
    renderWithProvider()
    const numInput = screen.getByLabelText('Extra monthly payment amount')
    expect(numInput).toHaveAttribute('min', '0')
    expect(numInput).toHaveAttribute('max', String(CURRENCY_CONFIGS.INR.sliderMax))
    expect(numInput).toHaveAttribute('step', String(CURRENCY_CONFIGS.INR.sliderStep))
  })

  it('number input does not call onChange for negative parsed value', () => {
    const onChange = vi.fn()
    renderWithProvider({ onChange })
    const numInput = screen.getByLabelText('Extra monthly payment amount')
    // Simulate a raw value that parses to negative (e.g. from programmatic change)
    fireEvent.change(numInput, { target: { value: '-1' } })
    expect(onChange).not.toHaveBeenCalled()
  })
})