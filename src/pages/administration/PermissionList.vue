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
      :title="t('permissions')"
      :rows="paginatedTableRows"
      :columns="columns"
      :loading="false"
      :rows-per-page-label="t('rowsPerPage')"
      @request="onTableRequest">
      <template v-slot:top>
        <div class="permission-module-chips">
          <q-spinner
            v-if="modulesFilterLoading"
            color="primary"
            size="20px" />
          <template v-else>
            <button
              type="button"
              class="permission-module-orb"
              :class="{
                'permission-module-orb--active': isAllModulesFilterActive,
              }"
              :data-testid="tid('btn', 'module-all')"
              :aria-label="t('all')"
              @click="clearModuleFilter">
              <span class="permission-module-orb__glyph">
                {{ allModulesGlyph }}
              </span>
              <q-tooltip
                class="permission-module-orb-tooltip"
                anchor="top middle"
                self="bottom middle"
                :offset="[0, 6]">
                {{ t('all') }}
              </q-tooltip>
            </button>
            <button
              v-for="mod in moduleFilterOptions"
              :key="mod.value"
              type="button"
              class="permission-module-orb"
              :class="{
                'permission-module-orb--active': isModuleChipActive(mod.value),
              }"
              :data-testid="tid('btn', `module-${mod.value}`)"
              :aria-label="mod.label"
              @click="selectModuleFilter(mod.value)">
              <span class="permission-module-orb__glyph">
                {{ moduleInitials(mod.label) }}
              </span>
              <q-tooltip
                class="permission-module-orb-tooltip"
                anchor="top middle"
                self="bottom middle"
                :offset="[0, 6]">
                {{ mod.label }}
              </q-tooltip>
            </button>
          </template>
        </div>
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
          :badge="getbadge(activePermissionFilterCount)"
          @click="openPermissionFilters"/>
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
          :title="t('viewPermission')"
          :aria-label="t('viewPermission')"
          @click="openViewPermission(row)"/>
        <q-btn
          flat
          round
          icon="edit"
          color="primary"
          :data-testid="rowTid(row.id, 'edit')"
          :size="siteBreakpoints.SM"
          :disable="loading || editSaving"
          :title="t('editPermission')"
          :aria-label="t('editPermission')"
          @click="openEditPermission(row)"/>
      </template>
    </AdminQTable>

    <Dialog
      v-model="editDialogOpen"
      :test-id-prefix="formTestIdPrefix"
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
      <q-card class="modal-card app-dialog-card app-dialog-card--sm">
        <q-toolbar class="app-dialog-toolbar">
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
        <q-card-section class="app-dialog-body app-dialog-form-stack">
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
        <q-card-actions align="right" class="app-dialog-actions">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :title="t('roleFilterClear')"
            :label="t('roleFilterClear')"
            @click="clearPermissionFilters"/>
          <q-btn
            no-caps
            unelevated
            class="primary-action"
            color="primary"
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
      <q-card
        v-if="permissionViewing"
        class="modal-card app-dialog-card app-dialog-card--lg">
        <q-toolbar class="app-dialog-toolbar">
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
        <q-card-section class="app-dialog-body">
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
        <q-card-actions align="right" class="app-dialog-actions">
          <q-btn
            no-caps
            unelevated
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
import {
  enrichPermissionsModuleNames,
  fetchAllEnvelopeList,
  mapPermission,
} from 'components/helpers.js'
import { apiInstance } from 'boot/axios'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import Dialog from 'components/Dialog.vue'
import { usePermissionEditForm } from 'src/composables/usePermissionEditForm.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { useAdminPageTestIds } from 'src/composables/useAdminPageTestIds.js'
import { usePageLoadingOverlay } from 'src/composables/usePageLoadingOverlay.js'
import { filterLabelValueOptions } from 'src/utils/q-select-local-filter.js'
import { fetchAllPaginatedRaw }
  from 'src/utils/permission-catalog-tree.js'
import { sortRowsByColumns } from 'src/utils/table-sort.js'

