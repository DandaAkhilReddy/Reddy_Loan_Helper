import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  apiLogin,
  apiGetMe,
  apiLogout,
  apiGetLoanData,
  apiPutLoanData,
  getToken,
  clearToken,
} from '../../lib/api'

const TOKEN_KEY = 'reddy-loan-token'

function mockFetch(status: number, body?: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      status,
      ok: status >= 200 && status < 300,
      json: () => Promise.resolve(body ?? {}),
    } as Response),
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('getToken / clearToken', () => {
  it('getToken returns null when nothing stored', () => {
    expect(getToken()).toBeNull()
  })

  it('getToken returns value after login sets it', async () => {
    mockFetch(200, { token: 'tok-abc', user: { id: '1', name: 'Akhil' } })
    await apiLogin('Akhil')
    expect(getToken()).toBe('tok-abc')
  })

  it('clearToken removes the stored token', async () => {
    mockFetch(200, { token: 'tok-abc', user: { id: '1', name: 'Akhil' } })
    await apiLogin('Akhil')
    clearToken()
    expect(getToken()).toBeNull()
  })
})

describe('apiLogin', () => {
  it('POSTs to /api/auth/login with name in body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ token: 'tok-xyz', user: { id: '42', name: 'Akhil' } }),
    } as Response)
    vi.stubGlobal('fetch', fetchMock)

    await apiLogin('Akhil')

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/auth/login')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body as string)).toEqual({ name: 'Akhil' })
  })

  it('stores the token from the response', async () => {
    mockFetch(200, { token: 'tok-stored', user: { id: '1', name: 'Akhil' } })
    await apiLogin('Akhil')
    expect(localStorage.getItem(TOKEN_KEY)).toBe('tok-stored')
  })

  it('returns LoginResponse with token and user', async () => {
    const payload = { token: 'tok-ret', user: { id: '99', name: 'Test' } }
    mockFetch(200, payload)
    const result = await apiLogin('Test')
    expect(result.token).toBe('tok-ret')
    expect(result.user).toEqual({ id: '99', name: 'Test' })
  })
})

describe('apiGetMe', () => {
  it('GETs /api/auth/me and returns user', async () => {
    localStorage.setItem(TOKEN_KEY, 'bearer-tok')
    mockFetch(200, { id: '5', name: 'Akhil' })
    const user = await apiGetMe()
    expect(user).toEqual({ id: '5', name: 'Akhil' })
  })

  it('sends Authorization header with stored token', async () => {
    localStorage.setItem(TOKEN_KEY, 'my-token')
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ id: '1', name: 'Akhil' }),
    } as Response)
    vi.stubGlobal('fetch', fetchMock)

    await apiGetMe()

    const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((opts.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token')
  })

  it('throws Unauthorized and clears token on 401', async () => {
    localStorage.setItem(TOKEN_KEY, 'bad-token')
    mockFetch(401)
    await expect(apiGetMe()).rejects.toThrow('Unauthorized')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})

describe('apiLogout', () => {
  it('clears the token even if the request fails', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok-logout')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    await apiLogout()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('clears the token on successful logout', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok-ok')
    mockFetch(200, { ok: true })
    await apiLogout()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})

describe('apiGetLoanData', () => {
  it('returns null on 204 No Content', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 204,
        ok: true,
        json: () => Promise.resolve(null),
      } as Response),
    )
    const result = await apiGetLoanData()
    expect(result).toBeNull()
  })

  it('returns loan data on 200', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    const data = {
      principal: 2563163,
      annual_rate: 13.5,
      emi: 51476,
      tenure_months: 111,
      extra_monthly: 0,
      currency: 'INR',
    }
    mockFetch(200, data)
    const result = await apiGetLoanData()
    expect(result).toEqual(data)
  })

  it('GETs /api/loan-data', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    const fetchMock = vi.fn().mockResolvedValue({
      status: 204,
      ok: true,
      json: () => Promise.resolve(null),
    } as Response)
    vi.stubGlobal('fetch', fetchMock)
    await apiGetLoanData()
    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain('/api/loan-data')
  })
})

describe('apiPutLoanData', () => {
  it('PUTs to /api/loan-data and returns saved data', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    const payload = {
      principal: 1000000,
      annual_rate: 8.5,
      emi: null,
      tenure_months: 84,
      extra_monthly: 0,
      currency: 'INR',
    }
    mockFetch(200, payload)
    const result = await apiPutLoanData(payload)
    expect(result).toEqual(payload)
  })

  it('sends PUT method with JSON body', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    const payload = {
      principal: 30000,
      annual_rate: 5.5,
      emi: null,
      tenure_months: 120,
      extra_monthly: 0,
      currency: 'USD',
    }
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve(payload),
    } as Response)
    vi.stubGlobal('fetch', fetchMock)
    await apiPutLoanData(payload)
    const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(opts.method).toBe('PUT')
    expect(JSON.parse(opts.body as string)).toEqual(payload)
  })
})

describe('apiFetch error handling', () => {
  it('throws with server error message when body has error.message', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 400,
        ok: false,
        json: () => Promise.resolve({ error: { message: 'Bad principal' } }),
      } as Response),
    )
    await expect(apiGetLoanData()).rejects.toThrow('Bad principal')
  })

  it('throws with detail when body has detail field', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 422,
        ok: false,
        json: () => Promise.resolve({ detail: 'Validation error' }),
      } as Response),
    )
    await expect(apiGetLoanData()).rejects.toThrow('Validation error')
  })

  it('throws with generic message when body parsing fails', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 500,
        ok: false,
        json: () => Promise.reject(new Error('parse error')),
      } as Response),
    )
    await expect(apiGetLoanData()).rejects.toThrow('Request failed: 500')
  })
})

// ---------------------------------------------------------------------------
// localStorage error paths
// ---------------------------------------------------------------------------
describe('token helpers — localStorage error paths', () => {
  it('getToken returns null when localStorage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage error')
    })
    expect(getToken()).toBeNull()
    spy.mockRestore()
  })

  it('clearToken silently handles localStorage error', () => {
    const spy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage error')
    })
    expect(() => clearToken()).not.toThrow()
    spy.mockRestore()
  })
})
