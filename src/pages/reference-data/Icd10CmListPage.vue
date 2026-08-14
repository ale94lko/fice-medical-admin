<template>
  <q-page class="admin-page admin-list-page admin-list-page--stacked">
    <AppLoadingOverlay
      scope="content"
      :showing="pageOverlayShowing"
      :message="pageOverlayMessage" />

    <AdminListPageHeader
      :title="t('referenceDataIcd10Cm')"
      :subtitle="t('referenceDataIcd10CmSubtitle')">
      <template #actions>
        <div class="admin-list-page__actions">
          <div class="admin-list-page__actions-bar row items-center
            q-gutter-sm no-wrap">
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
      </template>
    </AdminListPageHeader>

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
                :label="t('referenceDataUploadFileFallback')"
                :title="t('referenceDataIcd10CmUploadHint')"
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
          {{ t('referenceDataIcd10CmMasterHint') }}
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
      {{ t('referenceDataIcd10CmBrowse') }}
    </div>

    <AdminTablePanel class="admin-list-page__table-panel">
      <template #toolbar>
        <q-input
          v-model="searchDraft"
          outlined
          dense
          clearable
          hide-bottom-space
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
          hide-bottom-space
          class="q-mr-sm"
          style="min-width: 140px"
          :options="activeFilterOptions"
          :label="t('status')"
          :data-testid="tid('select', 'active')"
          @update:model-value="onFilterChange" />
        <q-select
          v-model="billableFilter"
          outlined
          dense
          emit-value
          map-options
          clearable
          hide-bottom-space
          class="q-mr-md"
          style="min-width: 140px"
          :options="billableFilterOptions"
          :label="t('referenceDataBillable')"
          :data-testid="tid('select', 'billable')"
          @update:model-value="onFilterChange" />
      </template>
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
      <template #body-cell-billable="scope">
        <q-td :props="scope">
          <q-badge
            outline
            :color="scope.row.billable ? 'positive' : 'grey'">
            {{
              scope.row.billable
                ? t('yes')
                : t('no')
            }}
          </q-badge>
        </q-td>
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
    </AdminTablePanel>

    <div
      v-if="!loading && !errorMessage && rows.length === 0"
      class="text-center text-grey-7 q-pa-lg">
      {{ t('referenceDataEmptyIcd10Cm') }}
    </div>

    <div class="text-subtitle1 q-mt-lg q-mb-sm">
      {{ t('referenceDataRecentIcd10CmJobs') }}
    </div>
    <AdminTablePanel class="admin-list-page__table-panel">
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
    </AdminTablePanel>

    <q-drawer
      v-model="detailOpen"
      side="right"
      overlay
      bordered
      :width="440"
      class="bg-white"
      :data-testid="tid('detail', 'drawer')">
      <div v-if="detailRow" class="q-pa-md">
        <div class="row items-center q-mb-md">
          <div class="col text-subtitle1 text-weight-medium">
            {{ detailTitle }}
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
  referenceDataIcd10CmSortFields,
  referenceDataImportStatuses,
  siteBreakpoints,
} from 'components/constants.js'
import AdminQTable from 'components/AdminQTable.vue'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTablePanel from
  'components/admin-table/AdminTablePanel.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import { useAdminPageTestIds } from 'src/composables/useAdminPageTestIds.js'
import { usePageLoadingOverlay }
  from 'src/composables/usePageLoadingOverlay.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  formatIcd10CmLabel,
  getIcd10CmById,
  isReferenceCatalogImportable,
  listIcd10CmCodes,
  listImports,
  listReferenceCatalogs,
  referenceDataErrorMessage,
  supportsReferenceAutoDownload,
} from 'src/services/reference-data-api.js'

const {
  tid,
  rowTid,
  tableTestId,
} = useAdminPageTestIds('ref-icd10cm')

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
const billableFilter = ref(true)

