<template>
  <q-page class="admin-page">
    <AdminQTable
      class="table admin-data-table"
      :test-id="tableTestId"
      row-key="id"
      binary-state-sort
      v-model:pagination="tablePagination"
      :rows-per-page-options="[10, 20, 50, 100]"
      :grid="showGrid"
      :title="t('modules')"
      :rows="sortedTableRows"
      :columns="columns"
      :loading="loading"
      :rows-per-page-label="t('rowsPerPage')"
      @request="onTableRequest">
      <template v-slot:top>
        <q-space />
        <q-btn
          outline
          no-caps
          color="primary"
          class="app-btn-outline"
          icon="filter_alt"
          :data-testid="tid('btn', 'filters')"
          badge-color="primary"
          :disable="loading || editSaving"
          :title="t('filters')"
          :label="t('filters')"
          :badge="getbadge(activeModuleFilterCount)"
          @click="openModuleFilters"/>
      </template>
      <template #row-actions="{ row }">
        <q-btn
          flat
          round
          icon="visibility"
          color="primary"
          :data-testid="rowTid(row.id, 'view')"
          :size="siteBreakpoints.SM"
          :disable="loading || editSaving"
          :title="t('viewModule')"
          :aria-label="t('viewModule')"
          @click="openViewModule(row)"/>
        <q-btn
          flat
          round
          icon="edit"
          color="primary"
          :data-testid="rowTid(row.id, 'edit')"
          :size="siteBreakpoints.SM"
          :disable="loading || editSaving"
          :title="t('editModule')"
          :aria-label="t('editModule')"
          @click="openEditModule(row)"/>
      </template>
    </AdminQTable>

    <Dialog
      v-model="editDialogOpen"
      :test-id-prefix="formTestIdPrefix"
      title-key="editModule"
      :fields="moduleEditFields"
      :initial-values="moduleEditInitialValues"
      :format-payload="formatModuleEditPayload"
      :saving="editSaving"
      @save="onSaveModuleEdit"/>

    <q-dialog
      v-model="filterDialogOpen"
      persistent
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card class="modal-card app-dialog-card app-dialog-card--sm">
        <q-toolbar class="app-dialog-toolbar">
          <q-toolbar-title>{{ t('moduleFiltersTitle') }}</q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            :title="t('close')"
            :aria-label="t('close')"
            @click="closeModuleFilterDialog"/>
        </q-toolbar>
        <q-card-section class="app-dialog-body app-dialog-form-stack">
          <q-input
            v-model="filterDraft[mk.name]"
            outlined
            dense
            clearable
            :label="t('name')"/>
          <q-input
            v-model="filterDraft[mk.description]"
            outlined
            dense
            clearable
            :label="t('description')"/>
        </q-card-section>
        <q-card-actions align="right" class="app-dialog-actions">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :title="t('roleFilterClear')"
            :label="t('roleFilterClear')"
            @click="clearModuleFilters"/>
          <q-btn
            no-caps
            unelevated
            class="primary-action"
            color="primary"
            :title="t('roleFilterApply')"
            :label="t('roleFilterApply')"
            @click="applyModuleFilters"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="viewModuleDialogOpen"
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card
        v-if="moduleViewing"
        class="modal-card app-dialog-card app-dialog-card--lg">
        <q-toolbar class="app-dialog-toolbar">
          <q-toolbar-title>{{ t('viewModuleTitle') }}</q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            :title="t('close')"
            :aria-label="t('close')"
            @click="closeViewModule"/>
        </q-toolbar>
        <q-card-section class="app-dialog-body">
          <div class="row q-col-gutter-md">
            <div
              v-for="item in moduleDetailRows"
              class="col-12 col-sm-6"
              :key="item.key">
              <div class="text-caption text-grey-7">{{ item.label }}</div>
              <div class="text-body2 text-grey-9">{{ item.value }}</div>
            </div>
            <div class="col-12">
              <div class="text-subtitle2 q-mb-sm">{{ t('permissions') }}</div>
              <div class="relative-position">
                <q-inner-loading
                  :showing="modulePermissionsLoading"
                  color="primary"/>
                <q-list
                  v-if="modulePermissionItems.length > 0"
                  dense
                  separator
                  class="app-embedded-list">
                  <q-item
                    v-for="perm in modulePermissionItems"
                    :key="perm.id">
                    <q-item-section>
                      <q-item-label>{{ perm.label }}</q-item-label>
                      <q-item-label
                        v-if="perm.description"
                        caption>
                        {{ perm.description }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
                <div
                  v-else-if="!modulePermissionsLoading"
                  class="app-embedded-list-empty">
                  {{ t('permissionTreeEmpty') }}
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="app-dialog-actions">
          <q-btn
            no-caps
            unelevated
            color="primary"
            :title="t('close')"
            :label="t('close')"
            @click="closeViewModule"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { onMounted, computed, ref, watch, reactive } from 'vue'
import { useSiteStore } from 'stores/site-store.js'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  moduleFieldKeys,
  moduleListColumnKeys,
  quasarNotifyTypes,
  quasarTableAlign,
  quasarTransitions,
  siteBreakpoints,
  siteBreakpointsPx,
} from 'components/constants.js'
import AdminQTable from 'components/AdminQTable.vue'
import Dialog from 'components/Dialog.vue'
import { useModuleEditForm } from 'src/composables/useModuleEditForm.js'
import { useModuleViewPermissions }
  from 'src/composables/useModuleViewPermissions.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { useAdminPageTestIds } from 'src/composables/useAdminPageTestIds.js'
