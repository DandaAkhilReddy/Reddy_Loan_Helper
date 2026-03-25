import { Clock, TrendingDown, Calendar, Wallet } from 'lucide-react'
import type { ComparisonResult } from '../../types/loan'
import { useCurrency } from '../../hooks/useCurrency'
import { formatMonths } from '../../lib/format'
import { AnimatedNumber } from '../ui/AnimatedNumber'

interface SummaryCardsProps {
  comparison: ComparisonResult | null
}

/**
 * Displays a 4-card summary grid of key loan comparison metrics.
 * Shows a placeholder when no comparison data is available.
 * Numeric values animate on change via AnimatedNumber.
 */
export function SummaryCards({ comparison }: SummaryCardsProps): React.JSX.Element {
  const { format } = useCurrency()

  if (!comparison) {
    return <div className="text-stone-400 dark:text-stone-500 text-center py-8">Enter loan details to see results</div>
  }

  const cards = [
    { title: 'New Payoff Time', value: formatMonths(comparison.newMonths), rawValue: undefined as number | undefined, formatter: undefined as ((n: number) => string) | undefined, icon: Clock, highlight: false },
    { title: 'Interest Saved', value: null, rawValue: comparison.interestSaved, formatter: format, icon: TrendingDown, highlight: true },
    { title: 'Months Saved', value: null, rawValue: comparison.monthsSaved, formatter: (n: number) => String(Math.round(n)), icon: Calendar, highlight: comparison.monthsSaved > 0 },
    { title: 'Total Interest', value: null, rawValue: comparison.newTotalInterest, formatter: format, icon: Wallet, highlight: false },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className={`rounded-xl border p-3 sm:p-4 hover:shadow-md transition-shadow duration-200 animate-fade-in-up ${card.highlight ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700' : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'}`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <card.icon className={`w-4 h-4 ${card.highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400 dark:text-stone-500'}`} />
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">{card.title}</span>
          </div>
          <p className={`text-lg sm:text-xl font-bold tabular-nums ${card.highlight ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-800 dark:text-stone-100'}`}>
            {card.rawValue !== undefined && card.formatter
              ? <AnimatedNumber value={card.rawValue} formatter={card.formatter} />
              : card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
