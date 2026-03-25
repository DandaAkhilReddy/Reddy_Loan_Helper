import type { ComparisonResult } from '../../types/loan'
import { useCurrency } from '../../hooks/useCurrency'
import { formatMonths } from '../../lib/format'

interface PayoffTimelineProps {
  comparison: ComparisonResult | null
}

/**
 * Renders a highlighted banner summarising the payoff acceleration benefit.
 * Returns an empty fragment when there is no comparison data or no months saved.
 */
export function PayoffTimeline({ comparison }: PayoffTimelineProps): React.JSX.Element {
  const { format } = useCurrency()

  if (!comparison || comparison.monthsSaved <= 0) return <></>

  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4 text-center">
      <p className="text-emerald-800 dark:text-emerald-300 font-medium">
        Debt-free in{' '}
        <span className="font-bold">{formatMonths(comparison.newMonths)}</span> instead of{' '}
        {formatMonths(comparison.originalMonths)}, saving{' '}
        <span className="font-bold text-emerald-700 dark:text-emerald-400">{format(comparison.interestSaved)}</span> in
        interest!
      </p>
    </div>
  )
}
