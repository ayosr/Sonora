<script setup>
import { ref } from 'vue'

const props = defineProps({
  collection: String,
  tag: String,
  tags: Array,
  playlists: Array,
  total: Number,
  favorites: Number,
  hot: Boolean,
})
const emit = defineEmits(['select', 'select-tag', 'new-playlist', 'pick-files'])

const naming = ref(false)
const name = ref('')

function submit() {
  if (name.value.trim()) emit('new-playlist', name.value.trim())
  name.value = ''
  naming.value = false
}
</script>

<template>
  <aside class="side glass">
    <div>
      <p class="eyebrow">Library</p>
      <nav class="nav">
        <button :class="{ on: collection === 'all' }" @click="emit('select', 'all')">
          All tracks <span class="n">{{ total }}</span>
        </button>
        <button :class="{ on: collection === 'recent' }" @click="emit('select', 'recent')">
          Recently added
        </button>
        <button :class="{ on: collection === 'favorites' }" @click="emit('select', 'favorites')">
          Favorites <span class="n">{{ favorites }}</span>
        </button>
      </nav>
    </div>

    <div>
      <p class="eyebrow">Playlists</p>
      <nav class="nav">
        <button
          v-for="p in playlists"
          :key="p.id"
          :class="{ on: collection === p.id }"
          @click="emit('select', p.id)"
        >
          {{ p.name }} <span class="n">{{ p.trackIds.length }}</span>
        </button>
        <button v-if="!naming" @click="naming = true">+ New playlist</button>
      </nav>
      <input
        v-if="naming"
        v-model="name"
        class="playlist-input"
        placeholder="Name it, then press Enter"
        autofocus
        @keyup.enter="submit"
        @blur="submit"
      />
    </div>

    <div v-if="tags.length">
      <p class="eyebrow">Tags</p>
      <div class="tags">
        <button
          v-for="t in tags"
          :key="t.name"
          class="tag"
          :class="{ on: tag === t.name }"
          @click="emit('select-tag', tag === t.name ? null : t.name)"
        >
          {{ t.name }} · {{ t.count }}
        </button>
      </div>
    </div>

    <div class="drop" :class="{ hot }" @click="emit('pick-files')">
      <strong>Drop files here</strong>
      <p>MP3, WAV, FLAC, M4A, OGG. Nothing leaves this device.</p>
    </div>
  </aside>
</template>

<style scoped>
.playlist-input {
  margin-top: 6px; width: 100%; border: 1px solid var(--edge);
  background: rgba(255, 255, 255, 0.6); border-radius: 12px; padding: 8px 12px;
  font: 500 13.5px var(--body); color: var(--ink); outline: none;
}
</style>
