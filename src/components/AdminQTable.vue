<template>
  <q-table v-bind="tableBind">
    <template
      v-for="name in passthroughSlotNames"
      :key="name"
      #[name]="scope">
      <slot :name="name" v-bind="scope || {}" />
    </template>

    <template v-if="hasRowActions" #body-cell-actions="scope">
      <q-td :props="scope">
        <slot name="row-actions" :row="scope.row" />
      </q-td>
    </template>

    <template v-if="hasRowActions" #item="scope">
      <AdminTableGridItem
        :table-props="scope"
        :row-class="gridCardClass(scope.row)">
        <template #actions>
          <slot name="row-actions" :row="scope.row" />
        </template>
      </AdminTableGridItem>
    </template>
  </q-table>
</template>

<script setup>
import { computed, useAttrs, useSlots } from 'vue'
import AdminTableGridItem from './AdminTableGridItem.vue'

const props = defineProps({
  testId: { type: String, default: '' },
})

defineOptions({
  inheritAttrs: false,
})

const RESERVED_SLOTS = ['row-actions', 'body-cell-actions', 'item']

const slots = useSlots()
const attrs = useAttrs()

const hasRowActions = computed(() => Boolean(slots['row-actions']))

const tableBind = computed(() => {
  const bind = { ...attrs }
  if (props.testId) {
    bind['data-testid'] = props.testId
  }

  return bind
})

const passthroughSlotNames = computed(() =>
  Object.keys(slots).filter(name => !RESERVED_SLOTS.includes(name)),
)

function gridCardClass(row) {
  const fn = attrs.cardClassFn
  if (typeof fn === 'function') {
    return fn(row)
  }

  return ''
}
</script>
