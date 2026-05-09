<template>
  <q-page>
    <q-table
      class="table"
      row-key="id"
      binary-state-sort
      v-model:pagination="tablePagination"
      :rows-per-page-options="[10, 20, 50, 100]"
      :grid="showGrid"
      :title="t('users')"
      :rows="filteredRows"
      :columns="columns"
      :loading="loading"
      :table-row-class-fn="userRowClass"
      :card-class-fn="userRowClass"
      :rows-per-page-label="t('rowsPerPage')"
      @request="onTableRequest">
      <template v-slot:top>
        <q-btn
          no-caps
          color="primary"
          icon="add"
          :disable="loading || addSaving || deleteSaving"
          :label="t('addUser')"
          @click="addUser"/>
        <q-space />
        <q-btn
          color="secondary"
          class="text-teal-10"
          icon="filter_alt"
          badge-color="primary"
          :disable="loading || deleteSaving"
          :label="t('filters')"
          :badge="getbadge(activeUserFilterCount)"
          @click="openUserFilters"/>
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
            :aria-label="t('viewUser')"
            @click="openViewUser(props.row)"/>
          <q-btn
            v-if="!isPrimarySuperadmin(props.row)"
            flat
            round
            icon="edit"
            color="primary"
            :size="siteBreakpoints.SM"
            :disable="addSaving || deleteSaving"
            @click="editRow(props.row)"/>
          <q-btn
            v-if="showDeleteAction(props.row)"
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
      :title-key="userDialogTitleKey"
      :fields="userAddFields"
      :initial-values="userDialogInitialValues"
      :editable-keys-when-edit="userDialogEditableKeys"
      :on-open="onUserDialogOpen"
      :format-payload="formatUserDialogPayload"
      :saving="addSaving"
      @save="onSaveUser"/>

    <q-dialog
      v-model="filterDialogOpen"
      persistent
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card class="user-filter-card">
        <q-toolbar class="q-px-md bg-teal-10 text-white">
          <q-toolbar-title>{{ t('userFiltersTitle') }}</q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            @click="closeUserFilterDialog"/>
        </q-toolbar>
        <q-card-section class="column q-gutter-md q-px-lg q-py-md">
          <q-input
            v-model="filterDraft[uk.username]"
            outlined
            dense
            clearable
            :label="t('username')"/>
          <q-input
            v-model="filterDraft[uk.email]"
            outlined
            dense
            clearable
            :label="t('email')"/>
          <q-select
            v-model="filterDraft[uk.status]"
            outlined
            dense
            clearable
            emit-value
            map-options
            :options="statusFilterOptions"
            :option-label="qSelectOptionKeys.label"
            :option-value="qSelectOptionKeys.value"
            :label="t('status')"/>
        </q-card-section>
        <q-separator />
        <q-card-actions align="center" class="q-pa-md">
          <q-btn
            no-caps
            padding="7px 30px"
            color="secondary"
            class="text-teal-10"
            :label="t('userFilterClear')"
            @click="clearUserFilters"/>
          <q-btn
            no-caps
            class="primary-action"
            color="primary"
            padding="7px 30px"
            :label="t('userFilterApply')"
            @click="applyUserFilters"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <ModalComponent
      v-model="deleteConfirmOpen"
      :title="t('deleteUserTitle')"
      :message="deleteUserMessage"
      :confirm-text="t('confirm')"
      :cancel-text="t('cancel')"
      @confirm="onConfirmDeleteUser"
      @cancel="onCancelDeleteUser"/>

    <q-dialog
      v-model="viewUserDialogOpen"
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card v-if="userViewing" class="user-view-card">
        <q-toolbar class="q-px-md bg-teal-10 text-white">
          <q-toolbar-title>{{ t('viewUserTitle') }}</q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            @click="closeViewUser"/>
        </q-toolbar>
        <q-card-section class="user-view-body q-px-lg q-py-md">
          <div class="row q-col-gutter-md">
            <div
              v-for="item in userDetailRows"
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
            :label="t('close')"
            @click="closeViewUser"
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
  primarySuperadminUser,
  qSelectOptionKeys,
  quasarNotifyTypes,
  quasarTableAlign,
  quasarTransitions,
  siteBreakpoints,
  siteBreakpointsPx,
  userFieldKeys,
  userListColumnKeys,
} from 'components/constants.js'
import Dialog from 'components/Dialog.vue'
import ModalComponent from 'components/ModalComponent.vue'
import {
  USER_EDITABLE_KEYS_ON_EDIT,
  useUserAddForm,
} from 'src/composables/useUserAddForm.js'

const uk = userFieldKeys

const $q = useQuasar()
const loading = ref(false)
const addDialogOpen = ref(false)
const addSaving = ref(false)
const deleteConfirmOpen = ref(false)
const userPendingDelete = ref(null)
const deleteSaving = ref(false)
const userBeingEdited = ref(null)
const viewUserDialogOpen = ref(false)
const userViewing = ref(null)

const siteStore = useSiteStore()
const { t } = useI18n()

