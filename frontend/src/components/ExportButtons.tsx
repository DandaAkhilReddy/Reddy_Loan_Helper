import { Download, Printer } from 'lucide-react'
import type { AmortizationEntry } from '../types/loan'
import { scheduleToCSV, downloadCSV, getExportFilename } from '../lib/export'
import { useCurrency } from '../hooks/useCurrency'

interface ExportButtonsProps {
  schedule: AmortizationEntry[]
  effectiveEmi: number
}

/**
 * Renders CSV download and print/PDF export buttons for the amortization schedule.
 * Must be rendered inside a CurrencyProvider subtree.
 */
export function ExportButtons({ schedule, effectiveEmi }: ExportButtonsProps): React.JSX.Element {
  const { currency } = useCurrency()

  const handleCSVDownload = () => {
    const csv = scheduleToCSV(schedule, effectiveEmi)
    downloadCSV(csv, getExportFilename(currency))
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex gap-3 no-print">
      <button
        onClick={handleCSVDownload}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
      >
        <Download className="w-4 h-4" />
        Download CSV
      </button>
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
      >
        <Printer className="w-4 h-4" />
        Print / PDF
      </button>
    </div>
  )
}
