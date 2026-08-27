/**
 * Minimal REST client. One place that knows about base URLs, auth headers,
 * JSON encoding, timeouts and error shape, so no component ever calls fetch().
 */

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'request_failed', body = null, url = '' } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.body = body
    this.url = url
  }

  get isAuthError() {
    return this.status === 401 || this.status === 403
  }
}

function joinUrl(baseURL, path) {
  if (/^https?:\/\//i.test(path)) return path
  return `${String(baseURL).replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}`
}

function toQuery(params) {
  const usable = Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
  if (!usable.length) return ''
  return `?${new URLSearchParams(usable).toString()}`
}

/**
 * @param {object}   options
 * @param {string}   options.baseURL         Prefix for every relative path.
 * @param {Function} options.getToken        Returns the current bearer token, or null.
 * @param {Function} options.onUnauthorized  Called once when the server answers 401.
 * @param {number}   options.timeout         Milliseconds before the request aborts.
 * @param {Function} options.fetchImpl       Injectable fetch, which is what the tests replace.
 */
export function createHttpClient({
  baseURL = '/api',
  getToken = () => null,
  onUnauthorized = null,
  timeout = 15000,
  fetchImpl = globalThis.fetch?.bind(globalThis),
} = {}) {
  async function request(method, path, { body, params, headers = {}, signal } = {}) {
    const url = joinUrl(baseURL, path) + toQuery(params)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true })

    const isForm = typeof FormData !== 'undefined' && body instanceof FormData
    const token = getToken()
    const finalHeaders = { Accept: 'application/json', ...headers }
    if (token) finalHeaders.Authorization = `Bearer ${token}`
    if (body !== undefined && !isForm) finalHeaders['Content-Type'] = 'application/json'

    let response
    try {
      response = await fetchImpl(url, {
        method,
        headers: finalHeaders,
        credentials: 'include',
        signal: controller.signal,
        body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      })
    } catch (err) {
      clearTimeout(timer)
      const aborted = err && err.name === 'AbortError'
      throw new ApiError(aborted ? `Request timed out after ${timeout}ms` : 'Network request failed', {
        code: aborted ? 'timeout' : 'network_error',
        url,
      })
    }
    clearTimeout(timer)

    const payload = await readBody(response)

    if (!response.ok) {
      if (response.status === 401 && onUnauthorized) onUnauthorized()
      throw new ApiError(payload?.message || `${method} ${url} failed with ${response.status}`, {
        status: response.status,
        code: payload?.code || 'http_error',
        body: payload,
        url,
      })
    }
    return payload
  }

  async function readBody(response) {
    if (response.status === 204) return null
    const type = response.headers?.get?.('content-type') || ''
    if (type.includes('application/json')) {
      try {
        return await response.json()
      } catch {
        return null
      }
    }
    if (typeof response.text === 'function') return await response.text()
    return null
  }

  return {
    request,
    get: (path, options) => request('GET', path, options),
    post: (path, body, options) => request('POST', path, { ...options, body }),
    put: (path, body, options) => request('PUT', path, { ...options, body }),
    patch: (path, body, options) => request('PATCH', path, { ...options, body }),
    del: (path, options) => request('DELETE', path, options),
  }
}
