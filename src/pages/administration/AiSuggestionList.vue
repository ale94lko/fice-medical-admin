<template>
  <q-page class="admin-page admin-list-page admin-list-page--stacked">
    <AppLoadingOverlay
      scope="content"
      :showing="pageOverlayShowing"
      :message="pageOverlayMessage" />

    <AdminListPageHeader
      :title="t('aiSuggestions')"
      :subtitle="t('aiSuggestionsSubtitle')" />

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-3">
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
      <div class="col-12 col-md-3">
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
          @update:model-value="onFilterChange" />
      </div>
      <div class="col-12 col-md-3">
        <q-select
          v-model="selectedFeature"
          outlined
          dense
          emit-value
          map-options
          clearable
          :disable="!selectedTenantId"
          :options="featureOptions"
          :label="t('aiSuggestionFeature')"
          :data-testid="tid('select', 'feature')"
          @update:model-value="onFilterChange" />
      </div>
      <div class="col-12 col-md-3">
        <q-select
          v-model="selectedStatus"
          outlined
          dense
          emit-value
          map-options
          clearable
          :disable="!selectedTenantId"
          :options="statusOptions"
          :label="t('aiSuggestionStatus')"
          :data-testid="tid('select', 'status')"
          @update:model-value="onFilterChange" />
      </div>
    </div>

    <q-banner
      v-if="!selectedTenantId"
      rounded
      class="bg-blue-1 text-grey-9 q-mb-md"
      dense>
      {{ t('aiSuggestionSelectTenant') }}
    </q-banner>

    <AdminTablePanel class="admin-list-page__table-panel">
    <AdminQTable
      class="table admin-data-table"
      :test-id="tableTestId"
      row-key="id"
      binary-state-sort
      v-model:pagination="tablePagination"
      :rows-per-page-options="[10, 20, 50, 100]"
      :grid="showGrid"
      :rows="sortedTableRows"
      :columns="columns"
      :loading="false"
      :rows-per-page-label="t('rowsPerPage')"
      @request="onTableRequest">
      <template #row-actions="{ row }">
        <q-btn
          flat
          round
          icon="visibility"
          color="primary"
          :data-testid="rowTid(row.id, 'view')"
          :size="siteBreakpoints.SM"
          :disable="loading"
          :title="t('viewAiSuggestion')"
          :aria-label="t('viewAiSuggestion')"
          @click="openView(row)"/>
      </template>
    </AdminQTable>
    </AdminTablePanel>

    <div
      v-if="selectedTenantId && !loading && rows.length === 0"
      class="text-center text-grey-7 q-pa-lg">
      {{ t('aiSuggestionEmpty') }}
    </div>

    <q-dialog
      v-model="viewDialogOpen"
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card
        v-if="viewing"
        class="modal-card app-dialog-card app-dialog-card--lg">
        <q-toolbar class="app-dialog-toolbar">
          <q-toolbar-title>
            {{ t('viewAiSuggestionTitle') }}
          </q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            :title="t('close')"
            :aria-label="t('close')"
            @click="closeView"/>
        </q-toolbar>
        <q-card-section class="app-dialog-body">
          <div class="row q-col-gutter-md">
            <div
              v-for="item in detailRows"
              class="col-12 col-sm-6"
              :key="item.key">
              <div class="text-caption text-grey-7">
                {{ item.label }}
              </div>
              <div class="text-body2 text-grey-9">
                {{ item.value }}
              </div>
            </div>
            <div class="col-12">
              <div class="text-caption text-grey-7">
                {{ t('aiSuggestionRequest') }}
              </div>
              <pre
                class="ai-suggestion-json text-body2 text-grey-9"
              >{{ dashText(requestJson) }}</pre>
            </div>
            <div class="col-12">
              <div class="text-caption text-grey-7">
                {{ t('aiSuggestionResult') }}
              </div>
              <pre
                class="ai-suggestion-json text-body2 text-grey-9"
              >{{ dashText(resultJson) }}</pre>
            </div>
          </div>
        </q-card-section>
        <q-card-actions
          align="right"
          class="app-dialog-actions">
          <q-btn
            no-caps
            unelevated
            color="primary"
            :title="t('close')"
            :label="t('close')"
            @click="closeView"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { onMounted, computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  aiSuggestionFeatures,
  aiSuggestionFieldKeys,
  aiSuggestionListColumnKeys,
  aiSuggestionStatuses,
  apiPaths,
  quasarNotifyTypes,
  quasarTableAlign,
  quasarTransitions,
  siteBreakpoints,
  siteBreakpointsPx,
  tenantFieldKeys,
} from 'components/constants.js'
import {
  extractTenantList,
  extractTenantListPagination,
  formatJsonPretty,
  mapAiSuggestion,
  mapTenant,
  tenantSubTenantsPath,
} from 'components/helpers.js'
import { apiInstance } from 'boot/axios'
import AdminQTable from 'components/AdminQTable.vue'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTablePanel from
  'components/admin-table/AdminTablePanel.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import { isAuthSessionEndUIError } from
  'src/utils/api-session-error.js'
