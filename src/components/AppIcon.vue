<script setup>
const paths = {
  play: 'M8 5v14l11-7z',
  pause: 'M6 5h4v14H6zm8 0h4v14h-4z',
  prev: 'M6 6h2v12H6zm3 6 9-6v12z',
  next: 'M16 6h2v12h-2zM6 6l9 6-9 6z',
  shuffle: 'M17 3l4 4-4 4V8h-2.2l-2 3-1.2-1.8L13.7 6H17V3zM3 6h4.3l7 10H17v-3l4 4-4 4v-3h-3.7L6.3 8H3V6zm0 10h4.3l1.6-2.3 1.2 1.8L8.3 18H3v-2z',
  repeat: 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z',
  search: 'M10 4a6 6 0 104.5 9.9l4.8 4.8 1.4-1.4-4.8-4.8A6 6 0 0010 4zm0 2a4 4 0 110 8 4 4 0 010-8z',
  heart: 'M12 21s-7.5-4.7-9.3-9A5 5 0 0112 5.6 5 5 0 0121.3 12c-1.8 4.3-9.3 9-9.3 9z',
  edit: 'M4 17.2V20h2.8L17 9.8 14.2 7 4 17.2zM19.7 6.3l-2-2a1 1 0 00-1.4 0L15 5.6 17.8 8.4 19.7 7a1 1 0 000-.7z',
  trash: 'M9 3h6l1 2h4v2H4V5h4l1-2zM6 9h12l-1 12H7L6 9z',
  plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z',
  folder: 'M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V6z',
  note: 'M9 18a3 3 0 11-2-2.8V4l11-2v12.2A3 3 0 1116 14V6.4L9 7.8V18z',
  clock: 'M12 2a10 10 0 100 20 10 10 0 000-20zm1 10V6h-2v8h6v-2h-4z',
}
defineProps({ name: { type: String, required: true } })
</script>

<template>
  <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="paths[name]" /></svg>
</template>
