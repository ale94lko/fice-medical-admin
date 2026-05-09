<template>
  <q-page>
    <q-table
      class="table"
      row-key="id"
      binary-state-sort
      v-model:pagination="tablePagination"
      :rows-per-page-options="[10, 20, 50, 100]"
      :grid="showGrid"
      :title="t('roles')"
      :rows="filteredRows"
      :columns="columns"
      :loading="loading"
      :rows-per-page-label="t('rowsPerPage')"
      @request="onTableRequest">
      <template v-slot:top>
        <q-btn
          no-caps
          color="primary"
          icon="add"
          :disable="loading || addSaving || deleteSaving"
          :label="t('addRole')"
          @click="addRole"/>
        <q-space />
        <q-btn
          color="secondary"
          class="text-teal-10"
          icon="filter_alt"
          badge-color="primary"
          :disable="loading || deleteSaving"
          :label="t('filters')"
          :badge="getbadge(activeRoleFilterCount)"
          @click="openRoleFilters"/>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            round
            icon="visibility"
            color="primary"
            :size="siteBreakpoints.SM"
            :disable="addSaving || deleteSaving"
            :aria-label="t('viewRole')"
            @click="openViewRole(props.row)"/>
          <q-btn
            v-if="!isProtectedRole(props.row)"
            flat
            round
            icon="delete"
            color="primary"
            :size="siteBreakpoints.SM"
            :disable="deleteSaving"
            @click="deleteRow(props.row)"/>
        </q-td>
      </template>
    </q-table>

    <Dialog
      v-model="addDialogOpen"
      :title-key="'newRole'"
      :fields="roleAddFields"
      :on-open="onRoleDialogOpen"
      :format-payload="formatRolePayload"
      :saving="addSaving"
      @save="onSaveRole"/>

    <q-dialog
      v-model="filterDialogOpen"
      persistent
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card class="role-filter-card">
        <q-toolbar class="q-px-md bg-teal-10 text-white">
          <q-toolbar-title>{{ t('roleFiltersTitle') }}</q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            @click="closeRoleFilterDialog"/>
        </q-toolbar>
        <q-card-section class="column q-gutter-md q-px-lg q-py-md">
          <q-input
            v-model="filterDraft[rk.name]"
            outlined
            dense
            clearable
            :label="t('name')"/>
          <q-input
            v-model="filterDraft[rk.description]"
            outlined
            dense
            clearable
            :label="t('description')"/>
        </q-card-section>
        <q-separator />
        <q-card-actions align="center" class="q-pa-md">
          <q-btn
            no-caps
            padding="7px 30px"
            color="secondary"
            class="text-teal-10"
            :label="t('roleFilterClear')"
            @click="clearRoleFilters"/>
          <q-btn
            no-caps
            class="primary-action"
            color="primary"
            padding="7px 30px"
            :label="t('roleFilterApply')"
            @click="applyRoleFilters"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <ModalComponent
      v-model="deleteConfirmOpen"
      :title="t('deleteRoleTitle')"
      :message="deleteRoleMessage"
      :confirm-text="t('confirm')"
      :cancel-text="t('cancel')"
      @confirm="onConfirmDeleteRole"
      @cancel="onCancelDeleteRole"/>

    <q-dialog
      v-model="viewRoleDialogOpen"
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card v-if="roleViewing" class="role-view-card">
        <q-toolbar class="q-px-md bg-teal-10 text-white">
          <q-toolbar-title>{{ t('viewRoleTitle') }}</q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            @click="closeViewRole"/>
        </q-toolbar>
        <q-card-section class="role-view-body q-px-lg q-py-md">
          <div class="row q-col-gutter-md">
            <div
              v-for="item in roleDetailRows"
              class="col-12 col-sm-6"
              :key="item.key">
              <div class="text-caption text-grey-7">{{ item.label }}</div>
              <div class="text-body2 text-grey-9">{{ item.value }}</div>
            </div>
            <div class="col-12">
              <q-field
                class="full-width role-view-permission-qfield"
                outlined
                stack-label
                readonly
                :model-value="viewRoleTicked"
                :label="t('permissions')">
                <template #control>
                  <div
                    class="relative-position full-width permission-tree-scroll">
                    <q-inner-loading
                      :showing="permissionsTreeLoading"
                      color="primary"/>
                    <q-tree
                      :nodes="viewRolePermissionTreeNodes"
                      node-key="nodeKey"
                      label-key="label"
                      children-key="children"
                      tick-strategy="leaf"
                      dense
                      no-connectors
                      default-expand-all
                      class="full-width q-pt-sm text-body2"
                      v-model:ticked="viewRoleTicked"
                      :no-nodes-label="t('permissionTreeEmpty')"/>
                  </div>
                </template>
              </q-field>
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="center" class="q-pa-md">
          <q-btn
            no-caps
            padding="7px 30px"
            color="primary"
            :label="t('close')"
            @click="closeViewRole"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { onMounted, computed, ref, watch, reactive, nextTick } from 'vue'
