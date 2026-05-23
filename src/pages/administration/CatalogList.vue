<template>
  <q-page class="admin-page">
    <q-table
      class="table admin-data-table"
      row-key="id"
      binary-state-sort
      v-model:pagination="tablePagination"
      :rows-per-page-options="[10, 20, 50, 100]"
      :grid="showGrid"
      :title="t('catalogs')"
      :rows="sortedTableRows"
      :columns="columns"
      :loading="loading"
      :rows-per-page-label="t('rowsPerPage')"
      @request="onTableRequest">
      <template v-slot:top>
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="add"
          :disable="loading || catalogFormSaving || deleteSaving"
          :title="t('addCatalog')"
          :label="t('addCatalog')"
          @click="addCatalog"/>
        <q-space />
        <q-btn
          outline
          no-caps
          color="primary"
          class="app-btn-outline"
          icon="filter_alt"
          badge-color="primary"
          :disable="loading || deleteSaving"
          :title="t('filters')"
          :label="t('filters')"
          :badge="getbadge(activeCatalogFilterCount)"
          @click="openCatalogFilters"/>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            round
            icon="visibility"
            color="primary"
            :size="siteBreakpoints.SM"
            :disable="catalogFormSaving || deleteSaving"
            :title="t('viewCatalog')"
            :aria-label="t('viewCatalog')"
            @click="openViewCatalog(props.row)"/>
          <q-btn
            flat
            round
            icon="edit"
            color="primary"
            :size="siteBreakpoints.SM"
            :disable="catalogFormSaving || deleteSaving"
            :title="t('editCatalog')"
            :aria-label="t('editCatalog')"
            @click="openEditCatalog(props.row)"/>
          <q-btn
            flat
            round
            icon="delete"
            color="primary"
            :size="siteBreakpoints.SM"
            :disable="deleteSaving || catalogFormSaving"
            :title="t('deleteCatalogTitle')"
            :aria-label="t('deleteCatalogTitle')"
            @click="deleteRow(props.row)"/>
        </q-td>
      </template>
    </q-table>

    <CatalogFormDialog
      v-model="catalogFormDialogOpen"
      :title="catalogFormDialogTitle"
      :initial-row="catalogFormInitialRow"
      :saving="catalogFormSaving"
      @save="onSaveCatalogForm"/>

    <q-dialog
      v-model="filterDialogOpen"
      persistent
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card class="modal-card app-dialog-card app-dialog-card--sm">
        <q-toolbar class="app-dialog-toolbar">
          <q-toolbar-title>{{ t('catalogFiltersTitle') }}</q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            :title="t('close')"
            :aria-label="t('close')"
            @click="closeCatalogFilterDialog"/>
        </q-toolbar>
        <q-card-section class="app-dialog-body app-dialog-form-stack">
          <q-input
            v-model="filterDraft[ck.name]"
            outlined
            dense
            clearable
            :label="t('catalogName')"/>
          <q-input
            v-model="filterDraft[ck.description]"
            outlined
            dense
            clearable
            :label="t('description')"/>
          <q-select
            v-model="filterDraft[ck.scope]"
            outlined
            dense
            clearable
            emit-value
            map-options
            :options="scopeFilterOptions"
            :label="t('catalogScope')"
            :behavior="selectBehaviors.menu"/>
          <q-select
            v-model="filterDraft[ck.status]"
            outlined
            dense
            clearable
            emit-value
            map-options
            :options="statusFilterOptions"
            :label="t('status')"
            :behavior="selectBehaviors.menu"/>
        </q-card-section>
        <q-card-actions align="right" class="app-dialog-actions">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :title="t('roleFilterClear')"
            :label="t('roleFilterClear')"
            @click="clearCatalogFilters"/>
          <q-btn
            no-caps
            unelevated
            class="primary-action"
            color="primary"
            :title="t('roleFilterApply')"
            :label="t('roleFilterApply')"
            @click="applyCatalogFilters"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <ModalComponent
      v-model="deleteConfirmOpen"
      :title="t('deleteCatalogTitle')"
      :message="deleteCatalogMessage"
      :confirm-text="t('confirm')"
      :cancel-text="t('cancel')"
      @confirm="onConfirmDeleteCatalog"
      @cancel="onCancelDeleteCatalog"/>

    <q-dialog
      v-model="viewCatalogDialogOpen"
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card
        v-if="catalogViewing"
        class="modal-card app-dialog-card app-dialog-card--lg">
        <q-toolbar class="app-dialog-toolbar">
          <q-toolbar-title>{{ t('viewCatalogTitle') }}</q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            :title="t('close')"
            :aria-label="t('close')"
            @click="closeViewCatalog"/>
        </q-toolbar>
        <q-card-section class="app-dialog-body">
          <div class="row q-col-gutter-md q-mb-md">
            <div
              v-for="item in catalogDetailRows"
              class="col-12 col-sm-6"
              :key="item.key">
              <div class="text-caption text-grey-7">{{ item.label }}</div>
              <div class="text-body2 text-grey-9">{{ item.value }}</div>
            </div>
          </div>
          <div class="text-subtitle2 q-mb-sm">{{ t('catalogItemsTitle') }}</div>
          <q-table
            v-if="catalogViewItems.length > 0"
            flat
            bordered
            dense
            class="table admin-data-table"
            row-key="_localKey"
            hide-pagination
            :rows="catalogViewItems"
            :columns="itemViewColumns"
            :rows-per-page-options="[0]"/>
          <div v-else class="text-body2 text-grey-7">
            {{ t('catalogItemsEmpty') }}
          </div>
        </q-card-section>
        <q-card-actions align="right" class="app-dialog-actions">
          <q-btn
            no-caps
            unelevated
            color="primary"
            :title="t('close')"
            :label="t('close')"
            @click="closeViewCatalog"/>
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
  catalogFieldKeys,
  catalogItemFieldKeys,
  catalogListColumnKeys,
  catalogScopes,
  quasarNotifyTypes,
  quasarTableAlign,
  quasarTransitions,
  selectBehaviors,
  siteBreakpoints,
  siteBreakpointsPx,
} from 'components/constants.js'
import CatalogFormDialog from 'components/CatalogFormDialog.vue'
import ModalComponent from 'components/ModalComponent.vue'
import { buildCatalogMutationBody } from 'components/helpers.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { sortRowsByColumns } from 'src/utils/table-sort.js'

