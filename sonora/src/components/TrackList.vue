<script setup>
import TrackRow from './TrackRow.vue'
import { SORTS } from '../utils/library.js'

const props = defineProps({
  title: String,
  tracks: Array,
  sort: String,
  currentId: String,
  playing: Boolean,
  empty: Boolean,
})
const emit = defineEmits(['sort', 'play', 'edit', 'favorite', 'remove', 'pick-files'])

const labels = { added: 'Added', title: 'Title', artist: 'Artist', duration: 'Length' }
</script>

<template>
  <section class="list glass">
    <div class="list-head">
      <h1>{{ title }}</h1>
      <span>{{ tracks.length }} {{ tracks.length === 1 ? 'track' : 'tracks' }}</span>
      <div class="sorts">
        <button
          v-for="key in SORTS"
          :key="key"
          :class="{ on: sort === key }"
          @click="emit('sort', key)"
        >
          {{ labels[key] }}
        </button>
      </div>
    </div>

    <div v-if="tracks.length" class="rows">
      <TrackRow
        v-for="(track, i) in tracks"
        :key="track.id"
        :track="track"
        :index="i"
        :active="track.id === currentId"
        :playing="playing"
        @play="emit('play', i)"
        @edit="emit('edit', track)"
        @favorite="emit('favorite', track.id)"
        @remove="emit('remove', track.id)"
      />
    </div>

    <div v-else class="empty">
      <h2>{{ empty ? 'Your library is empty' : 'Nothing matches that' }}</h2>
      <p>{{ empty ? 'Add a few files to get started. They stay on your machine.' : 'Try a different search, tag or collection.' }}</p>
      <button v-if="empty" class="btn primary" @click="emit('pick-files')">Choose files</button>
    </div>
  </section>
</template>
