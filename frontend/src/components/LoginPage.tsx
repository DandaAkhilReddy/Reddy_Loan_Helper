import { useState } from 'react'
import type { FormEvent } from 'react'
import { Calculator, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

/**
 * Login page shown when no authenticated user is present.
 */
export function LoginPage(): React.JSX.Element {
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setIsSubmitting(true)
    setError(null)
    try {
      await login(trimmed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-stone-800 rounded-2xl shadow-lg p-8 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="bg-indigo-600 text-white rounded-full p-3">
            <Calculator className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">Reddy Loan Helper</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
            Enter your name to get started
          </p>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-4">
          <div>
            <label htmlFor="login-name" className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1">
              Your name
            </label>
            <input
              id="login-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Akhil"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              autoFocus
              autoComplete="name"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting…</span>
              </>
            ) : (
              'Start'
            )}
          </button>
        </form>

        {isSubmitting && (
          <p className="text-xs text-stone-400 dark:text-stone-500 text-center">
            First start may take up to 30 seconds
          </p>
        )}
      </div>
    </div>
  )
}
