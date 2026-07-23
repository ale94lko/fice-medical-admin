<template>
  <q-page class="admin-page">
    <AppLoadingOverlay
      scope="content"
      :showing="pageOverlayShowing"
      :message="pageOverlayMessage" />

    <div class="row items-center q-mb-md q-col-gutter-sm">
      <div class="col">
        <div class="text-h6">{{ t('referenceDataTaxonomies') }}</div>
        <div class="text-caption text-grey-7">
          {{ t('referenceDataTaxonomiesSubtitle') }}
        </div>
      </div>
      <div class="col-auto row q-gutter-sm">
        <q-btn
          outline
          no-caps
          color="primary"
          class="app-btn-outline"
          icon="filter_alt"
          :data-testid="tid('btn', 'filters')"
          :badge="filterBadge"
          badge-color="primary"
          :label="t('filters')"
          @click="filterDialogOpen = true" />
        <q-btn
          outline
          no-caps
          color="primary"
          class="app-btn-outline"
          icon="cloud_upload"
          :data-testid="tid('btn', 'import')"
          :label="t('referenceDataImport')"
          @click="goImport" />
      </div>
    </div>

    <q-banner
      v-if="errorMessage"
      rounded
      class="bg-negative text-white q-mb-md">
      {{ errorMessage }}
    </q-banner>

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
        <q-space />
      </template>
      <template #body-cell-active="scope">
        <q-td :props="scope">
          <q-toggle
            :model-value="Boolean(scope.row.active)"
            color="primary"
            dense
            :disable="statusBusyId === scope.row.id"
            :data-testid="rowTid(scope.row.id, 'active')"
            @update:model-value="v => onToggleActive(scope.row, v)" />
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
      {{ t('referenceDataEmptyTaxonomies') }}
    </div>

    <q-dialog
      v-model="filterDialogOpen"
      persistent
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card class="modal-card app-dialog-card app-dialog-card--sm">
        <q-toolbar class="app-dialog-toolbar">
          <q-toolbar-title>
            {{ t('referenceDataTaxonomyFilters') }}
          </q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            :title="t('close')"
            @click="filterDialogOpen = false" />
        </q-toolbar>
        <q-card-section class="app-dialog-body app-dialog-form-stack">
          <q-input
            v-model="filterDraft.code"
            outlined
            dense
            clearable
            :label="t('referenceDataCode')" />
          <q-input
            v-model="filterDraft.grouping"
            outlined
            dense
            clearable
            :label="t('referenceDataGrouping')" />
          <q-input
            v-model="filterDraft.classification"
            outlined
            dense
            clearable
            :label="t('referenceDataClassification')" />
          <q-input
            v-model="filterDraft.specialization"
            outlined
            dense
            clearable
            :label="t('referenceDataSpecialization')" />
          <q-select
            v-model="filterDraft.active"
            outlined
            dense
            emit-value
            map-options
            clearable
            :options="activeFilterOptions"
            :label="t('status')" />
        </q-card-section>
        <q-card-actions align="right" class="app-dialog-actions">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :label="t('tenantFilterClear')"
            @click="clearFilters" />
          <q-btn
            no-caps
            unelevated
            color="primary"
            :label="t('tenantFilterApply')"
            @click="applyFilters" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-drawer
      v-model="detailOpen"
      side="right"
      overlay
      bordered
      :width="420"
      class="bg-white"
      :data-testid="tid('detail', 'drawer')">
      <div class="q-pa-md" v-if="detailRow">
        <div class="row items-center q-mb-md">
          <div class="col text-subtitle1 text-weight-medium">
            {{ detailRow.display_name || detailRow.code }}
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  quasarNotifyTypes,
  quasarTableAlign,
  quasarTransitions,
  referenceDataCatalogCodes,
  referenceDataTaxonomySortFields,
  siteBreakpoints,
} from 'components/constants.js'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import { useAdminPageTestIds } from 'src/composables/useAdminPageTestIds.js'
import { usePageLoadingOverlay }
  from 'src/composables/usePageLoadingOverlay.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  getTaxonomyByCode,
  listTaxonomies,
  patchTaxonomyStatus,
  referenceDataErrorMessage,
} from 'src/services/reference-data-api.js'

const {
  tid,
  rowTid,
  tableTestId,
} = useAdminPageTestIds('ref-taxonomies')

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const statusBusyId = ref(null)
const rows = ref([])
const errorMessage = ref('')
const filterDialogOpen = ref(false)
const detailOpen = ref(false)
const detailRow = ref(null)
const searchDraft = ref('')
const searchApplied = ref('')

const filterDraft = reactive({
  code: '',
  grouping: '',
  classification: '',
  specialization: '',
  active: null,
})
const filterApplied = reactive({
  code: '',
  grouping: '',
  classification: '',
  specialization: '',
  active: null,
})

