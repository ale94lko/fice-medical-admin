<template>
  <q-page class="admin-page">
    <AdminQTable
      class="table admin-data-table"
      row-key="id"
      binary-state-sort
      v-model:pagination="tablePagination"
      :rows-per-page-options="[10, 20, 50, 100]"
      :grid="showGrid"
      :title="t('users')"
      :rows="sortedTableRows"
      :columns="columns"
      :loading="loading"
      :table-row-class-fn="userRowClass"
      :card-class-fn="userRowClass"
      :rows-per-page-label="t('rowsPerPage')"
      @request="onTableRequest">
      <template v-slot:top>
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="add"
          :disable="
            loading || addSaving || deleteSaving || passwordChangeSaving
          "
          :title="t('addUser')"
          :label="t('addUser')"
          @click="addUser"/>
        <q-space />
        <q-btn
          outline
          no-caps
          color="primary"
          class="app-btn-outline"
          icon="filter_alt"
          badge-color="primary"
          :disable="loading || deleteSaving || passwordChangeSaving"
          :title="t('filters')"
          :label="t('filters')"
          :badge="getbadge(activeUserFilterCount)"
          @click="openUserFilters"/>
      </template>
      <template #row-actions="{ row }">
        <q-btn
          flat
          round
          icon="visibility"
          color="primary"
          :size="siteBreakpoints.SM"
          :disable="addSaving || deleteSaving || passwordChangeSaving"
          :title="t('viewUser')"
          :aria-label="t('viewUser')"
          @click="openViewUser(row)"/>
        <q-btn
          v-if="!isPrimarySuperadmin(row)"
          flat
          round
          icon="vpn_key"
          color="primary"
          :size="siteBreakpoints.SM"
          :disable="addSaving || deleteSaving || passwordChangeSaving"
          :title="t('changeUserPassword')"
          :aria-label="t('changeUserPassword')"
          @click="openChangePassword(row)"/>
        <q-btn
          v-if="!isPrimarySuperadmin(row)"
          flat
          round
          icon="edit"
          color="primary"
          :size="siteBreakpoints.SM"
          :disable="addSaving || deleteSaving || passwordChangeSaving"
          :title="t('editUser')"
          :aria-label="t('editUser')"
          @click="editRow(row)"/>
        <q-btn
          v-if="showDeleteAction(row)"
          flat
          round
          icon="delete"
          color="primary"
          :size="siteBreakpoints.SM"
          :disable="deleteSaving || passwordChangeSaving"
          :title="t('deleteUserTitle')"
          :aria-label="t('deleteUserTitle')"
          @click="deleteRow(row)"/>
      </template>
    </AdminQTable>

    <Dialog
      v-model="addDialogOpen"
      :title-key="userDialogTitleKey"
      :fields="userAddFields"
      :initial-values="userDialogInitialValues"
      :on-open="onUserDialogOpen"
      :after-open="onUserDialogReady"
      :format-payload="formatUserDialogPayload"
      :saving="addSaving"
      @save="onSaveUser"/>

    <q-dialog
      v-model="filterDialogOpen"
      persistent
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card class="modal-card app-dialog-card app-dialog-card--sm">
        <q-toolbar class="app-dialog-toolbar">
          <q-toolbar-title>{{ t('userFiltersTitle') }}</q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            :title="t('close')"
            :aria-label="t('close')"
            @click="closeUserFilterDialog"/>
        </q-toolbar>
        <q-card-section class="app-dialog-body app-dialog-form-stack">
          <q-input
            v-model="filterDraft[uk.username]"
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
            :behavior="selectBehaviors.menu"
            :options="statusFilterDisplayedOptions"
            :option-label="qSelectOptionKeys.label"
            :option-value="qSelectOptionKeys.value"
            :label="t('status')"
            @popup-show="onUserStatusFilterPopupShow">
            <template #before-options>
              <div class="user-filter-select-search q-pa-sm bg-white">
                <q-input
                  v-model="userStatusFilterSearchNeedle"
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
            :title="t('userFilterClear')"
            :label="t('userFilterClear')"
            @click="clearUserFilters"/>
          <q-btn
            no-caps
            unelevated
            class="primary-action"
            color="primary"
            :title="t('userFilterApply')"
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
      v-model="passwordDialogOpen"
      persistent
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card
        v-if="userPasswordTarget"
        class="modal-card app-dialog-card app-dialog-card--sm">
        <q-toolbar class="app-dialog-toolbar">
          <q-toolbar-title>{{ t('changeUserPasswordTitle') }}</q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            :disable="passwordChangeSaving"
            :title="t('close')"
            :aria-label="t('close')"
            @click="closePasswordDialog"/>
        </q-toolbar>
        <q-form
          ref="passwordFormRef"
          class="app-dialog-body app-dialog-form-stack"
          greedy
          autocomplete="off"
          @submit.prevent="onSubmitPasswordChange">
          <div class="text-body2 text-grey-8">
            {{ userPasswordTarget[uk.username] }}
          </div>
          <q-input
            v-model="passwordChangeDraft.password"
            outlined
            dense
            name="fice-admin-user-change-password"
            :autocomplete="htmlAutocomplete.newPassword"
            :type="passwordFieldVisibility.resolvedInputType(
              passwordVisibilityKey.password,
              htmlInputTypes.password,
            )"
            :label="t('password')"
            :rules="[passwordChangeRequiredRule]">
            <template #append>
              <PasswordToggleIcon
                :show-plain="passwordFieldVisibility.isPlainVisible(
                  passwordVisibilityKey.password,
                )"
                @toggle="passwordFieldVisibility.toggle(
                  passwordVisibilityKey.password,
                )"
              />
            </template>
          </q-input>
          <q-input
            v-model="passwordChangeDraft.confirm"
            outlined
            dense
            name="fice-admin-user-change-password-confirm"
            :autocomplete="htmlAutocomplete.off"
            :type="passwordFieldVisibility.resolvedInputType(
              passwordVisibilityKey.confirm,
              htmlInputTypes.password,
            )"
            :label="t('userPasswordConfirm')"
            :rules="passwordConfirmRules">
            <template #append>
              <PasswordToggleIcon
                :show-plain="passwordFieldVisibility.isPlainVisible(
                  passwordVisibilityKey.confirm,
                )"
                @toggle="passwordFieldVisibility.toggle(
                  passwordVisibilityKey.confirm,
                )"
              />
            </template>
          </q-input>
          <q-card-actions align="right" class="app-dialog-actions">
            <q-btn
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              :title="t('cancel')"
              :label="t('cancel')"
              :disable="passwordChangeSaving"
              @click="closePasswordDialog"/>
            <q-btn
              no-caps
              unelevated
              class="primary-action"
              color="primary"
              type="submit"
              :title="t('save')"
              :label="t('save')"
              :loading="passwordChangeSaving"/>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="viewUserDialogOpen"
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card
        v-if="userViewing"
        class="modal-card app-dialog-card app-dialog-card--lg">
        <q-toolbar class="app-dialog-toolbar">
          <q-toolbar-title>{{ t('viewUserTitle') }}</q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            :title="t('close')"
            :aria-label="t('close')"
            @click="closeViewUser"/>
        </q-toolbar>
        <q-card-section class="app-dialog-body">
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
        <q-card-actions align="right" class="app-dialog-actions">
          <q-btn
            no-caps
            unelevated
            color="primary"
            :title="t('close')"
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
import { apiInstance } from 'boot/axios'
import { useSiteStore } from 'stores/site-store.js'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  apiPaths,
  primarySuperadminUser,
  qSelectOptionKeys,
  quasarNotifyTypes,
  quasarTableAlign,
  quasarTransitions,
  selectBehaviors,
  siteBreakpoints,
  siteBreakpointsPx,
  tenantFieldKeys,
  htmlAutocomplete,
  htmlInputTypes,
  userFieldKeys,
  userListColumnKeys,
} from 'components/constants.js'
import PasswordToggleIcon from 'components/PasswordToggleIcon.vue'
import AdminQTable from 'components/AdminQTable.vue'
import Dialog from 'components/Dialog.vue'
import ModalComponent from 'components/ModalComponent.vue'
import {
  fetchAllEnvelopeList,
  intIdsFromMixedIdList,
  mapTenant,
} from 'components/helpers.js'
import { useUserAddForm } from 'src/composables/useUserAddForm.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { filterLabelValueOptions } from 'src/utils/q-select-local-filter.js'
import { usePasswordVisibilityByKey }
  from 'src/composables/usePasswordVisibility.js'
