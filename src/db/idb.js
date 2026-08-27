/**
 * IndexedDB store for offline mode: audio blobs live in `files`, metadata in `tracks`.
 * If IndexedDB is blocked (private mode, sandboxed frame) every call resolves to a
 * no-op and the app runs from memory for the session.
 */
const DB_NAME = 'sonora'
const VERSION = 1

let dbPromise = null

function open() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    try {
      if (!globalThis.indexedDB) return resolve(null)
      const req = globalThis.indexedDB.open(DB_NAME, VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains('tracks')) db.createObjectStore('tracks', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('files')) db.createObjectStore('files')
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta')
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return dbPromise
}

function run(storeName, mode, fn) {
  return open().then(
    (db) =>
      new Promise((resolve) => {
        if (!db) return resolve(null)
        try {
          const tx = db.transaction(storeName, mode)
          const req = fn(tx.objectStore(storeName))
          tx.onerror = () => resolve(null)
          if (req) {
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => resolve(null)
          } else {
            tx.oncomplete = () => resolve(true)
          }
        } catch {
          resolve(null)
        }
      })
  )
}

export const idb = {
  available: () => Boolean(globalThis.indexedDB),
  allTracks: () => run('tracks', 'readonly', (s) => s.getAll()).then((r) => r || []),
  putTrack: (track) => run('tracks', 'readwrite', (s) => s.put(track)),
  deleteTrack: (id) => run('tracks', 'readwrite', (s) => s.delete(id)),
  putFile: (id, blob) => run('files', 'readwrite', (s) => s.put(blob, id)),
  getFile: (id) => run('files', 'readonly', (s) => s.get(id)),
  deleteFile: (id) => run('files', 'readwrite', (s) => s.delete(id)),
  getMeta: (key) => run('meta', 'readonly', (s) => s.get(key)),
  putMeta: (key, value) => run('meta', 'readwrite', (s) => s.put(value, key)),
}
