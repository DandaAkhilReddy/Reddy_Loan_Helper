import { render, screen } from '@testing-library/react'
import { Footer } from '../../components/Footer'

describe('Footer', () => {
  it('renders the disclaimer text', () => {
    render(<Footer />)
    expect(
      screen.getByText(/This is an estimate only\. Actual values may vary based on your lender/i)
    ).toBeInTheDocument()
  })

  it('renders "Built by Akhil Reddy"', () => {
    render(<Footer />)
    expect(screen.getByText('Built by Akhil Reddy')).toBeInTheDocument()
  })
})
