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

  const data = useMemo(
    () => transformToChartData(originalSchedule, acceleratedSchedule),
    [originalSchedule, acceleratedSchedule],
  )

  const payoffMonth = acceleratedSchedule.length

  if (data.length === 0) {
    return <div className="text-stone-400 text-center py-8">No data to display</div>
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <h3 className="text-sm font-semibold text-stone-700 mb-4">Balance Over Time</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradOriginal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradAccelerated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(v: number) => formatCompact(v)}
            tick={{ fontSize: 11 }}
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
            stroke="#6366f1"
            fill="url(#gradOriginal)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="balanceAccelerated"
            name="With Extra"
            stroke="#10b981"
            fill="url(#gradAccelerated)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
