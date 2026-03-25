import { useCurrency } from '../../hooks/useCurrency'

interface PaymentSliderProps {
  value: number
  onChange: (value: number) => void
}

export function PaymentSlider({ value, onChange }: PaymentSliderProps): React.JSX.Element {
  const { config } = useCurrency()

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const raw = e.target.value
    if (raw === '') {
      onChange(0)
      return
    }
    const parsed = Number(raw)
    if (!Number.isNaN(parsed) && parsed >= 0) {
      onChange(parsed)
    }
  }

  const sliderValue = Math.min(value, config.sliderMax)

  return (
    <div>
      <label htmlFor="extra-payment-input" className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1">
        Extra Monthly Payment
      </label>
      <div className="relative mb-2">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 text-sm">
          {config.symbol}
        </span>
        <input
          id="extra-payment-input"
          type="number"
          min={0}
          step={config.sliderStep}
          value={value || ''}
          onChange={handleTextChange}
          placeholder="0"
          className="w-full pl-8 pr-3 py-3 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[48px] tabular-nums"
          aria-label="Extra monthly payment amount"
        />
      </div>
      <input
        id="extra-payment-slider"
        type="range"
        min={0}
        max={config.sliderMax}
        step={config.sliderStep}
        value={sliderValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        aria-label="Extra monthly payment slider"
        aria-valuemin={0}
        aria-valuemax={config.sliderMax}
        aria-valuenow={sliderValue}
      />
    </div>
  )
}
