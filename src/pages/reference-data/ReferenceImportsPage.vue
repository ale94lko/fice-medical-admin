<template>
  <q-page class="admin-page">
    <AppLoadingOverlay
      scope="content"
      :showing="pageOverlayShowing"
      :message="pageOverlayMessage" />

    <div class="row items-center q-mb-md q-col-gutter-sm">
      <div class="col">
        <div class="text-h6">{{ t('referenceDataImports') }}</div>
        <div class="text-caption text-grey-7">
          {{ t('referenceDataImportsSubtitle') }}
        </div>
      </div>
      <div class="col-auto">
        <q-btn
          outline
          no-caps
          color="primary"
          class="app-btn-outline"
          icon="refresh"
          :disable="loading"
          :label="t('dashboardRefresh')"
          :data-testid="tid('btn', 'refresh')"
          @click="reloadAll" />
      </div>
    </div>

    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1 q-mb-md">
          {{ t('referenceDataNewImport') }}
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-select
              v-model="form.catalogCode"
              outlined
              dense
              emit-value
              map-options
              :options="catalogOptions"
              :loading="catalogsLoading"
              :label="t('referenceDataCatalog')"
              :data-testid="tid('select', 'catalog')"
              @update:model-value="onCatalogChange" />
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="form.versionLabel"
              outlined
              dense
              clearable
              :label="t('referenceDataVersionLabel')"
              :data-testid="tid('input', 'version')" />
          </div>
          <div class="col-12">
            <q-btn-toggle
              v-model="importMode"
              toggle-color="primary"
              unelevated
              no-caps
              :options="modeOptions"
              :data-testid="tid('toggle', 'mode')" />
          </div>
          <div
            v-if="importMode === 'upload'"
            class="col-12 col-md-8">
            <q-file
              v-model="form.file"
              outlined
              dense
              clearable
              :label="t('referenceDataFile')"
              :hint="t('referenceDataFormatOptionalHint')"
              :data-testid="tid('input', 'file')" />
          </div>
          <div
            v-else-if="selectedCatalog"
            class="col-12">
            <q-banner dense rounded class="bg-blue-1 text-grey-9">
              <div class="text-body2">
                {{ t('referenceDataFromSourceHint') }}
              </div>
              <div
                v-if="selectedCatalog.download_url"
                class="text-caption q-mt-xs">
                {{ t('referenceDataDownloadUrl') }}:
                <a
                  :href="selectedCatalog.download_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary">
                  {{ selectedCatalog.download_url }}
                </a>
              </div>
              <div
                v-if="selectedCatalog.download_format"
                class="text-caption">
                {{ t('referenceDataFormat') }}:
                {{ selectedCatalog.download_format }}
              </div>
            </q-banner>
          </div>
          <div class="col-12 flex items-center q-gutter-sm">
            <q-btn
              unelevated
              no-caps
              color="primary"
              class="primary-action"
              :icon="submitIcon"
              :loading="submitting"
              :disable="!canSubmit"
              :label="submitLabel"
              :data-testid="tid('btn', 'submit')"
              @click="submitImport" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-banner
      v-if="errorMessage"
      rounded
      class="bg-negative text-white q-mb-md">
      {{ errorMessage }}
    </q-banner>

    <div class="text-subtitle1 q-mb-sm">
      {{ t('referenceDataImportHistory') }}
    </div>

    <div class="row q-mb-md">
      <div class="col-12 col-md-4">
        <q-select
          v-model="historyCatalogFilter"
          outlined
          dense
          emit-value
          map-options
          clearable
          :options="historyCatalogOptions"
          :label="t('referenceDataFilterByCatalog')"
          :data-testid="tid('select', 'history-catalog')"
          @update:model-value="onHistoryFilterChange" />
      </div>
    </div>

    <AdminQTable
      class="table admin-data-table"
      :test-id="tableTestId"
      row-key="id"
      v-model:pagination="tablePagination"
      :rows-per-page-options="[10, 20, 50]"
      :rows="jobs"
      :columns="columns"
      :loading="false"
      :rows-per-page-label="t('rowsPerPage')"
      @request="onTableRequest">
      <template #body-cell-status="scope">
        <q-td :props="scope">
          <q-badge :color="statusColor(scope.row.status)">
            {{ scope.row.status || '—' }}
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
          :title="t('referenceDataViewLogs')"
          @click="openJobDetail(row)" />
        <q-btn
          flat
          round
          icon="undo"
          color="warning"
          :size="siteBreakpoints.SM"
          :disable="!canRollback(row) || actionBusyId === row.id"
          :data-testid="rowTid(row.id, 'rollback')"
          :title="t('referenceDataRollback')"
          @click="onRollback(row)" />
        <q-btn
          flat
          round
          icon="check_circle"
          color="positive"
          :size="siteBreakpoints.SM"
          :disable="!canActivate(row) || actionBusyId === row.id"
          :data-testid="rowTid(row.id, 'activate')"
          :title="t('referenceDataActivateVersion')"
          @click="onActivate(row)" />
      </template>
    </AdminQTable>

    <div
      v-if="!loading && !errorMessage && jobs.length === 0"
      class="text-center text-grey-7 q-pa-lg">
      {{ t('referenceDataEmptyImports') }}
    </div>

    <q-dialog
      v-model="detailOpen"
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card class="modal-card app-dialog-card app-dialog-card--lg">
        <q-toolbar class="app-dialog-toolbar">
          <q-toolbar-title>
            {{ t('referenceDataImportDetail') }}
            <span v-if="detailJob">#{{ detailJob.id }}</span>
          </q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            :title="t('close')"
            @click="detailOpen = false" />
        </q-toolbar>
        <q-card-section v-if="detailJob" class="app-dialog-body">
          <div class="row q-col-gutter-md q-mb-md">
            <div
              v-for="item in detailSummary"
              :key="item.key"
              class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">{{ item.label }}</div>
              <div class="text-body2">{{ item.value }}</div>
            </div>
          </div>
          <div class="text-subtitle2 q-mb-sm">
            {{ t('referenceDataImportLogs') }}
          </div>
          <q-list
            v-if="detailLogs.length > 0"
            bordered
            separator
            class="app-embedded-list">
            <q-item
              v-for="log in detailLogs"
              :key="log.id">
              <q-item-section avatar>
                <q-badge
                  :color="log.level === 'ERROR' ? 'negative' : 'info'">
                  {{ log.level }}
                </q-badge>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ log.message }}</q-item-label>
                <q-item-label
                  v-if="log.row_number != null"
                  caption>
                  {{ t('referenceDataRowNumber') }}:
                  {{ log.row_number }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
          <div v-else class="text-grey-7">
            {{ t('referenceDataNoLogs') }}
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  quasarNotifyTypes,
  quasarTableAlign,
  quasarTransitions,
  referenceDataCatalogCodes,
  referenceDataImportStatuses,
  siteBreakpoints,
} from 'components/constants.js'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import { useAdminPageTestIds } from 'src/composables/useAdminPageTestIds.js'
import { usePageLoadingOverlay }
  from 'src/composables/usePageLoadingOverlay.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  activateReferenceVersion,
  createImportFromSource,
  createImportUpload,
  getImportById,
  isReferenceCatalogImportable,
  listImports,
  listReferenceCatalogs,
  referenceDataErrorMessage,
  rollbackImport,
  supportsReferenceAutoDownload,
} from 'src/services/reference-data-api.js'

