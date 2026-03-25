import { render, screen } from '@testing-library/react'
import { ProgressBar } from '../../components/ui/ProgressBar'

describe('ProgressBar', () => {
  it('renders correct percentage: original=100 new=70 → 30%', () => {
    render(<ProgressBar originalMonths={100} newMonths={70} />)
    expect(screen.getByText('30%')).toBeInTheDocument()
  })

  it('has role="progressbar" with correct aria-valuenow', () => {
    render(<ProgressBar originalMonths={100} newMonths={70} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '30')
  })

  it('progressbar has aria-valuemin=0 and aria-valuemax=100', () => {
    render(<ProgressBar originalMonths={100} newMonths={70} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('shows 0% when no time saved (original equals new)', () => {
    render(<ProgressBar originalMonths={120} newMonths={120} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '0')
  })

  it('returns empty fragment when originalMonths <= 0 (zero)', () => {
    const { container } = render(<ProgressBar originalMonths={0} newMonths={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('returns empty fragment when originalMonths is negative', () => {
    const { container } = render(<ProgressBar originalMonths={-5} newMonths={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('clamps to 100% when newMonths is negative', () => {
    render(<ProgressBar originalMonths={120} newMonths={-10} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '100')
  })

  it('clamps to 0% when newMonths exceeds original (edge case)', () => {
    render(<ProgressBar originalMonths={100} newMonths={150} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '0')
  })

  it('bar width style matches the clamped percentage', () => {
    render(<ProgressBar originalMonths={100} newMonths={40} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveStyle({ width: '60%' })
  })

  it('bar width is 0% when no savings', () => {
    render(<ProgressBar originalMonths={100} newMonths={100} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveStyle({ width: '0%' })
  })

  it('bar width is 100% when fully clamped', () => {
    render(<ProgressBar originalMonths={50} newMonths={-1} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveStyle({ width: '100%' })
  })

  it('renders "Time Saved" label', () => {
    render(<ProgressBar originalMonths={100} newMonths={50} />)
    expect(screen.getByText('Time Saved')).toBeInTheDocument()
  })

  it('aria-label on progressbar describes percentage', () => {
    render(<ProgressBar originalMonths={100} newMonths={75} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-label', '25% time saved')
  })

  it('rounds percentage correctly — original=3 new=2 → 33%', () => {
    render(<ProgressBar originalMonths={3} newMonths={2} />)
    expect(screen.getByText('33%')).toBeInTheDocument()
  })
})
