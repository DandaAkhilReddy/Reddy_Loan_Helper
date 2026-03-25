import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { AmortizationEntry } from '../../types/loan'
import { transformToChartData } from '../../lib/chart-transforms'
import { useCurrency } from '../../hooks/useCurrency'
import { useDarkMode } from '../../hooks/useDarkMode'

interface BalanceChartProps {
  originalSchedule: AmortizationEntry[]
  acceleratedSchedule: AmortizationEntry[]
}

/**
 * Area chart comparing outstanding balance over time for the original
 * vs accelerated repayment schedules.
 */
export function BalanceChart({
  originalSchedule,
  acceleratedSchedule,
}: BalanceChartProps): React.JSX.Element {
  const { formatCompact } = useCurrency()
  const { isDark } = useDarkMode()

  const originalColor = isDark ? '#818cf8' : '#6366f1'
  const acceleratedColor = isDark ? '#34d399' : '#10b981'
  const tickColor = isDark ? '#a8a29e' : '#44403c'

  const data = useMemo(
    () => transformToChartData(originalSchedule, acceleratedSchedule),
    [originalSchedule, acceleratedSchedule],
  )

  const payoffMonth = acceleratedSchedule.length

  if (data.length === 0) {
    return <div className="text-stone-400 dark:text-stone-500 text-center py-8">No data to display</div>
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-4">Balance Over Time</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradOriginal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={originalColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={originalColor} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradAccelerated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={acceleratedColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={acceleratedColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColor }} />
          <YAxis
            tickFormatter={(v: number) => formatCompact(v)}
            tick={{ fontSize: 11, fill: tickColor }}
            width={60}
          />
          <Tooltip formatter={(value) => formatCompact(Number(value))} />
          <Legend />
          {payoffMonth > 0 && payoffMonth < originalSchedule.length && (
            <ReferenceLine
              x={data[Math.min(payoffMonth - 1, data.length - 1)]?.label}
              stroke="#8b5cf6"
              strokeDasharray="5 5"
              label="Paid off"
            />
          )}
          <Area
            type="monotone"
            dataKey="balanceOriginal"
            name="Without Extra"
            stroke={originalColor}
            fill="url(#gradOriginal)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="balanceAccelerated"
            name="With Extra"
            stroke={acceleratedColor}
            fill="url(#gradAccelerated)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
