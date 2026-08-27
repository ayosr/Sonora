/**
 * Library query logic, kept out of the components so it can be tested directly.
 * A "track" is { id, title, artist, album, tags[], duration, size, addedAt, favorite }.
 */

export const SORTS = ['added', 'title', 'artist', 'duration']

/** Case-insensitive match across title, artist, album and tags. */
export function matchesQuery(track, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return true
  const haystack = [track.title, track.artist, track.album, ...(track.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}

/**
 * Filter by collection ("all" | "favorites" | "recent" | a playlist id), tag and query.
 * `playlists` maps a playlist id to an array of track ids.
 */
export function filterTracks(tracks, { collection = 'all', tag = null, query = '', playlists = {} } = {}) {
  let out = tracks.slice()

  if (collection === 'favorites') {
    out = out.filter((t) => t.favorite)
  } else if (collection === 'recent') {
    out = out.slice().sort((a, b) => b.addedAt - a.addedAt).slice(0, 25)
  } else if (collection !== 'all') {
    const ids = new Set(playlists[collection] || [])
    out = out.filter((t) => ids.has(t.id))
  }

  if (tag) out = out.filter((t) => (t.tags || []).includes(tag))
  if (query) out = out.filter((t) => matchesQuery(t, query))
  return out
}

/** Stable sort. `added` and `duration` descend by default; text keys ascend. */
export function sortTracks(tracks, key = 'added') {
  const list = tracks.slice()
  if (key === 'title' || key === 'artist') {
    return list.sort((a, b) =>
      String(a[key] || '').localeCompare(String(b[key] || ''), undefined, { sensitivity: 'base' })
    )
  }
  if (key === 'duration') return list.sort((a, b) => (b.duration || 0) - (a.duration || 0))
  return list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
}

/** Every tag in the library with its usage count, most used first. */
export function tagCloud(tracks) {
  const counts = new Map()
  for (const t of tracks) {
    for (const tag of t.tags || []) counts.set(tag, (counts.get(tag) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

/**
 * Index of the next track to play.
 * Returns null when the queue is empty or playback should stop at the end.
 */
export function nextIndex(length, current, { shuffle = false, repeat = 'off', random = Math.random } = {}) {
  if (length <= 0) return null
  if (repeat === 'one') return current
  if (shuffle) {
    if (length === 1) return 0
    let pick = current
    while (pick === current) pick = Math.floor(random() * length)
    return pick
  }
  const next = current + 1
  if (next < length) return next
  return repeat === 'all' ? 0 : null
}

/** Index of the previous track, wrapping to the end of the queue. */
export function prevIndex(length, current) {
  if (length <= 0) return null
  return current - 1 < 0 ? length - 1 : current - 1
}
