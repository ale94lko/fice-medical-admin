<template>
  <q-page class="admin-page">
    <AppLoadingOverlay
      scope="content"
      :showing="pageOverlayShowing"
      :message="pageOverlayMessage" />

    <div class="row items-center q-mb-md q-col-gutter-sm">
      <div class="col">
        <div class="text-h6">
          {{ t('referenceDataPlacesOfService') }}
        </div>
        <div class="text-caption text-grey-7">
          {{ t('referenceDataPlacesOfServiceSubtitle') }}
        </div>
      </div>
      <div class="col-auto row q-gutter-sm">
        <q-btn
          outline
          no-caps
          color="primary"
          class="app-btn-outline"
          icon="refresh"
          :disable="loading"
          :label="t('dashboardRefresh')"
          :data-testid="tid('btn', 'refresh')"
          @click="loadPlaces" />
        <q-btn
          outline
          no-caps
          color="primary"
          class="app-btn-outline"
          icon="cloud_upload"
          :label="t('referenceDataImport')"
          :data-testid="tid('btn', 'import')"
          @click="goImport" />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-4">
        <q-select
          v-model="selectedTenantId"
          outlined
          dense
          emit-value
          map-options
          clearable
          use-input
          input-debounce="0"
          :options="tenantOptionsFiltered"
          :loading="tenantsLoading"
          :label="t('tenants')"
          :data-testid="tid('select', 'tenant')"
          @filter="filterTenants"
          @update:model-value="onTenantChange" />
      </div>
      <div class="col-12 col-md-4">
        <q-select
          v-model="selectedSubtenantId"
          outlined
          dense
          emit-value
          map-options
          clearable
          :disable="!selectedTenantId"
          :options="subtenantOptions"
          :loading="subtenantsLoading"
          :label="t('userAllowedSubTenants')"
          :data-testid="tid('select', 'subtenant')"
          @update:model-value="onSubtenantChange" />
      </div>
      <div class="col-12 col-md-4 flex items-center">
        <q-checkbox
          v-model="includeDisabled"
          :label="t('referenceDataIncludeDisabled')"
          :data-testid="tid('check', 'include-disabled')"
          @update:model-value="loadPlaces" />
      </div>
    </div>

    <q-banner
      v-if="clinicHint"
      rounded
      class="bg-blue-1 text-grey-9 q-mb-md"
      dense>
      {{ clinicHint }}
    </q-banner>

    <q-banner
      v-if="errorMessage"
      rounded
      class="bg-negative text-white q-mb-md">
      {{ errorMessage }}
    </q-banner>

    <AdminQTable
      class="table admin-data-table"
      :test-id="tableTestId"
      row-key="code"
      :rows="rows"
      :columns="columns"
      :loading="false"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
      :rows-per-page-label="t('rowsPerPage')">
      <template #body-cell-active="scope">
        <q-td :props="scope">
          <q-toggle
            :model-value="Boolean(scope.row.active)"
            color="primary"
            dense
            :disable="busyCode === scope.row.code"
            :data-testid="rowTid(scope.row.code, 'global')"
            @update:model-value="
              v => onToggleGlobal(scope.row, v)
            " />
        </q-td>
      </template>
      <template #body-cell-enabled_for_clinic="scope">
        <q-td :props="scope">
          <q-toggle
            :model-value="Boolean(scope.row.enabled_for_clinic)"
            color="teal"
            dense
            :disable="
              !clinicContextReady || busyCode === scope.row.code
            "
            :data-testid="rowTid(scope.row.code, 'clinic')"
            @update:model-value="
              v => onToggleClinic(scope.row, v)
            " />
        </q-td>
      </template>
    </AdminQTable>

    <div
      v-if="!loading && !errorMessage && rows.length === 0"
      class="text-center text-grey-7 q-pa-lg">
      {{ t('referenceDataEmptyPlaces') }}
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { apiInstance } from 'boot/axios'
import {
  apiPaths,
  quasarNotifyTypes,
  quasarTableAlign,
  referenceDataCatalogCodes,
  tenantFieldKeys,
} from 'components/constants.js'
import {
  mapTenant,
  tenantSubTenantsPath,
} from 'components/helpers.js'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import { useAdminPageTestIds } from 'src/composables/useAdminPageTestIds.js'
import { usePageLoadingOverlay }
  from 'src/composables/usePageLoadingOverlay.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { fetchAllPaginatedRaw }
  from 'src/utils/permission-catalog-tree.js'
import {
  listPlacesOfService,
  patchPlaceOfServiceStatus,
  putPlaceOfServiceClinicAvailability,
  referenceDataErrorMessage,
} from 'src/services/reference-data-api.js'

const {
  tid,
  rowTid,
  tableTestId,
} = useAdminPageTestIds('ref-pos')

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const busyCode = ref(null)
const rows = ref([])
const errorMessage = ref('')
const includeDisabled = ref(true)

const tenantsLoading = ref(false)
const subtenantsLoading = ref(false)
const tenantOptions = ref([])
const tenantOptionsFiltered = ref([])
const subtenantOptions = ref([])
const selectedTenantId = ref(null)
const selectedSubtenantId = ref(null)

const { showing: pageOverlayShowing, message: pageOverlayMessage } =
  usePageLoadingOverlay({ loading, saving })

const clinicContextReady = computed(
  () => Number.isFinite(Number(selectedTenantId.value))
    && Number.isFinite(Number(selectedSubtenantId.value)),
)

const clinicHint = computed(() => {
  if (clinicContextReady.value) {
    return t('referenceDataClinicOverrideReady')
  }

  return t('referenceDataClinicOverrideHint')
})

