import { render, screen } from '@testing-library/react'
import { Tooltip } from '../../components/ui/Tooltip'

describe('Tooltip', () => {
  it('renders children', () => {
    render(
      <Tooltip text="Helpful hint">
        <button>Hover me</button>
      </Tooltip>,
    )
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument()
  })

  it('renders tooltip text in the DOM with role="tooltip"', () => {
    render(
      <Tooltip text="Some tooltip text">
        <span>target</span>
      </Tooltip>,
    )
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    expect(screen.getByRole('tooltip')).toHaveTextContent('Some tooltip text')
  })

  it('has aria-describedby on wrapper linking to tooltip id', () => {
    render(
      <Tooltip text="Describe this">
        <span>target</span>
      </Tooltip>,
    )
    const tooltip = screen.getByRole('tooltip')
    const tooltipId = tooltip.getAttribute('id')
    expect(tooltipId).toBeTruthy()

    // The wrapper span carries aria-describedby pointing to tooltip id
    const wrapper = tooltip.closest('[aria-describedby]')
    expect(wrapper?.getAttribute('aria-describedby')).toBe(tooltipId)
  })

  it('tooltip has opacity-0 class by default (hidden until hover)', () => {
    render(
      <Tooltip text="Hidden by default">
        <span>target</span>
      </Tooltip>,
    )
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.className).toContain('opacity-0')
  })

  it('tooltip has group-hover:opacity-100 class for hover reveal', () => {
    render(
      <Tooltip text="Hover to reveal">
        <span>target</span>
      </Tooltip>,
    )
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.className).toContain('group-hover:opacity-100')
  })

  it('tooltip has group-focus-within:opacity-100 class for keyboard reveal', () => {
    render(
      <Tooltip text="Focus to reveal">
        <span>target</span>
      </Tooltip>,
    )
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.className).toContain('group-focus-within:opacity-100')
  })

  it('generates unique ids between two instances', () => {
    render(
      <>
        <Tooltip text="First">
          <span>a</span>
        </Tooltip>
        <Tooltip text="Second">
          <span>b</span>
        </Tooltip>
      </>,
    )
    const tooltips = screen.getAllByRole('tooltip')
    expect(tooltips).toHaveLength(2)
    const id1 = tooltips[0]?.getAttribute('id')
    const id2 = tooltips[1]?.getAttribute('id')
    expect(id1).toBeTruthy()
    expect(id2).toBeTruthy()
    expect(id1).not.toBe(id2)
  })

  it('renders pointer caret arrow element inside tooltip', () => {
    const { container } = render(
      <Tooltip text="With arrow">
        <span>target</span>
      </Tooltip>,
    )
    // The caret is a sibling span inside the tooltip span
    const tooltip = screen.getByRole('tooltip')
    const caret = tooltip.querySelector('span')
    expect(caret).toBeInTheDocument()
    expect(caret?.className).toContain('border-t-stone-800')
    void container
  })

  it('wrapper has "group" class for Tailwind group-hover targeting', () => {
    render(
      <Tooltip text="Group class">
        <span>target</span>
      </Tooltip>,
    )
    const tooltip = screen.getByRole('tooltip')
    const wrapper = tooltip.parentElement
    expect(wrapper?.className).toContain('group')
  })

  it('tooltip has pointer-events-none to avoid obscuring hover target', () => {
    render(
      <Tooltip text="No pointer events">
        <span>target</span>
      </Tooltip>,
    )
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.className).toContain('pointer-events-none')
  })
})