const {
  fields: userAddFields,
  formatUserPayload,
  formatUserUpdatePayload,
  onDialogOpen: onUserDialogOpen,
} = useUserAddForm(userBeingEdited)

function formatUserDialogPayload(form) {
  if (!userBeingEdited.value) {
    return formatUserPayload(form)
  }
  return formatUserUpdatePayload(form)
}

const userDialogTitleKey = computed(() =>
  userBeingEdited.value ? 'editUser' : 'newUser',
)

const userDialogEditableKeys = computed(() =>
  userBeingEdited.value ? USER_EDITABLE_KEYS_ON_EDIT : null,
)

function userRowToFormSeed(row) {
  if (!row) {
    return null
  }
  return {
    [uk.username]: row[uk.username] ?? '',
    [uk.email]: row[uk.email] ?? '',
    [uk.password]: '',
    [uk.status]: row[uk.status] === 0 || row[uk.status] === '0' ? 0 : 1,
  }
}

const userDialogInitialValues = computed(() =>
  userBeingEdited.value
    ? userRowToFormSeed(userBeingEdited.value)
    : null,
)

watch(addDialogOpen, open => {
  if (!open) {
    userBeingEdited.value = null
  }
})

watch(viewUserDialogOpen, open => {
  if (!open) {
    userViewing.value = null
  }
})

function dashText(v) {
  const s = String(v ?? '').trim()

  return s || '—'
}

function rowStatusBucket(row) {
  const s = row?.[uk.status]
  return s === 0 || s === '0' ? 0 : 1
}

function showDeleteAction(row) {
  return !isUserStatusZero(row) && !isPrimarySuperadmin(row)
}

function isPrimarySuperadmin(row) {
  if (!row) {
    return false
  }
  const key = String(primarySuperadminUser).toLowerCase()
  const username = String(row[uk.username] ?? '').trim().toLowerCase()
  const email = String(row[uk.email] ?? '').trim().toLowerCase()

  return username === key || email === key
}

const userDetailRows = computed(() => {
  const r = userViewing.value
  if (!r) {
    return []
  }
  const statusText = rowStatusBucket(r) === 1
    ? t('tenantStatusActive')
    : t('tenantStatusInactive')

  return [
    { key: uk.username, label: t('username'), value: dashText(r[uk.username]) },
    { key: uk.email, label: t('email'), value: dashText(r[uk.email]) },
    { key: uk.status, label: t('status'), value: statusText },
  ]
})

function openViewUser(row) {
  userViewing.value = row
  viewUserDialogOpen.value = true
}

function closeViewUser() {
  viewUserDialogOpen.value = false
}

