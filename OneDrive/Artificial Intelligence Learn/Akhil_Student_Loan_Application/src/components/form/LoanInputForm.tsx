import type { LoanInput } from '../../types/loan'
import type { LoanPreset } from '../../constants/presets'
import { CurrencyInput } from './CurrencyInput'
import { PaymentSlider } from './PaymentSlider'
import { PresetSelector } from './PresetSelector'

interface LoanInputFormProps {
  inputs: LoanInput
  errors: Record<string, string>
  onUpdate: (field: keyof LoanInput, value: number | null) => void
  onLoadPreset: (preset: LoanPreset) => void
}

export function LoanInputForm({ inputs, errors, onUpdate, onLoadPreset }: LoanInputFormProps): React.JSX.Element {
  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-stone-200 dark:border-stone-700 p-4 sm:p-6 space-y-4">
      <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">Loan Details</h2>
      <PresetSelector onSelect={onLoadPreset} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <CurrencyInput id="principal" label="Remaining Principal" value={inputs.principal} onChange={(v) => onUpdate('principal', v)} required />
          {errors.principal && <p id="error-principal" className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.principal}</p>}
        </div>
        <div>
          <label htmlFor="rate" className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1">
            Annual Interest Rate<span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <input id="rate" type="number" step="0.1" min={0} max={50} value={inputs.annualRate} onChange={(e) => onUpdate('annualRate', Number(e.target.value))} className="w-full pr-8 pl-3 py-3 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-indigo-500 min-h-[48px]" aria-required aria-describedby={errors.annualRate ? 'error-rate' : undefined} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 text-sm">%</span>
          </div>
          {errors.annualRate && <p id="error-rate" className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.annualRate}</p>}
        </div>
        <div>
          <CurrencyInput id="emi" label="Current EMI (optional)" value={inputs.emi} onChange={(v) => onUpdate('emi', v)} placeholder="Auto-calculated" />
          <p className="text-stone-400 dark:text-stone-500 text-xs mt-0.5">Equated Monthly Installment — your fixed monthly payment</p>
        </div>
        <div>
          <label htmlFor="tenure" className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1">Remaining Months (optional)</label>
          <input id="tenure" type="number" value={inputs.tenureMonths ?? ''} onChange={(e) => onUpdate('tenureMonths', e.target.value === '' ? null : Number(e.target.value))} placeholder="Auto-calculated" className="w-full px-3 py-3 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-indigo-500 min-h-[48px]" />
          <p className="text-stone-400 dark:text-stone-500 text-xs mt-0.5">Number of months left on your loan term</p>
        </div>
      </div>
      <PaymentSlider value={inputs.extraMonthly} onChange={(v) => onUpdate('extraMonthly', v)} />
    </div>
  )
}