import { sortRowsByColumns } from 'src/utils/table-sort.js'

const uk = userFieldKeys
const ttk = tenantFieldKeys

const $q = useQuasar()
const tenantIdToLabel = ref(new Map())
const loading = ref(false)
const addDialogOpen = ref(false)
const addSaving = ref(false)
const deleteConfirmOpen = ref(false)
const userPendingDelete = ref(null)
const deleteSaving = ref(false)
const userBeingEdited = ref(null)
const viewUserDialogOpen = ref(false)
const userViewing = ref(null)
const passwordDialogOpen = ref(false)
const userPasswordTarget = ref(null)
const passwordChangeSaving = ref(false)
const passwordFormRef = ref(null)
const passwordChangeDraft = reactive({
  password: '',
  confirm: '',
})
const passwordFieldVisibility = usePasswordVisibilityByKey()
const passwordVisibilityKey = {
  password: 'user-password',
  confirm: 'user-password-confirm',
}

const siteStore = useSiteStore()
const { t } = useI18n()

const {
  fields: userAddFields,
  formatUserPayload,
  onDialogOpen: onUserDialogOpen,
  onDialogReady: onUserDialogReady,
  defaultNewUserTenantId,
} = useUserAddForm(userBeingEdited)

function passwordChangeRequiredRule(val) {
  return (!!val && String(val).trim().length > 0) || t('fieldRequired')
}

