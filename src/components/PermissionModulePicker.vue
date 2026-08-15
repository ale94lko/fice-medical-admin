<template>
  <div
    class="permission-module-picker"
    :class="{
      'permission-module-picker--readonly': readonly,
      'permission-module-picker--loading': loading,
    }"
    :data-testid="testId">
    <div
      v-if="loading"
      class="permission-module-picker__state">
      <q-spinner color="primary" size="28px" />
      <span>{{ loadingText }}</span>
    </div>

    <div
      v-else-if="!nodes.length"
      class="permission-module-picker__state">
      <q-icon name="folder_off" size="22px" />
      <span>{{ emptyText }}</span>
    </div>

    <div
      v-else
      class="permission-module-picker__panel">
      <div
        v-if="!readonly"
        class="permission-module-picker__toolbar">
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
      <div class="permission-module-picker__grid">
        <section
          v-for="module in nodes"
          :key="moduleNodeKey(module)"
          class="permission-module-picker__card"
          :class="{
            'permission-module-picker__card--warning':
              moduleHasImplicationWarning(module),
          }">
          <div class="permission-module-picker__header">
            <q-checkbox
              dense
              :model-value="moduleCheckValue(module)"
              true-value="checked"
              false-value="unchecked"
              indeterminate-value="indeterminate"
              toggle-indeterminate
              toggle-order="ft"
              :disable="readonly"
              color="primary"
              keep-color
              indeterminate-icon="remove"
              class="permission-module-picker__module-checkbox"
              :data-testid="`${testId}-module-${moduleNodeKey(module)}`"
              @update:model-value="onModuleToggle(module, $event)"
            />
            <button
              type="button"
              class="permission-module-picker__header-main"
              :disabled="readonly"
              @click="toggleModuleExpanded(moduleNodeKey(module))">
              <span
                class="permission-module-picker__icon"
                aria-hidden="true">
                <q-icon
                  :name="moduleIcon(module)"
                  size="18px"
                />
              </span>
              <span class="permission-module-picker__title">
                {{ module.label }}
              </span>
              <span
                v-if="moduleHasImplicationWarning(module)"
                class="permission-module-picker__hint"
                :data-testid="`${testId}-module-${
                  moduleNodeKey(module)
                }-hint`"
                :aria-label="t('permissionImplicationWarning')"
                @click.stop.prevent>
                ?
                <q-tooltip
                  class="permission-module-picker__hint-tooltip"
                  anchor="top middle"
                  self="bottom middle"
                  :offset="[0, 6]">
                  {{ t('permissionImplicationWarning') }}
                </q-tooltip>
              </span>
              <span class="permission-module-picker__badge">
                {{ selectedCount(module) }}/{{ leafCount(module) }}
              </span>
              <q-icon
                :name="isExpanded(moduleNodeKey(module))
                  ? 'expand_less'
                  : 'expand_more'"
                size="20px"
                class="permission-module-picker__chevron"
              />
            </button>
          </div>

          <div
            v-if="isExpanded(moduleNodeKey(module))"
            class="permission-module-picker__body">
            <label
              v-for="permission in module.children"
              :key="permissionNodeKey(permission)"
              class="permission-module-picker__permission">
              <q-checkbox
                dense
                :model-value="isPermissionSelected(permission)"
                :disable="readonly"
                color="primary"
                keep-color
                class="permission-module-picker__permission-checkbox"
                :data-testid="`${testId}-permission-${
                  permissionNodeKey(permission)
                }`"
                @update:model-value="
                  onPermissionToggle(permission, Boolean($event))
                "
              />
              <span class="permission-module-picker__permission-label">
                {{ permission.label }}
              </span>
            </label>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  collectAllLeafValues,
  collectLeafValues,
  moduleNodeKey,
  permissionNodeKey,
  toggleBranchSelection,
  toggleLeafSelection,
  toStoredPermissionId,
} from 'src/utils/tree-selection.js'
import { moduleKeysWithMissingViewImplications } from
  'src/utils/permission-implication.js'

const props = defineProps({
  nodes: {
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
    default: 'permission-module-picker',
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  loadingLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const expandedByModuleId = ref({})

const loadingText = computed(
  () => props.loadingLabel || t('appLoading'),
)
const emptyText = computed(
  () => props.emptyLabel || t('permissionTreeEmpty'),
)
const selectAllText = computed(() => t('permissionSelectAll'))
const deselectAllText = computed(() => t('permissionDeselectAll'))

const selectedSet = computed(
  () => new Set((props.modelValue ?? []).map(value => String(value))),
)

const allLeaves = computed(() => collectAllLeafValues(props.nodes))

const allSelected = computed(() => {
  const leaves = allLeaves.value
  if (!leaves.length) {
    return true
  }
  const selected = selectedSet.value

  return leaves.every(value => selected.has(String(value)))
})

const noneSelected = computed(() => {
  const selected = selectedSet.value

  return allLeaves.value.every(value => !selected.has(String(value)))
})

const warningModuleKeys = computed(() =>
  moduleKeysWithMissingViewImplications(
    props.nodes,
    props.modelValue,
  ),
)

function moduleHasImplicationWarning(module) {
  const key = moduleNodeKey(module)
  if (key == null) {
    return false
  }

  return warningModuleKeys.value.has(String(key))
}

watch(
  () => props.nodes,
  nodes => {
    const next = { ...expandedByModuleId.value }
    for (const module of nodes ?? []) {
      const key = moduleNodeKey(module)
      if (key != null && next[key] == null) {
        next[key] = false
      }
    }
    expandedByModuleId.value = next
  },
  { immediate: true },
)

function isExpanded(moduleId) {
  return expandedByModuleId.value[moduleId] === true
}

function toggleModuleExpanded(moduleId) {
  expandedByModuleId.value = {
    ...expandedByModuleId.value,
    [moduleId]: !isExpanded(moduleId),
  }
}

function moduleIcon(module) {
  const label = String(module?.label ?? '').toLowerCase()
  if (label.includes('user')) {
    return 'people'
  }
  if (label.includes('tenant')) {
    return 'apartment'
  }
  if (label.includes('role')) {
    return 'badge'
  }
  if (label.includes('plan')) {
    return 'paid'
  }
  if (label.includes('catalog')) {
    return 'menu_book'
  }
  if (label.includes('ai')) {
    return 'psychology'
  }

  return 'folder'
}

function leafValuesFor(module) {
  return collectLeafValues(module)
}

function leafCount(module) {
  return leafValuesFor(module).length
}

function selectedCount(module) {
  const selected = selectedSet.value

  return leafValuesFor(module).filter(
    value => selected.has(String(value)),
  ).length
}

function moduleCheckValue(module) {
  const leafValues = leafValuesFor(module)
  if (!leafValues.length) {
    return 'unchecked'
  }
  const selected = selectedSet.value
  let count = 0
  for (const value of leafValues) {
    if (selected.has(String(value))) {
      count += 1
    }
  }
  if (count === 0) {
    return 'unchecked'
  }
  if (count === leafValues.length) {
    return 'checked'
  }

  return 'indeterminate'
}

function isPermissionSelected(permission) {
  const key = permissionNodeKey(permission)
  if (key == null) {
    return false
  }

  return selectedSet.value.has(String(key))
}

function samePermissionSelection(nextValues) {
  const current = props.modelValue ?? []
  if (current.length !== nextValues.length) {
    return false
  }
  const currentSet = selectedSet.value

  return nextValues.every(value => currentSet.has(String(value)))
}

function emitSelection(nextValues) {
  if (samePermissionSelection(nextValues)) {
    return
  }
  emit('update:modelValue', nextValues)
}

function onModuleToggle(module, value) {
  if (props.readonly) {
    return
  }
  emitSelection(
    toggleBranchSelection(
      module,
      props.modelValue ?? [],
      value === 'checked',
    ),
  )
}

function onPermissionToggle(permission, checked) {
  const key = permissionNodeKey(permission)
  if (props.readonly || key == null) {
    return
  }
  emitSelection(
    toggleLeafSelection(key, props.modelValue ?? [], checked),
  )
}

function selectAll() {
  if (props.readonly) {
    return
  }
  emitSelection(allLeaves.value.map(toStoredPermissionId))
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

.permission-module-picker {
  width: 100%;

  &__panel {
    max-height: 420px;
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
    border: 1px solid $border-subtle;
    border-radius: 12px;
    background: $white;
    overflow: hidden;
  }

  &__card--warning {
    background: #fff7ed;
    border-color: #fdba74;
  }

  &__card--warning &__icon {
    background: rgba(#ea580c, 0.14);
    color: #c2410c;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    padding: 10px 10px 10px 8px;
  }

  &__header-main {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 1 auto;
    min-width: 0;
    padding: 0;
    border: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;
    color: $text-strong;
  }

  &__header-main:disabled {
    cursor: default;
  }

  &__module-checkbox {
    flex-shrink: 0;
    margin-top: 6px;
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
  }

  &__hint {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: #ffedd5;
    color: #c2410c;
    font-size: 0.8125rem;
    font-weight: 700;
    line-height: 1;
    cursor: help;
  }

  &__badge {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba($primary, 0.1);
    color: $primary;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.4;
  }

  &__chevron {
    flex-shrink: 0;
    color: $text-muted;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 12px 12px 44px;
  }

  &__permission {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
    cursor: pointer;
  }

  &__permission-label {
    font-size: 0.8125rem;
    font-weight: 400;
    line-height: 1.35;
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