const tablePagination = ref({
  sortBy: referenceDataIcd10CmSortFields.code,
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
  catalog.value?.name || t('referenceDataIcd10Cm'),
)

const detailTitle = computed(() =>
  formatIcd10CmLabel(detailRow.value)
  || detailRow.value?.code
  || '—',
)

const activeFilterOptions = computed(() => [
  { label: t('tenantStatusActive'), value: true },
  { label: t('tenantStatusInactive'), value: false },
])

const billableFilterOptions = computed(() => [
  { label: t('referenceDataBillableYes'), value: true },
  { label: t('referenceDataBillableNo'), value: false },
])

const columns = computed(() => [
  {
    name: 'code_dotted',
    label: t('referenceDataCode'),
    align: quasarTableAlign.left,
    field: row => row.code_dotted || row.code || '—',
    sortable: true,
  },
  {
    name: 'short_description',
    label: t('description'),
    align: quasarTableAlign.left,
    field: row => row.short_description || '—',
    sortable: true,
  },
  {
    name: 'billable',
    label: t('referenceDataBillable'),
    align: quasarTableAlign.left,
    field: 'billable',
    sortable: true,
  },
  {
    name: 'active',
    label: t('status'),
    align: quasarTableAlign.left,
    field: 'active',
  },
  {
    name: 'version_label',
    label: t('referenceDataActiveVersion'),
    align: quasarTableAlign.left,
    field: row => row.version_label || '—',
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
    {
      key: 'code_dotted',
      label: t('referenceDataCodeDotted'),
      value: row.code_dotted || '—',
    },
    {
      key: 'short_description',
      label: t('referenceDataShortDescription'),
      value: row.short_description || '—',
    },
    {
      key: 'long_description',
      label: t('referenceDataLongDescription'),
      value: row.long_description || '—',
    },
    {
      key: 'billable',
      label: t('referenceDataBillable'),
      value: row.billable ? t('yes') : t('no'),
    },
    {
      key: 'order_number',
      label: t('referenceDataOrderNumber'),
      value: row.order_number != null ? String(row.order_number) : '—',
    },
    {
      key: 'active',
      label: t('status'),
      value: row.active
        ? t('tenantStatusActive')
        : t('tenantStatusInactive'),
    },
    {
      key: 'version_label',
      label: t('referenceDataActiveVersion'),
      value: row.version_label || '—',
    },
  ]
})

function sortByToApi(sortBy) {
  const map = {
    code: referenceDataIcd10CmSortFields.code,
    'code_dotted': referenceDataIcd10CmSortFields.codeDotted,
    'short_description':
      referenceDataIcd10CmSortFields.shortDescription,
    'order_number': referenceDataIcd10CmSortFields.orderNumber,
    billable: referenceDataIcd10CmSortFields.billable,
    active: referenceDataIcd10CmSortFields.active,
  }

  return map[sortBy] || referenceDataIcd10CmSortFields.code
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
  if (billableFilter.value === true || billableFilter.value === false) {
    query.billable = billableFilter.value
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

function fallbackIcd10CmCatalog() {
  return {
    code: referenceDataCatalogCodes.icd10Cm,
    name: 'ICD-10-CM',
    status: 'ACTIVE',
    'supports_auto_download': true,
    'download_format': 'ZIP',
  }
}

async function loadCatalog() {
  catalogLoading.value = true
  try {
    const catalogs = await listReferenceCatalogs()
    const found = catalogs.find(c =>
      String(c.code).toUpperCase()
        === referenceDataCatalogCodes.icd10Cm,
    )
    if (!found) {
      catalog.value = fallbackIcd10CmCatalog()
      return
    }
    // Ensure from-source stays available once the catalog is ACTIVE.
    catalog.value = {
      ...found,
      'supports_auto_download':
        found.supports_auto_download
        || String(found.status || '').toUpperCase() === 'ACTIVE',
    }
  } catch (error) {
    catalog.value = fallbackIcd10CmCatalog()
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

async function loadCodes(pagination = tablePagination.value) {
  loading.value = true
  errorMessage.value = ''
  try {
    const { items, meta } = await listIcd10CmCodes(
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
        || t('referenceDataIcd10CmLoadError')
    }
  } finally {
    loading.value = false
  }
}

async function loadRecentJobs() {
  jobsLoading.value = true
  try {
    const { items } = await listImports({
      'catalog_code': referenceDataCatalogCodes.icd10Cm,
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
  return loadCodes(props.pagination)
}

function onSearchChange(value) {
  searchApplied.value = String(value ?? '').trim()
  return loadCodes({ ...tablePagination.value, page: 1 })
}

function onFilterChange() {
  return loadCodes({ ...tablePagination.value, page: 1 })
}

async function openDetail(row) {
  detailRow.value = row
  detailOpen.value = true
  if (!row?.id) {
    return
  }
  try {
    const detail = await getIcd10CmById(row.id)
    if (detail && detailOpen.value) {
      detailRow.value = { ...row, ...detail }
    }
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.warning,
        message:
          referenceDataErrorMessage(error)
          || t('referenceDataIcd10CmDetailError'),
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
      'catalog_code': referenceDataCatalogCodes.icd10Cm,
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
      'catalog_code': referenceDataCatalogCodes.icd10Cm,
      mode: 'upload',
    },
  })
}

function goJobs() {
  router.push({
    path: '/reference-data/imports',
    query: {
      'catalog_code': referenceDataCatalogCodes.icd10Cm,
    },
  })
}

function goJobDetail(row) {
  router.push({
    path: '/reference-data/imports',
    query: {
      'catalog_code': referenceDataCatalogCodes.icd10Cm,
      'job_id': row.id,
    },
  })
}

async function reloadPage() {
  await loadCatalog()
  await Promise.all([
    loadCodes(tablePagination.value),
    loadRecentJobs(),
  ])
}

onMounted(() => {
  reloadPage()
})
</script>
