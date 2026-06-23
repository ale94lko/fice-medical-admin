<template>
  <div
    class="dashboard-donut"
    :data-testid="testId">
    <div
      v-if="loading"
      class="dashboard-donut__loading">
      <q-spinner color="primary" size="36px" />
    </div>
    <template v-else-if="total > 0">
      <div class="dashboard-donut__chart-wrap">
        <svg
          class="dashboard-donut__svg"
          :viewBox="`0 0 ${size} ${size}`"
          role="img"
          :aria-label="title">
          <circle
            class="dashboard-donut__track"
            :cx="center"
            :cy="center"
            :r="radius"
            fill="none"
            :stroke-width="stroke" />
          <circle
            v-for="(seg, idx) in arcSegments"
            :key="idx"
            class="dashboard-donut__segment"
            :cx="center"
            :cy="center"
            :r="radius"
            fill="none"
            :stroke="seg.color"
            :stroke-width="stroke"
            :stroke-dasharray="seg.dashArray"
            :stroke-dashoffset="seg.dashOffset"
            stroke-linecap="butt"
            :transform="`rotate(-90 ${center} ${center})`" />
        </svg>
        <div class="dashboard-donut__center">
          <div class="dashboard-donut__total">{{ total }}</div>
          <div class="dashboard-donut__total-label">{{ totalLabel }}</div>
        </div>
      </div>
      <ul class="dashboard-donut__legend">
        <li
          v-for="(seg, idx) in segments"
          :key="idx"
          class="dashboard-donut__legend-item">
          <span
            class="dashboard-donut__swatch"
            :style="{ background: seg.color }" />
          <span class="dashboard-donut__legend-label">{{ seg.label }}</span>
          <span class="dashboard-donut__legend-value">
            {{ seg.value }}
            <span class="dashboard-donut__legend-pct">
              ({{ pct(seg.value) }}%)
            </span>
          </span>
        </li>
      </ul>
    </template>
    <div
      v-else
      class="dashboard-donut__empty">
      {{ emptyLabel }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  segments: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  totalLabel: { type: String, default: '' },
  emptyLabel: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  testId: { type: String, default: '' },
})

const size = 120
const stroke = 18
const center = size / 2
const radius = (size - stroke) / 2
const circumference = 2 * Math.PI * radius

const total = computed(() =>
  props.segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0),
)

const arcSegments = computed(() => {
  let offset = 0
  const t = total.value
  if (t <= 0) {
    return []
  }

  return props.segments.map(seg => {
    const value = Number(seg.value) || 0
    const len = (value / t) * circumference
    const dashArray = `${len} ${circumference - len}`
    const dashOffset = -offset
    offset += len

    return {
      color: seg.color,
      dashArray,
      dashOffset,
    }
  })
})

function pct(value) {
  const t = total.value
  if (t <= 0) {
    return 0
  }

  return Math.round((Number(value) / t) * 100)
}
</script>
