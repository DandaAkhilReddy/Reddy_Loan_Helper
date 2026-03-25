import { Clock, TrendingDown, Calendar, Wallet } from 'lucide-react'
import type { ComparisonResult } from '../../types/loan'
import { useCurrency } from '../../hooks/useCurrency'
import { formatMonths } from '../../lib/format'

interface SummaryCardsProps {
  comparison: ComparisonResult | null
}

/**
 * Displays a 4-card summary grid of key loan comparison metrics.
 * Shows a placeholder when no comparison data is available.
 */
export function SummaryCards({ comparison }: SummaryCardsProps): React.JSX.Element {
  const { format } = useCurrency()

  if (!comparison) {
    return <div className="text-stone-400 text-center py-8">Enter loan details to see results</div>
  }

  const cards = [
    { title: 'New Payoff Time', value: formatMonths(comparison.newMonths), icon: Clock, highlight: false },
    { title: 'Interest Saved', value: format(comparison.interestSaved), icon: TrendingDown, highlight: true },
    { title: 'Months Saved', value: `${comparison.monthsSaved}`, icon: Calendar, highlight: comparison.monthsSaved > 0 },
    { title: 'Total Interest', value: format(comparison.newTotalInterest), icon: Wallet, highlight: false },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`rounded-xl border p-3 sm:p-4 ${card.highlight ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-stone-200'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <card.icon className={`w-4 h-4 ${card.highlight ? 'text-emerald-600' : 'text-stone-400'}`} />
            <span className="text-xs font-medium text-stone-500">{card.title}</span>
          </div>
          <p className={`text-lg sm:text-xl font-bold tabular-nums ${card.highlight ? 'text-emerald-700' : 'text-stone-800'}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
