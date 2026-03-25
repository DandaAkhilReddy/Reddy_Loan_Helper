import { useState } from 'react'
import { Calculator, LogIn } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function LoginPage(): React.JSX.Element {
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter your name')
      return
    }
    if (trimmed.length > 50) {
      setError('Name must be 50 characters or less')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      await login(trimmed)
    } catch {
      setError('Could not connect to server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            Reddy Loan Helper
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            Loan payment estimator
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6 space-y-4 animate-scale-in">
          <div>
            <label htmlFor="login-name" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Enter your name to continue
            </label>
            <input
              id="login-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder="e.g. Mom"
              autoFocus
              autoComplete="name"
              maxLength={50}
              className="w-full px-3 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              aria-required="true"
              aria-invalid={!!error}
              aria-describedby={error ? 'login-error' : undefined}
            />
            {error && (
              <p id="login-error" className="text-red-600 dark:text-red-400 text-sm mt-1" role="alert">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <LogIn className="w-4 h-4" />
            {isSubmitting ? 'Signing in...' : 'Continue'}
          </button>

          <p className="text-xs text-stone-400 dark:text-stone-500 text-center">
            No password needed. Your calculations are saved by name.
          </p>
        </form>
      </div>
    </div>
  )
}