const passwordConfirmRules = computed(() => [
  passwordChangeRequiredRule,
  val => String(val ?? '').trim()
    === String(passwordChangeDraft.password ?? '').trim()
    || t('userPasswordMismatch'),
])

function formatUserDialogPayload(form) {
  return formatUserPayload(form)
}

const userDialogTitleKey = computed(() =>
  userBeingEdited.value ? 'editUser' : 'newUser',
)

function userRowToFormSeed(row) {
  if (!row) {
    return null
  }
  const roles = intIdsFromMixedIdList(row[uk.roles])
  const permissions = intIdsFromMixedIdList(row[uk.permissions])
  const allowedSubtenantIds = intIdsFromMixedIdList(row[uk.allowedSubtenantIds])
  const desc = String(row[uk.description] ?? '').trim()

  const tenantRaw = row[uk.tenantId]
  const tenantId = Number(tenantRaw)

  return {
    [uk.username]: row[uk.username] ?? '',
    [uk.status]: row[uk.status] === 0 || row[uk.status] === '0' ? 0 : 1,
    [uk.roles]: roles,
    [uk.permissions]: permissions,
    [uk.description]: desc,
    [uk.allowedSubtenantIds]: allowedSubtenantIds,
    ...(Number.isFinite(tenantId) ? { [uk.tenantId]: tenantId } : {}),
  }
}

const userDialogInitialValues = computed(() => {
  if (userBeingEdited.value) {
    return userRowToFormSeed(userBeingEdited.value)
  }
  const id = defaultNewUserTenantId.value
  if (!Number.isFinite(Number(id))) {
    return null
  }

  return { [uk.tenantId]: Number(id) }
})

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

watch(passwordDialogOpen, open => {
  if (!open) {
    userPasswordTarget.value = null
    passwordChangeDraft.password = ''
    passwordChangeDraft.confirm = ''
    passwordFieldVisibility.clear()
    passwordFormRef.value?.resetValidation?.()
  }
})

function openChangePassword(row) {
  if (isPrimarySuperadmin(row)) {
    return
  }
  userPasswordTarget.value = row
  passwordChangeDraft.password = ''
  passwordChangeDraft.confirm = ''
  passwordDialogOpen.value = true
}

function closePasswordDialog() {
  if (passwordChangeSaving.value) {
    return
  }
  passwordDialogOpen.value = false
}

async function onSubmitPasswordChange() {
  const row = userPasswordTarget.value
  if (!row?.id) {
    return
  }
  const valid = await passwordFormRef.value?.validate?.()
  if (valid !== true) {
    return
  }
  const pw = String(passwordChangeDraft.password).trim()
  if (!pw.length) {
    return
  }
  passwordChangeSaving.value = true
  try {
    await siteStore.changeUserPassword({
      [uk.username]: row[uk.username],
      [uk.password]: pw,
      [uk.changePassword]: true,
    })
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('userPasswordChangeSuccess'),
    })
    passwordDialogOpen.value = false
  } catch (error) {
    const msg =
      error?.response?.data?.message
      || error?.response?.data?.error
      || error?.message
      || t('userPasswordChangeError')
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: String(msg),
      })
    }
  } finally {
    passwordChangeSaving.value = false
  }
}

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

