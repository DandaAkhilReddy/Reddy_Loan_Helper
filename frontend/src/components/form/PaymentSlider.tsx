import { useCurrency } from '../../hooks/useCurrency'

interface PaymentSliderProps {
  value: number
  onChange: (value: number) => void
}

/**
 * Extra monthly payment control with a number input and a range slider.
 * Both controls stay in sync via the shared value / onChange props.
 */
export function PaymentSlider({ value, onChange }: PaymentSliderProps): React.JSX.Element {
  const { config, formatCompact } = useCurrency()

  const handleInputChange = (raw: string): void => {
    const parsed = Number(raw)
    if (parsed >= 0) {
      onChange(Math.min(parsed, config.sliderMax))
    }
  }

  return (
    <div>
      <label htmlFor="extra-payment-input" className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1">
        Extra Monthly Payment
      </label>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-stone-500 dark:text-stone-400">{config.symbol}</span>
        <input
          id="extra-payment-input"
          type="number"
          min={0}
          max={config.sliderMax}
          step={config.sliderStep}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          className="w-32 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-50 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Extra monthly payment amount"
        />
      </div>
      <div className="flex items-center gap-4">
        <input
          id="extra-payment"
          type="range"
          min={0}
          max={config.sliderMax}
          step={config.sliderStep}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          aria-label="Extra monthly payment"
          aria-valuemin={0}
          aria-valuemax={config.sliderMax}
          aria-valuenow={value}
          aria-valuetext={formatCompact(value)}
        />
        <span className="text-sm font-medium text-stone-700 dark:text-stone-200 tabular-nums min-w-[60px] text-right">
          {formatCompact(value)}
        </span>
      </div>
    </div>
  )
}
