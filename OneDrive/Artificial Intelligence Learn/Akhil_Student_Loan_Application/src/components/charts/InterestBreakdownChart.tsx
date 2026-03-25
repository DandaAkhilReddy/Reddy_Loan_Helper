import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { AmortizationEntry } from '../../types/loan'
import { transformToChartData } from '../../lib/chart-transforms'
import { useCurrency } from '../../hooks/useCurrency'

interface InterestBreakdownChartProps {
  originalSchedule: AmortizationEntry[]
  acceleratedSchedule: AmortizationEntry[]
}

/**
 * Stacked area chart showing cumulative interest vs cumulative principal paid
 * over the life of the original loan schedule.
 */
export function InterestBreakdownChart({
  originalSchedule,
  acceleratedSchedule,
}: InterestBreakdownChartProps): React.JSX.Element {
  const { formatCompact } = useCurrency()

  const data = useMemo(
    () => transformToChartData(originalSchedule, acceleratedSchedule),
    [originalSchedule, acceleratedSchedule],
  )

  if (data.length === 0) {
    return <div className="text-stone-400 text-center py-8">No data to display</div>
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <h3 className="text-sm font-semibold text-stone-700 mb-4">Interest vs Principal Paid</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(v: number) => formatCompact(v)}
            tick={{ fontSize: 11 }}
            width={60}
          />
          <Tooltip formatter={(value) => formatCompact(Number(value))} />
          <Legend />
          <Area
            type="monotone"
            dataKey="cumulativeInterestOriginal"
            name="Interest"
            stackId="1"
            stroke="#ef4444"
            fill="#ef444433"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="cumulativePrincipalOriginal"
            name="Principal"
            stackId="1"
            stroke="#3b82f6"
            fill="#3b82f633"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