const {
  tid,
  rowTid,
  tableTestId,
} = useAdminPageTestIds('ref-imports')

const { t } = useI18n()
const $q = useQuasar()
const route = useRoute()

const loading = ref(false)
const submitting = ref(false)
const catalogsLoading = ref(false)
const actionBusyId = ref(null)
const errorMessage = ref('')
const jobs = ref([])
const activeCatalogs = ref([])
const importMode = ref('upload')
const historyCatalogFilter = ref(null)
const detailOpen = ref(false)
const detailJob = ref(null)

const form = reactive({
  catalogCode: null,
  versionLabel: '',
  file: null,
})

const tablePagination = ref({
  sortBy: 'created_at',
  descending: true,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

const pageSaving = computed(
  () => submitting.value || actionBusyId.value != null,
)
const { showing: pageOverlayShowing, message: pageOverlayMessage } =
  usePageLoadingOverlay({ loading, saving: pageSaving })

const catalogOptions = computed(() =>
  activeCatalogs.value.map(c => ({
    label: `${c.code} — ${c.name}`,
    value: c.code,
  })),
)

const historyCatalogOptions = computed(() => {
  if (catalogOptions.value.length > 0) {
    return catalogOptions.value
  }

  return [
    {
      label: referenceDataCatalogCodes.nuccTaxonomy,
      value: referenceDataCatalogCodes.nuccTaxonomy,
    },
    {
      label: referenceDataCatalogCodes.placeOfService,
      value: referenceDataCatalogCodes.placeOfService,
    },
  ]
})

const selectedCatalog = computed(() =>
  activeCatalogs.value.find(c => c.code === form.catalogCode) || null,
)

const selectedSupportsAutoDownload = computed(() =>
  supportsReferenceAutoDownload(selectedCatalog.value),
)

const modeOptions = computed(() => {
  const options = [
    { label: t('referenceDataModeUpload'), value: 'upload' },
  ]
  if (selectedSupportsAutoDownload.value) {
    options.push({
      label: t('referenceDataModeFromSource'),
      value: 'from-source',
    })
  }

  return options
})

const canSubmit = computed(() => {
  if (!form.catalogCode || submitting.value) {
    return false
  }
  if (importMode.value === 'upload') {
    return Boolean(form.file)
  }
  if (importMode.value === 'from-source') {
    return selectedSupportsAutoDownload.value
  }

  return false
})

const submitLabel = computed(() => {
  if (importMode.value === 'from-source') {
    return t('referenceDataImportFromSource')
  }

  return t('referenceDataStartImport')
})

const submitIcon = computed(() =>
  importMode.value === 'from-source'
    ? 'cloud_download'
    : 'upload_file',
)

const columns = computed(() => [
  {
    name: 'id',
    label: 'ID',
    align: quasarTableAlign.left,
    field: 'id',
  },
  {
    name: 'catalog_code',
    label: t('referenceDataCatalog'),
    align: quasarTableAlign.left,
    field: 'catalog_code',
  },
  {
    name: 'version_label',
    label: t('referenceDataVersionLabel'),
    align: quasarTableAlign.left,
    field: row => row.version_label || '—',
  },
  {
    name: 'source_type',
    label: t('referenceDataSourceType'),
    align: quasarTableAlign.left,
    field: row => row.source_type || '—',
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

const detailLogs = computed(() => {
  const logs = detailJob.value?.logs

  return Array.isArray(logs) ? logs : []
})

const detailSummary = computed(() => {
  const job = detailJob.value
  if (!job) {
    return []
  }

  return [
    {
      key: 'catalog',
      label: t('referenceDataCatalog'),
      value: job.catalog_code || '—',
    },
    {
      key: 'status',
      label: t('status'),
      value: job.status || '—',
    },
    {
      key: 'version',
      label: t('referenceDataVersionLabel'),
      value: job.version_label || '—',
    },
    {
      key: 'source',
      label: t('referenceDataSourceType'),
      value: job.source_type || '—',
    },
    {
      key: 'format',
      label: t('referenceDataFormat'),
      value: job.format || '—',
    },
    {
      key: 'error',
      label: t('referenceDataErrorSummary'),
      value: job.error_summary || '—',
    },
    {
      key: 'started',
      label: t('referenceDataStartedAt'),
      value: job.started_at || '—',
    },
    {
      key: 'finished',
      label: t('referenceDataFinishedAt'),
      value: job.finished_at || '—',
    },
  ]
})

function statusColor(status) {
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

function canRollback(row) {
  return String(row?.status || '').toUpperCase()
    === referenceDataImportStatuses.completed
}

function canActivate(row) {
  return row?.version_id != null
    && String(row?.status || '').toUpperCase()
      === referenceDataImportStatuses.completed
}

function applyQueryCatalog() {
  const code = String(route.query.catalog_code || '').trim()
  if (code) {
    const allowed = activeCatalogs.value.some(c => c.code === code)
    if (allowed || activeCatalogs.value.length === 0) {
      form.catalogCode = code
      historyCatalogFilter.value = code
    }
  }
  const mode = String(route.query.mode || '').trim()
  if (mode === 'from-source' && selectedSupportsAutoDownload.value) {
    importMode.value = 'from-source'
  } else if (mode === 'upload') {
    importMode.value = 'upload'
  }
  syncImportModeForCatalog()
}

function syncImportModeForCatalog() {
  if (
    importMode.value === 'from-source'
    && !selectedSupportsAutoDownload.value
  ) {
    importMode.value = 'upload'
  }
}

function onCatalogChange() {
  syncImportModeForCatalog()
}

function fallbackActiveCatalogs() {
  return [
    {
      code: referenceDataCatalogCodes.nuccTaxonomy,
      name: referenceDataCatalogCodes.nuccTaxonomy,
      status: 'ACTIVE',
      'supports_auto_download': true,
    },
    {
      code: referenceDataCatalogCodes.placeOfService,
      name: referenceDataCatalogCodes.placeOfService,
      status: 'ACTIVE',
      'supports_auto_download': false,
    },
  ]
}

async function loadCatalogOptions() {
  catalogsLoading.value = true
  try {
    const catalogs = await listReferenceCatalogs()
    activeCatalogs.value = catalogs.filter(isReferenceCatalogImportable)
    if (activeCatalogs.value.length === 0) {
      activeCatalogs.value = fallbackActiveCatalogs()
    }
    applyQueryCatalog()
  } catch (error) {
    activeCatalogs.value = fallbackActiveCatalogs()
    applyQueryCatalog()
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.warning,
        message: t('referenceDataCatalogsLoadError'),
      })
    }
  } finally {
    catalogsLoading.value = false
  }
}

async function loadJobs(pagination = tablePagination.value) {
  loading.value = true
  errorMessage.value = ''
  try {
    const page = Math.max(0, Number(pagination.page || 1) - 1)
    const limit = Number(pagination.rowsPerPage || 20)
    const query = {
      page,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 20,
    }
    if (historyCatalogFilter.value) {
      query['catalog_code'] = historyCatalogFilter.value
    }
    const { items, meta } = await listImports(query)
    jobs.value = items
    const apiPage = meta?.page
    tablePagination.value = {
      ...pagination,
      page: Number.isFinite(Number(apiPage))
        ? Number(apiPage) + 1
        : pagination.page,
      rowsNumber: Number(meta?.total ?? items.length),
      rowsPerPage: Number(meta?.limit || limit),
    }
  } catch (error) {
    jobs.value = []
    if (!isAuthSessionEndUIError(error)) {
      errorMessage.value =
        referenceDataErrorMessage(error)
        || t('referenceDataImportsLoadError')
    }
  } finally {
    loading.value = false
  }
}

function onTableRequest(props) {
  return loadJobs(props.pagination)
}

function onHistoryFilterChange() {
  return loadJobs({ ...tablePagination.value, page: 1 })
}

async function reloadAll() {
  await loadCatalogOptions()
  await loadJobs({ ...tablePagination.value, page: 1 })
}

async function submitImport() {
  if (!canSubmit.value) {
    return
  }
  submitting.value = true
  try {
    let job = null
    if (importMode.value === 'upload') {
      job = await createImportUpload({
        catalogCode: form.catalogCode,
        file: form.file,
        versionLabel: form.versionLabel || undefined,
      })
    } else {
      job = await createImportFromSource({
        catalogCode: form.catalogCode,
        versionLabel: form.versionLabel || undefined,
      })
    }
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('referenceDataImportStarted'),
    })
    form.file = null
    await loadJobs({ ...tablePagination.value, page: 1 })
    if (job?.id) {
      await openJobDetail(job)
    }
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message:
          referenceDataErrorMessage(error)
          || t('referenceDataImportError'),
      })
    }
  } finally {
    submitting.value = false
  }
}

