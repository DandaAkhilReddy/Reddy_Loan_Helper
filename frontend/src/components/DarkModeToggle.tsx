import { Sun, Moon } from 'lucide-react'
import { useDarkMode } from '../hooks/useDarkMode'

/**
 * Icon button that toggles dark mode on/off.
 * Must be rendered within a DarkModeProvider.
 */
export function DarkModeToggle(): React.JSX.Element {
  const { isDark, toggle } = useDarkMode()

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-2 rounded-lg text-indigo-200 hover:text-white hover:bg-indigo-500/30 transition-colors"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  )
}
