<script setup>
import AppIcon from './AppIcon.vue'

defineProps({ modelValue: String, count: Number })
const emit = defineEmits(['update:modelValue', 'import'])
</script>

<template>
  <header class="bar glass">
    <div class="mark"><i></i> Sonora</div>
    <label class="search">
      <AppIcon name="search" style="width:15px;height:15px;fill:var(--ink-faint)" />
      <input
        :value="modelValue"
        type="search"
        placeholder="Search titles, artists, albums, tags"
        @input="emit('update:modelValue', $event.target.value)"
      />
    </label>
    <button class="btn primary" @click="emit('import')">
      <AppIcon name="plus" style="width:15px;height:15px;fill:currentColor" /> Add music
    </button>
  </header>
</template>
