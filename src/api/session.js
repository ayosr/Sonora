import { ref, computed, readonly } from 'vue'
import { createHttpClient } from './http.js'

const TOKEN_KEY = 'sonora.token'

/** localStorage is unavailable in some sandboxes, so every access is guarded. */
const store = {
  read(key) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null
    } catch {
      return null
    }
  },
  write(key, value) {
    try {
      if (value === null) globalThis.localStorage?.removeItem(key)
      else globalThis.localStorage?.setItem(key, value)
    } catch {
      /* non-persistent session, which is fine */
    }
  },
}

/**
 * Session state plus an http client already wired to it.
 * Call once at app start and pass the result down, or import the singleton below.
 */
export function createSession({ baseURL = '/api', fetchImpl } = {}) {
  const token = ref(store.read(TOKEN_KEY))
  const user = ref(null)
  const pending = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => Boolean(token.value))

  function setToken(value) {
    token.value = value
    store.write(TOKEN_KEY, value)
  }

  function clear() {
    setToken(null)
    user.value = null
  }

  const http = createHttpClient({
    baseURL,
    fetchImpl,
    getToken: () => token.value,
    onUnauthorized: clear,
  })

  async function login(credentials) {
    pending.value = true
    error.value = null
    try {
      const data = await http.post('/auth/login', credentials)
      setToken(data.token)
      user.value = data.user ?? null
      return user.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      pending.value = false
    }
  }

  /** Rehydrate on boot. A rejected token clears the session instead of throwing. */
  async function restore() {
    if (!token.value) return null
    try {
      user.value = await http.get('/auth/me')
      return user.value
    } catch (err) {
      if (err.isAuthError) clear()
      return null
    }
  }

  async function logout() {
    try {
      await http.post('/auth/logout')
    } catch {
      /* the local session is cleared regardless */
    }
    clear()
  }

  return {
    http,
    token: readonly(token),
    user: readonly(user),
    pending: readonly(pending),
    error: readonly(error),
    isAuthenticated,
    login,
    logout,
    restore,
  }
}

export const session = createSession({ baseURL: import.meta?.env?.VITE_API_URL || '/api' })
