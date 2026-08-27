/**
 * Resource module for /tracks and /playlists.
 * Components call these; they never build URLs themselves.
 */
export function createTracksApi(http) {
  return {
    list: (params) => http.get('/tracks', { params }),
    get: (id) => http.get(`/tracks/${encodeURIComponent(id)}`),

    /** Multipart upload. The client leaves Content-Type alone for FormData. */
    upload(file, meta = {}, { signal } = {}) {
      const form = new FormData()
      form.append('file', file, file.name)
      for (const [key, value] of Object.entries(meta)) {
        form.append(key, Array.isArray(value) ? value.join(',') : String(value))
      }
      return http.post('/tracks', form, { signal })
    },

    update: (id, patch) => http.patch(`/tracks/${encodeURIComponent(id)}`, patch),
    remove: (id) => http.del(`/tracks/${encodeURIComponent(id)}`),
    streamUrl: (id) => `/api/tracks/${encodeURIComponent(id)}/stream`,

    playlists: {
      list: () => http.get('/playlists'),
      create: (name) => http.post('/playlists', { name }),
      addTrack: (playlistId, trackId) => http.post(`/playlists/${playlistId}/tracks`, { trackId }),
      removeTrack: (playlistId, trackId) => http.del(`/playlists/${playlistId}/tracks/${trackId}`),
    },
  }
}
