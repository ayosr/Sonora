<script setup>
import { reactive } from 'vue'

const props = defineProps({ track: { type: Object, required: true } })
const emit = defineEmits(['save', 'close'])

const draft = reactive({
  title: props.track.title,
  artist: props.track.artist,
  album: props.track.album,
  tags: (props.track.tags || []).join(', '),
})
</script>

<template>
  <div class="veil" @click.self="emit('close')">
    <div class="sheet glass" role="dialog" aria-modal="true" aria-label="Edit track details">
      <h2>Edit details</h2>
      <div class="field-row"><label>Title</label><input v-model="draft.title" /></div>
      <div class="field-row"><label>Artist</label><input v-model="draft.artist" /></div>
      <div class="field-row"><label>Album</label><input v-model="draft.album" /></div>
      <div class="field-row">
        <label>Tags</label>
        <input v-model="draft.tags" placeholder="focus, jazz, late night" />
      </div>
      <div class="sheet-acts">
        <button class="btn" @click="emit('close')">Cancel</button>
        <button class="btn primary" @click="emit('save', { ...draft })">Save changes</button>
      </div>
    </div>
  </div>
</template>
