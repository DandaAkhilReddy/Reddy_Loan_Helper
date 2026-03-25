import type { AmortizationEntry, Currency } from '../types/loan'

/**
 * Converts an amortization schedule to a CSV string.
 *
 * @param schedule - The amortization entries to serialize
 * @param effectiveEmi - The base EMI used to cap display values on the final row
 * @returns A CSV string with a header row followed by one row per entry
 */
export function scheduleToCSV(schedule: AmortizationEntry[], effectiveEmi: number): string {
  const headers = ['Month', 'Opening Balance', 'EMI', 'Interest', 'Principal', 'Extra Payment', 'Closing Balance']
  const rows = schedule.map(row => {
    const emiDisplay = Math.min(effectiveEmi, row.openingBalance + row.interest)
    return [row.month, row.openingBalance, emiDisplay, row.interest, row.principalPaid, row.extraPayment, row.closingBalance].join(',')
  })
  return [headers.join(','), ...rows].join('\n')
}

/**
 * Triggers a browser download for the given CSV content.
 *
 * @param content - The CSV string to download
 * @param filename - The suggested filename for the download
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Builds a filename for the exported loan schedule CSV.
 *
 * @param currency - The active currency code
 * @returns A filename in the format `loan-schedule-{currency}-{YYYY-MM-DD}.csv`
 */
export function getExportFilename(currency: Currency): string {
  const date = new Date().toISOString().split('T')[0]
  return `loan-schedule-${currency.toLowerCase()}-${date}.csv`
}
