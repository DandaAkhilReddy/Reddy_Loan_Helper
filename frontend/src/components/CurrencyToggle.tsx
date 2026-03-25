import { useCurrency } from '../hooks/useCurrency'

export function CurrencyToggle(): React.JSX.Element {
  const { currency, setCurrency } = useCurrency()

  return (
    <div className="flex rounded-lg overflow-hidden border border-indigo-400" role="radiogroup" aria-label="Currency selection">
      <button
        role="radio"
        aria-checked={currency === 'INR'}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          currency === 'INR' ? 'bg-white text-indigo-600' : 'text-indigo-200 hover:text-white'
        }`}
        onClick={() => setCurrency('INR')}
      >
        ₹ INR
      </button>
      <button
        role="radio"
        aria-checked={currency === 'USD'}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          currency === 'USD' ? 'bg-white text-indigo-600' : 'text-indigo-200 hover:text-white'
        }`}
        onClick={() => setCurrency('USD')}
      >
        $ USD
      </button>
    </div>
  )
}