async function openJobDetail(row) {
  detailJob.value = row
  detailOpen.value = true
  if (!row?.id) {
    return
  }
  try {
    const detail = await getImportById(row.id)
    if (detail && detailOpen.value) {
      detailJob.value = detail
    }
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.warning,
        message:
          referenceDataErrorMessage(error)
          || t('referenceDataImportDetailError'),
      })
    }
  }
}

async function onRollback(row) {
  if (!canRollback(row)) {
    return
  }
  actionBusyId.value = row.id
  try {
    await rollbackImport(row.id)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('referenceDataRollbackSuccess'),
    })
    await loadJobs(tablePagination.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message:
          referenceDataErrorMessage(error)
          || t('referenceDataRollbackError'),
      })
    }
  } finally {
    actionBusyId.value = null
  }
}

async function onActivate(row) {
  if (!canActivate(row)) {
    return
  }
  actionBusyId.value = row.id
  try {
    await activateReferenceVersion(row.version_id)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('referenceDataActivateSuccess'),
    })
    await loadJobs(tablePagination.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message:
          referenceDataErrorMessage(error)
          || t('referenceDataActivateError'),
      })
    }
  } finally {
    actionBusyId.value = null
  }
}

watch(
  () => [route.query.catalog_code, route.query.mode],
  () => {
    applyQueryCatalog()
  },
)

watch(selectedSupportsAutoDownload, () => {
  syncImportModeForCatalog()
})

onMounted(async() => {
  await loadCatalogOptions()
  await loadJobs(tablePagination.value)
})
</script>