const {
  tid,
  rowTid,
  tableTestId,
  formTestIdPrefix,
} = useAdminPageTestIds('permissions')

const pk = permissionFieldKeys

const $q = useQuasar()
const loading = ref(false)
const editDialogOpen = ref(false)
const editSaving = ref(false)
const permissionBeingEdited = ref(null)
const viewPermissionDialogOpen = ref(false)
const permissionViewing = ref(null)

const { showing: pageOverlayShowing, message: pageOverlayMessage } =
  usePageLoadingOverlay({
    loading,
    saving: editSaving,
  })

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

const allPermissions = ref([])

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
  let list = allPermissions.value
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

watch(
  () => [
    filterApplied[pk.name],
    filterApplied[pk.description],
    filterApplied[pk.moduleId],
  ],
  () => {
    syncTablePaginationRowsNumber()
  },
)

function syncTablePaginationRowsNumber() {
  const total = filteredRows.value.length
  const rowsPerPage = tablePagination.value.rowsPerPage
  const maxPage = Math.max(1, Math.ceil(total / rowsPerPage) || 1)
  let page = tablePagination.value.page
  if (page > maxPage) {
    page = maxPage
  }
  tablePagination.value = {
    ...tablePagination.value,
    page,
    rowsNumber: total,
  }
}

async function loadAllPermissions() {
  loading.value = true
  try {
    const [permissionRows, moduleRows] = await Promise.all([
      fetchAllPaginatedRaw(apiPaths.permissionsList),
      fetchAllEnvelopeList(
        (path, cfg) => apiInstance.get(path, cfg),
        apiPaths.modulesList,
      ).catch(() => []),
    ])
    const mapped = permissionRows.map(mapPermission).filter(Boolean)
    allPermissions.value = enrichPermissionsModuleNames(
      mapped,
      moduleRows,
    )
    syncTablePaginationRowsNumber()
  } catch (error) {
    allPermissions.value = []
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
  tablePagination.value = {
    sortBy: props.pagination.sortBy,
    descending: props.pagination.descending,
    page: props.pagination.page,
    rowsPerPage: props.pagination.rowsPerPage,
    rowsNumber: filteredRows.value.length,
  }
}

onMounted(() => {
  loadAllPermissions()
  loadModuleFilterOptions()
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

const isAllModulesFilterActive = computed(() => {
  const modId = filterApplied[pk.moduleId]

  return modId == null || !Number.isFinite(Number(modId))
})

function isModuleChipActive(moduleId) {
  const applied = filterApplied[pk.moduleId]
  if (applied == null || !Number.isFinite(Number(applied))) {
    return false
  }

  return Number(applied) === Number(moduleId)
}

function selectModuleFilter(moduleId) {
  const id = Number(moduleId)
  if (!Number.isFinite(id)) {
    return
  }
  if (isModuleChipActive(id)) {
    clearModuleFilter()

    return
  }
  filterApplied[pk.moduleId] = id
  filterDraft[pk.moduleId] = id
}

function clearModuleFilter() {
  filterApplied[pk.moduleId] = null
  filterDraft[pk.moduleId] = null
}

function getbadge(n) {
  return n > 0 ? String(n) : undefined
}

const MODULE_ORB_LABEL_LEN = 10

function moduleInitials(label) {
  const compact = String(label ?? '')
    .replace(/\s+/g, '')
    .toUpperCase()
  if (!compact) {
    return '?'
  }

  return compact.slice(0, MODULE_ORB_LABEL_LEN)
}

const allModulesGlyph = computed(() =>
  String(t('all')).replace(/\s+/g, '').toUpperCase()
    .slice(0, MODULE_ORB_LABEL_LEN),
)

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

const paginatedTableRows = computed(() => {
  const sorted = sortedTableRows.value
  const p = tablePagination.value
  const start = (p.page - 1) * p.rowsPerPage

  return sorted.slice(start, start + p.rowsPerPage)
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
    await loadAllPermissions()
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
