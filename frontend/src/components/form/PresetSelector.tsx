import type { LoanPreset } from '../../constants/presets'
import { LOAN_PRESETS } from '../../constants/presets'
import { useCurrency } from '../../hooks/useCurrency'

interface PresetSelectorProps {
  onSelect: (preset: LoanPreset) => void
}

/**
 * Dropdown to load a named loan preset into the calculator.
 * Switches the app currency when a non-custom preset is selected.
 */
export function PresetSelector({ onSelect }: PresetSelectorProps): React.JSX.Element {
  const { setCurrency } = useCurrency()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const preset = LOAN_PRESETS.find(p => p.id === e.target.value)
    if (preset) {
      if (preset.id !== 'custom') {
        setCurrency(preset.currency)
      }
      onSelect(preset)
    }
  }

  return (
    <div className="mb-4">
      <label htmlFor="preset-selector" className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1">
        Quick Presets
      </label>
      <select
        id="preset-selector"
        onChange={handleChange}
        defaultValue=""
        className="w-full sm:w-auto px-3 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[48px]"
      >
        <option value="" disabled>Select a preset...</option>
        {LOAN_PRESETS.map(preset => (
          <option key={preset.id} value={preset.id}>
            {preset.label} — {preset.description}
          </option>
        ))}
      </select>
    </div>
  )
}