const ck = catalogFieldKeys
const ik = catalogItemFieldKeys

const $q = useQuasar()
const loading = ref(false)
const catalogEditingRow = ref(null)
const catalogFormDialogOpen = ref(false)
const catalogFormSaving = ref(false)
const catalogFormSeedRow = ref(null)
const deleteConfirmOpen = ref(false)
const catalogPendingDelete = ref(null)
const deleteSaving = ref(false)
const viewCatalogDialogOpen = ref(false)
const catalogViewing = ref(null)

const siteStore = useSiteStore()
const { t } = useI18n()

const catalogFormDialogTitle = computed(() =>
  catalogEditingRow.value ? t('editCatalog') : t('newCatalog'),
)

const catalogFormInitialRow = computed(() =>
  catalogFormDialogOpen.value ? catalogFormSeedRow.value : null,
)

const scopeFilterOptions = computed(() => [
  { label: t('catalogScopeGlobal'), value: catalogScopes.global },
  { label: t('catalogScopeTenant'), value: catalogScopes.tenant },
])

const statusFilterOptions = computed(() => [
  { label: t('tenantStatusActive'), value: 1 },
  { label: t('tenantStatusInactive'), value: 0 },
])

const tablePagination = ref({
  sortBy: ck.name,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

function catalogTablePaginationFromStore(paginationPayload) {
  const meta = siteStore.catalogListPagination
  const total = meta?.total != null && Number.isFinite(Number(meta.total))
    ? Number(meta.total)
    : siteStore.catalogList.length
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

async function loadCatalogs(paginationPayload) {
  loading.value = true
  try {
    await siteStore.getCatalogList({
      page: paginationPayload.page,
      limit: paginationPayload.rowsPerPage,
    })
    tablePagination.value = catalogTablePaginationFromStore(
      paginationPayload,
    )
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('catalogListError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function onTableRequest(props) {
  return loadCatalogs(props.pagination)
}

watch(catalogFormDialogOpen, open => {
  if (!open) {
    catalogEditingRow.value = null
    catalogFormSeedRow.value = null
  }
})

watch(viewCatalogDialogOpen, open => {
  if (!open) {
    catalogViewing.value = null
  }
})

onMounted(() => {
  loadCatalogs(tablePagination.value)
})

function catalogScopeLabel(scope) {
  const v = String(scope ?? '').trim().toLowerCase()
  if (v === catalogScopes.global) {
    return t('catalogScopeGlobal')
  }
  if (v === catalogScopes.tenant) {
    return t('catalogScopeTenant')
  }

  return v || '—'
}

function catalogStatusLabel(status) {
  const n = Number(status)

  return n === 1 ? t('tenantStatusActive') : t('tenantStatusInactive')
}

const columns = computed(() => [
  {
    name: ck.name,
    required: true,
    label: t('catalogName'),
    align: quasarTableAlign.left,
    field: row => row[ck.name],
    sortable: true,
  },
  {
    name: ck.scope,
    required: true,
    label: t('catalogScope'),
    align: quasarTableAlign.left,
    field: row => catalogScopeLabel(row[ck.scope]),
    sortable: true,
  },
  {
    name: ck.description,
    required: true,
    label: t('description'),
    align: quasarTableAlign.left,
    field: row => row[ck.description] ?? '',
    sortable: true,
  },
  {
    name: catalogListColumnKeys.itemCount,
    required: true,
    label: t('catalogItemCount'),
    align: quasarTableAlign.center,
    field: row => row.itemCount ?? 0,
    sortable: true,
  },
  {
    name: ck.status,
    required: true,
    label: t('status'),
    align: quasarTableAlign.left,
    field: row => catalogStatusLabel(row[ck.status]),
    sortable: true,
  },
  {
    name: catalogListColumnKeys.actions,
    required: true,
    label: t('actions'),
    align: quasarTableAlign.center,
    field: () => null,
    sortable: false,
  },
])

const itemViewColumns = computed(() => [
  {
    name: ik.label,
    label: t('catalogItemLabel'),
    align: quasarTableAlign.left,
    field: row => row[ik.label],
  },
  {
    name: ik.code,
    label: t('catalogItemCode'),
    align: quasarTableAlign.left,
    field: row => row[ik.code],
  },
  {
    name: ik.description,
    label: t('description'),
    align: quasarTableAlign.left,
    field: row => row[ik.description] ?? '',
  },
])

const filterDialogOpen = ref(false)
const filterDraft = reactive({
  [ck.name]: '',
  [ck.description]: '',
  [ck.scope]: null,
  [ck.status]: null,
})
const filterApplied = reactive({
  [ck.name]: '',
  [ck.description]: '',
  [ck.scope]: null,
  [ck.status]: null,
})

function syncDraftFromApplied() {
  filterDraft[ck.name] = filterApplied[ck.name]
  filterDraft[ck.description] = filterApplied[ck.description]
  filterDraft[ck.scope] = filterApplied[ck.scope]
  filterDraft[ck.status] = filterApplied[ck.status]
}

const filteredRows = computed(() => {
  let list = siteStore.catalogList
  const nameQ = String(filterApplied[ck.name] ?? '').trim().toLowerCase()
  if (nameQ) {
    list = list.filter(r =>
      String(r[ck.name] ?? '').toLowerCase().includes(nameQ),
    )
  }
  const descQ = String(filterApplied[ck.description] ?? '').trim().toLowerCase()
  if (descQ) {
    list = list.filter(r =>
      String(r[ck.description] ?? '').toLowerCase().includes(descQ),
    )
  }
  const scope = String(filterApplied[ck.scope] ?? '').trim()
  if (scope) {
    list = list.filter(r => String(r[ck.scope] ?? '').trim() === scope)
  }
  const statusVal = filterApplied[ck.status]
  if (statusVal != null && Number.isFinite(Number(statusVal))) {
    const want = Number(statusVal)
    list = list.filter(r => Number(r[ck.status]) === want)
  }

  return list
})

const sortedTableRows = computed(() => {
  const p = tablePagination.value

  return sortRowsByColumns(
    filteredRows.value,
    p.sortBy,
    p.descending,
    columns.value,
  )
})

const activeCatalogFilterCount = computed(() => {
  let n = 0
  if (String(filterApplied[ck.name] ?? '').trim()) {
    n += 1
  }
  if (String(filterApplied[ck.description] ?? '').trim()) {
    n += 1
  }
  if (String(filterApplied[ck.scope] ?? '').trim()) {
    n += 1
  }
  if (
    filterApplied[ck.status] != null
    && Number.isFinite(Number(filterApplied[ck.status]))
  ) {
    n += 1
  }

  return n
})

function openCatalogFilters() {
  syncDraftFromApplied()
  filterDialogOpen.value = true
}

function closeCatalogFilterDialog() {
  syncDraftFromApplied()
  filterDialogOpen.value = false
}

function applyCatalogFilters() {
  filterApplied[ck.name] = String(filterDraft[ck.name] ?? '').trim()
  filterApplied[ck.description] = String(
    filterDraft[ck.description] ?? '',
  ).trim()
  const scope = filterDraft[ck.scope]
  filterApplied[ck.scope] =
    scope != null && String(scope).trim() ? String(scope).trim() : null
  const st = filterDraft[ck.status]
  filterApplied[ck.status] =
    st != null && Number.isFinite(Number(st)) ? Number(st) : null
  filterDialogOpen.value = false
}

function clearCatalogFilters() {
  filterDraft[ck.name] = ''
  filterDraft[ck.description] = ''
  filterDraft[ck.scope] = null
  filterDraft[ck.status] = null
  filterApplied[ck.name] = ''
  filterApplied[ck.description] = ''
  filterApplied[ck.scope] = null
  filterApplied[ck.status] = null
  filterDialogOpen.value = false
}

function dashText(v) {
  const s = String(v ?? '').trim()

  return s || '—'
}

const catalogDetailRows = computed(() => {
  const r = catalogViewing.value
  if (!r) {
    return []
  }

  return [
    { key: 'id', label: t('catalogId'), value: String(r.id) },
    { key: ck.name, label: t('catalogName'), value: dashText(r[ck.name]) },
    {
      key: ck.scope,
      label: t('catalogScope'),
      value: catalogScopeLabel(r[ck.scope]),
    },
    {
      key: ck.description,
      label: t('description'),
      value: dashText(r[ck.description]),
    },
    {
      key: ck.status,
      label: t('status'),
      value: catalogStatusLabel(r[ck.status]),
    },
  ]
})

const catalogViewItems = computed(() => {
  const items = catalogViewing.value?.[ck.items]

  return Array.isArray(items) ? items : []
})

async function openViewCatalog(row) {
  viewCatalogDialogOpen.value = true
  catalogViewing.value = row
  if (!row?.id) {
    return
  }
  try {
    const fresh = await siteStore.getCatalogById(row.id)
    if (fresh && viewCatalogDialogOpen.value) {
      catalogViewing.value = fresh
    }
  } catch {
    if (viewCatalogDialogOpen.value) {
      $q.notify({
        type: quasarNotifyTypes.warning,
        message: t('catalogDetailLoadError'),
      })
    }
  }
}

function closeViewCatalog() {
  viewCatalogDialogOpen.value = false
}

const windowWidth = computed(() => $q.screen.width)
const showGrid = computed(() => windowWidth.value <= siteBreakpointsPx.XXS)

function addCatalog() {
  catalogEditingRow.value = null
  catalogFormSeedRow.value = null
  catalogFormDialogOpen.value = true
}

async function openEditCatalog(row) {
  catalogEditingRow.value = row
  catalogFormSeedRow.value = row
  catalogFormDialogOpen.value = true
  if (!row?.id) {
    return
  }
  try {
    const fresh = await siteStore.getCatalogById(row.id)
    if (fresh && catalogFormDialogOpen.value) {
      catalogFormSeedRow.value = fresh
      catalogEditingRow.value = fresh
    }
  } catch {
    if (catalogFormDialogOpen.value) {
      $q.notify({
        type: quasarNotifyTypes.warning,
        message: t('catalogDetailLoadError'),
      })
    }
  }
}

async function onSaveCatalogForm(formPayload) {
  const body = buildCatalogMutationBody(formPayload)
  if (!body['catalog_items']?.length) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('catalogItemsRequired'),
    })

    return
  }

  catalogFormSaving.value = true
  const isEdit = Boolean(catalogEditingRow.value?.id)
  try {
    if (isEdit) {
      await siteStore.updateCatalog(catalogEditingRow.value.id, body)
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('catalogUpdatedSuccess'),
      })
    } else {
      await siteStore.createCatalog(body)
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('catalogCreatedSuccess'),
      })
    }
    catalogFormDialogOpen.value = false
    tablePagination.value = catalogTablePaginationFromStore(
      tablePagination.value,
    )
  } catch (error) {
    const fallbackKey = isEdit ? 'catalogUpdateError' : 'catalogCreateError'
    const msg =
      error?.response?.data?.message
      || error?.response?.data?.error
      || error?.message
      || t(fallbackKey)
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: String(msg),
    })
  } finally {
    catalogFormSaving.value = false
  }
}

function getbadge(n) {
  return n > 0 ? String(n) : undefined
}

function deleteRow(row) {
  catalogPendingDelete.value = row
  deleteConfirmOpen.value = true
}

function onCancelDeleteCatalog() {
  catalogPendingDelete.value = null
}

const deleteCatalogMessage = computed(() => {
  const row = catalogPendingDelete.value
  if (!row) {
    return ''
  }

  return t('deleteCatalogMessage', {
    name: row[ck.name] || row.id,
  })
})

async function onConfirmDeleteCatalog() {
  if (deleteSaving.value) {
    return
  }
  const row = catalogPendingDelete.value
  if (!row?.id) {
    return
  }
  deleteSaving.value = true
  try {
    await siteStore.deleteCatalog(row.id)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('catalogDeletedSuccess'),
    })
    await loadCatalogs(tablePagination.value)
  } catch (error) {
    const msg =
      error?.response?.data?.message
      || error?.response?.data?.error
      || error?.message
      || t('catalogDeleteError')
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: String(msg),
    })
  } finally {
    deleteSaving.value = false
    catalogPendingDelete.value = null
    deleteConfirmOpen.value = false
  }
}
</script>
