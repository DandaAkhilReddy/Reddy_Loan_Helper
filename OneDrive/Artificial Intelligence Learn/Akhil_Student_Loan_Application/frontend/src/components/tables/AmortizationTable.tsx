import { useState } from 'react'
import type { AmortizationEntry } from '../../types/loan'
import { useCurrency } from '../../hooks/useCurrency'

interface AmortizationTableProps {
  originalSchedule: AmortizationEntry[]
  acceleratedSchedule: AmortizationEntry[]
  effectiveEmi: number
}

const INITIAL_ROWS = 24

export function AmortizationTable({ originalSchedule, acceleratedSchedule, effectiveEmi }: AmortizationTableProps): React.JSX.Element {
  const { format } = useCurrency()
  const [activeTab, setActiveTab] = useState<'original' | 'accelerated'>('accelerated')
  const [expanded, setExpanded] = useState(false)

  const schedule = activeTab === 'original' ? originalSchedule : acceleratedSchedule
  const visibleRows = expanded ? schedule : schedule.slice(0, INITIAL_ROWS)
  const hasMore = schedule.length > INITIAL_ROWS

  if (schedule.length === 0) {
    return <div className="text-stone-400 dark:text-stone-500 text-center py-8">No schedule data</div>
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200">Amortization Schedule</h3>
        <div className="flex rounded-lg overflow-hidden border border-stone-300 dark:border-stone-600">
          <button
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === 'original'
                ? 'bg-indigo-600 text-white'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
            }`}
            onClick={() => setActiveTab('original')}
          >
            Original
          </button>
          <button
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === 'accelerated'
                ? 'bg-indigo-600 text-white'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
            }`}
            onClick={() => setActiveTab('accelerated')}
          >
            With Extra
          </button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-xs tabular-nums">
          <thead>
            <tr className="border-b border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400">
              <th className="text-left py-2 pr-2 sticky left-0 bg-white dark:bg-stone-800">Mo</th>
              <th className="text-right py-2 px-2">Opening</th>
              <th className="text-right py-2 px-2">EMI</th>
              <th className="text-right py-2 px-2">Interest</th>
              <th className="text-right py-2 px-2">Principal</th>
              {activeTab === 'accelerated' && <th className="text-right py-2 px-2">Extra</th>}
              <th className="text-right py-2 pl-2">Closing</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const isPayoff = row.closingBalance === 0
              const emiDisplay = Math.min(effectiveEmi, row.openingBalance + row.interest)
              return (
                <tr
                  key={row.month}
                  className={`border-b border-stone-100 dark:border-stone-700/50 ${
                    isPayoff ? 'bg-emerald-50 dark:bg-emerald-900/30 font-medium' : ''
                  }`}
                >
                  <td className="py-1.5 pr-2 text-stone-600 dark:text-stone-300 sticky left-0 bg-inherit">{row.month}</td>
                  <td className="py-1.5 px-2 text-right text-stone-700 dark:text-stone-200">{format(row.openingBalance)}</td>
                  <td className="py-1.5 px-2 text-right text-stone-700 dark:text-stone-200">{format(emiDisplay)}</td>
                  <td className="py-1.5 px-2 text-right text-red-600 dark:text-red-400">{format(row.interest)}</td>
                  <td className="py-1.5 px-2 text-right text-emerald-600 dark:text-emerald-400">{format(row.principalPaid)}</td>
                  {activeTab === 'accelerated' && (
                    <td className="py-1.5 px-2 text-right text-indigo-600 dark:text-indigo-400">{format(row.extraPayment)}</td>
                  )}
                  <td className="py-1.5 pl-2 text-right text-stone-700 dark:text-stone-200">{format(row.closingBalance)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
        >
          {expanded ? `Show Less (first ${INITIAL_ROWS})` : `Show All ${schedule.length} Months`}
        </button>
      )}
    </div>
  )
}
