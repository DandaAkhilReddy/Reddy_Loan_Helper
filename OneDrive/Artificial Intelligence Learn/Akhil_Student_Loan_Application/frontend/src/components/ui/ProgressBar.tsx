interface ProgressBarProps {
  originalMonths: number
  newMonths: number
}

export function ProgressBar({ originalMonths, newMonths }: ProgressBarProps): React.JSX.Element {
  if (originalMonths <= 0) return <></>

  const percentReduction = Math.round(((originalMonths - newMonths) / originalMonths) * 100)
  const clampedPercent = Math.max(0, Math.min(100, percentReduction))

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Time Saved</span>
        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{clampedPercent}%</span>
      </div>
      <div className="w-full h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
        <div
          role="progressbar"
          aria-valuenow={clampedPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${clampedPercent}% time saved`}
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  )
}