function userTenantDisplayText(row, tenantLabels = tenantIdToLabel.value) {
  const n = Number(row?.[uk.tenantId])
  if (!Number.isFinite(n)) {
    return '—'
  }
  const name = tenantLabels.get(n)
  const label = name ? String(name).trim() : '—'

  return `${n} - ${label}`
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
    { key: uk.username, label: t('email'), value: dashText(r[uk.username]) },
    {
      key: uk.tenantId,
      label: t('roleListTenantName'),
      value: userTenantDisplayText(r),
    },
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

async function loadTenantNameLookup() {
  try {
    const rawRows = await fetchAllEnvelopeList(
      (path, cfg) => apiInstance.get(path, cfg),
      apiPaths.tenantsList,
    )
    const next = new Map()
    for (const row of rawRows) {
      const mapped = mapTenant(row)
      if (!mapped) {
        continue
      }
      const id = Number(mapped.id)
      if (!Number.isFinite(id)) {
        continue
      }
      const label = String(
        mapped[ttk.name] ?? mapped[ttk.domain] ?? '',
      ).trim() || String(id)
      next.set(id, label)
    }
    tenantIdToLabel.value = next
  } catch {
    tenantIdToLabel.value = new Map()
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
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('userListError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function onTableRequest(props) {
  return loadUsers(props.pagination)
}

onMounted(() => {
  void loadTenantNameLookup()
  loadUsers(tablePagination.value)
})

const columns = computed(() => {
  const tenantLabels = tenantIdToLabel.value

  return [
    {
      name: uk.username,
      required: true,
      label: t('email'),
      align: quasarTableAlign.left,
      field: row => row[uk.username],
      sortable: true,
    },
    {
      name: uk.tenantId,
      required: true,
      label: t('roleListTenantName'),
      align: quasarTableAlign.left,
      field: row => {
        const n = Number(row?.[uk.tenantId])
        return Number.isFinite(n) ? n : null
      },
      format: val => {
        if (val == null) {
          return '—'
        }

        return userTenantDisplayText({ [uk.tenantId]: val }, tenantLabels)
      },
      sortable: true,
    },
    {
      name: uk.status,
      required: true,
      label: t('status'),
      align: quasarTableAlign.left,
      field: row => rowStatusBucket(row),
      format: val =>
        val === 1 ? t('tenantStatusActive') : t('tenantStatusInactive'),
      sortable: true,
    },
    {
      name: userListColumnKeys.actions,
      required: true,
      label: t('actions'),
      align: quasarTableAlign.center,
      field: row => row.actions,
      sortable: false,
    },
  ]
})

const filterDialogOpen = ref(false)
const filterDraft = reactive({
  [uk.username]: '',
  [uk.status]: null,
})
const filterApplied = reactive({
  [uk.username]: '',
  [uk.status]: null,
})

const statusFilterOptions = computed(() => [
  { label: t('all'), value: null },
  { label: t('tenantStatusActive'), value: 1 },
  { label: t('tenantStatusInactive'), value: 0 },
])

const userStatusFilterSearchNeedle = ref('')

const statusFilterDisplayedOptions = computed(() =>
  filterLabelValueOptions(
    statusFilterOptions.value,
    userStatusFilterSearchNeedle.value,
  ),
)

function onUserStatusFilterPopupShow() {
  userStatusFilterSearchNeedle.value = ''
}

function resetUserFilterSelectSearch() {
  userStatusFilterSearchNeedle.value = ''
}

function syncDraftFromApplied() {
  filterDraft[uk.username] = filterApplied[uk.username]
  filterDraft[uk.status] = filterApplied[uk.status]
}

const filteredRows = computed(() => {
  let list = siteStore.userList
  const f = filterApplied
  const emailQ = String(f[uk.username] ?? '').trim().toLowerCase()
  if (emailQ) {
    list = list.filter(r =>
      String(r[uk.username] ?? '').toLowerCase().includes(emailQ),
    )
  }
  if (f[uk.status] === 0 || f[uk.status] === 1) {
    list = list.filter(r => rowStatusBucket(r) === f[uk.status])
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

const activeUserFilterCount = computed(() => {
  let n = 0
  const f = filterApplied
  if (String(f[uk.username] ?? '').trim()) {
    n += 1
  }
  if (f[uk.status] === 0 || f[uk.status] === 1) {
    n += 1
  }

  return n
})

function openUserFilters() {
  resetUserFilterSelectSearch()
  syncDraftFromApplied()
  filterDialogOpen.value = true
}

function closeUserFilterDialog() {
  resetUserFilterSelectSearch()
  syncDraftFromApplied()
  filterDialogOpen.value = false
}

function applyUserFilters() {
  filterApplied[uk.username] = String(filterDraft[uk.username] ?? '').trim()
  const st = filterDraft[uk.status]
  filterApplied[uk.status] =
    st === 0 || st === 1 ? Number(st) : null
  filterDialogOpen.value = false
}

function clearUserFilters() {
  filterDraft[uk.username] = ''
  filterDraft[uk.status] = null
  filterApplied[uk.username] = ''
  filterApplied[uk.status] = null
  filterDialogOpen.value = false
}

function isUserStatusZero(row) {
  const s = row?.[uk.status]

  return s === 0 || s === '0'
}

function userRowClass(row) {
  return isUserStatusZero(row) ? 'data-row--inactive' : ''
}

const deleteUserMessage = computed(() => {
  const row = userPendingDelete.value
  if (!row) {
    return ''
  }

  return t('deleteUserMessage', {
    name: row[uk.username] || row.id,
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

async function editRow(row) {
  if (isPrimarySuperadmin(row)) {
    return
  }
  let seed = row
  try {
    const detail = await siteStore.getUserById(row.id)
    if (detail) {
      seed = { ...row, ...detail }
    }
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('userDetailLoadError'),
      })
    }
  }
  userBeingEdited.value = seed
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
