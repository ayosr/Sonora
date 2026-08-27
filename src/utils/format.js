/**
 * Pure helpers shared by the UI and the API layer.
 * Everything here is side-effect free so it is trivial to unit test.
 */

/** Seconds -> "m:ss" (or "h:mm:ss" past an hour). Invalid input renders as "0:00". */
export function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

/** Bytes -> short human string, e.g. 5242880 -> "5.0 MB". */
export function formatBytes(bytes) {
  const n = Number(bytes) || 0
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB']
  let value = n / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(1)} ${units[i]}`
}

/**
 * Best-effort title/artist from a filename.
 * "03 - Nujabes - Feather.mp3" -> { artist: 'Nujabes', title: 'Feather' }
 */
export function parseFilename(filename = '') {
  const base = String(filename).replace(/\.[a-z0-9]+$/i, '')
  const clean = base.replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim()
  const noIndex = clean.replace(/^\d{1,3}\s*[-.)]\s*/, '')
  const parts = noIndex.split(/\s+-\s+/)
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() }
  }
  return { artist: 'Unknown artist', title: noIndex || 'Untitled' }
}

/** Deterministic hue from a string, so every track keeps the same cover color. */
export function hueFor(text = '') {
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) % 360
  return hash
}

/** Two-stop gradient used for cover art and the now-playing disc. */
export function coverGradient(text) {
  const h = hueFor(text)
  const l1 = 58 + (h % 18)
  const l2 = 34 + (h % 14)
  return `linear-gradient(140deg, hsl(${h} 6% ${l1}%), hsl(${(h + 48) % 360} 6% ${l2}%))`
}

/** First letter of a title, upper-cased, with a safe fallback. */
export function initial(text = '') {
  const c = String(text).trim().charAt(0)
  return c ? c.toUpperCase() : '?'
}

/** Normalize free-text tag input into a clean, de-duplicated, lower-case list. */
export function parseTags(input) {
  const raw = Array.isArray(input) ? input : String(input || '').split(',')
  const seen = new Set()
  const out = []
  for (const item of raw) {
    const tag = String(item).trim().toLowerCase()
    if (tag && !seen.has(tag)) {
      seen.add(tag)
      out.push(tag)
    }
  }
  return out
}
