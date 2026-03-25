import { useId } from 'react'
import type { ReactNode } from 'react'

interface TooltipProps {
  text: string
  children: ReactNode
}

export function Tooltip({ text, children }: TooltipProps): React.JSX.Element {
  const id = useId()

  return (
    <span className="relative inline-flex group" aria-describedby={id}>
      {children}
      <span
        id={id}
        role="tooltip"
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-800 whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-10"
      >
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-800 dark:border-t-stone-200" />
      </span>
    </span>
  )
}
