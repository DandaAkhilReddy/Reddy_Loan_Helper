import { useEffect, useRef } from 'react'
import { FileSearch, Loader2 } from 'lucide-react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { LoginPage } from './components/LoginPage'
import { LoanInputForm } from './components/form/LoanInputForm'
import { SummaryCards } from './components/results/SummaryCards'
import { PayoffTimeline } from './components/results/PayoffTimeline'
import { BalanceChart } from './components/charts/BalanceChart'
import { InterestBreakdownChart } from './components/charts/InterestBreakdownChart'
import { ComparisonTable } from './components/results/ComparisonTable'
import { AmortizationTable } from './components/tables/AmortizationTable'
import { ExportButtons } from './components/ExportButtons'
import { ProgressBar } from './components/ui/ProgressBar'
import { useLoanCalculator } from './hooks/useLoanCalculator'
import { useAuth } from './hooks/useAuth'
import { apiGetLoanData, apiPutLoanData } from './lib/api'
import type { ServerLoanData } from './lib/api'

function App(): React.JSX.Element {
  const { user, isLoading } = useAuth()
  const { inputs, errors, results, updateInput, loadPreset } = useLoanCalculator()
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevUserRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user) {
      prevUserRef.current = null
      return
    }
    if (prevUserRef.current === user.id) return
    prevUserRef.current = user.id

    void apiGetLoanData().then((data) => {
      if (!data) return
      loadPreset({
        principal: data.principal,
        annualRate: data.annual_rate,
        emi: data.emi,
        tenureMonths: data.tenure_months,
        extraMonthly: data.extra_monthly,
      })
    }).catch(() => {})
  }, [user, loadPreset])

  useEffect(() => {
    if (!user) return
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    syncTimeoutRef.current = setTimeout(() => {
      const payload: ServerLoanData = {
        principal: inputs.principal,
        annual_rate: inputs.annualRate,
        emi: inputs.emi,
        tenure_months: inputs.tenureMonths,
        extra_monthly: inputs.extraMonthly,
        currency: 'INR',
      }
      void apiPutLoanData(payload).catch(() => {})
    }, 500)
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clearTimeout(syncTimeoutRef.current as any)
    }
  }, [user, inputs])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" aria-label="Loading" />
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Header />
      <main id="main-content" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <LoanInputForm inputs={inputs} errors={errors} onUpdate={updateInput} onLoadPreset={(preset) => loadPreset(preset.inputs)} />

        {results && (
          <section className="space-y-6 animate-fade-in-up" aria-live="polite">
            <PayoffTimeline comparison={results.comparison} />
            <ProgressBar originalMonths={results.comparison.originalMonths} newMonths={results.comparison.newMonths} />
            <SummaryCards comparison={results.comparison} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BalanceChart
                originalSchedule={results.originalSchedule}
                acceleratedSchedule={results.acceleratedSchedule}
              />
              <InterestBreakdownChart
                originalSchedule={results.originalSchedule}
                acceleratedSchedule={results.acceleratedSchedule}
              />
            </div>
            <AmortizationTable
              originalSchedule={results.originalSchedule}
              acceleratedSchedule={results.acceleratedSchedule}
              effectiveEmi={results.effectiveEmi}
            />
            <ExportButtons schedule={results.acceleratedSchedule} effectiveEmi={results.effectiveEmi} />
            <ComparisonTable
              principal={inputs.principal}
              annualRate={inputs.annualRate}
              emi={results.effectiveEmi}
              currentExtra={inputs.extraMonthly}
            />
          </section>
        )}

        {!results && (
          <div className="text-center py-12">
            <FileSearch className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <p className="text-stone-400 dark:text-stone-500">Enter loan details above to see your payoff analysis</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default App
