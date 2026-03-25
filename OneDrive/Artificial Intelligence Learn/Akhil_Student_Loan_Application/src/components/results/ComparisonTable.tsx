import { useMemo } from 'react'
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

/**
 * Renders a comparison table showing loan payoff metrics for multiple
 * extra-payment scenarios side-by-side.
 *
 * The currently active extra-payment row is highlighted and labelled "current".
 */
export function ComparisonTable({ principal, annualRate, emi, currentExtra }: ComparisonTableProps): React.JSX.Element {
  const { format, formatCompact } = useCurrency()

  const extraAmounts = useMemo(() => getExtraAmounts(currentExtra, emi), [currentExtra, emi])

  const scenarios: ScenarioComparison[] = useMemo(
    () => compareMultipleScenarios(principal, annualRate, emi, extraAmounts),
    [principal, annualRate, emi, extraAmounts],
  )

  if (scenarios.length === 0) return <></>

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
      <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-4">Compare Extra Payment Scenarios</h3>
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
              return (
                <tr
                  key={scenario.extraAmount}
                  className={`border-b border-stone-100 dark:border-stone-700/50 ${
                    isCurrent ? 'bg-indigo-50 dark:bg-indigo-900/20 font-medium' : ''
                  }`}
                >
                  <td className="py-1.5 pr-2 text-stone-700 dark:text-stone-200">
                    {format(scenario.extraAmount)}
                    {isCurrent && <span className="ml-1 text-indigo-600 dark:text-indigo-400 text-[10px]">current</span>}
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