const columns = computed(() => [
  {
    name: 'code',
    label: t('referenceDataCode'),
    align: quasarTableAlign.left,
    field: 'code',
  },
  {
    name: 'display_name',
    label: t('name'),
    align: quasarTableAlign.left,
    field: row => row.display_name || row.name || '—',
  },
  {
    name: 'description',
    label: t('description'),
    align: quasarTableAlign.left,
    field: row => row.description || '—',
  },
  {
    name: 'active',
    label: t('referenceDataGlobalActive'),
    align: quasarTableAlign.left,
    field: 'active',
  },
  {
    name: 'enabled_for_clinic',
    label: t('referenceDataClinicEnabled'),
    align: quasarTableAlign.left,
    field: 'enabled_for_clinic',
  },
  {
    name: 'version',
    label: t('referenceDataActiveVersion'),
    align: quasarTableAlign.left,
    field: row => row.version || '—',
  },
])

function extractSubtenantList(root) {
  if (!root) {
    return []
  }
  if (Array.isArray(root)) {
    return root
  }
  if (Array.isArray(root.items)) {
    return root.items
  }

  return []
}

function mapSubtenantOptions(list) {
  return (list || [])
    .map(row => {
      const idNum = Number(row?.id)
      if (!Number.isFinite(idNum)) {
        return null
      }
      const name = String(row?.name ?? '').trim()
      const code = String(row?.code ?? '').trim()
      let label = name || code || String(idNum)
      if (name && code) {
        label = `${name} (${code})`
      }

      return { label, value: idNum }
    })
    .filter(Boolean)
}

async function loadTenants() {
  tenantsLoading.value = true
  try {
    const raw = await fetchAllPaginatedRaw(apiPaths.tenantsList)
    const mapped = raw
      .map(mapTenant)
      .filter(Boolean)
      .map(row => ({
        label: row[tenantFieldKeys.name] || String(row.id),
        value: Number(row.id),
      }))
      .filter(o => Number.isFinite(o.value))
    tenantOptions.value = mapped
    tenantOptionsFiltered.value = mapped.slice()
  } catch (error) {
    tenantOptions.value = []
    tenantOptionsFiltered.value = []
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.warning,
        message: t('tenantListError'),
      })
    }
  } finally {
    tenantsLoading.value = false
  }
}

function filterTenants(val, update) {
  update(() => {
    const needle = String(val || '').toLowerCase()
    if (!needle) {
      tenantOptionsFiltered.value = tenantOptions.value.slice()

      return
    }
    tenantOptionsFiltered.value = tenantOptions.value.filter(o =>
      String(o.label).toLowerCase().includes(needle),
    )
  })
}

async function loadSubtenants(tenantId) {
  selectedSubtenantId.value = null
  subtenantOptions.value = []
  const id = Number(tenantId)
  if (!Number.isFinite(id)) {
    return
  }
  subtenantsLoading.value = true
  try {
    const res = await apiInstance.get(tenantSubTenantsPath(id))
    subtenantOptions.value = mapSubtenantOptions(
      extractSubtenantList(res.data?.data),
    )
  } catch (error) {
    subtenantOptions.value = []
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.warning,
        message: t('userSubtenantsLoadError'),
      })
    }
  } finally {
    subtenantsLoading.value = false
  }
}

function buildPlacesQuery() {
  const query = {
    'include_disabled': Boolean(includeDisabled.value),
  }
  if (clinicContextReady.value) {
    query['tenant_id'] = Number(selectedTenantId.value)
    query['subtenant_id'] = Number(selectedSubtenantId.value)
  }

  return query
}

async function loadPlaces() {
  loading.value = true
  errorMessage.value = ''
  try {
    rows.value = await listPlacesOfService(buildPlacesQuery())
  } catch (error) {
    rows.value = []
    if (!isAuthSessionEndUIError(error)) {
      errorMessage.value =
        referenceDataErrorMessage(error)
        || t('referenceDataPlacesLoadError')
    }
  } finally {
    loading.value = false
  }
}

async function onTenantChange(tenantId) {
  await loadSubtenants(tenantId)
  await loadPlaces()
}

async function onSubtenantChange() {
  await loadPlaces()
}

async function onToggleGlobal(row, active) {
  if (!row?.code) {
    return
  }
  busyCode.value = row.code
  saving.value = true
  const previous = Boolean(row.active)
  row.active = active
  try {
    await patchPlaceOfServiceStatus(row.code, active)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('referenceDataStatusUpdated'),
    })
  } catch (error) {
    row.active = previous
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message:
          referenceDataErrorMessage(error)
          || t('referenceDataStatusUpdateError'),
      })
    }
  } finally {
    busyCode.value = null
    saving.value = false
  }
}

async function onToggleClinic(row, enabled) {
  if (!row?.code || !clinicContextReady.value) {
    return
  }
  busyCode.value = row.code
  saving.value = true
  const previous = Boolean(row.enabled_for_clinic)
  row['enabled_for_clinic'] = enabled
  try {
    await putPlaceOfServiceClinicAvailability(
      row.code,
      Number(selectedTenantId.value),
      Number(selectedSubtenantId.value),
      enabled,
    )
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('referenceDataClinicUpdated'),
    })
  } catch (error) {
    row['enabled_for_clinic'] = previous
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message:
          referenceDataErrorMessage(error)
          || t('referenceDataClinicUpdateError'),
      })
    }
  } finally {
    busyCode.value = null
    saving.value = false
  }
}

function goImport() {
  router.push({
    path: '/reference-data/imports',
    query: {
      'catalog_code': referenceDataCatalogCodes.placeOfService,
      mode: 'upload',
    },
  })
}

onMounted(async() => {
  await loadTenants()
  await loadPlaces()
})
</script>