import { useAdminPageTestIds } from
  'src/composables/useAdminPageTestIds.js'
import { useListFooterPagination } from
  'src/composables/useListFooterPagination.js'
import { usePageLoadingOverlay } from
  'src/composables/usePageLoadingOverlay.js'
import { fetchAllPaginatedRaw }
  from 'src/utils/permission-catalog-tree.js'
import { sortRowsByColumns } from 'src/utils/table-sort.js'
import { listSortQueryParams } from 'src/utils/list-sort-query.js'

const {
  tid,
  rowTid,
  tableTestId,
} = useAdminPageTestIds('ai-suggestions')

const sk = aiSuggestionFieldKeys
const $q = useQuasar()
const { t } = useI18n()

const loading = ref(false)
const viewDialogOpen = ref(false)
const viewing = ref(null)
const rows = ref([])
const listPagination = ref(null)

const tenantsLoading = ref(false)
const subtenantsLoading = ref(false)
const tenantOptions = ref([])
const tenantOptionsFiltered = ref([])
const subtenantOptions = ref([])
const selectedTenantId = ref(null)
const selectedSubtenantId = ref(null)
const selectedFeature = ref(null)
const selectedStatus = ref(null)

const { showing: pageOverlayShowing, message: pageOverlayMessage } =
  usePageLoadingOverlay({ loading })

const tablePagination = ref({
  sortBy: sk.createdAt,
  descending: true,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

const showGrid = computed(() =>
  typeof window !== 'undefined'
    && window.innerWidth < siteBreakpointsPx.XXS,
)

const featureOptions = computed(() =>
  aiSuggestionFeatures.map(value => ({ label: value, value })),
)

const statusOptions = computed(() =>
  aiSuggestionStatuses.map(value => ({ label: value, value })),
)

function dashText(v) {
  const s = String(v ?? '').trim()

  return s || '—'
}

function optionalId(value) {
  const n = Number(value)

  return Number.isFinite(n) ? n : null
}

function apiErrorMessage(error, fallbackKey) {
  const data = error?.response?.data
  const msg = data?.error?.message || data?.message || ''
  if (String(msg).trim()) {
    return String(msg).trim()
  }

  return t(fallbackKey)
}

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

function tablePaginationFromMeta(paginationPayload) {
  const meta = listPagination.value
  const total = meta?.total != null && Number.isFinite(Number(meta.total))
    ? Number(meta.total)
    : rows.value.length
  let resolvedPage = paginationPayload.page
  if (meta && meta.limit > 0 && Number.isFinite(meta.offset)) {
    resolvedPage = Math.floor(Number(meta.offset) / Number(meta.limit))
      + 1
  }

  return {
    sortBy: paginationPayload.sortBy,
    descending: paginationPayload.descending,
    page: resolvedPage,
    rowsPerPage: paginationPayload.rowsPerPage,
    rowsNumber: total,
  }
}

function buildListParams(paginationPayload) {
  const page = Number(paginationPayload.page ?? 1)
  const limit = Number(paginationPayload.rowsPerPage ?? 20)
  const safePage = Number.isFinite(page) && page >= 1 ? page : 1
  const safeLimit = Number.isFinite(limit) && limit >= 1 ? limit : 20
  const params = {
    page: Math.max(0, safePage - 1),
    limit: safeLimit,
    ...listSortQueryParams(paginationPayload),
  }
  params['tenant_id'] = Number(selectedTenantId.value)
  const subtenantId = optionalId(selectedSubtenantId.value)
  if (subtenantId != null) {
    params['subtenant_id'] = subtenantId
  }
  if (selectedFeature.value) {
    params.feature = selectedFeature.value
  }
  if (selectedStatus.value) {
    params.status = selectedStatus.value
  }

  return params
}

async function loadRows(paginationPayload) {
  const tenantId = optionalId(selectedTenantId.value)
  if (tenantId == null) {
    rows.value = []
    listPagination.value = null
    tablePagination.value = {
      ...paginationPayload,
      rowsNumber: 0,
    }

    return
  }
  loading.value = true
  try {
    const response = await apiInstance.get(
      apiPaths.aiSuggestionsList,
      { params: buildListParams(paginationPayload) },
    )
    const root = response?.data?.data
    rows.value = extractTenantList(root).map(mapAiSuggestion)
      .filter(Boolean)
    listPagination.value = extractTenantListPagination(root)
    tablePagination.value = tablePaginationFromMeta(
      paginationPayload,
    )
  } catch (error) {
    rows.value = []
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error, 'aiSuggestionListError'),
      })
    }
  } finally {
    loading.value = false
  }
}

