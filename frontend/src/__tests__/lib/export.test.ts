import { scheduleToCSV, downloadCSV, getExportFilename } from '../../lib/export'
import type { AmortizationEntry } from '../../types/loan'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseEntry: AmortizationEntry = {
  month: 1,
  openingBalance: 100000,
  interest: 1125,
  principalPaid: 999,
  extraPayment: 500,
  closingBalance: 98501,
  cumulativeInterest: 1125,
}

const finalEntry: AmortizationEntry = {
  month: 120,
  openingBalance: 2000,
  interest: 22,
  principalPaid: 1978,
  extraPayment: 22,
  closingBalance: 0,
  cumulativeInterest: 100000,
}

const twoRowSchedule: AmortizationEntry[] = [baseEntry, finalEntry]

// ---------------------------------------------------------------------------
// scheduleToCSV
// ---------------------------------------------------------------------------

describe('scheduleToCSV', () => {
  it('generates correct header row', () => {
    const csv = scheduleToCSV([baseEntry], 2124)
    const header = csv.split('\n')[0]
    expect(header).toBe('Month,Opening Balance,EMI,Interest,Principal,Extra Payment,Closing Balance')
  })

  it('generates correct data row for a mid-schedule entry', () => {
    const effectiveEmi = 2124
    const csv = scheduleToCSV([baseEntry], effectiveEmi)
    const dataRow = csv.split('\n')[1]
    // emiDisplay = min(2124, 100000 + 1125) = 2124
    expect(dataRow).toBe('1,100000,2124,1125,999,500,98501')
  })

  it('generates correct data rows for a two-row schedule', () => {
    const csv = scheduleToCSV(twoRowSchedule, 2124)
    const lines = csv.split('\n')
    expect(lines).toHaveLength(3) // header + 2 data rows
  })

  it('handles empty schedule — returns header only', () => {
    const csv = scheduleToCSV([], 2124)
    const lines = csv.split('\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toBe('Month,Opening Balance,EMI,Interest,Principal,Extra Payment,Closing Balance')
  })

  it('caps EMI at openingBalance + interest for the final month', () => {
    // finalEntry: openingBalance=2000, interest=22 → cap = 2022, effectiveEmi=2124 → display=2022
    const csv = scheduleToCSV([finalEntry], 2124)
    const dataRow = csv.split('\n')[1]
    expect(dataRow).toBe('120,2000,2022,22,1978,22,0')
  })

  it('uses full EMI when it is less than openingBalance + interest', () => {
    const lowEmiEntry: AmortizationEntry = { ...baseEntry, openingBalance: 200000, interest: 5000 }
    // min(500, 200000 + 5000) = 500
    const csv = scheduleToCSV([lowEmiEntry], 500)
    const dataRow = csv.split('\n')[1]
    expect(dataRow.split(',')[2]).toBe('500')
  })
})

// ---------------------------------------------------------------------------
// getExportFilename
// ---------------------------------------------------------------------------

describe('getExportFilename', () => {
  it('includes the currency code lowercased', () => {
    expect(getExportFilename('INR')).toContain('inr')
    expect(getExportFilename('USD')).toContain('usd')
  })

  it('includes today\'s date in YYYY-MM-DD format', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(getExportFilename('INR')).toContain(today)
    expect(getExportFilename('USD')).toContain(today)
  })

  it('ends with .csv extension', () => {
    expect(getExportFilename('INR')).toMatch(/\.csv$/)
  })

  it('matches expected filename pattern for INR', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(getExportFilename('INR')).toBe(`loan-schedule-inr-${today}.csv`)
  })

  it('matches expected filename pattern for USD', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(getExportFilename('USD')).toBe(`loan-schedule-usd-${today}.csv`)
  })
})

// ---------------------------------------------------------------------------
// downloadCSV
// ---------------------------------------------------------------------------

describe('downloadCSV', () => {
  it('creates an anchor element and triggers a click', () => {
    const mockClick = vi.fn()
    const mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
    const mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    const mockRevokeObjectURL = vi.fn()

    const mockAnchor = {
      href: '',
      download: '',
      style: { display: '' },
      click: mockClick,
    }
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement)

    global.URL.createObjectURL = mockCreateObjectURL
    global.URL.revokeObjectURL = mockRevokeObjectURL

    downloadCSV('a,b\n1,2', 'test.csv')

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(mockAnchor.download).toBe('test.csv')
    expect(mockAnchor.href).toBe('blob:mock-url')
    expect(mockAnchor.style.display).toBe('none')
    expect(mockAppendChild).toHaveBeenCalled()
    expect(mockClick).toHaveBeenCalled()
    expect(mockRemoveChild).toHaveBeenCalled()
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')

    createElementSpy.mockRestore()
    mockAppendChild.mockRestore()
    mockRemoveChild.mockRestore()
  })

  it('passes CSV content in a Blob with correct MIME type', () => {
    const capturedBlobs: Blob[] = []
    const originalCreateObjectURL = URL.createObjectURL
    global.URL.createObjectURL = (blob: Blob) => {
      capturedBlobs.push(blob)
      return 'blob:test'
    }

    const mockAnchor = { href: '', download: '', style: { display: '' }, click: vi.fn() }
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement)
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)
    global.URL.revokeObjectURL = vi.fn()

    downloadCSV('col1,col2\nval1,val2', 'export.csv')

    expect(capturedBlobs).toHaveLength(1)
    expect(capturedBlobs[0].type).toBe('text/csv;charset=utf-8;')

    createElementSpy.mockRestore()
    global.URL.createObjectURL = originalCreateObjectURL
  })
})