const tablePagination = ref({
  sortBy: 'username',
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

function userTablePaginationFromStore(paginationPayload) {
  const meta = siteStore.userListPagination
  const total = meta?.total != null && Number.isFinite(Number(meta.total))
    ? Number(meta.total)
    : siteStore.userList.length
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

async function loadUsers(paginationPayload) {
  loading.value = true
  try {
    await siteStore.getUserList({
      page: paginationPayload.page,
      limit: paginationPayload.rowsPerPage,
    })
    tablePagination.value = userTablePaginationFromStore(paginationPayload)
  } catch {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('userListError'),
    })
  } finally {
    loading.value = false
  }
}

function onTableRequest(props) {
  return loadUsers(props.pagination)
}

onMounted(() => {
  loadUsers(tablePagination.value)
})

const columns = computed(() => [
  {
    name: uk.username,
    required: true,
    label: t('username'),
    align: quasarTableAlign.left,
    field: row => row[uk.username],
    sortable: true,
  },
  {
    name: uk.email,
    required: true,
    label: t('email'),
    align: quasarTableAlign.left,
    field: row => row[uk.email],
    sortable: true,
  },
  {
    name: uk.status,
    required: true,
    label: t('status'),
    align: quasarTableAlign.left,
    field: row =>
      rowStatusBucket(row) === 1
        ? t('tenantStatusActive')
        : t('tenantStatusInactive'),
    sortable: false,
  },
  {
    name: userListColumnKeys.actions,
    required: true,
    label: t('actions'),
    align: quasarTableAlign.center,
    field: row => row.actions,
    sortable: false,
  },
])

const filterDialogOpen = ref(false)
const filterDraft = reactive({
  [uk.username]: '',
  [uk.email]: '',
  [uk.status]: null,
})
const filterApplied = reactive({
  [uk.username]: '',
  [uk.email]: '',
  [uk.status]: null,
})

const statusFilterOptions = computed(() => [
  { label: t('all'), value: null },
  { label: t('tenantStatusActive'), value: 1 },
  { label: t('tenantStatusInactive'), value: 0 },
])

function syncDraftFromApplied() {
  filterDraft[uk.username] = filterApplied[uk.username]
  filterDraft[uk.email] = filterApplied[uk.email]
  filterDraft[uk.status] = filterApplied[uk.status]
}

const filteredRows = computed(() => {
  let list = siteStore.userList
  const f = filterApplied
  const userQ = String(f[uk.username] ?? '').trim().toLowerCase()
  if (userQ) {
    list = list.filter(r =>
      String(r[uk.username] ?? '').toLowerCase().includes(userQ),
    )
  }
  const emailQ = String(f[uk.email] ?? '').trim().toLowerCase()
  if (emailQ) {
    list = list.filter(r =>
      String(r[uk.email] ?? '').toLowerCase().includes(emailQ),
    )
  }
  if (f[uk.status] === 0 || f[uk.status] === 1) {
    list = list.filter(r => rowStatusBucket(r) === f[uk.status])
  }

  return list
})

const activeUserFilterCount = computed(() => {
  let n = 0
  const f = filterApplied
  if (String(f[uk.username] ?? '').trim()) {
    n += 1
  }
  if (String(f[uk.email] ?? '').trim()) {
    n += 1
  }
  if (f[uk.status] === 0 || f[uk.status] === 1) {
    n += 1
  }

  return n
})

function openUserFilters() {
  syncDraftFromApplied()
  filterDialogOpen.value = true
}

function closeUserFilterDialog() {
  syncDraftFromApplied()
  filterDialogOpen.value = false
}

function applyUserFilters() {
  filterApplied[uk.username] = String(filterDraft[uk.username] ?? '').trim()
  filterApplied[uk.email] = String(filterDraft[uk.email] ?? '').trim()
  const st = filterDraft[uk.status]
  filterApplied[uk.status] =
    st === 0 || st === 1 ? Number(st) : null
  filterDialogOpen.value = false
}

function clearUserFilters() {
  filterDraft[uk.username] = ''
  filterDraft[uk.email] = ''
  filterDraft[uk.status] = null
  filterApplied[uk.username] = ''
  filterApplied[uk.email] = ''
  filterApplied[uk.status] = null
  filterDialogOpen.value = false
}

function isUserStatusZero(row) {
  const s = row?.[uk.status]

  return s === 0 || s === '0'
}

function userRowClass(row) {
  return isUserStatusZero(row) ? 'user-row--status-zero' : ''
}

const deleteUserMessage = computed(() => {
  const row = userPendingDelete.value
  if (!row) {
    return ''
  }

  return t('deleteUserMessage', {
    name: row[uk.username] || row[uk.email] || row.id,
  })
})

const windowWidth = computed(() => $q.screen.width)
const showGrid = computed(() => windowWidth.value <= siteBreakpointsPx.XXS)

function getbadge(activeUserFilterCount) {
  return activeUserFilterCount > 0
    ? String(activeUserFilterCount) : undefined
}

const addUser = () => {
  userBeingEdited.value = null
  addDialogOpen.value = true
}

async function onSaveUser(payload) {
  const editingId = userBeingEdited.value?.id
  addSaving.value = true
  try {
    if (editingId != null) {
      await siteStore.updateUser(editingId, payload)
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('userUpdatedSuccess'),
      })
    } else {
      await siteStore.createUser(payload)
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('userCreatedSuccess'),
      })
    }
    addDialogOpen.value = false
    tablePagination.value = userTablePaginationFromStore(
      tablePagination.value,
    )
  } catch (error) {
    const fallback = editingId != null
      ? t('userUpdateError')
      : t('userCreateError')
    const msg =
      error?.response?.data?.message
      || error?.response?.data?.error
      || error?.message
      || fallback
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: String(msg),
    })
  } finally {
    addSaving.value = false
  }
}

function editRow(row) {
  if (isPrimarySuperadmin(row)) {
    return
  }
  userBeingEdited.value = row
  addDialogOpen.value = true
}

function deleteRow(row) {
  if (isPrimarySuperadmin(row)) {
    return
  }
  userPendingDelete.value = row
  deleteConfirmOpen.value = true
}

function onCancelDeleteUser() {
  userPendingDelete.value = null
}

async function onConfirmDeleteUser() {
  if (deleteSaving.value) {
    return
  }
  const row = userPendingDelete.value
  if (!row?.id || isPrimarySuperadmin(row)) {
    return
  }
  const id = row.id
  deleteSaving.value = true
  try {
    await siteStore.deleteUser(id)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('userDeletedSuccess'),
    })
  } catch (error) {
    const msg =
      error?.response?.data?.message
      || error?.response?.data?.error
      || error?.message
      || t('userDeleteError')
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: String(msg),
    })
  } finally {
    deleteSaving.value = false
    userPendingDelete.value = null
  }
}
</script>

<style scoped>
  :deep(tbody tr.user-row--status-zero td) {
    background-color: rgba(244, 67, 54, 0.12) !important;
  }

  :deep(.q-table--grid .user-row--status-zero) {
    background-color: rgba(244, 67, 54, 0.12);
  }

  .user-filter-card {
    min-width: min(400px, 100vw - 32px);
    max-width: 440px;
  }

  .user-filter-card .primary-action {
    margin-left: 16px;
  }

  .user-view-card {
    min-width: min(400px, 100vw - 24px);
    max-width: min(560px, 100vw - 24px);
  }

  .user-view-body {
    max-height: min(360px, 70vh);
    overflow-y: auto;
  }
</style>
