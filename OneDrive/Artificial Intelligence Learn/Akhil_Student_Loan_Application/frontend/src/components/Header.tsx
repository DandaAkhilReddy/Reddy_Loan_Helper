import { Calculator, LogOut, User } from 'lucide-react'
import { CurrencyToggle } from './CurrencyToggle'
import { DarkModeToggle } from './DarkModeToggle'
import { useAuth } from '../hooks/useAuth'

export function Header(): React.JSX.Element {
  const { user, logout } = useAuth()

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
        <div className="flex items-center gap-2 sm:gap-3">
          <CurrencyToggle />
          <DarkModeToggle />
          {user && (
            <div className="flex items-center gap-2 ml-1 pl-2 sm:pl-3 border-l border-indigo-400/40">
              <User className="w-4 h-4 text-indigo-200" />
              <span className="text-sm text-indigo-100 hidden sm:inline capitalize">{user.name}</span>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg hover:bg-indigo-500/30 transition-colors"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
