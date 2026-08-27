<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({ bins: { type: Object, default: () => new Uint8Array(0) } })
const canvas = ref(null)

function draw() {
  const el = canvas.value
  if (!el) return
  const dpr = globalThis.devicePixelRatio || 1
  const w = el.clientWidth
  const h = el.clientHeight
  if (el.width !== w * dpr) {
    el.width = w * dpr
    el.height = h * dpr
  }
  const ctx = el.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const bins = props.bins
  const count = 22
  const gap = 2
  const barW = (w - gap * (count - 1)) / count
  const gradient = ctx.createLinearGradient(0, 0, w, 0)
  gradient.addColorStop(0, '#3d3e44')
  gradient.addColorStop(1, '#9a9ba1')
  ctx.fillStyle = gradient

  for (let i = 0; i < count; i++) {
    const source = bins.length ? bins[Math.floor((i / count) * bins.length)] / 255 : 0
    const barH = Math.max(2, source * h)
    const x = i * (barW + gap)
    const y = (h - barH) / 2
    ctx.beginPath()
    ctx.roundRect(x, y, barW, barH, barW / 2)
    ctx.fill()
  }
}

onMounted(draw)
watch(() => props.bins, draw)
</script>

<template>
  <canvas ref="canvas" class="spectrum" aria-hidden="true"></canvas>
</template>
