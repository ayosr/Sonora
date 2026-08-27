import { ref, computed, onUnmounted } from 'vue'
import { nextIndex, prevIndex } from '../utils/library.js'

/**
 * Wraps one <audio> element plus a Web Audio analyser.
 * The analyser feeds the spectrum canvas and the ambient light field.
 */
export function usePlayer(resolveUrl) {
  const audio = typeof Audio !== 'undefined' ? new Audio() : null
  if (audio) audio.preload = 'metadata'

  const queue = ref([])
  const index = ref(-1)
  const playing = ref(false)
  const position = ref(0)
  const duration = ref(0)
  const volume = ref(0.85)
  const shuffle = ref(false)
  const repeat = ref('off') // 'off' | 'all' | 'one'
  const level = ref(0)
  const spectrum = ref(new Uint8Array(0))

  const playingTrack = ref(null)
  const current = computed(() => playingTrack.value)
  const progress = computed(() => (duration.value ? position.value / duration.value : 0))

  let ctx = null
  let analyser = null
  let source = null
  let raf = 0

  /** Created on the first play, because browsers block audio contexts before a gesture. */
  function ensureGraph() {
    if (ctx || !audio) return
    const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext
    if (!Ctx) return
    try {
      ctx = new Ctx()
      analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.82
      source = ctx.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(ctx.destination)
      spectrum.value = new Uint8Array(analyser.frequencyBinCount)
    } catch {
      analyser = null
    }
  }

  function tick() {
    if (analyser) {
      const bins = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(bins)
      spectrum.value = bins
      let sum = 0
      for (let i = 0; i < bins.length; i++) sum += bins[i]
      level.value = sum / bins.length / 255
    }
    if (audio) position.value = audio.currentTime
    raf = requestAnimationFrame(tick)
  }

  if (audio) {
    audio.addEventListener('loadedmetadata', () => {
      duration.value = Number.isFinite(audio.duration) ? audio.duration : 0
    })
    audio.addEventListener('play', () => {
      playing.value = true
      if (!raf) raf = requestAnimationFrame(tick)
    })
    audio.addEventListener('pause', () => {
      playing.value = false
    })
    audio.addEventListener('ended', () => next(true))
  }

  /**
   * Swap the queue (the user searched or changed collection) and re-point the
   * cursor at the track that is currently playing, so playback is unaffected.
   */
  function setQueue(list) {
    queue.value = list
    if (playingTrack.value) {
      index.value = list.findIndex((t) => t.id === playingTrack.value.id)
    }
  }

  async function playAt(i, list) {
    if (list) queue.value = list
    const track = queue.value[i]
    if (!track || !audio) return
    ensureGraph()
    if (ctx?.state === 'suspended') await ctx.resume()
    index.value = i
    playingTrack.value = track
    const url = resolveUrl(track.id)
    if (!url) return
    if (audio.src !== url) audio.src = url
    audio.volume = volume.value
    try {
      await audio.play()
    } catch {
      playing.value = false
    }
  }

  function toggle() {
    if (!audio) return
    if (!current.value) {
      if (queue.value.length) playAt(0)
      return
    }
    if (!audio.paused) {
      audio.pause()
      return
    }
    // Resume where we left off; only reload if the element lost its source.
    if (audio.src) audio.play().catch(() => (playing.value = false))
    else playAt(Math.max(index.value, 0))
  }

  /** `auto` is true when the current track ended on its own. */
  function next(auto = false) {
    const i = nextIndex(queue.value.length, index.value, {
      shuffle: shuffle.value,
      repeat: auto ? repeat.value : repeat.value === 'one' ? 'off' : repeat.value,
    })
    if (i === null) {
      playing.value = false
      return
    }
    if (i === index.value && repeat.value === 'one' && audio) {
      audio.currentTime = 0
      audio.play()
      return
    }
    playAt(i)
  }

  function prev() {
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    const i = prevIndex(queue.value.length, index.value)
    if (i !== null) playAt(i)
  }

  function seek(ratio) {
    if (!audio || !duration.value) return
    audio.currentTime = Math.min(Math.max(ratio, 0), 1) * duration.value
    position.value = audio.currentTime
  }

  function setVolume(value) {
    volume.value = Math.min(Math.max(Number(value), 0), 1)
    if (audio) audio.volume = volume.value
  }

  function cycleRepeat() {
    repeat.value = repeat.value === 'off' ? 'all' : repeat.value === 'all' ? 'one' : 'off'
  }

  function stop(id) {
    if (current.value?.id === id && audio) {
      audio.pause()
      audio.removeAttribute('src')
      index.value = -1
      playingTrack.value = null
    }
  }

  onUnmounted(() => {
    if (raf) cancelAnimationFrame(raf)
    audio?.pause()
  })

  return {
    queue, index, current, playing, position, duration, progress,
    volume, shuffle, repeat, level, spectrum,
    setQueue, playAt, toggle, next, prev, seek, setVolume, cycleRepeat, stop,
  }
}
