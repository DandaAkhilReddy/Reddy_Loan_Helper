import { useCurrency } from '../../hooks/useCurrency'

interface PaymentSliderProps {
  value: number
  onChange: (value: number) => void
}

export function PaymentSlider({ value, onChange }: PaymentSliderProps): React.JSX.Element {
  const { config, formatCompact } = useCurrency()

  return (
    <div>
      <label htmlFor="extra-payment" className="block text-sm font-medium text-stone-700 mb-1">
        Extra Monthly Payment
      </label>
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
        <span className="text-sm font-medium text-stone-700 tabular-nums min-w-[60px] text-right">
          {formatCompact(value)}
        </span>
      </div>
    </div>
  )
}
