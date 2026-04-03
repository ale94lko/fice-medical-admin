<template>
  <q-page>
    <q-table
      class="table"
      selection="multiple"
      row-key="id"
      v-model:selected="selected"
      :rows-per-page-options="[20, 50, 100, t('all')]"
      :grid="showGrid"
      :title="t('tenants')"
      :rows="rows"
      :columns="columns"
      :rows-per-page-label="t('rowsPerPage')">
      <template v-slot:top>
        <q-btn
          no-caps
          color="primary"
          icon="add"
          :disable="loading"
          :label="t('addTenant')"
          @click="addTenant" />
        <q-space />
        <q-btn
          color="secondary"
          class="text-teal-10"
          icon="filter_alt"
          :disable="loading"
          :label="t('filters')"
          @click="showFilters" />
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            round
            icon="edit"
            color="primary"
            :size="siteBreakpoints.SM"
            @click="editRow(props.row)"
          />
          <q-btn
            flat
            round
            icon="delete"
            color="primary"
            :size="siteBreakpoints.SM"
            @click="deleteRow(props.row)"
          />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useSiteStore } from 'stores/site-store.js'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { siteBreakpoints, siteBreakpointsPx } from 'components/constants.js'

const $q = useQuasar()
const loading = ref(false)
const selected = ref([])

const siteStore = useSiteStore()
const { t } = useI18n()

// Load data when component is mounted
onMounted(async() => {
  await siteStore.getTenantList(t)
})

// Computed properties
const columns = computed(() => [
  {
    name: 'name',
    required: true,
    label: t('name'),
    align: 'left',
    field: row => row.name,
    sortable: true,
  },
  {
    name: 'domain',
    required: true,
    label: t('domain'),
    align: 'left',
    field: row => row.domain,
    sortable: true,
  },
  {
    name: 'planName',
    required: true,
    label: t('planName'),
    align: 'left',
    field: row => row.planName,
    sortable: false,
  },
  {
    name: 'actions',
    required: true,
    label: t('actions'),
    align: 'center',
    field: row => row.actions,
    sortable: false,
  },
])
const rows = computed(() => siteStore.tenantList)

// Responsive logic
const windowWidth = computed(() => $q.screen.width)
// TODO: take into account drawer width
const showGrid = computed(() => windowWidth.value <= siteBreakpointsPx.XXS)

// Methods
const addTenant = () => {
  console.log('Add Tenant')
}

const showFilters = () => {
  console.log('Show Filters')
}
function editRow(row) {
  console.log('Editar:', row)
}
function deleteRow(row) {
  console.log('Eliminar:', row)
}

</script>
