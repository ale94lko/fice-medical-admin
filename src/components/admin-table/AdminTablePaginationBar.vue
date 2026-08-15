<template>
  <div
    class="admin-table-pagination row items-center justify-end"
    :class="{ 'admin-table-pagination--compact': isMobile }">
    <div
      class="admin-table-pagination__end row items-center">
      <p
        v-if="!isMobile"
        class="admin-table-pagination__summary q-mb-none">
        {{ summaryText }}
      </p>
      <div class="row items-center admin-table-pagination__controls">
        <q-select
          dense
          borderless
          emit-value
          map-options
          hide-bottom-space
          class="admin-table-pagination__per-page"
          :model-value="rowsPerPage"
          :options="rowsPerPageOptions"
          :disable="disable"
          :aria-label="t('rowsPerPage')"
          @update:model-value="emit('update:rowsPerPage', $event)"
        />
        <template v-if="isMobile">
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="chevron_left"
            class="admin-table-pagination__nav-btn"
            :disable="disable || page <= 1"
            :aria-label="t('adminTablePaginationPrev')"
            @click="emit('update:page', page - 1)"
          />
          <span class="admin-table-pagination__page-indicator">
            {{ page }} / {{ pagesNumber }}
          </span>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="chevron_right"
            class="admin-table-pagination__nav-btn"
            :disable="disable || page >= pagesNumber"
            :aria-label="t('adminTablePaginationNext')"
            @click="emit('update:page', page + 1)"
          />
        </template>
        <q-pagination
          v-else
          :model-value="page"
          :max="pagesNumber"
          :max-pages="6"
          direction-links
          boundary-links
          color="primary"
          size="sm"
          :disable="disable"
          @update:model-value="emit('update:page', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { drawerMobileMaxPx } from 'components/constants.js'

const props = defineProps({
  page: {
    type: Number,
    default: 1,
  },
  rowsPerPage: {
    type: Number,
    default: 20,
  },
  rowsNumber: {
    type: Number,
    default: 0,
  },
  rowsPerPageChoices: {
    type: Array,
    default: () => [20, 50, 100],
  },
  summaryKey: {
    type: String,
    default: 'adminTablePaginationSummary',
  },
  perPageKey: {
    type: String,
    default: 'adminTablePerPage',
  },
  disable: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:page', 'update:rowsPerPage'])

const { t } = useI18n()
const $q = useQuasar()
const isMobile = computed(
  () => $q.screen.width <= drawerMobileMaxPx,
)

const pagesNumber = computed(() => {
  if (!props.rowsNumber) {
    return 1
  }
  if (!props.rowsPerPage) {
    return 1
  }

  return Math.max(1, Math.ceil(props.rowsNumber / props.rowsPerPage))
})

const summaryText = computed(() => {
  const total = props.rowsNumber || 0
  if (!total) {
    return t(props.summaryKey, { from: 0, to: 0, total: 0 })
  }
  if (!props.rowsPerPage) {
    return t(props.summaryKey, { from: 1, to: total, total })
  }
  const from = (props.page - 1) * props.rowsPerPage + 1
  const to = Math.min(props.page * props.rowsPerPage, total)

  return t(props.summaryKey, { from, to, total })
})

const rowsPerPageOptions = computed(() =>
  props.rowsPerPageChoices.map(count => ({
    label: count === 0
      ? t('adminTablePerPageAll')
      : t(props.perPageKey, { count }),
    value: count,
  })),
)
</script>
