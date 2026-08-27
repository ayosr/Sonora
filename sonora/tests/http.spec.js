import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHttpClient, ApiError } from '../src/api/http.js'

/** Build a fetch stub that answers with the given status and JSON payload. */
function jsonResponse(body, { status = 200 } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
    text: async () => JSON.stringify(body),
  }
}

describe('createHttpClient', () => {
  let fetchImpl

  beforeEach(() => {
    fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ id: 't1' }))
  })

  it('joins the base URL with the path without doubling slashes', async () => {
    const http = createHttpClient({ baseURL: 'https://api.test/v1/', fetchImpl })
    await http.get('/tracks')
    expect(fetchImpl.mock.calls[0][0]).toBe('https://api.test/v1/tracks')
  })

  it('serializes query params and drops empty ones', async () => {
    const http = createHttpClient({ baseURL: '/api', fetchImpl })
    await http.get('/tracks', { params: { q: 'jazz', tag: '', page: 2 } })
    expect(fetchImpl.mock.calls[0][0]).toBe('/api/tracks?q=jazz&page=2')
  })

  it('attaches the bearer token from getToken', async () => {
    const http = createHttpClient({ baseURL: '/api', fetchImpl, getToken: () => 'abc123' })
    await http.get('/auth/me')
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe('Bearer abc123')
  })

  it('omits the Authorization header when there is no token', async () => {
    const http = createHttpClient({ baseURL: '/api', fetchImpl })
    await http.get('/tracks')
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('JSON-encodes a plain object body', async () => {
    const http = createHttpClient({ baseURL: '/api', fetchImpl })
    await http.post('/tracks', { title: 'Feather' })
    const init = fetchImpl.mock.calls[0][1]
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.body).toBe('{"title":"Feather"}')
  })

  it('leaves FormData alone so the browser can set the boundary', async () => {
    const http = createHttpClient({ baseURL: '/api', fetchImpl })
    const form = new FormData()
    form.append('file', new Blob(['x']), 'x.mp3')
    await http.post('/tracks', form)
    const init = fetchImpl.mock.calls[0][1]
    expect(init.headers['Content-Type']).toBeUndefined()
    expect(init.body).toBe(form)
  })

  it('returns null for a 204 instead of trying to parse a body', async () => {
    fetchImpl.mockResolvedValue({ ok: true, status: 204, headers: { get: () => null } })
    const http = createHttpClient({ baseURL: '/api', fetchImpl })
    await expect(http.del('/tracks/t1')).resolves.toBeNull()
  })

  it('throws an ApiError carrying the status and server code', async () => {
    fetchImpl.mockResolvedValue(jsonResponse({ message: 'No such track', code: 'not_found' }, { status: 404 }))
    const http = createHttpClient({ baseURL: '/api', fetchImpl })
    await expect(http.get('/tracks/nope')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      code: 'not_found',
      message: 'No such track',
    })
  })

  it('calls onUnauthorized exactly once on a 401', async () => {
    fetchImpl.mockResolvedValue(jsonResponse({ message: 'nope' }, { status: 401 }))
    const onUnauthorized = vi.fn()
    const http = createHttpClient({ baseURL: '/api', fetchImpl, onUnauthorized })
    await expect(http.get('/tracks')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('flags auth errors on the error object', async () => {
    const error = new ApiError('denied', { status: 403 })
    expect(error.isAuthError).toBe(true)
    expect(new ApiError('boom', { status: 500 }).isAuthError).toBe(false)
  })

  it('wraps network failures rather than leaking the raw error', async () => {
    fetchImpl.mockRejectedValue(new TypeError('Failed to fetch'))
    const http = createHttpClient({ baseURL: '/api', fetchImpl })
    await expect(http.get('/tracks')).rejects.toMatchObject({ code: 'network_error' })
  })
})

describe('request timeouts', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('aborts and reports a timeout', async () => {
    const fetchImpl = vi.fn(
      (url, init) =>
        new Promise((_, reject) => {
          init.signal.addEventListener('abort', () => {
            const err = new Error('aborted')
            err.name = 'AbortError'
            reject(err)
          })
        })
    )
    const http = createHttpClient({ baseURL: '/api', fetchImpl, timeout: 50 })
    const pending = expect(http.get('/slow')).rejects.toMatchObject({ code: 'timeout' })
    await vi.advanceTimersByTimeAsync(60)
    await pending
  })
})
