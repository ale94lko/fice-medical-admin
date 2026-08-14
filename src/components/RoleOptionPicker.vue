<template>
  <div
    class="role-option-picker"
    :class="{
      'role-option-picker--readonly': readonly,
      'role-option-picker--loading': loading,
    }"
    :data-testid="testId">
    <div
      v-if="loading"
      class="role-option-picker__state">
      <q-spinner color="primary" size="28px" />
      <span>{{ loadingText }}</span>
    </div>

    <div
      v-else-if="!options.length"
      class="role-option-picker__state">
      <q-icon :name="defaultIcon || 'badge'" size="22px" />
      <span>{{ emptyText }}</span>
    </div>

    <div
      v-else
      class="role-option-picker__panel">
      <div
        v-if="!readonly"
        class="role-option-picker__toolbar">
        <q-btn
          no-caps
          outline
          dense
          color="primary"
          class="app-btn-outline"
          :disable="allSelected"
          :data-testid="`${testId}-select-all`"
          :label="selectAllText"
          @click="selectAll"/>
        <q-btn
          no-caps
          outline
          dense
          color="primary"
          class="app-btn-outline"
          :disable="noneSelected"
          :data-testid="`${testId}-deselect-all`"
          :label="deselectAllText"
          @click="deselectAll"/>
      </div>
      <div class="role-option-picker__grid">
        <label
          v-for="option in options"
          :key="option.value"
          class="role-option-picker__card">
          <q-checkbox
            dense
            :model-value="isSelected(option)"
            :disable="readonly"
            color="primary"
            keep-color
            class="role-option-picker__checkbox"
            :data-testid="`${testId}-${itemKey}-${option.value}`"
            @update:model-value="
              onToggle(option, Boolean($event))
            "
          />
          <span
            class="role-option-picker__icon"
            aria-hidden="true">
            <q-icon
              :name="roleIcon(option)"
              size="18px"
            />
          </span>
          <span class="role-option-picker__title">
            {{ option.label }}
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  toStoredPermissionId,
  toggleLeafSelection,
} from 'src/utils/tree-selection.js'

const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  testId: {
    type: String,
    default: 'role-option-picker',
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  loadingLabel: {
    type: String,
    default: '',
  },
  defaultIcon: {
    type: String,
    default: '',
  },
  itemKey: {
    type: String,
    default: 'role',
  },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const loadingText = computed(
  () => props.loadingLabel || t('appLoading'),
)
const emptyText = computed(
  () => props.emptyLabel || t('rolePickerEmpty'),
)
const selectAllText = computed(() => t('permissionSelectAll'))
const deselectAllText = computed(() => t('permissionDeselectAll'))

const selectedSet = computed(
  () => new Set((props.modelValue ?? []).map(value => String(value))),
)

const allValues = computed(
  () => (props.options ?? []).map(option => option.value),
)

const allSelected = computed(() => {
  const values = allValues.value
  if (!values.length) {
    return true
  }
  const selected = selectedSet.value

  return values.every(value => selected.has(String(value)))
})

const noneSelected = computed(() => {
  const selected = selectedSet.value

  return allValues.value.every(value => !selected.has(String(value)))
})

function isSelected(option) {
  return selectedSet.value.has(String(option.value))
}

function roleIcon(option) {
  if (props.defaultIcon) {
    return props.defaultIcon
  }
  const label = String(option?.label ?? '').toLowerCase()
  if (label.includes('admin')) {
    return 'admin_panel_settings'
  }
  if (label.includes('clinician') || label.includes('doctor')) {
    return 'medical_services'
  }
  if (label.includes('staff')) {
    return 'badge'
  }
  if (label.includes('user')) {
    return 'person'
  }

  return 'badge'
}

function sameSelection(nextValues) {
  const current = props.modelValue ?? []
  if (current.length !== nextValues.length) {
    return false
  }
  const currentSet = selectedSet.value

  return nextValues.every(value => currentSet.has(String(value)))
}

function emitSelection(nextValues) {
  if (sameSelection(nextValues)) {
    return
  }
  emit('update:modelValue', nextValues)
}

function onToggle(option, checked) {
  if (props.readonly || option?.value == null) {
    return
  }
  emitSelection(
    toggleLeafSelection(
      option.value,
      props.modelValue ?? [],
      checked,
    ),
  )
}

function selectAll() {
  if (props.readonly) {
    return
  }
  emitSelection(allValues.value.map(toStoredPermissionId))
}

function deselectAll() {
  if (props.readonly) {
    return
  }
  emitSelection([])
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.role-option-picker {
  width: 100%;

  &__panel {
    max-height: 280px;
    overflow: auto;
    padding: 4px 4px 8px;
    border: 1px solid rgba($primary, 0.16);
    border-radius: $radius-md;
    background: $secondary-2;
  }

  &__toolbar {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 8px 4px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    padding: 8px;
  }

  &__card {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    margin: 0;
    padding: 10px 10px 10px 8px;
    border: 1px solid $border-subtle;
    border-radius: 12px;
    background: $white;
    cursor: pointer;
  }

  &__checkbox {
    flex-shrink: 0;
  }

  &__icon {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba($primary, 0.12);
    color: $primary;
  }

  &__title {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1.3;
    color: $text-strong;
    word-break: break-word;
  }

  &__state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 120px;
    padding: 16px;
    border: 1px dashed $border-subtle;
    border-radius: $radius-md;
    color: $text-muted;
    font-size: 0.875rem;
    background: $surface-muted;
  }

  @media (max-width: 767px) {
    &__grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
