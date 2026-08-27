<script setup>
import AppIcon from './AppIcon.vue'
import { formatDuration, coverGradient, initial } from '../utils/format.js'

const props = defineProps({
  track: { type: Object, required: true },
  active: Boolean,
  playing: Boolean,
  index: { type: Number, default: 0 },
})
const emit = defineEmits(['play', 'edit', 'favorite', 'remove'])
</script>

<template>
  <div
    class="row"
    :class="{ playing: active }"
    :style="{ animationDelay: Math.min(index, 14) * 22 + 'ms' }"
    tabindex="0"
    role="button"
    :aria-label="`Play ${track.title} by ${track.artist}`"
    @click="emit('play')"
    @keyup.enter="emit('play')"
  >
    <div class="art" :style="{ background: coverGradient(track.title + track.artist) }">
      <div v-if="active && playing" class="bars"><i></i><i></i><i></i></div>
      <span v-else>{{ initial(track.title) }}</span>
    </div>

    <div class="t-main">
      <div class="t-title">{{ track.title }}</div>
      <div class="t-sub">{{ track.artist }}<template v-if="track.tags.length"> · {{ track.tags.join(', ') }}</template></div>
    </div>

    <div class="t-album">{{ track.album }}</div>
    <div class="t-dur">{{ formatDuration(track.duration) }}</div>

    <div class="row-acts" @click.stop>
      <button
        class="icon ghost"
        :title="track.favorite ? 'Remove from favorites' : 'Add to favorites'"
        :style="{ color: track.favorite ? 'var(--accent-2)' : 'var(--ink-faint)' }"
        @click="emit('favorite')"
      >
        <AppIcon name="heart" />
      </button>
      <button class="icon ghost" title="Edit details" style="color:var(--ink-faint)" @click="emit('edit')">
        <AppIcon name="edit" />
      </button>
      <button class="icon ghost" title="Remove from library" style="color:var(--ink-faint)" @click="emit('remove')">
        <AppIcon name="trash" />
      </button>
    </div>
  </div>
</template>
