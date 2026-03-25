import { render, screen, fireEvent } from '@testing-library/react'
import { CurrencyProvider, useCurrency } from '../../hooks/useCurrency'
import { PresetSelector } from '../../components/form/PresetSelector'
import { LOAN_PRESETS } from '../../constants/presets'
import type { LoanPreset } from '../../constants/presets'

function renderWithProvider(onSelect: (preset: LoanPreset) => void = () => {}): ReturnType<typeof render> {
  return render(
    <CurrencyProvider>
      <PresetSelector onSelect={onSelect} />
    </CurrencyProvider>
  )
}

describe('PresetSelector', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('renders the Quick Presets label', () => {
    renderWithProvider()
    expect(screen.getByText('Quick Presets')).toBeInTheDocument()
  })

  it('renders a select element with id preset-selector', () => {
    renderWithProvider()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByLabelText('Quick Presets')).toBeInTheDocument()
  })

  it('renders all preset options plus the disabled placeholder', () => {
    renderWithProvider()
    const select = screen.getByRole('combobox')
    // placeholder + 4 presets = 5 options
    expect(select.querySelectorAll('option')).toHaveLength(LOAN_PRESETS.length + 1)
  })

  it('each preset label appears in the options', () => {
    renderWithProvider()
    for (const preset of LOAN_PRESETS) {
      expect(screen.getByText(new RegExp(preset.label))).toBeInTheDocument()
    }
  })

  it('selecting a preset calls onSelect with the matching preset object', () => {
    const onSelect = vi.fn()
    renderWithProvider(onSelect)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'akhil-student' } })
    expect(onSelect).toHaveBeenCalledTimes(1)
    const called = onSelect.mock.calls[0][0] as LoanPreset
    expect(called.id).toBe('akhil-student')
    expect(called.inputs.principal).toBe(2563163)
  })

  it('selecting US Student Loan calls onSelect and switches currency to USD', () => {
    const onSelect = vi.fn()

    function CurrencyDisplay(): React.JSX.Element {
      const { currency } = useCurrency()
      return <span data-testid="currency">{currency}</span>
    }

    render(
      <CurrencyProvider>
        <PresetSelector onSelect={onSelect} />
        <CurrencyDisplay />
      </CurrencyProvider>
    )

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'us-student' } })
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('currency').textContent).toBe('USD')
  })

  it('selecting custom preset does not switch currency', () => {
    const onSelect = vi.fn()

    function CurrencyDisplay(): React.JSX.Element {
      const { currency } = useCurrency()
      return <span data-testid="currency">{currency}</span>
    }

    render(
      <CurrencyProvider>
        <PresetSelector onSelect={onSelect} />
        <CurrencyDisplay />
      </CurrencyProvider>
    )

    // Currency starts as INR (default)
    expect(screen.getByTestId('currency').textContent).toBe('INR')

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'custom' } })
    expect(onSelect).toHaveBeenCalledTimes(1)
    // Currency should remain INR — custom preset does not call setCurrency
    expect(screen.getByTestId('currency').textContent).toBe('INR')
  })

  it('selecting akhil-student sets currency to INR', () => {
    const onSelect = vi.fn()

    function CurrencyDisplay(): React.JSX.Element {
      const { currency } = useCurrency()
      return <span data-testid="currency">{currency}</span>
    }

    render(
      <CurrencyProvider>
        <PresetSelector onSelect={onSelect} />
        <CurrencyDisplay />
      </CurrencyProvider>
    )

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'akhil-student' } })
    expect(screen.getByTestId('currency').textContent).toBe('INR')
  })

  it('selecting an unknown value does not call onSelect', () => {
    const onSelect = vi.fn()
    renderWithProvider(onSelect)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'nonexistent-id' } })
    expect(onSelect).not.toHaveBeenCalled()
  })
})
