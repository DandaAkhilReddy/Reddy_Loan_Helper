import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useCurrency } from '../../hooks/useCurrency'
import { compareMultipleScenarios, getExtraAmounts } from '../../lib/comparison'
import { formatMonths } from '../../lib/format'
import type { ScenarioComparison } from '../../lib/comparison'

interface ComparisonTableProps {
  principal: number
  annualRate: number
  emi: number
  currentExtra: number
}

const MAX_CUSTOM = 3

/**
 * Renders a comparison table showing loan payoff metrics for multiple
 * extra-payment scenarios side-by-side.
 *
 * Users can add up to 3 custom amounts to compare alongside auto-generated ones.
 * The currently active extra-payment row is highlighted and labelled "current".
 */
export function ComparisonTable({ principal, annualRate, emi, currentExtra }: ComparisonTableProps): React.JSX.Element {
  const { format, formatCompact, config } = useCurrency()
  const [customAmounts, setCustomAmounts] = useState<(number | null)[]>([])

  const validCustom = customAmounts.filter((a): a is number => a !== null && a > 0)

  const extraAmounts = useMemo(
    () => getExtraAmounts(currentExtra, emi, validCustom),
    [currentExtra, emi, validCustom],
  )

  const customSet = new Set(validCustom)

  const scenarios: ScenarioComparison[] = useMemo(
    () => compareMultipleScenarios(principal, annualRate, emi, extraAmounts),
    [principal, annualRate, emi, extraAmounts],
  )

  const addSlot = (): void => {
    if (customAmounts.length < MAX_CUSTOM) {
      setCustomAmounts(prev => [...prev, null])
    }
  }

  const updateSlot = (index: number, value: number | null): void => {
    setCustomAmounts(prev => prev.map((v, i) => i === index ? value : v))
  }

  const removeSlot = (index: number): void => {
    setCustomAmounts(prev => prev.filter((_, i) => i !== index))
  }

  if (scenarios.length === 0) return <></>

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
      <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-3">Compare Extra Payment Scenarios</h3>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-stone-500 dark:text-stone-400">Compare with:</span>
        {customAmounts.map((amount, index) => (
          <div key={index} className="flex items-center gap-1">
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 text-xs">
                {config.symbol}
              </span>
              <input
                type="number"
                min={0}
                step={config.sliderStep}
                value={amount ?? ''}
                onChange={(e) => updateSlot(index, e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-24 pl-6 pr-2 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 tabular-nums"
                aria-label={`Custom comparison amount ${index + 1}`}
              />
            </div>
            <button
              onClick={() => removeSlot(index)}
              className="p-0.5 rounded text-stone-400 hover:text-red-500 dark:text-stone-500 dark:hover:text-red-400 transition-colors"
              aria-label="Remove amount"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {customAmounts.length < MAX_CUSTOM && (
          <button
            onClick={addSlot}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            aria-label="Add custom amount to compare"
          >
            <Plus className="w-3.5 h-3.5" />
            Add amount
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs tabular-nums">
          <thead>
            <tr className="border-b border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400">
              <th className="text-left py-2 pr-2">Extra/month</th>
              <th className="text-right py-2 px-2">Payoff Time</th>
              <th className="text-right py-2 px-2">Total Interest</th>
              <th className="text-right py-2 px-2">Interest Saved</th>
              <th className="text-right py-2 pl-2">Months Saved</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((scenario) => {
              const isCurrent = scenario.extraAmount === currentExtra
              const isCustom = customSet.has(scenario.extraAmount) && !isCurrent
              return (
                <tr
                  key={scenario.extraAmount}
                  className={`border-b border-stone-100 dark:border-stone-700/50 ${
                    isCurrent
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 font-medium'
                      : isCustom
                        ? 'bg-amber-50/50 dark:bg-amber-900/10'
                        : ''
                  }`}
                >
                  <td className="py-1.5 pr-2 text-stone-700 dark:text-stone-200">
                    {format(scenario.extraAmount)}
                    {isCurrent && <span className="ml-1 text-indigo-600 dark:text-indigo-400 text-[10px]">current</span>}
                    {isCustom && <span className="ml-1 text-amber-600 dark:text-amber-400 text-[10px]">custom</span>}
                  </td>
                  <td className="py-1.5 px-2 text-right text-stone-700 dark:text-stone-200">{formatMonths(scenario.payoffMonths)}</td>
                  <td className="py-1.5 px-2 text-right text-stone-700 dark:text-stone-200">{formatCompact(scenario.totalInterest)}</td>
                  <td className="py-1.5 px-2 text-right text-emerald-600 dark:text-emerald-400">{scenario.interestSaved > 0 ? format(scenario.interestSaved) : '—'}</td>
                  <td className="py-1.5 pl-2 text-right text-emerald-600 dark:text-emerald-400">{scenario.monthsSaved > 0 ? String(scenario.monthsSaved) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
