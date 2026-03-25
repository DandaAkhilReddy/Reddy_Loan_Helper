import { renderHook, act, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../../hooks/useAuth'
import * as api from '../../lib/api'

const TOKEN_KEY = 'reddy-loan-token'

function wrapper({ children }: { children: ReactNode }) {
  return createElement(AuthProvider, null, children)
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('useAuth — initial loading state', () => {
  it('starts with isLoading true when a token is stored', async () => {
    localStorage.setItem(TOKEN_KEY, 'some-token')
    vi.spyOn(api, 'apiGetMe').mockResolvedValue({ id: '1', name: 'Akhil' })

    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  it('resolves to user when stored token is valid', async () => {
    localStorage.setItem(TOKEN_KEY, 'valid-token')
    vi.spyOn(api, 'apiGetMe').mockResolvedValue({ id: '1', name: 'Akhil' })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.user).toEqual({ id: '1', name: 'Akhil' })
  })

  it('resolves to null user when stored token is invalid', async () => {
    localStorage.setItem(TOKEN_KEY, 'bad-token')
    vi.spyOn(api, 'apiGetMe').mockRejectedValue(new Error('Unauthorized'))

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.user).toBeNull()
  })

  it('resolves immediately to null when no token is stored', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.user).toBeNull()
  })

  it('does not call apiGetMe when no token is stored', async () => {
    const spy = vi.spyOn(api, 'apiGetMe')
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('useAuth — login', () => {
  it('sets user after successful login', async () => {
    vi.spyOn(api, 'apiLogin').mockResolvedValue({
      token: 'tok',
      user: { id: '5', name: 'Test' },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.login('Test')
    })

    expect(result.current.user).toEqual({ id: '5', name: 'Test' })
  })

  it('throws when apiLogin rejects', async () => {
    vi.spyOn(api, 'apiLogin').mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await expect(
      act(async () => {
        await result.current.login('Bad')
      }),
    ).rejects.toThrow('Server error')
  })
})

describe('useAuth — logout', () => {
  it('clears user after logout', async () => {
    localStorage.setItem(TOKEN_KEY, 'valid-token')
    vi.spyOn(api, 'apiGetMe').mockResolvedValue({ id: '1', name: 'Akhil' })
    vi.spyOn(api, 'apiLogout').mockResolvedValue(undefined)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.user).toEqual({ id: '1', name: 'Akhil' }))

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
  })
})

describe('useAuth — outside provider', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within AuthProvider',
    )
  })
})
