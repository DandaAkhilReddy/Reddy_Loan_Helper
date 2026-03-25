/**
 * Edge-case tests for PaymentSlider covering: USD mode slider attributes,
 * aria-valuetext matching the formatted value, and max-value rendering.
 */
import { render, screen } from '@testing-library/react'
import { CurrencyProvider } from '../../hooks/useCurrency'
import { PaymentSlider } from '../../components/form/PaymentSlider'
import { CURRENCY_CONFIGS } from '../../constants/defaults'

function renderWithProvider(
  props: Partial<React.ComponentProps<typeof PaymentSlider>> = {},
): ReturnType<typeof render> {
  const defaults = { value: 0, onChange: () => {} }
  return render(
    <CurrencyProvider>
      <PaymentSlider {...defaults} {...props} />
    </CurrencyProvider>,
  )
}

describe('PaymentSlider — aria attributes', () => {
  it('slider aria-valuemin is 0', () => {
    renderWithProvider({ value: 5000 })
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuemin', '0')
  })

  it('slider aria-valuenow reflects current value', () => {
    renderWithProvider({ value: 5000 })
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '5000')
  })

  it('slider aria-valuemax equals INR sliderMax', () => {
    renderWithProvider()
    expect(screen.getByRole('slider')).toHaveAttribute(
      'aria-valuemax',
      String(CURRENCY_CONFIGS.INR.sliderMax),
    )
  })

  it('slider aria-valuetext matches compact formatted value', () => {
    renderWithProvider({ value: 10000 })
    // formatINRCompact(10000) = ₹10.0K
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '₹10.0K')
  })
})

describe('PaymentSlider — max value display', () => {
  it('renders compact format for slider max (INR: 100000 → ₹1.0L)', () => {
    renderWithProvider({ value: 100000 })
    // formatINRCompact(100000) = ₹1.0L
    expect(screen.getByText('₹1.0L')).toBeInTheDocument()
  })
})

describe('PaymentSlider — zero value display', () => {
  it('displays ₹0 for value 0 (falls back to formatINR)', () => {
    renderWithProvider({ value: 0 })
    expect(screen.getByText('₹0')).toBeInTheDocument()
  })
})

describe('PaymentSlider — label', () => {
  it('renders "Extra Monthly Payment" label text', () => {
    renderWithProvider()
    expect(screen.getByText('Extra Monthly Payment')).toBeInTheDocument()
  })
})
