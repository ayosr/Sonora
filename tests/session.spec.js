import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSession } from '../src/api/session.js'

function jsonResponse(body, { status = 200 } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
  }
}

describe('createSession', () => {
  beforeEach(() => localStorage.clear())

  it('starts unauthenticated with a clean store', () => {
    const session = createSession({ fetchImpl: vi.fn() })
    expect(session.isAuthenticated.value).toBe(false)
  })

  it('stores the token and user after a successful login', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ token: 'tok_1', user: { id: 'u1', name: 'Ayo' } })
    )
    const session = createSession({ fetchImpl })
    const user = await session.login({ email: 'a@b.co', password: 'secret' })

    expect(user.name).toBe('Ayo')
    expect(session.isAuthenticated.value).toBe(true)
    expect(localStorage.getItem('sonora.token')).toBe('tok_1')
  })

  it('surfaces the error and stays signed out on bad credentials', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ message: 'Invalid credentials' }, { status: 401 })
    )
    const session = createSession({ fetchImpl })
    await expect(session.login({ email: 'a@b.co', password: 'wrong' })).rejects.toThrow('Invalid credentials')
    expect(session.isAuthenticated.value).toBe(false)
    expect(session.error.value).toBe('Invalid credentials')
  })

  it('sends the stored token when restoring', async () => {
    localStorage.setItem('sonora.token', 'tok_2')
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ id: 'u1', name: 'Ayo' }))
    const session = createSession({ fetchImpl })
    await session.restore()
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe('Bearer tok_2')
    expect(session.user.value.name).toBe('Ayo')
  })

  it('clears a rejected token instead of throwing', async () => {
    localStorage.setItem('sonora.token', 'expired')
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ message: 'expired' }, { status: 401 }))
    const session = createSession({ fetchImpl })
    await expect(session.restore()).resolves.toBeNull()
    expect(session.isAuthenticated.value).toBe(false)
    expect(localStorage.getItem('sonora.token')).toBeNull()
  })

  it('clears the local session even if logout fails on the server', async () => {
    localStorage.setItem('sonora.token', 'tok_3')
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('offline'))
    const session = createSession({ fetchImpl })
    await session.logout()
    expect(session.isAuthenticated.value).toBe(false)
    expect(localStorage.getItem('sonora.token')).toBeNull()
  })
})
