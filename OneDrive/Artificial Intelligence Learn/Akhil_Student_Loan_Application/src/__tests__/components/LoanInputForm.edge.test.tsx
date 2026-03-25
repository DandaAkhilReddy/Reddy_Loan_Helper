/**
 * Edge-case tests for LoanInputForm covering: null emi renders empty input,
 * null tenureMonths renders empty input, calling onUpdate with 'principal'
 * and 'emi' from the CurrencyInput onChange paths.
 */
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
  props: Partial<React.ComponentProps<typeof LoanInputForm>> = {},
): ReturnType<typeof render> {
  const defaults = {
    inputs: defaultInputs,
    errors: {},
    onUpdate: () => {},
  }
  return render(
    <CurrencyProvider>
      <LoanInputForm {...defaults} {...props} />
    </CurrencyProvider>,
  )
}

describe('LoanInputForm — null optional fields render empty inputs', () => {
  it('emi = null renders an empty EMI input', () => {
    renderWithProvider({ inputs: { ...defaultInputs, emi: null } })
    const emiInput = screen.getByLabelText(/Current EMI/i)
    expect(emiInput).toHaveValue(null)
  })

  it('tenureMonths = null renders an empty tenure input', () => {
    renderWithProvider({ inputs: { ...defaultInputs, tenureMonths: null } })
    const tenureInput = screen.getByLabelText(/Remaining Months/i)
    expect(tenureInput).toHaveValue(null)
  })
})

describe('LoanInputForm — onUpdate called for all fields', () => {
  it('calls onUpdate with "principal" when principal input changes', () => {
    const onUpdate = vi.fn()
    renderWithProvider({ onUpdate })
    const principalInput = screen.getByLabelText(/Remaining Principal/i)
    fireEvent.change(principalInput, { target: { value: '1000000' } })
    expect(onUpdate).toHaveBeenCalledWith('principal', 1000000)
  })

  it('calls onUpdate with "emi" and null when EMI input cleared', () => {
    const onUpdate = vi.fn()
    renderWithProvider({ onUpdate })
    const emiInput = screen.getByLabelText(/Current EMI/i)
    fireEvent.change(emiInput, { target: { value: '' } })
    expect(onUpdate).toHaveBeenCalledWith('emi', null)
  })

  it('calls onUpdate with "emi" and number when EMI input set', () => {
    const onUpdate = vi.fn()
    renderWithProvider({ onUpdate })
    const emiInput = screen.getByLabelText(/Current EMI/i)
    fireEvent.change(emiInput, { target: { value: '15000' } })
    expect(onUpdate).toHaveBeenCalledWith('emi', 15000)
  })
})

describe('LoanInputForm — does not show errors when none provided', () => {
  it('no error paragraphs rendered when errors = {}', () => {
    renderWithProvider()
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument()
  })
})

describe('LoanInputForm — heading rendered', () => {
  it('section heading is "Loan Details"', () => {
    renderWithProvider()
    expect(screen.getByRole('heading', { name: 'Loan Details' })).toBeInTheDocument()
  })
})
