import { useState, useEffect, useRef, useMemo } from 'react'

interface AnimatedNumberProps {
  value: number
  formatter: (n: number) => string
  duration?: number
}

export function AnimatedNumber({ value, formatter, duration = 600 }: AnimatedNumberProps): React.JSX.Element {
  /* c8 ignore next 4 */
  const reducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  const staticDisplay = useMemo(() => formatter(value), [formatter, value])
  const [animatedDisplay, setAnimatedDisplay] = useState<string | null>(null)
  const rafRef = useRef(0)
  const prevValueRef = useRef(value)

  useEffect(() => {
    if (reducedMotion) {
      prevValueRef.current = value
      return
    }

    const startValue = prevValueRef.current
    const startTime = performance.now()

    function tick(now: number): void {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (value - startValue) * eased
      setAnimatedDisplay(formatter(Math.round(current)))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        prevValueRef.current = value
        setAnimatedDisplay(null)
      }
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      /* c8 ignore next */
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration, reducedMotion, formatter])

  return <span className="tabular-nums">{animatedDisplay ?? staticDisplay}</span>
}