import { sortRowsByColumns } from 'src/utils/table-sort.js'

const {
  tid,
  rowTid,
  tableTestId,
  formTestIdPrefix,
} = useAdminPageTestIds('modules')

const mk = moduleFieldKeys

const $q = useQuasar()
const loading = ref(false)
const editDialogOpen = ref(false)
const editSaving = ref(false)
const moduleBeingEdited = ref(null)
const viewModuleDialogOpen = ref(false)
const moduleViewing = ref(null)

const siteStore = useSiteStore()
const { t } = useI18n()

const {
  fields: moduleEditFields,
  formatModuleUpdatePayload: formatModuleEditPayload,
} = useModuleEditForm()

const {
  loadPermissionsCatalog,
  applyModulePermissions,
  resetModulePermissions,
  modulePermissionItems,
  modulePermissionsLoading,
} = useModuleViewPermissions()

let viewModulePermissionsSeq = 0

const tablePagination = ref({
  sortBy: mk.name,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

function moduleTablePaginationFromStore(paginationPayload) {
  const meta = siteStore.moduleListPagination
  const total = meta?.total != null && Number.isFinite(Number(meta.total))
    ? Number(meta.total)
    : siteStore.moduleList.length
  let resolvedPage = paginationPayload.page
  if (meta && meta.limit > 0 && Number.isFinite(meta.offset)) {
    resolvedPage = Math.floor(Number(meta.offset) / Number(meta.limit)) + 1
  }

  return {
    sortBy: paginationPayload.sortBy,
    descending: paginationPayload.descending,
    page: resolvedPage,
    rowsPerPage: paginationPayload.rowsPerPage,
    rowsNumber: total,
  }
}

async function loadModules(paginationPayload) {
  loading.value = true
  try {
    await siteStore.getModuleList({
      page: paginationPayload.page,
      limit: paginationPayload.rowsPerPage,
    })
    tablePagination.value = moduleTablePaginationFromStore(
      paginationPayload,
    )
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('moduleListError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function onTableRequest(props) {
  return loadModules(props.pagination)
}

onMounted(() => {
  loadModules(tablePagination.value)
})

watch(editDialogOpen, open => {
  if (!open) {
    moduleBeingEdited.value = null
  }
})

watch(viewModuleDialogOpen, open => {
  if (!open) {
    moduleViewing.value = null
  }
})

watch(
  [viewModuleDialogOpen, moduleViewing],
  async([open, row]) => {
    if (!open) {
      viewModulePermissionsSeq += 1
      resetModulePermissions()

      return
    }
    if (!row?.id) {
      return
    }
    const seq = ++viewModulePermissionsSeq
    await loadPermissionsCatalog()
    if (seq !== viewModulePermissionsSeq || !viewModuleDialogOpen.value) {
      return
    }
    applyModulePermissions(row.id)
  },
)

const filterDialogOpen = ref(false)

const filterDraft = reactive({
  [mk.name]: '',
  [mk.description]: '',
})
const filterApplied = reactive({
  [mk.name]: '',
  [mk.description]: '',
})

function syncDraftFromApplied() {
  filterDraft[mk.name] = filterApplied[mk.name]
  filterDraft[mk.description] = filterApplied[mk.description]
}

const filteredRows = computed(() => {
  let list = siteStore.moduleList
  const nameQ = String(filterApplied[mk.name] ?? '').trim().toLowerCase()
  if (nameQ) {
    list = list.filter(r =>
      String(r[mk.name] ?? '').toLowerCase().includes(nameQ),
    )
  }
  const descQ = String(filterApplied[mk.description] ?? '').trim().toLowerCase()
  if (descQ) {
    list = list.filter(r =>
      String(r[mk.description] ?? '').toLowerCase().includes(descQ),
    )
  }

  return list
})

const activeModuleFilterCount = computed(() => {
  let n = 0
  if (String(filterApplied[mk.name] ?? '').trim()) {
    n += 1
  }
  if (String(filterApplied[mk.description] ?? '').trim()) {
    n += 1
  }

  return n
})

function openModuleFilters() {
  syncDraftFromApplied()
  filterDialogOpen.value = true
}

function closeModuleFilterDialog() {
  syncDraftFromApplied()
  filterDialogOpen.value = false
}

function applyModuleFilters() {
  filterApplied[mk.name] = String(filterDraft[mk.name] ?? '').trim()
  filterApplied[mk.description] = String(
    filterDraft[mk.description] ?? '',
  ).trim()
  filterDialogOpen.value = false
}

function clearModuleFilters() {
  filterDraft[mk.name] = ''
  filterDraft[mk.description] = ''
  filterApplied[mk.name] = ''
  filterApplied[mk.description] = ''
  filterDialogOpen.value = false
}

function getbadge(n) {
  return n > 0 ? String(n) : undefined
}

const columns = computed(() => [
  {
    name: mk.name,
    required: true,
    label: t('name'),
    align: quasarTableAlign.left,
    field: row => row[mk.name],
    sortable: true,
  },
  {
    name: mk.description,
    required: true,
    label: t('description'),
    align: quasarTableAlign.left,
    field: row => row[mk.description] ?? '',
    sortable: true,
  },
  {
    name: moduleListColumnKeys.actions,
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
    filteredRows.value,
    p.sortBy,
    p.descending,
    columns.value,
  )
})

function dashText(v) {
  const s = String(v ?? '').trim()

  return s || '—'
}

const moduleDetailRows = computed(() => {
  const r = moduleViewing.value
  if (!r) {
    return []
  }

  return [
    { key: 'id', label: t('moduleId'), value: String(r.id) },
    { key: mk.name, label: t('name'), value: dashText(r[mk.name]) },
    {
      key: mk.description,
      label: t('description'),
      value: dashText(r[mk.description]),
    },
  ]
})

function moduleRowToFormSeed(row) {
  if (!row) {
    return null
  }

  return {
    [mk.name]: row[mk.name] ?? '',
    [mk.description]: row[mk.description] ?? '',
  }
}

const moduleEditInitialValues = computed(() =>
  moduleBeingEdited.value
    ? moduleRowToFormSeed(moduleBeingEdited.value)
    : null,
)

function openViewModule(row) {
  moduleViewing.value = row
  viewModuleDialogOpen.value = true
}

function closeViewModule() {
  viewModuleDialogOpen.value = false
}

async function openEditModule(row) {
  let seed = row
  try {
    const detail = await siteStore.getModuleById(row.id)
    if (detail) {
      seed = detail
    }
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('moduleDetailLoadError'),
      })
    }
  }
  moduleBeingEdited.value = seed
  editDialogOpen.value = true
}

async function onSaveModuleEdit(payload) {
  const row = moduleBeingEdited.value
  if (!row?.id) {
    return
  }
  editSaving.value = true
  try {
    await siteStore.updateModule(row.id, payload)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('moduleUpdatedSuccess'),
    })
    editDialogOpen.value = false
    await loadModules(tablePagination.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      const msg =
        error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || t('moduleUpdateError')
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: String(msg),
      })
    }
  } finally {
    editSaving.value = false
  }
}

const windowWidth = computed(() => $q.screen.width)
const showGrid = computed(() => windowWidth.value <= siteBreakpointsPx.XXS)
</script>

