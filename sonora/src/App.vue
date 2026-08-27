<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import TheHeader from './components/TheHeader.vue'
import LibrarySidebar from './components/LibrarySidebar.vue'
import TrackList from './components/TrackList.vue'
import PlayerBar from './components/PlayerBar.vue'
import TrackEditor from './components/TrackEditor.vue'
import { useLibrary } from './composables/useLibrary.js'
import { usePlayer } from './composables/usePlayer.js'

const library = useLibrary()
const player = usePlayer(library.urlFor)

const fileInput = ref(null)
const editing = ref(null)
const hot = ref(false)
const toast = ref('')
let toastTimer = 0

const heading = computed(() => {
  if (library.tag.value) return `#${library.tag.value}`
  if (library.collection.value === 'favorites') return 'Favorites'
  if (library.collection.value === 'recent') return 'Recently added'
  const playlist = library.playlists.value.find((p) => p.id === library.collection.value)
  return playlist ? playlist.name : 'All tracks'
})

/** Keep the play queue in sync with whatever the user is looking at. */
watch(library.visible, (list) => player.setQueue(list), { immediate: true })

function say(message) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2600)
}

async function onFiles(fileList) {
  if (!fileList?.length) return
  const { added, skipped } = await library.importFiles(fileList)
  if (added) say(`Added ${added} ${added === 1 ? 'track' : 'tracks'}`)
  else say(`Skipped ${skipped} ${skipped === 1 ? 'file' : 'files'}. Audio only.`)
}

function onDrop(event) {
  hot.value = false
  onFiles(event.dataTransfer?.files)
}

function onKey(event) {
  if (event.target.matches('input, textarea')) return
  if (event.code === 'Space') {
    event.preventDefault()
    player.toggle()
  }
  if (event.code === 'ArrowRight') player.next()
  if (event.code === 'ArrowLeft') player.prev()
}

async function saveEdit(patch) {
  await library.update(editing.value.id, patch)
  editing.value = null
  say('Details saved')
}

async function removeTrack(id) {
  player.stop(id)
  await library.remove(id)
  say('Removed from library')
}

onMounted(async () => {
  const restored = await library.load()
  if (restored) say(`Restored ${restored} ${restored === 1 ? 'track' : 'tracks'}`)
  window.addEventListener('keydown', onKey)
})
</script>

<template>
  <div
    class="app"
    :style="{ '--level': player.level.value }"
    @dragover.prevent="hot = true"
    @dragleave="hot = false"
    @drop.prevent="onDrop"
  >
    <div class="field" aria-hidden="true"><b></b><b></b><b></b></div>

    <TheHeader v-model="library.query.value" @import="fileInput.click()" />

    <div class="stage">
      <LibrarySidebar
        :collection="library.collection.value"
        :tag="library.tag.value"
        :tags="library.tags.value"
        :playlists="library.playlists.value"
        :total="library.tracks.value.length"
        :favorites="library.favorites.value"
        :hot="hot"
        @select="library.collection.value = $event"
        @select-tag="library.tag.value = $event"
        @new-playlist="library.createPlaylist($event)"
        @pick-files="fileInput.click()"
      />

      <TrackList
        :title="heading"
        :tracks="library.visible.value"
        :sort="library.sort.value"
        :current-id="player.current.value?.id"
        :playing="player.playing.value"
        :empty="library.tracks.value.length === 0"
        @sort="library.sort.value = $event"
        @play="player.playAt($event, library.visible.value)"
        @edit="editing = $event"
        @favorite="library.toggleFavorite($event)"
        @remove="removeTrack"
        @pick-files="fileInput.click()"
      />
    </div>

    <PlayerBar
      :track="player.current.value"
      :playing="player.playing.value"
      :position="player.position.value"
      :duration="player.duration.value"
      :progress="player.progress.value"
      :volume="player.volume.value"
      :shuffle="player.shuffle.value"
      :repeat="player.repeat.value"
      :bins="player.spectrum.value"
      @toggle="player.toggle()"
      @next="player.next()"
      @prev="player.prev()"
      @seek="player.seek($event)"
      @volume="player.setVolume($event)"
      @shuffle="player.shuffle.value = !player.shuffle.value"
      @repeat="player.cycleRepeat()"
    />

    <TrackEditor v-if="editing" :track="editing" @save="saveEdit" @close="editing = null" />
    <div v-if="toast" class="toast">{{ toast }}</div>

    <input
      ref="fileInput"
      type="file"
      accept="audio/*"
      multiple
      hidden
      @change="onFiles($event.target.files); $event.target.value = ''"
    />
  </div>
</template>
