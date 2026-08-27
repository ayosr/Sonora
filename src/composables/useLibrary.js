import { ref, computed } from 'vue'
import { idb } from '../db/idb.js'
import { parseFilename, parseTags } from '../utils/format.js'
import { filterTracks, sortTracks, tagCloud } from '../utils/library.js'

const AUDIO_TYPES = /\.(mp3|m4a|aac|wav|flac|ogg|oga|opus|webm)$/i

/** Read duration by loading the file into a throwaway <audio> element. */
function readDuration(url) {
  return new Promise((resolve) => {
    const probe = new Audio()
    const done = (value) => {
      probe.src = ''
      resolve(value)
    }
    probe.preload = 'metadata'
    probe.onloadedmetadata = () => done(Number.isFinite(probe.duration) ? probe.duration : 0)
    probe.onerror = () => done(0)
    setTimeout(() => done(0), 6000)
    probe.src = url
  })
}

/**
 * Owns the track list, playlists and the current view (search, collection, tag, sort).
 * Object URLs are created once per track and revoked on removal.
 */
export function useLibrary() {
  const tracks = ref([])
  const playlists = ref([])
  const urls = new Map()

  const query = ref('')
  const collection = ref('all')
  const tag = ref(null)
  const sort = ref('added')
  const importing = ref(0)
  const ready = ref(false)

  const playlistMap = computed(() =>
    Object.fromEntries(playlists.value.map((p) => [p.id, p.trackIds]))
  )

  const visible = computed(() =>
    sortTracks(
      filterTracks(tracks.value, {
        collection: collection.value,
        tag: tag.value,
        query: query.value,
        playlists: playlistMap.value,
      }),
      sort.value
    )
  )

  const tags = computed(() => tagCloud(tracks.value))
  const favorites = computed(() => tracks.value.filter((t) => t.favorite).length)

  function urlFor(id) {
    return urls.get(id) || null
  }

  function registerBlob(id, blob) {
    if (urls.has(id)) URL.revokeObjectURL(urls.get(id))
    urls.set(id, URL.createObjectURL(blob))
  }

  /** Restore metadata and blobs saved by a previous session. */
  async function load() {
    const saved = await idb.allTracks()
    const restored = []
    for (const track of saved) {
      const blob = await idb.getFile(track.id)
      if (!blob) continue
      registerBlob(track.id, blob)
      restored.push(track)
    }
    tracks.value = restored
    playlists.value = (await idb.getMeta('playlists')) || []
    ready.value = true
    return restored.length
  }

  /** Import File objects from a picker or a drop. Non-audio files are skipped. */
  async function importFiles(fileList) {
    const files = [...fileList].filter((f) => f.type.startsWith('audio/') || AUDIO_TYPES.test(f.name))
    if (!files.length) return { added: 0, skipped: fileList.length }

    importing.value += files.length
    const added = []
    for (const file of files) {
      const id = `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
      registerBlob(id, file)
      const guess = parseFilename(file.name)
      const track = {
        id,
        title: guess.title,
        artist: guess.artist,
        album: 'Imported',
        tags: [],
        favorite: false,
        size: file.size,
        filename: file.name,
        addedAt: Date.now(),
        duration: await readDuration(urls.get(id)),
      }
      await idb.putFile(id, file)
      await idb.putTrack(track)
      added.push(track)
      importing.value--
    }
    tracks.value = [...added, ...tracks.value]
    return { added: added.length, skipped: fileList.length - files.length }
  }

  async function update(id, patch) {
    const i = tracks.value.findIndex((t) => t.id === id)
    if (i === -1) return null
    const next = { ...tracks.value[i], ...patch }
    if (patch.tags !== undefined) next.tags = parseTags(patch.tags)
    tracks.value.splice(i, 1, next)
    await idb.putTrack(next)
    return next
  }

  function toggleFavorite(id) {
    const track = tracks.value.find((t) => t.id === id)
    return track ? update(id, { favorite: !track.favorite }) : null
  }

  async function remove(id) {
    tracks.value = tracks.value.filter((t) => t.id !== id)
    playlists.value = playlists.value.map((p) => ({ ...p, trackIds: p.trackIds.filter((x) => x !== id) }))
    if (urls.has(id)) {
      URL.revokeObjectURL(urls.get(id))
      urls.delete(id)
    }
    await idb.deleteTrack(id)
    await idb.deleteFile(id)
    await idb.putMeta('playlists', JSON.parse(JSON.stringify(playlists.value)))
  }

  async function createPlaylist(name) {
    const clean = String(name || '').trim()
    if (!clean) return null
    const playlist = { id: `p_${Date.now().toString(36)}`, name: clean, trackIds: [] }
    playlists.value = [...playlists.value, playlist]
    await idb.putMeta('playlists', JSON.parse(JSON.stringify(playlists.value)))
    return playlist
  }

  /** Add to a playlist, ignoring duplicates. Returns false if it was already there. */
  async function addToPlaylist(playlistId, trackId) {
    const playlist = playlists.value.find((p) => p.id === playlistId)
    if (!playlist || playlist.trackIds.includes(trackId)) return false
    playlist.trackIds = [...playlist.trackIds, trackId]
    playlists.value = [...playlists.value]
    await idb.putMeta('playlists', JSON.parse(JSON.stringify(playlists.value)))
    return true
  }

  return {
    tracks, playlists, visible, tags, favorites,
    query, collection, tag, sort, importing, ready,
    load, importFiles, update, toggleFavorite, remove,
    createPlaylist, addToPlaylist, urlFor,
  }
}
