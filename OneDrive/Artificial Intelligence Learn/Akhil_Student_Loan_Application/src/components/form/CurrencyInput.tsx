import { useCurrency } from '../../hooks/useCurrency'

interface CurrencyInputProps {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  required?: boolean
  placeholder?: string
  id: string
}

export function CurrencyInput({ label, value, onChange, required, placeholder, id }: CurrencyInputProps): React.JSX.Element {
  const { config } = useCurrency()

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">{config.symbol}</span>
        <input
          id={id}
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          required={required}
          placeholder={placeholder}
          className="w-full pl-8 pr-3 py-3 rounded-lg border border-stone-300 text-stone-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[48px]"
          aria-required={required}
        />
      </div>
    </div>
  )
}
