import { Calculator } from 'lucide-react'
import { CurrencyToggle } from './CurrencyToggle'
import { DarkModeToggle } from './DarkModeToggle'

export function Header(): React.JSX.Element {
  return (
    <header className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-4 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-6 h-6" />
          <div>
            <h1 className="text-lg sm:text-xl font-bold leading-tight">Reddy Loan Helper</h1>
            <p className="text-xs sm:text-sm text-indigo-200">Student Loan Payoff Estimator</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CurrencyToggle />
          <DarkModeToggle />
        </div>
      </div>
    </header>
  )
}
