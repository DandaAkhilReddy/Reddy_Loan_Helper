import { render, screen, fireEvent } from '@testing-library/react'
import { CurrencyProvider } from '../../hooks/useCurrency'
import { CurrencyInput } from '../../components/form/CurrencyInput'

function renderWithProvider(
  props: Partial<React.ComponentProps<typeof CurrencyInput>> = {}
): ReturnType<typeof render> {
  const defaults = {
    id: 'test-input',
    label: 'Test Label',
    value: null as number | null,
    onChange: () => {},
  }
  return render(
    <CurrencyProvider>
      <CurrencyInput {...defaults} {...props} />
    </CurrencyProvider>
  )
}

describe('CurrencyInput', () => {
  it('renders with ₹ prefix in INR mode', () => {
    renderWithProvider({ value: 1000 })
    expect(screen.getByText('₹')).toBeInTheDocument()
  })

  it('renders the label', () => {
    renderWithProvider({ label: 'Remaining Principal' })
    expect(screen.getByText('Remaining Principal')).toBeInTheDocument()
  })

  it('shows required asterisk when required prop is set', () => {
    renderWithProvider({ required: true, label: 'Amount' })
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('does not show asterisk when required is not set', () => {
    renderWithProvider({ label: 'Amount' })
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('calls onChange with a number when input has a value', () => {
    const onChange = vi.fn()
    renderWithProvider({ onChange, id: 'amt' })
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5000' } })
    expect(onChange).toHaveBeenCalledWith(5000)
  })

  it('calls onChange with null when input is cleared', () => {
    const onChange = vi.fn()
    renderWithProvider({ onChange, value: 5000, id: 'amt' })
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('associates label with input via htmlFor/id', () => {
    renderWithProvider({ id: 'my-field', label: 'My Field' })
    const label = screen.getByText('My Field')
    const input = screen.getByRole('spinbutton')
    expect(label.closest('label')).toHaveAttribute('for', 'my-field')
    expect(input).toHaveAttribute('id', 'my-field')
  })
})
