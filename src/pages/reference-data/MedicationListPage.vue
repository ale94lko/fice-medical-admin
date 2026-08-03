<template>
  <q-page class="admin-page">
    <AppLoadingOverlay
      scope="content"
      :showing="pageOverlayShowing"
      :message="pageOverlayMessage" />

    <div class="row items-center q-mb-md q-col-gutter-sm">
      <div class="col">
        <div class="text-h6">{{ t('referenceDataMedications') }}</div>
        <div class="text-caption text-grey-7">
          {{ t('referenceDataMedicationsSubtitle') }}
        </div>
      </div>
      <div class="col-auto row q-gutter-sm">
        <q-btn
          outline
          no-caps
          color="primary"
          class="app-btn-outline"
          icon="refresh"
          :disable="loading || catalogLoading"
          :label="t('dashboardRefresh')"
          :data-testid="tid('btn', 'refresh')"
          @click="reloadPage" />
      </div>
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row items-start q-col-gutter-md">
          <div class="col">
            <div class="text-subtitle1 text-weight-medium">
              {{ catalogCardTitle }}
            </div>
            <div class="text-caption text-grey-7 q-mt-xs">
              {{ t('referenceDataAuthority') }}:
              {{ catalog?.source_authority || '—' }}
            </div>
            <div class="text-caption text-grey-7">
              {{ t('referenceDataActiveVersion') }}:
              {{ catalog?.active_version || '—' }}
            </div>
            <div v-if="catalog?.source_url" class="q-mt-xs">
              <a
                :href="catalog.source_url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary text-caption">
                {{ t('referenceDataSourceLink') }}
              </a>
            </div>
          </div>
          <div class="col-auto column q-gutter-y-sm items-end">
            <q-btn
              unelevated
              no-caps
              color="primary"
              class="primary-action"
              icon="cloud_download"
              :disable="!canAutoImport"
              :label="t('referenceDataImportFromSource')"
              :data-testid="tid('btn', 'from-source')"
              @click="goFromSource" />
            <div class="row q-gutter-sm">
              <q-btn
                outline
                no-caps
                color="primary"
                class="app-btn-outline"
                icon="upload_file"
                :disable="!canImport"
                :label="t('referenceDataUploadFile')"
                :data-testid="tid('btn', 'upload')"
                @click="goUpload" />
              <q-btn
                outline
                no-caps
                color="primary"
                class="app-btn-outline"
                icon="history"
                :label="t('referenceDataViewImportJobs')"
                :data-testid="tid('btn', 'jobs')"
                @click="goJobs" />
            </div>
          </div>
        </div>
        <q-banner
          dense
          rounded
          class="bg-blue-1 text-grey-9 q-mt-md">
          {{ t('referenceDataMedicationMasterHint') }}
        </q-banner>
      </q-card-section>
    </q-card>

    <q-banner
      v-if="errorMessage"
      rounded
      class="bg-negative text-white q-mb-md">
      {{ errorMessage }}
    </q-banner>

    <div class="text-subtitle1 q-mb-sm">
      {{ t('referenceDataMedicationBrowse') }}
    </div>

    <AdminQTable
      class="table admin-data-table"
      :test-id="tableTestId"
      row-key="id"
      binary-state-sort
      v-model:pagination="tablePagination"
      :rows-per-page-options="[10, 20, 50, 100]"
      :rows="rows"
      :columns="columns"
      :loading="false"
      :rows-per-page-label="t('rowsPerPage')"
      @request="onTableRequest">
      <template #top>
        <q-input
          v-model="searchDraft"
          outlined
          dense
          clearable
          debounce="400"
          class="q-mr-md"
          style="min-width: 220px"
          :label="t('referenceDataSearch')"
          :data-testid="tid('input', 'search')"
          @update:model-value="onSearchChange" />
        <q-select
          v-model="activeFilter"
          outlined
          dense
          emit-value
          map-options
          clearable
          class="q-mr-md"
          style="min-width: 160px"
          :options="activeFilterOptions"
          :label="t('status')"
          :data-testid="tid('select', 'active')"
          @update:model-value="onActiveFilterChange" />
        <q-space />
      </template>
      <template #body-cell-active="scope">
        <q-td :props="scope">
          <q-badge
            outline
            :color="scope.row.active ? 'positive' : 'grey'">
            {{
              scope.row.active
                ? t('tenantStatusActive')
                : t('tenantStatusInactive')
            }}
          </q-badge>
        </q-td>
      </template>
      <template #row-actions="{ row }">
        <q-btn
          flat
          round
          icon="visibility"
          color="primary"
          :size="siteBreakpoints.SM"
          :data-testid="rowTid(row.id, 'view')"
          :title="t('referenceDataViewDetail')"
          :aria-label="t('referenceDataViewDetail')"
          @click="openDetail(row)" />
      </template>
    </AdminQTable>

    <div
      v-if="!loading && !errorMessage && rows.length === 0"
      class="text-center text-grey-7 q-pa-lg">
      {{ t('referenceDataEmptyMedications') }}
    </div>

    <div class="text-subtitle1 q-mt-lg q-mb-sm">
      {{ t('referenceDataRecentMedicationJobs') }}
    </div>
    <AdminQTable
      class="table admin-data-table"
      :test-id="tid('jobs', 'table')"
      row-key="id"
      :rows="recentJobs"
      :columns="jobColumns"
      :loading="false"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination>
      <template #body-cell-status="scope">
        <q-td :props="scope">
          <q-badge :color="jobStatusColor(scope.row.status)">
            {{ scope.row.status || '—' }}
          </q-badge>
        </q-td>
      </template>
      <template #row-actions="{ row }">
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          icon="open_in_new"
          :label="t('referenceDataViewLogs')"
          :data-testid="rowTid(row.id, 'job-open')"
          @click="goJobDetail(row)" />
      </template>
    </AdminQTable>

    <q-drawer
      v-model="detailOpen"
      side="right"
      overlay
      bordered
      :width="420"
      class="bg-white"
      :data-testid="tid('detail', 'drawer')">
      <div v-if="detailRow" class="q-pa-md">
        <div class="row items-center q-mb-md">
          <div class="col text-subtitle1 text-weight-medium">
            {{ detailRow.name || detailRow.code }}
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            :title="t('close')"
            @click="detailOpen = false" />
        </div>
        <div class="q-gutter-y-md">
          <div
            v-for="item in detailFields"
            :key="item.key">
            <div class="text-caption text-grey-7">{{ item.label }}</div>
            <div class="text-body2 text-grey-9">{{ item.value }}</div>
          </div>
        </div>
      </div>
    </q-drawer>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  quasarNotifyTypes,
  quasarTableAlign,
  referenceDataCatalogCodes,
  referenceDataImportStatuses,
  referenceDataMedicationSortFields,
  siteBreakpoints,
} from 'components/constants.js'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import { useAdminPageTestIds } from 'src/composables/useAdminPageTestIds.js'
import { usePageLoadingOverlay }
  from 'src/composables/usePageLoadingOverlay.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  getMedicationById,
  isReferenceCatalogImportable,
  listImports,
  listMedications,
  listReferenceCatalogs,
  referenceDataErrorMessage,
  supportsReferenceAutoDownload,
} from 'src/services/reference-data-api.js'

