<template>
  <q-page class="admin-page">
    <AppLoadingOverlay
      scope="content"
      :showing="pageOverlayShowing"
      :message="pageOverlayMessage" />
    <AdminQTable
      class="table admin-data-table"
      :test-id="tableTestId"
      row-key="id"
      binary-state-sort
      v-model:pagination="tablePagination"
      :rows-per-page-options="[10, 20, 50, 100]"
      :grid="showGrid"
      :title="t('aiConfig')"
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
          :disable="loading || editSaving"
          :title="t('viewAiConfig')"
          :aria-label="t('viewAiConfig')"
          @click="openView(row)"/>
        <q-btn
          flat
          round
          icon="edit"
          color="primary"
          :data-testid="rowTid(row.id, 'edit')"
          :size="siteBreakpoints.SM"
          :disable="loading || editSaving"
          :title="t('editAiConfig')"
          :aria-label="t('editAiConfig')"
          @click="openEdit(row)"/>
      </template>
    </AdminQTable>

    <Dialog
      v-model="editDialogOpen"
      :test-id-prefix="formTestIdPrefix"
      title-key="editAiConfig"
      :fields="editFields"
      :initial-values="editInitialValues"
      :format-payload="formatAiConfigUpdatePayload"
      :saving="editSaving"
      min-width="min(720px, 100vw - 24px)"
      max-width="min(840px, 100vw - 24px)"
      body-max-height="min(72vh, 760px)"
      @save="onSaveEdit"/>

    <q-dialog
      v-model="viewDialogOpen"
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card
        v-if="viewing"
        class="modal-card app-dialog-card app-dialog-card--lg">
        <q-toolbar class="app-dialog-toolbar">
          <q-toolbar-title>{{ t('viewAiConfigTitle') }}</q-toolbar-title>
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
                {{ t('aiConfigPromptBody') }}
              </div>
              <pre
                class="ai-config-prompt text-body2 text-grey-9"
              >{{ dashText(viewing.promptBody) }}</pre>
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
  aiConfigFieldKeys,
  aiConfigListColumnKeys,
  apiPaths,
  quasarNotifyTypes,
  quasarTableAlign,
  quasarTransitions,
  siteBreakpoints,
  siteBreakpointsPx,
} from 'components/constants.js'
import {
  extractTenantList,
  extractTenantListPagination,
  mapAiConfig,
} from 'components/helpers.js'
import { apiInstance } from 'boot/axios'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import Dialog from 'components/Dialog.vue'
import { useAiConfigEditForm } from
  'src/composables/useAiConfigEditForm.js'
import { isAuthSessionEndUIError } from
  'src/utils/api-session-error.js'
import { useAdminPageTestIds } from
  'src/composables/useAdminPageTestIds.js'
import { usePageLoadingOverlay } from
  'src/composables/usePageLoadingOverlay.js'
import { sortRowsByColumns } from 'src/utils/table-sort.js'

const {
  rowTid,
  tableTestId,
  formTestIdPrefix,
} = useAdminPageTestIds('ai-config')

const ck = aiConfigFieldKeys
const $q = useQuasar()
const { t } = useI18n()

const loading = ref(false)
const editDialogOpen = ref(false)
const editSaving = ref(false)
const formPreparing = ref(false)
const editing = ref(null)
const viewDialogOpen = ref(false)
const viewing = ref(null)
const rows = ref([])
const listPagination = ref(null)

const { showing: pageOverlayShowing, message: pageOverlayMessage } =
  usePageLoadingOverlay({
    loading,
    saving: editSaving,
    preparing: formPreparing,
  })

const {
  fields: editFields,
  formatAiConfigUpdatePayload,
} = useAiConfigEditForm()

