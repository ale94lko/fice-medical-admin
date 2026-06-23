<template>
  <q-card
    flat
    bordered
    class="dashboard-stat-card"
    :data-testid="testId">
    <q-card-section class="dashboard-stat-card__body">
      <div
        class="dashboard-stat-card__icon"
        :style="{ background: iconBg, color: iconColor }">
        <q-icon :name="icon" size="22px" />
      </div>
      <div class="dashboard-stat-card__content">
        <div class="dashboard-stat-card__value">
          <q-skeleton
            v-if="loading"
            type="text"
            width="48px" />
          <template v-else>{{ displayValue }}</template>
        </div>
        <div class="dashboard-stat-card__label">{{ label }}</div>
        <div
          v-if="hint && !loading"
          class="dashboard-stat-card__hint">
          {{ hint }}
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  hint: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  iconColor: { type: String, default: '#0f766e' },
  iconBg: { type: String, default: 'rgba(15, 118, 110, 0.12)' },
  testId: { type: String, default: '' },
})

const displayValue = computed(() => {
  const v = props.value
  if (typeof v === 'number' && Number.isFinite(v)) {
    return v.toLocaleString()
  }

  return String(v ?? '—')
})
</script>