const {
  tid,
  rowTid,
  tableTestId,
} = useAdminPageTestIds('ref-medications')

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()

const loading = ref(false)
const catalogLoading = ref(false)
const jobsLoading = ref(false)
const catalog = ref(null)
const rows = ref([])
const recentJobs = ref([])
const errorMessage = ref('')
const detailOpen = ref(false)
const detailRow = ref(null)
const searchDraft = ref('')
const searchApplied = ref('')
const activeFilter = ref(true)

const tablePagination = ref({
  sortBy: referenceDataMedicationSortFields.name,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

const pageLoading = computed(
  () => loading.value || catalogLoading.value || jobsLoading.value,
)
const { showing: pageOverlayShowing, message: pageOverlayMessage } =
  usePageLoadingOverlay({ loading: pageLoading })

const canImport = computed(
  () => isReferenceCatalogImportable(catalog.value),
)
const canAutoImport = computed(
  () => supportsReferenceAutoDownload(catalog.value),
)

const catalogCardTitle = computed(() =>
  catalog.value?.name
  || t('referenceDataMedications'),
)

const activeFilterOptions = computed(() => [
  { label: t('tenantStatusActive'), value: true },
  { label: t('tenantStatusInactive'), value: false },
])

const columns = computed(() => [
  {
    name: 'code',
    label: t('referenceDataCode'),
    align: quasarTableAlign.left,
    field: 'code',
    sortable: true,
  },
  {
    name: 'name',
    label: t('name'),
    align: quasarTableAlign.left,
    field: 'name',
    sortable: true,
  },
  {
    name: 'generic_name',
    label: t('referenceDataGenericName'),
    align: quasarTableAlign.left,
    field: row => row.generic_name || '—',
    sortable: true,
  },
  {
    name: 'active',
    label: t('status'),
    align: quasarTableAlign.left,
    field: 'active',
  },
  {
    name: 'version',
    label: t('referenceDataActiveVersion'),
    align: quasarTableAlign.left,
    field: row => row.version || '—',
  },
  {
    name: 'actions',
    label: t('actions'),
    align: quasarTableAlign.right,
    field: 'id',
  },
])

const jobColumns = computed(() => [
  {
    name: 'id',
    label: 'ID',
    align: quasarTableAlign.left,
    field: 'id',
  },
  {
    name: 'version_label',
    label: t('referenceDataVersionLabel'),
    align: quasarTableAlign.left,
    field: row => row.version_label || '—',
  },
  {
    name: 'status',
    label: t('status'),
    align: quasarTableAlign.left,
    field: 'status',
  },
  {
    name: 'created_at',
    label: t('referenceDataCreatedAt'),
    align: quasarTableAlign.left,
    field: row => row.created_at || '—',
  },
  {
    name: 'actions',
    label: t('actions'),
    align: quasarTableAlign.right,
    field: 'id',
  },
])

const detailFields = computed(() => {
  const row = detailRow.value
  if (!row) {
    return []
  }

  return [
    { key: 'code', label: t('referenceDataCode'), value: row.code || '—' },
    { key: 'name', label: t('name'), value: row.name || '—' },
    {
      key: 'generic_name',
      label: t('referenceDataGenericName'),
      value: row.generic_name || '—',
    },
    {
      key: 'active',
      label: t('status'),
      value: row.active
        ? t('tenantStatusActive')
        : t('tenantStatusInactive'),
    },
    {
      key: 'version',
      label: t('referenceDataActiveVersion'),
      value: row.version || '—',
    },
    {
      key: 'external_rxnorm',
      label: t('referenceDataExternalRxNorm'),
      value: row.external_rxnorm || '—',
    },
    {
      key: 'external_ndc',
      label: t('referenceDataExternalNdc'),
      value: row.external_ndc || '—',
    },
    {
      key: 'created_at',
      label: t('referenceDataCreatedAt'),
      value: row.created_at || '—',
    },
    {
      key: 'updated_at',
      label: t('referenceDataUpdatedAt'),
      value: row.updated_at || '—',
    },
  ]
})

function sortByToApi(sortBy) {
  const map = {
    code: referenceDataMedicationSortFields.code,
    name: referenceDataMedicationSortFields.name,
    'generic_name': referenceDataMedicationSortFields.genericName,
    'created_at': referenceDataMedicationSortFields.createdAt,
    'updated_at': referenceDataMedicationSortFields.updatedAt,
  }

  return map[sortBy] || referenceDataMedicationSortFields.name
}

function buildListQuery(pagination) {
  const page = Math.max(0, Number(pagination.page || 1) - 1)
  const limit = Number(pagination.rowsPerPage || 20)
  const query = {
    page,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 20,
    'sort_by': sortByToApi(pagination.sortBy),
    'sort_dir': pagination.descending ? 'DESC' : 'ASC',
  }
  const q = String(searchApplied.value || '').trim()
  if (q) {
    query.q = q
  }
  if (activeFilter.value === true || activeFilter.value === false) {
    query.active = activeFilter.value
  }

  return query
}

function jobStatusColor(status) {
  const s = String(status || '').toUpperCase()
  if (s === referenceDataImportStatuses.completed) {
    return 'positive'
  }
  if (s === referenceDataImportStatuses.failed) {
    return 'negative'
  }
  if (s === referenceDataImportStatuses.running
    || s === referenceDataImportStatuses.pending) {
    return 'info'
  }
  if (s === referenceDataImportStatuses.rolledBack) {
    return 'warning'
  }

  return 'grey'
}

async function loadCatalog() {
  catalogLoading.value = true
  try {
    const catalogs = await listReferenceCatalogs()
    catalog.value = catalogs.find(c =>
      String(c.code).toUpperCase()
        === referenceDataCatalogCodes.medication,
    ) || null
  } catch (error) {
    catalog.value = null
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.warning,
        message: t('referenceDataCatalogsLoadError'),
      })
    }
  } finally {
    catalogLoading.value = false
  }
}

