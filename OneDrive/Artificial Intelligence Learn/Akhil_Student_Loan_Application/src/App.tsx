import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { LoanInputForm } from './components/form/LoanInputForm'
import { SummaryCards } from './components/results/SummaryCards'
import { PayoffTimeline } from './components/results/PayoffTimeline'
import { BalanceChart } from './components/charts/BalanceChart'
import { InterestBreakdownChart } from './components/charts/InterestBreakdownChart'
import { useLoanCalculator } from './hooks/useLoanCalculator'

function App(): React.JSX.Element {
  const { inputs, errors, results, updateInput } = useLoanCalculator()

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <LoanInputForm inputs={inputs} errors={errors} onUpdate={updateInput} />

        {results && (
          <>
            <PayoffTimeline comparison={results.comparison} />
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
          </>
        )}

        {!results && (
          <div className="text-center text-stone-400 py-12">
            Enter loan details above to see your payoff analysis
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default App
