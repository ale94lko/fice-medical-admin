<template>
  <q-page>
    <q-table
      class="table"
      row-key="id"
      binary-state-sort
      v-model:pagination="tablePagination"
      :rows-per-page-options="[10, 20, 50, 100]"
      :grid="showGrid"
      :title="t('permissions')"
      :rows="sortedTableRows"
      :columns="columns"
      :loading="loading"
      :rows-per-page-label="t('rowsPerPage')"
      @request="onTableRequest">
      <template v-slot:top>
        <q-space />
        <q-btn
          color="secondary"
          class="text-teal-10"
          icon="filter_alt"
          badge-color="primary"
          :disable="loading || editSaving"
          :title="t('filters')"
          :label="t('filters')"
          :badge="getbadge(activePermissionFilterCount)"
          @click="openPermissionFilters"/>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            round
            icon="visibility"
            color="primary"
            :size="siteBreakpoints.SM"
            :disable="loading || editSaving"
            :title="t('viewPermission')"
            :aria-label="t('viewPermission')"
            @click="openViewPermission(props.row)"/>
          <q-btn
            flat
            round
            icon="edit"
            color="primary"
            :size="siteBreakpoints.SM"
            :disable="loading || editSaving"
            :title="t('editPermission')"
            :aria-label="t('editPermission')"
            @click="openEditPermission(props.row)"/>
        </q-td>
      </template>
    </q-table>

    <Dialog
      v-model="editDialogOpen"
      :title-key="'editPermission'"
      :fields="permissionEditFields"
      :initial-values="permissionEditInitialValues"
      :format-payload="formatPermissionEditPayload"
      :saving="editSaving"
      @save="onSavePermissionEdit"/>

    <q-dialog
      v-model="filterDialogOpen"
      persistent
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card class="permission-filter-card">
        <q-toolbar class="q-px-md bg-teal-10 text-white">
          <q-toolbar-title>{{ t('permissionFiltersTitle') }}</q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            :title="t('close')"
            :aria-label="t('close')"
            @click="closePermissionFilterDialog"/>
        </q-toolbar>
        <q-card-section class="column q-gutter-md q-px-lg q-py-md">
          <q-input
            v-model="filterDraft[pk.name]"
            outlined
            dense
            clearable
            :label="t('name')"/>
          <q-input
            v-model="filterDraft[pk.description]"
            outlined
            dense
            clearable
            :label="t('description')"/>
          <q-select
            v-model="filterDraft[pk.moduleId]"
            outlined
            dense
            clearable
            emit-value
            map-options
            :options="moduleFilterDisplayedOptions"
            :option-label="qSelectOptionKeys.label"
            :option-value="qSelectOptionKeys.value"
            :label="t('permissionModule')"
            :loading="modulesFilterLoading"
            :behavior="selectBehaviors.menu"
            @popup-show="onModuleFilterPopupShow">
            <template #before-options>
              <div class="permission-filter-select-search q-pa-sm bg-white">
                <q-input
                  v-model="moduleFilterSearchNeedle"
                  dense
                  outlined
                  clearable
                  :placeholder="t('selectOptionsSearchPlaceholder')"/>
              </div>
            </template>
          </q-select>
        </q-card-section>
        <q-separator />
        <q-card-actions align="center" class="q-pa-md">
          <q-btn
            no-caps
            padding="7px 30px"
            color="secondary"
            class="text-teal-10"
            :title="t('roleFilterClear')"
            :label="t('roleFilterClear')"
            @click="clearPermissionFilters"/>
          <q-btn
            no-caps
            class="primary-action"
            color="primary"
            padding="7px 30px"
            :title="t('roleFilterApply')"
            :label="t('roleFilterApply')"
            @click="applyPermissionFilters"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="viewPermissionDialogOpen"
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card v-if="permissionViewing" class="permission-view-card">
        <q-toolbar class="q-px-md bg-teal-10 text-white">
          <q-toolbar-title>{{ t('viewPermissionTitle') }}</q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            :title="t('close')"
            :aria-label="t('close')"
            @click="closeViewPermission"/>
        </q-toolbar>
        <q-card-section class="permission-view-body q-px-lg q-py-md">
          <div class="row q-col-gutter-md">
            <div
              v-for="item in permissionDetailRows"
              class="col-12 col-sm-6"
              :key="item.key">
              <div class="text-caption text-grey-7">{{ item.label }}</div>
              <div class="text-body2 text-grey-9">{{ item.value }}</div>
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="center" class="q-pa-md">
          <q-btn
            no-caps
            padding="7px 30px"
            color="primary"
            :title="t('close')"
            :label="t('close')"
            @click="closeViewPermission"
          />
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
  apiPaths,
  qSelectOptionKeys,
  quasarNotifyTypes,
  quasarTableAlign,
  quasarTransitions,
  permissionFieldKeys,
  permissionListColumnKeys,
  selectBehaviors,
  siteBreakpoints,
  siteBreakpointsPx,
} from 'components/constants.js'
import { fetchAllEnvelopeList } from 'components/helpers.js'
import { apiInstance } from 'boot/axios'
import Dialog from 'components/Dialog.vue'
import { usePermissionEditForm } from 'src/composables/usePermissionEditForm.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { filterLabelValueOptions } from 'src/utils/q-select-local-filter.js'
import { sortRowsByColumns } from 'src/utils/table-sort.js'