import { useSiteStore } from 'stores/site-store.js'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  protectedSystemRoleName,
  quasarNotifyTypes,
  quasarTableAlign,
  quasarTransitions,
  roleFieldKeys,
  roleListColumnKeys,
  siteBreakpoints,
  siteBreakpointsPx,
} from 'components/constants.js'
import Dialog from 'components/Dialog.vue'
import ModalComponent from 'components/ModalComponent.vue'
import { extractRoleTemplatePermissionIds } from 'components/helpers.js'
import { useRoleAddForm } from 'src/composables/useRoleAddForm.js'

const rk = roleFieldKeys

const $q = useQuasar()
const loading = ref(false)
const addDialogOpen = ref(false)
const addSaving = ref(false)
const deleteConfirmOpen = ref(false)
const rolePendingDelete = ref(null)
const deleteSaving = ref(false)
const viewRoleDialogOpen = ref(false)
const roleViewing = ref(null)
const viewRoleTicked = ref([])
let viewRoleTreeSeq = 0

const siteStore = useSiteStore()
const { t } = useI18n()

const {
  fields: roleAddFields,
  onDialogOpen: onRoleDialogOpen,
  formatRolePayload,
  loadPermissionCatalog,
  permissionTreeNodes,
  permissionsTreeLoading,
  permissionCodeToId,
  knownPermissionIds,
} = useRoleAddForm()

function clonePermissionTreeForViewReadonly(nodes) {
  if (!Array.isArray(nodes)) {
    return []
  }

  return nodes.map(node => {
    const children = node.children
    const copy = { ...node, tickable: false }
    if (Array.isArray(children) && children.length > 0) {
      copy.children = clonePermissionTreeForViewReadonly(children)
    }

    return copy
  })
}

const viewRolePermissionTreeNodes = computed(() =>
  clonePermissionTreeForViewReadonly(permissionTreeNodes.value),
)

const tablePagination = ref({
  sortBy: rk.name,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

function roleTablePaginationFromStore(paginationPayload) {
  const meta = siteStore.roleListPagination
  const total = meta?.total != null && Number.isFinite(Number(meta.total))
    ? Number(meta.total)
    : siteStore.roleList.length
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

async function loadRoles(paginationPayload) {
  loading.value = true
  try {
    await siteStore.getRoleList({
      page: paginationPayload.page,
      limit: paginationPayload.rowsPerPage,
    })
    tablePagination.value = roleTablePaginationFromStore(paginationPayload)
  } catch {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('roleListError'),
    })
  } finally {
    loading.value = false
  }
}

function onTableRequest(props) {
  return loadRoles(props.pagination)
}

onMounted(() => {
  loadRoles(tablePagination.value)
})

watch(
  [viewRoleDialogOpen, roleViewing],
  async([open, row]) => {
    if (!open) {
      viewRoleTreeSeq += 1
      viewRoleTicked.value = []
      roleViewing.value = null

      return
    }
    if (!row) {
      return
    }
    const seq = ++viewRoleTreeSeq
    await loadPermissionCatalog()
    if (seq !== viewRoleTreeSeq || !viewRoleDialogOpen.value) {
      return
    }
    const raw = extractRoleTemplatePermissionIds(
      { data: row },
      permissionCodeToId.value,
    )
    const allowed = knownPermissionIds.value
    const filtered = allowed.size
      ? raw.filter(pid => allowed.has(pid))
      : raw
    viewRoleTicked.value = filtered.slice()
    await nextTick()
  },
)

const columns = computed(() => [
  {
    name: rk.name,
    required: true,
    label: t('name'),
    align: quasarTableAlign.left,
    field: row => row[rk.name],
    sortable: true,
  },
  {
    name: rk.description,
    required: true,
    label: t('description'),
    align: quasarTableAlign.left,
    field: row => row[rk.description] ?? '',
    sortable: true,
  },
  {
    name: rk.level,
    required: true,
    label: t('roleLevel'),
    align: quasarTableAlign.left,
    field: row => row[rk.level],
    sortable: true,
  },
  {
    name: rk.tenantId,
    required: true,
    label: t('tenantId'),
    align: quasarTableAlign.left,
    field: row => row[rk.tenantId] ?? '—',
    sortable: false,
  },
  {
    name: roleListColumnKeys.actions,
    required: true,
    label: t('actions'),
    align: quasarTableAlign.center,
    field: () => null,
    sortable: false,
  },
])

const filterDialogOpen = ref(false)
const filterDraft = reactive({
  [rk.name]: '',
  [rk.description]: '',
})
const filterApplied = reactive({
  [rk.name]: '',
  [rk.description]: '',
})

function syncDraftFromApplied() {
  filterDraft[rk.name] = filterApplied[rk.name]
  filterDraft[rk.description] = filterApplied[rk.description]
}

const filteredRows = computed(() => {
  let list = siteStore.roleList
  const nameQ = String(filterApplied[rk.name] ?? '').trim().toLowerCase()
  if (nameQ) {
    list = list.filter(r =>
      String(r[rk.name] ?? '').toLowerCase().includes(nameQ),
    )
  }
  const descQ = String(filterApplied[rk.description] ?? '').trim().toLowerCase()
  if (descQ) {
    list = list.filter(r =>
      String(r[rk.description] ?? '').toLowerCase().includes(descQ),
    )
  }

  return list
})

const activeRoleFilterCount = computed(() => {
  let n = 0
  if (String(filterApplied[rk.name] ?? '').trim()) {
    n += 1
  }
  if (String(filterApplied[rk.description] ?? '').trim()) {
    n += 1
  }

  return n
})

function openRoleFilters() {
  syncDraftFromApplied()
  filterDialogOpen.value = true
}

function closeRoleFilterDialog() {
  syncDraftFromApplied()
  filterDialogOpen.value = false
}

function applyRoleFilters() {
  filterApplied[rk.name] = String(filterDraft[rk.name] ?? '').trim()
  filterApplied[rk.description] = String(
    filterDraft[rk.description] ?? '',
  ).trim()
  filterDialogOpen.value = false
}

function clearRoleFilters() {
  filterDraft[rk.name] = ''
  filterDraft[rk.description] = ''
  filterApplied[rk.name] = ''
  filterApplied[rk.description] = ''
  filterDialogOpen.value = false
}

function dashText(v) {
  const s = String(v ?? '').trim()

  return s || '—'
}

const roleDetailRows = computed(() => {
  const r = roleViewing.value
  if (!r) {
    return []
  }

  return [
    { key: rk.name, label: t('name'), value: dashText(r[rk.name]) },
    {
      key: rk.description,
      label: t('description'),
      value: dashText(r[rk.description]),
    },
    {
      key: rk.level,
      label: t('roleLevel'),
      value: r[rk.level] != null ? String(r[rk.level]) : '—',
    },
    {
      key: rk.tenantId,
      label: t('tenantId'),
      value: r[rk.tenantId] != null ? String(r[rk.tenantId]) : '—',
    },
  ]
})

function openViewRole(row) {
  roleViewing.value = row
  viewRoleDialogOpen.value = true
}

function closeViewRole() {
  viewRoleDialogOpen.value = false
}

const windowWidth = computed(() => $q.screen.width)
const showGrid = computed(() => windowWidth.value <= siteBreakpointsPx.XXS)

function addRole() {
  addDialogOpen.value = true
}

async function onSaveRole(payload) {
  addSaving.value = true
  try {
    await siteStore.createRole(payload)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('roleCreatedSuccess'),
    })
    addDialogOpen.value = false
    tablePagination.value = roleTablePaginationFromStore(
      tablePagination.value,
    )
  } catch (error) {
    const msg =
      error?.response?.data?.message
      || error?.response?.data?.error
      || error?.message
      || t('roleCreateError')
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: String(msg),
    })
  } finally {
    addSaving.value = false
  }
}