async function loadMedications(pagination = tablePagination.value) {
  loading.value = true
  errorMessage.value = ''
  try {
    const { items, meta } = await listMedications(
      buildListQuery(pagination),
    )
    rows.value = items
    const apiPage = meta?.page
    tablePagination.value = {
      ...pagination,
      page: Number.isFinite(Number(apiPage))
        ? Number(apiPage) + 1
        : pagination.page,
      rowsNumber: Number(meta?.total ?? items.length),
      rowsPerPage: Number(
        meta?.limit || pagination.rowsPerPage || 20,
      ),
    }
  } catch (error) {
    rows.value = []
    if (!isAuthSessionEndUIError(error)) {
      errorMessage.value =
        referenceDataErrorMessage(error)
        || t('referenceDataMedicationsLoadError')
    }
  } finally {
    loading.value = false
  }
}

async function loadRecentJobs() {
  jobsLoading.value = true
  try {
    const { items } = await listImports({
      'catalog_code': referenceDataCatalogCodes.medication,
      page: 0,
      limit: 5,
    })
    recentJobs.value = items
  } catch {
    recentJobs.value = []
  } finally {
    jobsLoading.value = false
  }
}

function onTableRequest(props) {
  return loadMedications(props.pagination)
}

function onSearchChange(value) {
  searchApplied.value = String(value ?? '').trim()
  return loadMedications({ ...tablePagination.value, page: 1 })
}

