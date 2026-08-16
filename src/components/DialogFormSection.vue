<template>
  <section
    v-if="!plain"
    class="dialog-form-section"
    :data-testid="testId || undefined">
    <button
      type="button"
      class="dialog-form-section__header"
      :data-testid="toggleTestId || undefined"
      :aria-expanded="modelValue ? 'true' : 'false'"
      @click="emit('update:modelValue', !modelValue)">
      <span class="dialog-form-section__title">{{ title }}</span>
      <span
        v-if="badge"
        class="dialog-form-section__badge"
        :class="badgeClass">
        {{ badge }}
      </span>
      <q-icon
        class="dialog-form-section__chevron"
        :name="modelValue ? 'expand_less' : 'expand_more'"/>
    </button>
    <div
      v-show="modelValue"
      class="dialog-form-section__body">
        <p
          v-if="helper"
          class="dialog-form-section__helper text-body2 text-grey-7">
          {{ helper }}
        </p>
        <div class="dialog-form-section__fields">
          <slot/>
        </div>
    </div>
  </section>
  <div
    v-else
    class="dialog-form-section-plain">
    <slot/>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: true },
  plain: { type: Boolean, default: false },
  title: { type: String, default: '' },
  helper: { type: String, default: '' },
  badge: { type: String, default: '' },
  badgeTone: { type: String, default: '' },
  testId: { type: String, default: '' },
  toggleTestId: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const badgeClass = computed(() => {
  if (props.badgeTone === 'required') {
    return 'dialog-form-section__badge--required'
  }
  if (props.badgeTone === 'future') {
    return 'dialog-form-section__badge--future'
  }

  return ''
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.dialog-form-section {
  grid-column: 1 / -1;
  border: 1px solid $border-subtle;
  border-radius: 12px;
  background: $surface;
  overflow: hidden;
}

.dialog-form-section__header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin: 0;
  padding: 12px 16px;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  color: $text-strong;
}

.dialog-form-section__title {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  font-size: 0.9375rem;
  line-height: 1.3;
}

.dialog-form-section__badge {
  flex-shrink: 0;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}

.dialog-form-section__badge--required {
  background: #ccfbf1;
  color: $primary;
}

.dialog-form-section__badge--future {
  background: #f3f4f6;
  color: #6b7280;
}

.dialog-form-section__chevron {
  flex-shrink: 0;
  font-size: 22px;
  color: $text-muted;
}

.dialog-form-section__body {
  padding: 0 16px 16px;
}

.dialog-form-section__helper {
  margin: 0 0 12px;
}

.dialog-form-section__fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  width: 100%;
}

.dialog-form-section-plain {
  display: contents;
}
</style>