const tablePagination = ref({
  sortBy: referenceDataTaxonomySortFields.code,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

const { showing: pageOverlayShowing, message: pageOverlayMessage } =
  usePageLoadingOverlay({ loading, saving })

const activeFilterOptions = computed(() => [
  { label: t('tenantStatusActive'), value: true },
  { label: t('tenantStatusInactive'), value: false },
])

const filterBadge = computed(() => {
  let n = 0
  if (filterApplied.code) {
    n += 1
  }
  if (filterApplied.grouping) {
    n += 1
  }
  if (filterApplied.classification) {
    n += 1
  }
  if (filterApplied.specialization) {
    n += 1
  }
  if (filterApplied.active === true || filterApplied.active === false) {
    n += 1
  }

  return n > 0 ? String(n) : undefined
})

const columns = computed(() => [
  {
    name: 'code',
    label: t('referenceDataCode'),
    align: quasarTableAlign.left,
    field: 'code',
    sortable: true,
  },
  {
    name: 'display_name',
    label: t('name'),
    align: quasarTableAlign.left,
    field: row => row.display_name || '—',
    sortable: true,
  },
  {
    name: 'grouping',
    label: t('referenceDataGrouping'),
    align: quasarTableAlign.left,
    field: row => row.grouping || '—',
    sortable: true,
  },
  {
    name: 'classification',
    label: t('referenceDataClassification'),
    align: quasarTableAlign.left,
    field: row => row.classification || '—',
    sortable: true,
  },
  {
    name: 'specialization',
    label: t('referenceDataSpecialization'),
    align: quasarTableAlign.left,
    field: row => row.specialization || '—',
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

const detailFields = computed(() => {
  const row = detailRow.value
  if (!row) {
    return []
  }

  return [
    { key: 'code', label: t('referenceDataCode'), value: row.code || '—' },
    {
      key: 'display_name',
      label: t('name'),
      value: row.display_name || '—',
    },
    {
      key: 'grouping',
      label: t('referenceDataGrouping'),
      value: row.grouping || '—',
    },
    {
      key: 'classification',
      label: t('referenceDataClassification'),
      value: row.classification || '—',
    },
    {
      key: 'specialization',
      label: t('referenceDataSpecialization'),
      value: row.specialization || '—',
    },
    {
      key: 'definition',
      label: t('referenceDataDefinition'),
      value: row.definition || '—',
    },
    {
      key: 'notes',
      label: t('referenceDataNotes'),
      value: row.notes || '—',
    },
    {
      key: 'version',
      label: t('referenceDataActiveVersion'),
      value: row.version || '—',
    },
    {
      key: 'effective_date',
      label: t('referenceDataEffectiveDate'),
      value: row.effective_date || '—',
    },
    {
      key: 'expiration_date',
      label: t('referenceDataExpirationDate'),
      value: row.expiration_date || '—',
    },
  ]
})

function sortByToApi(sortBy) {
  const map = {
    code: referenceDataTaxonomySortFields.code,
    'display_name': referenceDataTaxonomySortFields.displayName,
    grouping: referenceDataTaxonomySortFields.grouping,
    classification: referenceDataTaxonomySortFields.classification,
    specialization: referenceDataTaxonomySortFields.specialization,
    'created_at': referenceDataTaxonomySortFields.createdAt,
  }

  return map[sortBy] || referenceDataTaxonomySortFields.code
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
  if (filterApplied.code) {
    query.code = String(filterApplied.code).trim()
  }
  if (filterApplied.grouping) {
    query.grouping = String(filterApplied.grouping).trim()
  }
  if (filterApplied.classification) {
    query.classification = String(filterApplied.classification).trim()
  }
  if (filterApplied.specialization) {
    query.specialization = String(filterApplied.specialization).trim()
  }
  if (filterApplied.active === true || filterApplied.active === false) {
    query.active = filterApplied.active
  }

  return query
}

async function loadTaxonomies(pagination = tablePagination.value) {
  loading.value = true
  errorMessage.value = ''
  try {
    const { items, meta } = await listTaxonomies(
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
    if (!isAuthSessionEndUIError(error)) {
      errorMessage.value =
        referenceDataErrorMessage(error)
        || t('referenceDataTaxonomiesLoadError')
    }
    rows.value = []
  } finally {
    loading.value = false
  }
}

function onTableRequest(props) {
  return loadTaxonomies(props.pagination)
}

function onSearchChange(value) {
  searchApplied.value = String(value ?? '').trim()
  const next = {
    ...tablePagination.value,
    page: 1,
  }
  return loadTaxonomies(next)
}

function applyFilters() {
  filterApplied.code = String(filterDraft.code || '').trim()
  filterApplied.grouping = String(filterDraft.grouping || '').trim()
  filterApplied.classification =
    String(filterDraft.classification || '').trim()
  filterApplied.specialization =
    String(filterDraft.specialization || '').trim()
  filterApplied.active = filterDraft.active
  filterDialogOpen.value = false
  return loadTaxonomies({ ...tablePagination.value, page: 1 })
}

function clearFilters() {
  filterDraft.code = ''
  filterDraft.grouping = ''
  filterDraft.classification = ''
  filterDraft.specialization = ''
  filterDraft.active = null
  filterApplied.code = ''
  filterApplied.grouping = ''
  filterApplied.classification = ''
  filterApplied.specialization = ''
  filterApplied.active = null
  filterDialogOpen.value = false
  return loadTaxonomies({ ...tablePagination.value, page: 1 })
}

async function onToggleActive(row, active) {
  if (!row?.id) {
    return
  }
  statusBusyId.value = row.id
  saving.value = true
  const previous = Boolean(row.active)
  row.active = active
  try {
    await patchTaxonomyStatus(row.id, active)
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
    statusBusyId.value = null
    saving.value = false
  }
}

async function openDetail(row) {
  detailRow.value = row
  detailOpen.value = true
  if (!row?.code) {
    return
  }
  try {
    const detail = await getTaxonomyByCode(row.code)
    if (detail && detailOpen.value) {
      detailRow.value = { ...row, ...detail }
    }
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.warning,
        message:
          referenceDataErrorMessage(error)
          || t('referenceDataTaxonomyDetailError'),
      })
    }
  }
}

function goImport() {
  router.push({
    path: '/reference-data/imports',
    query: {
      'catalog_code': referenceDataCatalogCodes.nuccTaxonomy,
      mode: 'upload',
    },
  })
}

onMounted(() => {
  loadTaxonomies(tablePagination.value)
})
</script>