const { onTableRequest } = useListFooterPagination({
  tablePagination,
  loading,
  loadPage: loadRows,
})

function onFilterChange() {
  return loadRows({
    ...tablePagination.value,
    page: 1,
  })
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
  const id = optionalId(tenantId)
  if (id == null) {
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

async function onTenantChange(tenantId) {
  selectedFeature.value = null
  selectedStatus.value = null
  await loadSubtenants(tenantId)
  await loadRows({
    ...tablePagination.value,
    page: 1,
  })
}

onMounted(() => {
  loadTenants()
})

watch(viewDialogOpen, open => {
  if (!open) {
    viewing.value = null
  }
})

const columns = computed(() => [
  {
    name: 'id',
    required: true,
    label: 'ID',
    align: quasarTableAlign.left,
    field: row => row.id,
    sortable: true,
  },
  {
    name: sk.feature,
    required: true,
    label: t('aiSuggestionFeature'),
    align: quasarTableAlign.left,
    field: row => row[sk.feature],
    sortable: true,
  },
  {
    name: sk.status,
    required: true,
    label: t('aiSuggestionStatus'),
    align: quasarTableAlign.left,
    field: row => row[sk.status],
    sortable: true,
  },
  {
    name: sk.provider,
    required: true,
    label: t('aiSuggestionProvider'),
    align: quasarTableAlign.left,
    field: row => row[sk.provider],
    sortable: true,
  },
  {
    name: sk.model,
    required: true,
    label: t('aiSuggestionModel'),
    align: quasarTableAlign.left,
    field: row => row[sk.model],
    sortable: false,
  },
  {
    name: sk.clientId,
    required: true,
    label: t('aiSuggestionClientId'),
    align: quasarTableAlign.left,
    field: row => row[sk.clientId] ?? '—',
    sortable: true,
  },
  {
    name: sk.conversationId,
    required: false,
    label: t('aiSuggestionConversationId'),
    align: quasarTableAlign.left,
    field: row => dashText(row[sk.conversationId]),
    sortable: false,
  },
  {
    name: sk.createdAt,
    required: true,
    label: t('aiSuggestionCreatedAt'),
    align: quasarTableAlign.left,
    field: row => dashText(row[sk.createdAt]),
    sortable: true,
  },
  {
    name: aiSuggestionListColumnKeys.actions,
    required: true,
    label: t('actions'),
    align: quasarTableAlign.center,
    field: () => null,
    sortable: false,
  },
])

const sortedTableRows = computed(() => {
  const p = tablePagination.value

  return sortRowsByColumns(
    rows.value,
    p.sortBy,
    p.descending,
    columns.value,
  )
})

const detailRows = computed(() => {
  const r = viewing.value
  if (!r) {
    return []
  }

  return [
    { key: 'id', label: 'ID', value: dashText(r.id) },
    {
      key: sk.tenantName,
      label: t('tenants'),
      value: dashText(r[sk.tenantName]),
    },
    {
      key: sk.subtenantId,
      label: t('userAllowedSubTenants'),
      value: dashText(r[sk.subtenantId]),
    },
    {
      key: sk.feature,
      label: t('aiSuggestionFeature'),
      value: dashText(r[sk.feature]),
    },
    {
      key: sk.status,
      label: t('aiSuggestionStatus'),
      value: dashText(r[sk.status]),
    },
    {
      key: sk.provider,
      label: t('aiSuggestionProvider'),
      value: dashText(r[sk.provider]),
    },
    {
      key: sk.model,
      label: t('aiSuggestionModel'),
      value: dashText(r[sk.model]),
    },
    {
      key: sk.promptVersion,
      label: t('aiSuggestionPromptVersion'),
      value: dashText(r[sk.promptVersion]),
    },
    {
      key: sk.createdAt,
      label: t('aiSuggestionCreatedAt'),
      value: dashText(r[sk.createdAt]),
    },
    {
      key: sk.createdBy,
      label: t('aiSuggestionCreatedBy'),
      value: dashText(r[sk.createdBy]),
    },
    {
      key: sk.clientId,
      label: t('aiSuggestionClientId'),
      value: dashText(r[sk.clientId]),
    },
    {
      key: sk.encounterId,
      label: t('aiSuggestionEncounterId'),
      value: dashText(r[sk.encounterId]),
    },
    {
      key: sk.conversationId,
      label: t('aiSuggestionConversationId'),
      value: dashText(r[sk.conversationId]),
    },
    {
      key: sk.tokensPrompt,
      label: t('aiSuggestionTokensPrompt'),
      value: dashText(r[sk.tokensPrompt]),
    },
    {
      key: sk.tokensCompletion,
      label: t('aiSuggestionTokensCompletion'),
      value: dashText(r[sk.tokensCompletion]),
    },
    {
      key: sk.acceptedAt,
      label: t('aiSuggestionAcceptedAt'),
      value: dashText(r[sk.acceptedAt]),
    },
    {
      key: sk.acceptedBy,
      label: t('aiSuggestionAcceptedBy'),
      value: dashText(r[sk.acceptedBy]),
    },
    {
      key: sk.rejectedAt,
      label: t('aiSuggestionRejectedAt'),
      value: dashText(r[sk.rejectedAt]),
    },
    {
      key: sk.rejectedBy,
      label: t('aiSuggestionRejectedBy'),
      value: dashText(r[sk.rejectedBy]),
    },
    {
      key: sk.rejectionReason,
      label: t('aiSuggestionRejectionReason'),
      value: dashText(r[sk.rejectionReason]),
    },
    {
      key: sk.committedToRecordAt,
      label: t('aiSuggestionCommittedAt'),
      value: dashText(r[sk.committedToRecordAt]),
    },
  ]
})

const requestJson = computed(() =>
  formatJsonPretty(viewing.value?.[sk.request]),
)

const resultJson = computed(() =>
  formatJsonPretty(viewing.value?.[sk.result]),
)

async function openView(row) {
  viewing.value = row
  viewDialogOpen.value = true
  const tenantId = optionalId(selectedTenantId.value)
  if (tenantId == null || row?.id == null) {
    return
  }
  try {
    const response = await apiInstance.get(
      `${apiPaths.aiSuggestionsList}/${row.id}`,
      { params: { 'tenant_id': tenantId } },
    )
    const mapped = mapAiSuggestion(response?.data?.data)
    if (mapped) {
      viewing.value = mapped
    }
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(
          error,
          'aiSuggestionDetailLoadError',
        ),
      })
    }
  }
}

function closeView() {
  viewDialogOpen.value = false
}
</script>

<style scoped>
.ai-suggestion-json {
  margin: 6px 0 0;
  max-height: 28vh;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