const tablePagination = ref({
  sortBy: ck.feature,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

const showGrid = computed(() =>
  typeof window !== 'undefined'
    && window.innerWidth < siteBreakpointsPx.XXS,
)

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

async function loadRows(paginationPayload) {
  loading.value = true
  try {
    const page = Number(paginationPayload.page ?? 1)
    const limit = Number(paginationPayload.rowsPerPage ?? 20)
    const safePage = Number.isFinite(page) && page >= 1 ? page : 1
    const safeLimit = Number.isFinite(limit) && limit >= 1 ? limit : 20
    const response = await apiInstance.get(apiPaths.aiConfigList, {
      params: { page: Math.max(0, safePage - 1), limit: safeLimit },
    })
    const root = response?.data?.data
    rows.value = extractTenantList(root).map(mapAiConfig)
      .filter(Boolean)
    listPagination.value = extractTenantListPagination(root)
    tablePagination.value = tablePaginationFromMeta(paginationPayload)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('aiConfigListError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function onTableRequest(props) {
  return loadRows(props.pagination)
}

onMounted(() => {
  loadRows(tablePagination.value)
})

watch(editDialogOpen, open => {
  if (!open) {
    editing.value = null
  }
})

watch(viewDialogOpen, open => {
  if (!open) {
    viewing.value = null
  }
})

const columns = computed(() => [
  {
    name: ck.feature,
    required: true,
    label: t('aiConfigFeature'),
    align: quasarTableAlign.left,
    field: row => row[ck.feature],
    sortable: true,
  },
  {
    name: ck.enabled,
    required: true,
    label: t('aiConfigEnabled'),
    align: quasarTableAlign.left,
    field: row => (row[ck.enabled] ? t('yes') : t('no')),
    sortable: true,
  },
  {
    name: ck.promptVersion,
    required: true,
    label: t('aiConfigPromptVersion'),
    align: quasarTableAlign.left,
    field: row => row[ck.promptVersion],
    sortable: true,
  },
  {
    name: aiConfigListColumnKeys.actions,
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

function dashText(v) {
  const s = String(v ?? '').trim()

  return s || '—'
}

const detailRows = computed(() => {
  const r = viewing.value
  if (!r) {
    return []
  }

  return [
    { key: ck.feature, label: t('aiConfigFeature'),
      value: dashText(r.feature) },
    { key: ck.enabled, label: t('aiConfigEnabled'),
      value: r.enabled ? t('yes') : t('no') },
    { key: ck.promptVersion, label: t('aiConfigPromptVersion'),
      value: dashText(r.promptVersion) },
  ]
})

const editInitialValues = computed(() =>
  editing.value
    ? {
      [ck.feature]: editing.value.feature ?? '',
      [ck.enabled]: editing.value.enabled === true,
      [ck.promptVersion]: editing.value.promptVersion ?? 1,
      [ck.promptBody]: editing.value.promptBody ?? '',
    }
    : null,
)

function openView(row) {
  viewing.value = row
  viewDialogOpen.value = true
}

function closeView() {
  viewDialogOpen.value = false
}

async function openEdit(row) {
  formPreparing.value = true
  let seed = row
  try {
    try {
      const response = await apiInstance.get(
        `${apiPaths.aiConfigList}/${row.id}`,
      )
      const mapped = mapAiConfig(response?.data?.data)
      if (mapped) {
        seed = mapped
      }
    } catch (error) {
      if (!isAuthSessionEndUIError(error)) {
        $q.notify({
          type: quasarNotifyTypes.negative,
          message: t('aiConfigDetailLoadError'),
        })
      }
    }
    editing.value = seed
    editDialogOpen.value = true
  } finally {
    formPreparing.value = false
  }
}

async function onSaveEdit(payload) {
  const row = editing.value
  if (!row?.id) {
    return
  }
  editSaving.value = true
  try {
    await apiInstance.patch(
      `${apiPaths.aiConfigList}/${row.id}`,
      payload,
    )
    editDialogOpen.value = false
    await loadRows(tablePagination.value)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('aiConfigUpdatedSuccess'),
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('aiConfigUpdateError'),
      })
    }
  } finally {
    editSaving.value = false
  }
}
</script>

<style scoped>
.ai-config-prompt {
  margin: 6px 0 0;
  max-height: 40vh;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