const pk = permissionFieldKeys

const $q = useQuasar()
const loading = ref(false)
const editDialogOpen = ref(false)
const editSaving = ref(false)
const permissionBeingEdited = ref(null)
const viewPermissionDialogOpen = ref(false)
const permissionViewing = ref(null)

const siteStore = useSiteStore()
const { t } = useI18n()

const {
  fields: permissionEditFields,
  formatPermissionUpdatePayload: formatPermissionEditPayload,
} = usePermissionEditForm()

const tablePagination = ref({
  sortBy: pk.name,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

function permissionTablePaginationFromStore(paginationPayload) {
  const meta = siteStore.permissionListPagination
  const total = meta?.total != null && Number.isFinite(Number(meta.total))
    ? Number(meta.total)
    : siteStore.permissionList.length
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

async function loadPermissions(paginationPayload) {
  loading.value = true
  try {
    await siteStore.getPermissionList({
      page: paginationPayload.page,
      limit: paginationPayload.rowsPerPage,
    })
    tablePagination.value = permissionTablePaginationFromStore(
      paginationPayload,
    )
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('permissionListError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function onTableRequest(props) {
  return loadPermissions(props.pagination)
}

onMounted(() => {
  loadPermissions(tablePagination.value)
})

watch(editDialogOpen, open => {
  if (!open) {
    permissionBeingEdited.value = null
  }
})

watch(viewPermissionDialogOpen, open => {
  if (!open) {
    permissionViewing.value = null
  }
})

const filterDialogOpen = ref(false)
const moduleFilterOptions = ref([])
const moduleFilterSearchNeedle = ref('')
const modulesFilterLoading = ref(false)

const moduleFilterDisplayedOptions = computed(() =>
  filterLabelValueOptions(
    moduleFilterOptions.value,
    moduleFilterSearchNeedle.value,
  ),
)

function onModuleFilterPopupShow() {
  moduleFilterSearchNeedle.value = ''
}

function resetPermissionFilterSelectSearch() {
  moduleFilterSearchNeedle.value = ''
}

const filterDraft = reactive({
  [pk.name]: '',
  [pk.description]: '',
  [pk.moduleId]: null,
})
const filterApplied = reactive({
  [pk.name]: '',
  [pk.description]: '',
  [pk.moduleId]: null,
})

function syncDraftFromApplied() {
  filterDraft[pk.name] = filterApplied[pk.name]
  filterDraft[pk.description] = filterApplied[pk.description]
  filterDraft[pk.moduleId] = filterApplied[pk.moduleId]
}

async function loadModuleFilterOptions() {
  if (moduleFilterOptions.value.length > 0) {
    return
  }
  modulesFilterLoading.value = true
  try {
    const rows = await fetchAllEnvelopeList(
      (path, cfg) => apiInstance.get(path, cfg),
      apiPaths.modulesList,
    )
    const out = []
    for (const row of rows) {
      if (!row || typeof row !== 'object') {
        continue
      }
      const id = Number(row.id)
      if (!Number.isFinite(id)) {
        continue
      }
      const label = String(row.name ?? '').trim() || String(id)
      out.push({ label, value: id })
    }
    out.sort((a, b) => a.label.localeCompare(b.label))
    moduleFilterOptions.value = out
  } catch {
    moduleFilterOptions.value = []
  } finally {
    modulesFilterLoading.value = false
  }
}

const filteredRows = computed(() => {
  let list = siteStore.permissionList
  const nameQ = String(filterApplied[pk.name] ?? '').trim().toLowerCase()
  if (nameQ) {
    list = list.filter(r =>
      String(r[pk.name] ?? '').toLowerCase().includes(nameQ),
    )
  }
  const descQ = String(filterApplied[pk.description] ?? '').trim().toLowerCase()
  if (descQ) {
    list = list.filter(r =>
      String(r[pk.description] ?? '').toLowerCase().includes(descQ),
    )
  }
  const modId = filterApplied[pk.moduleId]
  if (modId != null && Number.isFinite(Number(modId))) {
    const want = Number(modId)
    list = list.filter(r => Number(r[pk.moduleId]) === want)
  }

  return list
})

const activePermissionFilterCount = computed(() => {
  let n = 0
  if (String(filterApplied[pk.name] ?? '').trim()) {
    n += 1
  }
  if (String(filterApplied[pk.description] ?? '').trim()) {
    n += 1
  }
  if (
    filterApplied[pk.moduleId] != null
    && Number.isFinite(Number(filterApplied[pk.moduleId]))
  ) {
    n += 1
  }

  return n
})

async function openPermissionFilters() {
  resetPermissionFilterSelectSearch()
  syncDraftFromApplied()
  filterDialogOpen.value = true
  await loadModuleFilterOptions()
}

function closePermissionFilterDialog() {
  resetPermissionFilterSelectSearch()
  syncDraftFromApplied()
  filterDialogOpen.value = false
}

function applyPermissionFilters() {
  filterApplied[pk.name] = String(filterDraft[pk.name] ?? '').trim()
  filterApplied[pk.description] = String(
    filterDraft[pk.description] ?? '',
  ).trim()
  const mid = filterDraft[pk.moduleId]
  filterApplied[pk.moduleId] =
    mid != null && Number.isFinite(Number(mid)) ? Number(mid) : null
  filterDialogOpen.value = false
}

function clearPermissionFilters() {
  filterDraft[pk.name] = ''
  filterDraft[pk.description] = ''
  filterDraft[pk.moduleId] = null
  filterApplied[pk.name] = ''
  filterApplied[pk.description] = ''
  filterApplied[pk.moduleId] = null
  filterDialogOpen.value = false
}

function getbadge(n) {
  return n > 0 ? String(n) : undefined
}

const columns = computed(() => [
  {
    name: pk.name,
    required: true,
    label: t('name'),
    align: quasarTableAlign.left,
    field: row => row[pk.name],
    sortable: true,
  },
  {
    name: pk.description,
    required: true,
    label: t('description'),
    align: quasarTableAlign.left,
    field: row => row[pk.description] ?? '',
    sortable: true,
  },
  {
    name: pk.moduleName,
    required: true,
    label: t('permissionModule'),
    align: quasarTableAlign.left,
    field: row => {
      const n = row[pk.moduleName]

      return n ? String(n) : '—'
    },
    sortable: true,
  },
  {
    name: permissionListColumnKeys.actions,
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

const permissionDetailRows = computed(() => {
  const r = permissionViewing.value
  if (!r) {
    return []
  }

  return [
    { key: 'id', label: t('permissionId'), value: String(r.id) },
    { key: pk.name, label: t('name'), value: dashText(r[pk.name]) },
    {
      key: pk.description,
      label: t('description'),
      value: dashText(r[pk.description]),
    },
    {
      key: pk.moduleName,
      label: t('permissionModule'),
      value: dashText(r[pk.moduleName]),
    },
  ]
})

function permissionRowToFormSeed(row) {
  if (!row) {
    return null
  }

  return {
    [pk.name]: row[pk.name] ?? '',
    [pk.description]: row[pk.description] ?? '',
  }
}

const permissionEditInitialValues = computed(() =>
  permissionBeingEdited.value
    ? permissionRowToFormSeed(permissionBeingEdited.value)
    : null,
)

function openViewPermission(row) {
  permissionViewing.value = row
  viewPermissionDialogOpen.value = true
}

function closeViewPermission() {
  viewPermissionDialogOpen.value = false
}

function openEditPermission(row) {
  permissionBeingEdited.value = row
  editDialogOpen.value = true
}

async function onSavePermissionEdit(payload) {
  const row = permissionBeingEdited.value
  if (!row?.id) {
    return
  }
  editSaving.value = true
  try {
    await siteStore.updatePermission(row.id, payload)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('permissionUpdatedSuccess'),
    })
    editDialogOpen.value = false
    await loadPermissions(tablePagination.value)
  } catch (error) {
    const msg =
      error?.response?.data?.message
      || error?.response?.data?.error
      || error?.message
      || t('permissionUpdateError')
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: String(msg),
    })
  } finally {
    editSaving.value = false
  }
}

const windowWidth = computed(() => $q.screen.width)
const showGrid = computed(() => windowWidth.value <= siteBreakpointsPx.XXS)
</script>

<style scoped>
  .permission-view-card {
    min-width: min(520px, 100vw - 24px);
    max-width: min(640px, 100vw - 24px);
  }

  .permission-view-body {
    max-height: min(640px, 78vh);
    overflow-y: auto;
  }

  .permission-filter-card {
    min-width: min(400px, 100vw - 32px);
    max-width: 440px;
  }

  .permission-filter-card .primary-action {
    margin-left: 16px;
  }
</style>
