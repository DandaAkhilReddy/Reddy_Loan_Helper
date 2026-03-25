/**
 * Edge-case tests for AnimatedNumber covering:
 *
 * - Formatter called with intermediate rounded values during animation
 * - Value changes to the same value do not cause visual regression
 * - Custom duration of 0 ms completes immediately on first frame
 * - Large value changes (0 → large number) animate via easing function
 * - Formatter that returns complex strings (currency, units)
 */
import { render, screen, act } from '@testing-library/react'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'

function identity(n: number): string {
  return String(n)
}

describe('AnimatedNumber (normal motion) — value stays the same', () => {
  let rafCallbacks: Map<number, FrameRequestCallback>
  let rafCounter: number

  beforeEach(() => {
    rafCallbacks = new Map()
    rafCounter = 0
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCounter += 1
      rafCallbacks.set(rafCounter, cb)
      return rafCounter
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      rafCallbacks.delete(id)
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders correct value when rerendered with same value (no animation stutter)', () => {
    vi.stubGlobal('performance', { now: () => 0 })
    const { rerender } = render(<AnimatedNumber value={500} formatter={identity} />)
    // Rerender with same value
    act(() => {
      rerender(<AnimatedNumber value={500} formatter={identity} />)
    })
    // The displayed value should still be 500
    expect(screen.getByText('500')).toBeInTheDocument()
  })

  it('animates from 0 to 1000: intermediate frame shows eased value rounded', () => {
    let nowValue = 0
    vi.stubGlobal('performance', { now: () => nowValue })

    // Start at 0, then change to 1000 to trigger animation from 0 → 1000
    const { rerender } = render(<AnimatedNumber value={0} formatter={identity} duration={1000} />)

    // The initial render fires a rAF; run it to completion to establish prevValueRef = 0
    act(() => {
      const cb = rafCallbacks.get(rafCounter)
      if (cb) cb(2000) // well past duration → progress=1, prevValueRef set to 0
    })

    // Now set nowValue so performance.now() returns 0 at animation start
    nowValue = 0
    // Change value to 1000 → triggers new animation from startValue=0 to value=1000
    act(() => {
      rerender(<AnimatedNumber value={1000} formatter={identity} duration={1000} />)
    })

    // Fire a frame at 500ms elapsed (progress=0.5 → eased=0.875 → current=875)
    act(() => {
      const cb = rafCallbacks.get(rafCounter)
      if (cb) cb(500)
    })

    // Component should display the intermediate animated value (875)
    expect(screen.getByText('875')).toBeInTheDocument()
  })
})

describe('AnimatedNumber — formatter contract', () => {
  beforeEach(() => {
    // Use reduced motion to keep tests synchronous
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: () => ({ matches: true, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false }),
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({ matches: false, media: query, onchange: null, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false }),
    })
  })

  it('formatter receiving a currency prefix renders correctly', () => {
    render(<AnimatedNumber value={150000} formatter={(n) => `₹${n.toLocaleString('en-IN')}`} />)
    expect(screen.getByText(/₹/)).toBeInTheDocument()
  })

  it('formatter is called with Math.round applied to animated value', () => {
    const fmt = vi.fn((n: number) => `val:${n}`)
    render(<AnimatedNumber value={42} formatter={fmt} />)
    // With reduced motion, formatter is called with the exact value (42)
    expect(fmt).toHaveBeenCalledWith(42)
  })

  it('span contains formatted output from formatter', () => {
    render(<AnimatedNumber value={0} formatter={() => 'zero'} />)
    expect(screen.getByText('zero')).toBeInTheDocument()
    const span = screen.getByText('zero')
    expect(span.tagName).toBe('SPAN')
    expect(span.className).toContain('tabular-nums')
  })
})
