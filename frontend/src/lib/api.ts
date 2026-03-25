const API_BASE = import.meta.env.VITE_API_URL || ''

interface RequestOptions {
  method?: string
  body?: unknown
  token?: string | null
}

class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const detail = data?.detail
    const message = typeof detail === 'string' ? detail : detail?.message || response.statusText
    throw new ApiError(message, response.status, detail?.code)
  }

  if (response.status === 204) return undefined as T
  return response.json()
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: { id: string; name: string; created_at: string }
}

export interface LoanData {
  id: string
  user_id: string
  name: string
  principal: number
  annual_rate: number
  emi: number | null
  tenure_months: number | null
  extra_monthly: number
  currency: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export const api = {
  login: (name: string) =>
    request<LoginResponse>('/api/auth/login', { method: 'POST', body: { name } }),

  getMe: (token: string) =>
    request<LoginResponse['user']>('/api/auth/me', { token }),

  listLoans: (token: string) =>
    request<LoanData[]>('/api/loans/', { token }),

  createLoan: (token: string, data: Omit<LoanData, 'id' | 'user_id' | 'is_active' | 'created_at' | 'updated_at'>) =>
    request<LoanData>('/api/loans/', { method: 'POST', body: data, token }),

  updateLoan: (token: string, loanId: string, data: Partial<LoanData>) =>
    request<LoanData>(`/api/loans/${loanId}`, { method: 'PUT', body: data, token }),

  deleteLoan: (token: string, loanId: string) =>
    request<void>(`/api/loans/${loanId}`, { method: 'DELETE', token }),
}

export { ApiError }
