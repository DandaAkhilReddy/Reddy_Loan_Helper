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
})