function isProtectedRole(row) {
  if (!row) {
    return false
  }
  const name = String(row[rk.name] ?? '').toUpperCase()
  if (name === protectedSystemRoleName) {
    return true
  }
  const level = row[rk.level]

  return level === -1 || level === '-1'
}

function getbadge(n) {
  return n > 0 ? String(n) : undefined
}

function deleteRow(row) {
  rolePendingDelete.value = row
  deleteConfirmOpen.value = true
}

function onCancelDeleteRole() {
  rolePendingDelete.value = null
}

const deleteRoleMessage = computed(() => {
  const row = rolePendingDelete.value
  if (!row) {
    return ''
  }

  return t('deleteRoleMessage', {
    name: row[rk.name] || row.id,
  })
})

async function onConfirmDeleteRole() {
  if (deleteSaving.value) {
    return
  }
  const row = rolePendingDelete.value
  if (!row?.id) {
    return
  }
  const id = row.id
  deleteSaving.value = true
  try {
    await siteStore.deleteRole(id)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('roleDeletedSuccess'),
    })
  } catch (error) {
    const msg =
      error?.response?.data?.message
      || error?.response?.data?.error
      || error?.message
      || t('roleDeleteError')
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: String(msg),
    })
  } finally {
    deleteSaving.value = false
    rolePendingDelete.value = null
    deleteConfirmOpen.value = false
  }
}
</script>

<style scoped>
  .role-filter-card {
    min-width: min(400px, 100vw - 32px);
    max-width: 440px;
  }

  .role-filter-card .primary-action {
    margin-left: 16px;
  }

  .role-view-card {
    min-width: min(520px, 100vw - 24px);
    max-width: min(640px, 100vw - 24px);
  }

  .role-view-body {
    max-height: min(640px, 78vh);
    overflow-y: auto;
  }

  .permission-tree-scroll {
    max-height: 320px;
    overflow-y: auto;
  }

  .role-view-permission-qfield :deep(.q-field__control) {
    padding-top: 6px;
  }
</style>
