# Sonora

A single-page music library. Import audio files from your machine, organize them
with playlists, tags and favorites, and play them back. Files never leave the
device: audio blobs and metadata live in IndexedDB, so the library survives a
reload with no server involved.

The REST layer, session handling, container image and Kubernetes manifests are
all wired up so the same app can run against a real backend.

<img width="1140" height="771" alt="image" src="https://github.com/user-attachments/assets/eb10e40a-e257-4e36-b309-34b24b3c55bf" />

---

## Run it

Two ways, depending on what you need.

**No build step.** Open `sonora-standalone.html` in a browser. It is the whole
app in one file, using the Vue 3 global build from a CDN. Good for a quick look.

**The real project.**

```
npm install
npm run dev        # http://localhost:5173
npm run test       # Vitest, single run
npm run test:watch # Vitest in watch mode
npm run coverage   # v8 coverage report
npm run build      # production bundle in dist/
```

`npm run dev` proxies `/api` to `http://localhost:8000`. Point it somewhere else
with `API_TARGET=http://my-api:9000 npm run dev`.

## Using it

| Action | How |
| --- | --- |
| Add music | Click **Add music**, or drop files anywhere on the window |
| Play | Click a row, or press Space |
| Skip | Arrow keys, or the transport buttons |
| Edit title, artist, album, tags | Pencil icon on a row |
| Favorite | Heart icon on a row |
| Playlists | **+ New playlist** in the sidebar, then the folder icon on a row |
| Filter by tag | Click a tag chip. Click it again to clear |
| Search | Matches title, artist, album and tags at once |

Accepted formats are whatever the browser decodes: MP3, M4A, AAC, WAV, FLAC,
OGG, Opus, WebM.

## Project layout

```
src/
  api/http.js          fetch wrapper: base URL, auth header, timeout, error shape
  api/session.js       login, restore, logout, token persistence
  api/tracks.js        /tracks and /playlists resource methods
  db/idb.js            IndexedDB stores for blobs, metadata, playlists
  composables/
    useLibrary.js      import, edit, delete, playlists, current view
    usePlayer.js       audio element, Web Audio analyser, queue navigation
  utils/format.js      duration, bytes, filename parsing, cover colors
  utils/library.js     filtering, sorting, tag counts, next/prev index
  components/          header, sidebar, track list, player bar, editor
tests/                 Vitest specs
k8s/                   Deployment, Service, Ingress, ConfigMap
```

The split is deliberate: everything in `utils/` is pure, so the interesting
logic is testable without mounting a component or touching the DOM.

### What each piece does

**`createHttpClient({ baseURL, getToken, onUnauthorized, timeout, fetchImpl })`**
Returns `get`, `post`, `put`, `patch`, `del`. It joins URLs, drops empty query
params, adds `Authorization` when a token exists, JSON-encodes plain objects and
leaves `FormData` alone so the browser sets its own multipart boundary. Failures
throw an `ApiError` carrying `status`, `code` and the parsed body. `fetchImpl` is
injectable, which is what makes the client testable without a network.

**`createSession({ baseURL, fetchImpl })`**
Holds `token`, `user`, `isAuthenticated` and exposes `login`, `restore`,
`logout`. A 401 anywhere in the app clears the session through the client's
`onUnauthorized` hook. `restore()` swallows a rejected token instead of throwing,
so a stale token means "signed out" rather than a crash on boot.

**`useLibrary()`**
Owns `tracks`, `playlists` and the current view (`query`, `collection`, `tag`,
`sort`). `importFiles` reads duration from a throwaway `<audio>` element, writes
the blob to IndexedDB and creates one object URL per track, revoked on delete.

**`usePlayer(resolveUrl)`**
One `<audio>` element plus an `AnalyserNode` at `fftSize: 128`. The audio graph
is built on the first play, because browsers refuse to start an `AudioContext`
before a user gesture. `spectrum` drives the canvas in the player bar and `level`
drives the `--level` custom property behind the glass.

## Testing

Vitest with jsdom, plus `@vue/test-utils` for component mounting.

```
tests/format.spec.js    duration and byte formatting, filename parsing, tag cleanup
tests/library.spec.js   filters, sorting, tag counts, queue navigation incl. shuffle and repeat
tests/http.spec.js      URL joining, params, auth header, FormData, 204, error mapping, timeout
tests/session.spec.js   login, restore, expired token, logout while offline
tests/TrackRow.spec.js  render, click and keyboard events, emitted events, aria labels
```

The HTTP tests pass a `vi.fn()` in place of `fetch`, so they assert on the exact
request that would have gone out. The timeout test uses fake timers and a fetch
stub that only settles when the abort signal fires.

## Docker

```
docker build -t sonora:local .
docker run --rm -p 8080:8080 sonora:local   # http://localhost:8080
```

Multi-stage: Node 20 builds and runs the test suite, then the static output is
copied into `nginx:1.27-alpine`. A failing test fails the image build. The
runtime stage listens on 8080 as the `nginx` user, so it needs no root and no
extra capabilities.

## Kubernetes

```
kubectl apply -f k8s/
```

`k8s/deployment.yaml` runs 2 replicas behind a rolling update with
`maxUnavailable: 0`, `readinessProbe` and `livenessProbe` on `/healthz`, CPU and
memory requests and limits, `readOnlyRootFilesystem` with `emptyDir` mounts for
nginx's cache and `/tmp`, and all capabilities dropped. A `PodDisruptionBudget`
keeps one pod up during node drains.

`k8s/ingress.yaml` routes `/api` to the backend service and everything else to
the SPA, so the browser makes same-origin requests and session cookies stay
simple. `proxy-body-size` is raised to 64m because audio uploads are large.

Set the image reference in `k8s/deployment.yaml` before applying.

## Known limits
+ Playlists do not work yet; folder icon not appearing.
+ Metadata comes from the filename, not from ID3 tags. Reading real tags needs a
  parser such as `music-metadata-browser`.
+ Browser storage quota caps the library size. Large collections need the
  backend that `src/api/` is already written against.
+ Safari applies `backdrop-filter` less consistently than Chrome and Firefox, so
  the glass reads slightly flatter there.
+ Drag and drop imports files, not folders.
