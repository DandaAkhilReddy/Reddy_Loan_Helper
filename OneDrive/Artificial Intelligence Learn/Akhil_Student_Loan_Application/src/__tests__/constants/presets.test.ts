import { LOAN_PRESETS } from '../../constants/presets'
import type { LoanPreset } from '../../constants/presets'

describe('LOAN_PRESETS', () => {
  it('has exactly 4 presets', () => {
    expect(LOAN_PRESETS).toHaveLength(4)
  })

  it('each preset has required fields', () => {
    for (const preset of LOAN_PRESETS) {
      expect(typeof preset.id).toBe('string')
      expect(preset.id.length).toBeGreaterThan(0)
      expect(typeof preset.label).toBe('string')
      expect(preset.label.length).toBeGreaterThan(0)
      expect(typeof preset.description).toBe('string')
      expect(preset.description.length).toBeGreaterThan(0)
      expect(['INR', 'USD']).toContain(preset.currency)
      expect(preset.inputs).toBeDefined()
      expect(typeof preset.inputs.principal).toBe('number')
      expect(typeof preset.inputs.annualRate).toBe('number')
      expect(typeof preset.inputs.extraMonthly).toBe('number')
    }
  })

  it('first preset is akhil-student with INR currency', () => {
    const first = LOAN_PRESETS[0]
    expect(first.id).toBe('akhil-student')
    expect(first.currency).toBe('INR')
    expect(first.inputs.principal).toBe(2563163)
    expect(first.inputs.annualRate).toBe(13.5)
    expect(first.inputs.emi).toBe(51476)
  })

  it('indian-education preset has INR currency', () => {
    const preset = LOAN_PRESETS.find(p => p.id === 'indian-education')
    expect(preset).toBeDefined()
    expect((preset as LoanPreset).currency).toBe('INR')
    expect((preset as LoanPreset).inputs.principal).toBe(1000000)
  })

  it('us-student preset has USD currency', () => {
    const preset = LOAN_PRESETS.find(p => p.id === 'us-student')
    expect(preset).toBeDefined()
    expect((preset as LoanPreset).currency).toBe('USD')
    expect((preset as LoanPreset).inputs.principal).toBe(30000)
  })

  it('custom preset has id "custom" and zero principal', () => {
    const preset = LOAN_PRESETS.find(p => p.id === 'custom')
    expect(preset).toBeDefined()
    expect((preset as LoanPreset).inputs.principal).toBe(0)
    expect((preset as LoanPreset).inputs.annualRate).toBe(0)
  })

  it('all preset ids are unique', () => {
    const ids = LOAN_PRESETS.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('currency field matches expected values per preset', () => {
    const currencyMap: Record<string, string> = {
      'akhil-student': 'INR',
      'indian-education': 'INR',
      'us-student': 'USD',
      'custom': 'INR',
    }
    for (const preset of LOAN_PRESETS) {
      expect(preset.currency).toBe(currencyMap[preset.id])
    }
  })
})
