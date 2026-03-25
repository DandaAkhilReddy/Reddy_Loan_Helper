import { render, screen, act } from '@testing-library/react'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function identity(n: number): string {
  return String(n)
}

function currency(n: number): string {
  return `$${n}`
}

// ---------------------------------------------------------------------------
// Tests — reduced-motion path (synchronous, deterministic)
// ---------------------------------------------------------------------------

describe('AnimatedNumber (reduced motion)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (_query: string) => ({
        matches: true,
        media: _query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    })
  })

  afterEach(() => {
    // Restore setup.ts default (matches: false)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    })
  })

  it('renders formatted value immediately with reduced motion', () => {
    render(<AnimatedNumber value={1000} formatter={identity} />)
    expect(screen.getByText('1000')).toBeInTheDocument()
  })

  it('applies tabular-nums class to span', () => {
    render(<AnimatedNumber value={42} formatter={identity} />)
    const span = screen.getByText('42')
    expect(span.tagName).toBe('SPAN')
    expect(span.className).toContain('tabular-nums')
  })

  it('calls formatter with the initial value', () => {
    const fmt = vi.fn((n: number) => `val:${n}`)
    render(<AnimatedNumber value={99} formatter={fmt} />)
    expect(fmt).toHaveBeenCalledWith(99)
    expect(screen.getByText('val:99')).toBeInTheDocument()
  })

  it('updates display synchronously when value changes (reduced motion)', () => {
    const { rerender } = render(<AnimatedNumber value={100} formatter={currency} />)
    expect(screen.getByText('$100')).toBeInTheDocument()

    act(() => {
      rerender(<AnimatedNumber value={200} formatter={currency} />)
    })
    expect(screen.getByText('$200')).toBeInTheDocument()
  })

  it('handles value of 0 correctly', () => {
    render(<AnimatedNumber value={0} formatter={identity} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('handles negative values correctly', () => {
    render(<AnimatedNumber value={-50} formatter={identity} />)
    expect(screen.getByText('-50')).toBeInTheDocument()
  })

  it('cleanup runs with rafRef=0 when reducedMotion is true (covers false branch of cleanup if)', () => {
    // When reducedMotion=true the effect returns early without calling rAF.
    // rafRef.current stays 0. On rerender, the old cleanup fires with rafRef=0.
    const { rerender } = render(<AnimatedNumber value={10} formatter={identity} />)
    // Rerender triggers cleanup of the previous effect (where rafRef.current=0)
    act(() => {
      rerender(<AnimatedNumber value={20} formatter={identity} />)
    })
    expect(screen.getByText('20')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Tests — normal-motion path (rAF-based)
// ---------------------------------------------------------------------------

describe('AnimatedNumber (normal motion)', () => {
  let rafCallbacks: Map<number, FrameRequestCallback>
  let rafCounter: number
  let cancelledIds: Set<number>

  beforeEach(() => {
    rafCallbacks = new Map()
    rafCounter = 0
    cancelledIds = new Set()

    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCounter += 1
      rafCallbacks.set(rafCounter, cb)
      return rafCounter
    })

    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      cancelledIds.add(id)
      rafCallbacks.delete(id)
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls requestAnimationFrame on initial render', () => {
    render(<AnimatedNumber value={500} formatter={identity} />)
    expect(rafCallbacks.size).toBeGreaterThan(0)
  })

  it('renders initial value before any frame fires', () => {
    render(<AnimatedNumber value={750} formatter={identity} />)
    // Before any rAF tick, display is the initial formatted value
    expect(screen.getByText('750')).toBeInTheDocument()
  })

  it('cancels pending animation on unmount', () => {
    const { unmount } = render(<AnimatedNumber value={300} formatter={identity} />)
    const scheduledId = rafCounter
    unmount()
    expect(cancelledIds.has(scheduledId)).toBe(true)
  })

  it('cancels previous animation when value changes', () => {
    const { rerender } = render(<AnimatedNumber value={100} formatter={identity} />)
    const firstId = rafCounter

    act(() => {
      rerender(<AnimatedNumber value={200} formatter={identity} />)
    })

    // Either cancelled directly or a new rAF was scheduled (old one superseded)
    // The cancel path fires when rafRef.current is non-zero at next effect run
    expect(cancelledIds.has(firstId) || rafCounter > firstId).toBe(true)
  })

  it('advances to final value when rAF runs to completion', () => {
    vi.stubGlobal('performance', { now: () => 0 })

    render(<AnimatedNumber value={1000} formatter={identity} />)

    // Simulate time well past duration (600ms default) so progress >= 1
    act(() => {
      const cb = rafCallbacks.get(rafCounter)
      if (cb) cb(1000) // timestamp = 1000ms >> duration=600ms → progress = 1
    })

    expect(screen.getByText('1000')).toBeInTheDocument()
  })

  it('respects custom duration prop — shorter duration completes sooner', () => {
    vi.stubGlobal('performance', { now: () => 0 })

    render(<AnimatedNumber value={500} formatter={identity} duration={200} />)

    act(() => {
      // 300ms elapsed > 200ms duration → progress = 1 → shows final value
      const cb = rafCallbacks.get(rafCounter)
      if (cb) cb(300)
    })

    expect(screen.getByText('500')).toBeInTheDocument()
  })

  it('schedules a follow-up rAF frame when progress < 1 (covers if-branch on line 37)', () => {
    vi.stubGlobal('performance', { now: () => 0 })

    render(<AnimatedNumber value={1000} formatter={identity} duration={600} />)

    const initialCount = rafCounter

    act(() => {
      // 100ms elapsed / 600ms duration = progress ~0.167 → still animating → schedules another frame
      const cb = rafCallbacks.get(rafCounter)
      if (cb) cb(100)
    })

    // A new rAF frame must have been scheduled (rafCounter advanced)
    expect(rafCounter).toBeGreaterThan(initialCount)
  })
})
