<template>
  <div
    class="q-pa-xs col-xs-12"
    :class="rowClass">
    <q-card flat bordered class="admin-table-grid-card">
      <q-list dense class="q-pa-sm">
        <q-item
          v-for="col in displayCols"
          :key="col.name"
          class="q-px-none">
          <q-item-section>
            <q-item-label overline class="text-grey-7">
              {{ col.label }}
            </q-item-label>
            <q-item-label class="text-body2 text-weight-medium">
              {{ formatColValue(col) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
      <q-card-actions
        align="right"
        class="admin-table-grid-actions q-px-md q-pt-sm">
        <slot name="actions" :row="tableProps.row" />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tableProps: {
    type: Object,
    required: true,
  },
  rowClass: {
    type: [String, Array, Object],
    default: '',
  },
  excludeColumns: {
    type: Array,
    default: () => ['actions'],
  },
})

const displayCols = computed(() =>
  props.tableProps.cols.filter(
    col => !props.excludeColumns.includes(col.name),
  ),
)

function formatColValue(col) {
  const value = col.value
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return value
}
</script>
