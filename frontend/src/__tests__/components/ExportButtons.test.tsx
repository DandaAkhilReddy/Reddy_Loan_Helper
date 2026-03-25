import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { CurrencyProvider } from '../../hooks/useCurrency'
import { DarkModeProvider } from '../../hooks/useDarkMode'
import { ExportButtons } from '../../components/ExportButtons'
import * as exportLib from '../../lib/export'
import type { AmortizationEntry } from '../../types/loan'

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: ReactNode }): ReactNode {
  return createElement(DarkModeProvider, null, createElement(CurrencyProvider, null, children))
}

function renderWithProviders(ui: React.JSX.Element): ReturnType<typeof render> {
  return render(ui, { wrapper })
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleSchedule: AmortizationEntry[] = [
  {
    month: 1,
    openingBalance: 100000,
    interest: 1125,
    principalPaid: 999,
    extraPayment: 500,
    closingBalance: 98376,
    cumulativeInterest: 1125,
  },
]

const EFFECTIVE_EMI = 2124

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExportButtons', () => {
  it('renders Download CSV and Print / PDF buttons', () => {
    renderWithProviders(<ExportButtons schedule={sampleSchedule} effectiveEmi={EFFECTIVE_EMI} />)
    expect(screen.getByRole('button', { name: /Download CSV/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Print \/ PDF/ })).toBeInTheDocument()
  })

  it('CSV button triggers scheduleToCSV and downloadCSV', () => {
    const csvSpy = vi.spyOn(exportLib, 'scheduleToCSV').mockReturnValue('mock,csv')
    const downloadSpy = vi.spyOn(exportLib, 'downloadCSV').mockImplementation(() => undefined)
    vi.spyOn(exportLib, 'getExportFilename').mockReturnValue('loan-schedule-inr-2026-03-25.csv')

    renderWithProviders(<ExportButtons schedule={sampleSchedule} effectiveEmi={EFFECTIVE_EMI} />)
    fireEvent.click(screen.getByRole('button', { name: /Download CSV/ }))

    expect(csvSpy).toHaveBeenCalledWith(sampleSchedule, EFFECTIVE_EMI)
    expect(downloadSpy).toHaveBeenCalledWith('mock,csv', 'loan-schedule-inr-2026-03-25.csv')

    csvSpy.mockRestore()
    downloadSpy.mockRestore()
  })

  it('Print button calls window.print', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    renderWithProviders(<ExportButtons schedule={sampleSchedule} effectiveEmi={EFFECTIVE_EMI} />)
    fireEvent.click(screen.getByRole('button', { name: /Print \/ PDF/ }))
    expect(printSpy).toHaveBeenCalledTimes(1)
    printSpy.mockRestore()
  })

  it('Download CSV button has a Download icon (svg child)', () => {
    renderWithProviders(<ExportButtons schedule={sampleSchedule} effectiveEmi={EFFECTIVE_EMI} />)
    const csvBtn = screen.getByRole('button', { name: /Download CSV/ })
    expect(csvBtn.querySelector('svg')).toBeInTheDocument()
  })

  it('Print button has a Printer icon (svg child)', () => {
    renderWithProviders(<ExportButtons schedule={sampleSchedule} effectiveEmi={EFFECTIVE_EMI} />)
    const printBtn = screen.getByRole('button', { name: /Print \/ PDF/ })
    expect(printBtn.querySelector('svg')).toBeInTheDocument()
  })

  it('container div has no-print class', () => {
    const { container } = renderWithProviders(
      <ExportButtons schedule={sampleSchedule} effectiveEmi={EFFECTIVE_EMI} />
    )
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain('no-print')
  })
})
