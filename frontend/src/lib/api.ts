const BASE_URL = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'reddy-loan-token'

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

function setToken(token: string): void {
  try { localStorage.setItem(TOKEN_KEY, token) } catch { /* ignore */ }
}

export function clearToken(): void {
  try { localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (response.status === 401) {
    clearToken()
    throw new Error('Unauthorized')
  }

  if (response.status === 204) return null as T

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error((body as { error?: { message?: string }; detail?: string })?.error?.message || (body as { detail?: string })?.detail || `Request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

/** Authenticated user shape returned from the server. */
export interface AuthUser { id: string; name: string }

interface LoginResponse { token: string; user: AuthUser }

/**
 * POST /api/auth/login — exchanges a name for a JWT and stores it.
 */
export async function apiLogin(name: string): Promise<LoginResponse> {
  const result = await apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
  setToken(result.token)
  return result
}

/**
 * GET /api/auth/me — validates the stored token and returns the user.
 */
export async function apiGetMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/auth/me')
}

/**
 * POST /api/auth/logout — clears the stored token.
 */
export async function apiLogout(): Promise<void> {
  await apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }).catch(() => {})
  clearToken()
}

/** Server-side loan data shape. */
export interface ServerLoanData {
  principal: number
  annual_rate: number
  emi: number | null
  tenure_months: number | null
  extra_monthly: number
  currency: string
}

/**
 * GET /api/loan-data — returns saved loan data or null on 204.
 */
export async function apiGetLoanData(): Promise<ServerLoanData | null> {
  return apiFetch<ServerLoanData | null>('/api/loan-data')
}

/**
 * PUT /api/loan-data — upserts loan inputs for the current user.
 */
export async function apiPutLoanData(data: ServerLoanData): Promise<ServerLoanData> {
  return apiFetch<ServerLoanData>('/api/loan-data', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
