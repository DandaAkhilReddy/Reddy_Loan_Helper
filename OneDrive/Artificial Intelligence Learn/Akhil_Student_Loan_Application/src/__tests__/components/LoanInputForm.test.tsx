import { render, screen, fireEvent } from '@testing-library/react'
import { CurrencyProvider } from '../../hooks/useCurrency'
import { LoanInputForm } from '../../components/form/LoanInputForm'
import type { LoanInput } from '../../types/loan'

const defaultInputs: LoanInput = {
  principal: 2563163,
  annualRate: 13.5,
  emi: 51476,
  tenureMonths: 111,
  extraMonthly: 0,
}

function renderWithProvider(
  props: Partial<React.ComponentProps<typeof LoanInputForm>> = {}
): ReturnType<typeof render> {
  const defaults = {
    inputs: defaultInputs,
    errors: {},
    onUpdate: () => {},
    onLoadPreset: () => {},
  }
  return render(
    <CurrencyProvider>
      <LoanInputForm {...defaults} {...props} />
    </CurrencyProvider>
  )
}

describe('LoanInputForm', () => {
  it('renders the Loan Details heading', () => {
    renderWithProvider()
    expect(screen.getByRole('heading', { name: 'Loan Details' })).toBeInTheDocument()
  })

  it('renders the principal field', () => {
    renderWithProvider()
    expect(screen.getByLabelText(/Remaining Principal/i)).toBeInTheDocument()
  })

  it('renders the annual rate field', () => {
    renderWithProvider()
    expect(screen.getByLabelText(/Annual Interest Rate/i)).toBeInTheDocument()
  })

  it('renders the EMI field', () => {
    renderWithProvider()
    expect(screen.getByLabelText(/Current EMI/i)).toBeInTheDocument()
  })

  it('renders the remaining months field', () => {
    renderWithProvider()
    expect(screen.getByLabelText(/Remaining Months/i)).toBeInTheDocument()
  })

  it('renders the extra monthly payment slider', () => {
    renderWithProvider()
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('shows principal error message when provided', () => {
    renderWithProvider({ errors: { principal: 'Principal is required' } })
    expect(screen.getByText('Principal is required')).toBeInTheDocument()
  })

  it('shows annualRate error message when provided', () => {
    renderWithProvider({ errors: { annualRate: 'Rate must be positive' } })
    expect(screen.getByText('Rate must be positive')).toBeInTheDocument()
  })

  it('does not show error messages when errors is empty', () => {
    renderWithProvider({ errors: {} })
    expect(screen.queryByText('Principal is required')).not.toBeInTheDocument()
    expect(screen.queryByText('Rate must be positive')).not.toBeInTheDocument()
  })

  it('calls onUpdate with "annualRate" when rate input changes', () => {
    const onUpdate = vi.fn()
    renderWithProvider({ onUpdate })
    const rateInput = screen.getByLabelText(/Annual Interest Rate/i)
    fireEvent.change(rateInput, { target: { value: '12' } })
    expect(onUpdate).toHaveBeenCalledWith('annualRate', 12)
  })

  it('calls onUpdate with "tenureMonths" and null when tenure cleared', () => {
    const onUpdate = vi.fn()
    renderWithProvider({ onUpdate })
    const tenureInput = screen.getByLabelText(/Remaining Months/i)
    fireEvent.change(tenureInput, { target: { value: '' } })
    expect(onUpdate).toHaveBeenCalledWith('tenureMonths', null)
  })

  it('calls onUpdate with "tenureMonths" and number when tenure set', () => {
    const onUpdate = vi.fn()
    renderWithProvider({ onUpdate })
    const tenureInput = screen.getByLabelText(/Remaining Months/i)
    fireEvent.change(tenureInput, { target: { value: '60' } })
    expect(onUpdate).toHaveBeenCalledWith('tenureMonths', 60)
  })

  it('calls onUpdate with "extraMonthly" when slider changes', () => {
    const onUpdate = vi.fn()
    renderWithProvider({ onUpdate })
    fireEvent.change(screen.getByRole('slider'), { target: { value: '5000' } })
    expect(onUpdate).toHaveBeenCalledWith('extraMonthly', 5000)
  })

  it('calls onUpdate with "emi" when EMI input changes', () => {
    const onUpdate = vi.fn()
    renderWithProvider({ onUpdate })
    const emiInput = screen.getByLabelText(/Current EMI/i)
    fireEvent.change(emiInput, { target: { value: '50000' } })
    expect(onUpdate).toHaveBeenCalledWith('emi', 50000)
  })

  it('renders tenure input with empty string when tenureMonths is null', () => {
    renderWithProvider({ inputs: { ...defaultInputs, tenureMonths: null } })
    const tenureInput = screen.getByLabelText(/Remaining Months/i) as HTMLInputElement
    expect(tenureInput.value).toBe('')
  })
})