function onActiveFilterChange() {
  return loadMedications({ ...tablePagination.value, page: 1 })
}

async function openDetail(row) {
  detailRow.value = row
  detailOpen.value = true
  if (!row?.id) {
    return
  }
  try {
    const detail = await getMedicationById(row.id)
    if (detail && detailOpen.value) {
      detailRow.value = { ...row, ...detail }
    }
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.warning,
        message:
          referenceDataErrorMessage(error)
          || t('referenceDataMedicationDetailError'),
      })
    }
  }
}

function goFromSource() {
  if (!canAutoImport.value) {
    return
  }
  router.push({
    path: '/reference-data/imports',
    query: {
      'catalog_code': referenceDataCatalogCodes.medication,
      mode: 'from-source',
    },
  })
}

function goUpload() {
  if (!canImport.value) {
    return
  }
  router.push({
    path: '/reference-data/imports',
    query: {
      'catalog_code': referenceDataCatalogCodes.medication,
      mode: 'upload',
    },
  })
}

function goJobs() {
  router.push({
    path: '/reference-data/imports',
    query: {
      'catalog_code': referenceDataCatalogCodes.medication,
    },
  })
}

function goJobDetail(row) {
  router.push({
    path: '/reference-data/imports',
    query: {
      'catalog_code': referenceDataCatalogCodes.medication,
      'job_id': row.id,
    },
  })
}

async function reloadPage() {
  await loadCatalog()
  await Promise.all([
    loadMedications(tablePagination.value),
    loadRecentJobs(),
  ])
}

onMounted(() => {
  reloadPage()
})
</script>
