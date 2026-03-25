/**
 * Accessibility attribute tests for LoanInputForm covering the
 * aria-describedby conditional on the annualRate input:
 *
 * - When errors.annualRate is set: aria-describedby="error-rate" is present
 * - When errors.annualRate is absent: aria-describedby attribute is NOT present
 *   (undefined is not serialised as an HTML attribute)
 *
 * Also covers:
 * - error-principal paragraph gets id="error-principal" when error present
 * - error-rate paragraph gets id="error-rate" when error present
 * - helper text paragraphs (not errors) are always rendered
 */
import { render, screen } from '@testing-library/react'
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
  return render(
    <CurrencyProvider>
      <LoanInputForm
        inputs={defaultInputs}
        errors={{}}
        onUpdate={() => {}}
        onLoadPreset={() => {}}
        {...props}
      />
    </CurrencyProvider>,
  )
}

describe('LoanInputForm — aria-describedby on annualRate input', () => {
  it('rate input has no aria-describedby when errors.annualRate is absent', () => {
    renderWithProvider({ errors: {} })
    const rateInput = screen.getByLabelText(/Annual Interest Rate/i)
    // When there is no error, aria-describedby is undefined → attribute absent
    expect(rateInput).not.toHaveAttribute('aria-describedby')
  })

  it('rate input has aria-describedby="error-rate" when errors.annualRate is present', () => {
    renderWithProvider({ errors: { annualRate: 'Rate must be 0-50%' } })
    const rateInput = screen.getByLabelText(/Annual Interest Rate/i)
    expect(rateInput).toHaveAttribute('aria-describedby', 'error-rate')
  })

  it('error paragraph has id="error-rate" when annualRate error is present', () => {
    const { container } = renderWithProvider({ errors: { annualRate: 'Rate must be 0-50%' } })
    expect(container.querySelector('#error-rate')).toBeInTheDocument()
    expect(container.querySelector('#error-rate')?.textContent).toBe('Rate must be 0-50%')
  })

  it('error-rate paragraph is absent when no annualRate error', () => {
    const { container } = renderWithProvider({ errors: {} })
    expect(container.querySelector('#error-rate')).not.toBeInTheDocument()
  })
})

describe('LoanInputForm — error paragraph ids for principal', () => {
  it('error paragraph has id="error-principal" when principal error is present', () => {
    const { container } = renderWithProvider({ errors: { principal: 'Principal must be positive' } })
    expect(container.querySelector('#error-principal')).toBeInTheDocument()
    expect(container.querySelector('#error-principal')?.textContent).toBe('Principal must be positive')
  })

  it('error-principal paragraph is absent when no principal error', () => {
    const { container } = renderWithProvider({ errors: {} })
    expect(container.querySelector('#error-principal')).not.toBeInTheDocument()
  })
})

describe('LoanInputForm — helper text paragraphs always rendered', () => {
  it('EMI helper text is always visible regardless of errors', () => {
    renderWithProvider({ errors: { principal: 'Principal must be positive', annualRate: 'Rate must be 0-50%' } })
    expect(screen.getByText(/Equated Monthly Installment/i)).toBeInTheDocument()
  })

  it('tenure helper text is always visible regardless of errors', () => {
    renderWithProvider({ errors: { principal: 'Principal must be positive' } })
    expect(screen.getByText(/Number of months left on your loan term/i)).toBeInTheDocument()
  })
})
