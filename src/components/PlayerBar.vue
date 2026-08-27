<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import SpectrumCanvas from './SpectrumCanvas.vue'
import { formatDuration, coverGradient, initial } from '../utils/format.js'

const props = defineProps({
  track: Object,
  playing: Boolean,
  position: Number,
  duration: Number,
  progress: Number,
  volume: Number,
  shuffle: Boolean,
  repeat: String,
  bins: Object,
})
const emit = defineEmits(['toggle', 'next', 'prev', 'seek', 'volume', 'shuffle', 'repeat'])

const repeatLabel = computed(() =>
  props.repeat === 'one' ? 'Repeat one' : props.repeat === 'all' ? 'Repeat all' : 'Repeat off'
)

function onSeek(event) {
  const box = event.currentTarget.getBoundingClientRect()
  emit('seek', (event.clientX - box.left) / box.width)
}
</script>

<template>
  <footer class="player glass">
    <div class="now">
      <div
        class="disc"
        :class="{ spin: playing }"
        :style="{ background: track ? coverGradient(track.title + track.artist) : 'linear-gradient(140deg,#d6d6d9,#ececee)' }"
      >
        <span v-if="!playing">{{ track ? initial(track.title) : '' }}</span>
      </div>
      <div style="min-width:0">
        <div class="t-title">{{ track ? track.title : 'Nothing playing' }}</div>
        <div class="t-sub">{{ track ? track.artist : 'Pick a track to start' }}</div>
      </div>
    </div>

    <div class="controls">
      <div class="buttons">
        <button class="icon ghost" :style="{ color: shuffle ? 'var(--accent)' : 'var(--ink-faint)' }"
                title="Shuffle" @click="emit('shuffle')"><AppIcon name="shuffle" /></button>
        <button class="icon" title="Previous" @click="emit('prev')"><AppIcon name="prev" /></button>
        <button class="icon big" :title="playing ? 'Pause' : 'Play'" @click="emit('toggle')">
          <AppIcon :name="playing ? 'pause' : 'play'" />
        </button>
        <button class="icon" title="Next" @click="emit('next')"><AppIcon name="next" /></button>
        <button class="icon ghost" :style="{ color: repeat === 'off' ? 'var(--ink-faint)' : 'var(--accent)' }"
                :title="repeatLabel" @click="emit('repeat')">
          <AppIcon name="repeat" />
          <sup v-if="repeat === 'one'" style="font:600 9px var(--mono)">1</sup>
        </button>
      </div>
      <div class="seek">
        <time>{{ formatDuration(position) }}</time>
        <div class="track" role="slider" :aria-valuenow="Math.round(progress * 100)"
             aria-valuemin="0" aria-valuemax="100" aria-label="Seek" @click="onSeek">
          <i :style="{ width: (progress * 100).toFixed(2) + '%' }"></i>
        </div>
        <time>{{ formatDuration(duration) }}</time>
      </div>
    </div>

    <div class="meters">
      <SpectrumCanvas :bins="bins" />
      <input class="vol" type="range" min="0" max="1" step="0.01" :value="volume"
             aria-label="Volume" @input="emit('volume', $event.target.value)" />
    </div>
  </footer>
</template>
