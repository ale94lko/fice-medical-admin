<template>
  <div
    class="dashboard-bar-chart"
    :data-testid="testId">
    <div
      v-if="loading"
      class="dashboard-bar-chart__loading">
      <q-skeleton
        v-for="n in 5"
        :key="n"
        type="rect"
        height="28px"
        class="q-mb-sm" />
    </div>
    <template v-else-if="items.length > 0">
      <div
        v-for="(item, idx) in items"
        :key="idx"
        class="dashboard-bar-chart__row">
        <div
          class="dashboard-bar-chart__label"
          :title="item.label">
          {{ item.label }}
        </div>
        <div class="dashboard-bar-chart__track-wrap">
          <div class="dashboard-bar-chart__track">
            <div
              class="dashboard-bar-chart__fill"
              :style="{
                width: `${barWidth(item.value)}%`,
                background: item.color,
              }" />
          </div>
          <span class="dashboard-bar-chart__value">{{ item.value }}</span>
        </div>
      </div>
    </template>
    <div
      v-else
      class="dashboard-bar-chart__empty">
      {{ emptyLabel }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyLabel: { type: String, default: '' },
  testId: { type: String, default: '' },
})

const maxValue = computed(() => {
  let max = 0
  for (const item of props.items) {
    const v = Number(item.value) || 0
    if (v > max) {
      max = v
    }
  }

  return max || 1
})

function barWidth(value) {
  const v = Number(value) || 0

  return Math.max(4, Math.round((v / maxValue.value) * 100))
}
</script>
