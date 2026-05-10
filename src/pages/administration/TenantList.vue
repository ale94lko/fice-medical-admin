<template>
  <q-page>
    <q-table
      class="table"
      row-key="id"
      binary-state-sort
      v-model:pagination="tablePagination"
      :rows-per-page-options="[10, 20, 50, 100]"
      :grid="showGrid"
      :title="t('tenants')"
      :rows="sortedTableRows"
      :columns="columns"
      :loading="loading"
      :table-row-class-fn="tenantRowClass"
      :card-class-fn="tenantRowClass"
      :rows-per-page-label="t('rowsPerPage')"
      @request="onTableRequest">
      <template v-slot:top>
        <q-btn
          no-caps
          color="primary"
          icon="add"
          :disable="loading || addSaving || deleteSaving"
          :label="t('addTenant')"
          @click="addTenant"/>
        <q-space />
        <q-btn
          color="secondary"
          class="text-teal-10"
          icon="filter_alt"
          badge-color="primary"
          :disable="loading || deleteSaving"
          :label="t('filters')"
          :badge="getbadge(activeTenantFilterCount)"
          @click="openTenantFilters"/>
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
            :aria-label="t('viewTenant')"
            @click="openViewTenant(props.row)"/>
          <q-btn
            v-if="!isMainTenant(props.row)"
            flat
            round
            icon="edit"
            color="primary"
            :size="siteBreakpoints.SM"
            :disable="addSaving || deleteSaving"
            @click="editRow(props.row)"/>
          <q-btn
            v-if="!isTenantStatusZero(props.row) && !isMainTenant(props.row)"
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
      :title-key="tenantDialogTitleKey"
      :fields="tenantAddFields"
      :initial-values="tenantDialogInitialValues"
      :editable-keys-when-edit="tenantDialogEditableKeys"
      :on-open="onTenantDialogOpen"
      :format-payload="formatTenantDialogPayload"
      :saving="addSaving"
      @save="onSaveTenant"
    />

    <q-dialog
      v-model="filterDialogOpen"
      persistent
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card class="tenant-filter-card">
        <q-toolbar class="q-px-md bg-teal-10 text-white">
          <q-toolbar-title>{{ t('tenantFiltersTitle') }}</q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            @click="closeTenantFilterDialog"
          />
        </q-toolbar>
        <q-card-section class="column q-gutter-md q-px-lg q-py-md">
          <q-input
            v-model="filterDraft[tk.name]"
            outlined
            dense
            clearable
            :label="t('name')"/>
          <q-input
            v-model="filterDraft[tk.domain]"
            outlined
            dense
            clearable
            :label="t('domain')"/>
          <q-select
            v-model="filterDraft[tk.planId]"
            outlined
            dense
            clearable
            emit-value
            map-options
            :options="planFilterOptions"
            :option-label="qSelectOptionKeys.label"
            :option-value="qSelectOptionKeys.value"
            :label="t('planName')"/>
          <q-select
            v-model="filterDraft[tk.status]"
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
            :label="t('tenantFilterClear')"
            @click="clearTenantFilters"/>
          <q-btn
            no-caps
            class="primary-action"
            color="primary"
            padding="7px 30px"
            :label="t('tenantFilterApply')"
            @click="applyTenantFilters"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <ModalComponent
      v-model="deleteConfirmOpen"
      :title="t('deleteTenantTitle')"
      :message="deleteTenantMessage"
      :confirm-text="t('confirm')"
      :cancel-text="t('cancel')"
      @confirm="onConfirmDeleteTenant"
      @cancel="onCancelDeleteTenant"
    />

    <q-dialog
      v-model="viewTenantDialogOpen"
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card v-if="tenantViewing" class="tenant-view-card">
        <q-toolbar class="q-px-md bg-teal-10 text-white">
          <q-toolbar-title>{{ t('viewTenantTitle') }}</q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            @click="closeViewTenant"/>
        </q-toolbar>
        <q-card-section class="tenant-view-body q-px-lg q-py-md">
          <div class="row q-col-gutter-md">
            <div
              v-for="item in tenantDetailRows"
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
            @click="closeViewTenant"
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
  countryCodeUsa,
  defaultTenant,
  qSelectOptionKeys,
  quasarNotifyTypes,
  quasarTableAlign,
  quasarTransitions,
  siteBreakpoints,
  siteBreakpointsPx,
  tenantFieldKeys,
  tenantFormDefaults,
  tenantListColumnKeys,
  localeCodes,
  tenantModelFallbacks,
} from 'components/constants.js'
import {
  formatNationalPhoneDisplay,
  formatPhoneWithCountryCode,
  nationalPhoneDigitsFromStored,
  usStateLabelFromCode,
} from 'components/helpers.js'
import Dialog from 'components/Dialog.vue'
import ModalComponent from 'components/ModalComponent.vue'
import {
  TENANT_EDITABLE_KEYS_ON_EDIT,
  useTenantAddForm,
} from 'src/composables/useTenantAddForm.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { sortRowsByColumns } from 'src/utils/table-sort.js'

const tk = tenantFieldKeys

const $q = useQuasar()
const loading = ref(false)
const addDialogOpen = ref(false)
const addSaving = ref(false)
const deleteConfirmOpen = ref(false)
const tenantPendingDelete = ref(null)
const deleteSaving = ref(false)
const tenantBeingEdited = ref(null)
const viewTenantDialogOpen = ref(false)
const tenantViewing = ref(null)

const siteStore = useSiteStore()
const { t } = useI18n()

const {
  fields: tenantAddFields,
  onDialogOpen: onTenantDialogOpen,
  formatTenantPayload: formatTenantPayloadBase,
  formatTenantUpdatePayload,
} = useTenantAddForm()

function formatTenantDialogPayload(form) {
  if (!tenantBeingEdited.value) {
    return formatTenantPayloadBase(form)
  }
  return formatTenantUpdatePayload(form)
}

const tenantDialogTitleKey = computed(() =>
  tenantBeingEdited.value ? 'editTenant' : 'newTenant',
)

const tenantDialogEditableKeys = computed(() =>
  tenantBeingEdited.value ? TENANT_EDITABLE_KEYS_ON_EDIT : null,
)

function tenantRowToFormSeed(row) {
  if (!row) {
    return null
  }
  const seed = {
    [tk.name]: row[tk.name] ?? '',
    [tk.domain]: row[tk.domain] ?? '',
    [tk.planId]: row[tk.planId] ?? null,
    [tk.status]: row[tk.status] === 0 || row[tk.status] === '0' ? 0 : 1,
    [tk.timezone]: row[tk.timezone] ?? tenantFormDefaults.timezonePicker,
    [tk.locale]: row[tk.locale] ?? tenantModelFallbacks.locale,
    [tk.contactEmail]: row[tk.contactEmail] ?? '',
    [tk.contactPhone]: formatNationalPhoneDisplay(
      row[tk.country] ?? countryCodeUsa,
      nationalPhoneDigitsFromStored(
        row[tk.country] ?? countryCodeUsa,
        row[tk.contactPhone] ?? '',
      ),
    ),
    [tk.contactAddress]: row[tk.contactAddress] ?? '',
    [tk.notes]: row[tk.notes] ?? '',
  }
  if (row[tk.country]) {
    seed[tk.country] = row[tk.country]
  }
  if (row[tk.state]) {
    seed[tk.state] = row[tk.state]
  }

  return seed
}

const tenantDialogInitialValues = computed(() =>
  tenantBeingEdited.value
    ? tenantRowToFormSeed(tenantBeingEdited.value)
    : null,
)

watch(addDialogOpen, open => {
  if (!open) {
    tenantBeingEdited.value = null
  }
})

watch(viewTenantDialogOpen, open => {
  if (!open) {
    tenantViewing.value = null
  }
})

function dashText(v) {
  const s = String(v ?? '').trim()

  return s || '—'
}

const tenantDetailRows = computed(() => {
  const r = tenantViewing.value
  if (!r) {
    return []
  }
  const statusText = rowStatusBucket(r) === 1
    ? t('tenantStatusActive')
    : t('tenantStatusInactive')
  const countryVal = r[tk.country] === countryCodeUsa
    ? t('countryUnitedStates')
    : dashText(r[tk.country])
  const sc = r[tk.state]
  const stateVal = sc
    ? dashText(usStateLabelFromCode(sc) || sc)
    : '—'
  const phoneVal = formatPhoneWithCountryCode(
    r[tk.country] ?? countryCodeUsa,
    r[tk.contactPhone] ?? '',
  )
  const rawLoc = String(r[tk.locale] ?? '').trim()
  let localeVal = '—'
  if (rawLoc) {
    if (rawLoc === localeCodes.enUs) {
      localeVal = t('languageEnglish')
    } else if (rawLoc === localeCodes.esUs) {
      localeVal = t('languageSpanish')
    } else {
      localeVal = rawLoc
    }
  }

  return [
    { key: tk.name, label: t('name'), value: dashText(r[tk.name]) },
    { key: tk.domain, label: t('domain'), value: dashText(r[tk.domain]) },
    {
      key: tk.schemaName,
      label: t('schemaName'),
      value: dashText(r[tk.schemaName]),
    },
    { key: tk.planName, label: t('planName'), value: dashText(r[tk.planName]) },
    { key: tk.status, label: t('status'), value: statusText },
    { key: tk.timezone, label: t('timezone'), value: dashText(r[tk.timezone]) },
    { key: tk.locale, label: t('language'), value: localeVal },
    { key: tk.country, label: t('country'), value: countryVal },
    { key: tk.state, label: t('state'), value: stateVal },
    {
      key: tk.contactEmail,
      label: t('contactEmail'),
      value: dashText(r[tk.contactEmail]),
    },
    {
      key: tk.contactPhone,
      label: t('contactPhone'),
      value: phoneVal || '—',
    },
    {
      key: tk.contactAddress,
      label: t('contactAddress'),
      value: dashText(r[tk.contactAddress]),
    },
    { key: tk.notes, label: t('notes'), value: dashText(r[tk.notes]) },
  ]
})

function openViewTenant(row) {
  tenantViewing.value = row
  viewTenantDialogOpen.value = true
}

function closeViewTenant() {
  viewTenantDialogOpen.value = false
}

const tablePagination = ref({
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

function tenantTablePaginationFromStore(paginationPayload) {
  const meta = siteStore.tenantListPagination
  const total = meta?.total != null && Number.isFinite(Number(meta.total))
    ? Number(meta.total)
    : siteStore.tenantList.length
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

async function loadTenants(paginationPayload) {
  loading.value = true
  try {
    await siteStore.getTenantList({
      page: paginationPayload.page,
      limit: paginationPayload.rowsPerPage,
    })
    tablePagination.value = tenantTablePaginationFromStore(paginationPayload)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('tenantListError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function onTableRequest(props) {
  return loadTenants(props.pagination)
}

onMounted(() => {
  loadTenants(tablePagination.value)
})

const columns = computed(() => [
  {
    name: tk.name,
    required: true,
    label: t('name'),
    align: quasarTableAlign.left,
    field: row => row[tk.name],
    sortable: true,
  },
  {
    name: tk.domain,
    required: true,
    label: t('domain'),
    align: quasarTableAlign.left,
    field: row => row[tk.domain],
    sortable: true,
  },
  {
    name: tk.planName,
    required: true,
    label: t('planName'),
    align: quasarTableAlign.left,
    field: row => row[tk.planName],
    sortable: true,
  },
  {
    name: tk.contactEmail,
    required: true,
    label: t('contactEmail'),
    align: quasarTableAlign.left,
    field: row => row[tk.contactEmail] ?? '',
    sortable: true,
  },
  {
    name: tk.contactPhone,
    required: true,
    label: t('contactPhone'),
    align: quasarTableAlign.left,
    field: row =>
      formatPhoneWithCountryCode(
        row[tk.country] ?? countryCodeUsa,
        row[tk.contactPhone] ?? '',
      ),
    sortable: true,
  },
  {
    name: tenantListColumnKeys.actions,
    required: true,
    label: t('actions'),
    align: quasarTableAlign.center,
    field: row => row.actions,
    sortable: false,
  },
])

const filterDialogOpen = ref(false)
const filterDraft = reactive({
  [tk.name]: '',
  [tk.domain]: '',
  [tk.planId]: null,
  [tk.status]: null,
})
const filterApplied = reactive({
  [tk.name]: '',
  [tk.domain]: '',
  [tk.planId]: null,
  [tk.status]: null,
})

const planFilterOptions = computed(() => [
  { label: t('all'), value: null },
  ...siteStore.planSelectOptions,
])

const statusFilterOptions = computed(() => [
  { label: t('all'), value: null },
  { label: t('tenantStatusActive'), value: 1 },
  { label: t('tenantStatusInactive'), value: 0 },
])

function syncDraftFromApplied() {
  filterDraft[tk.name] = filterApplied[tk.name]
  filterDraft[tk.domain] = filterApplied[tk.domain]
  filterDraft[tk.planId] = filterApplied[tk.planId]
  filterDraft[tk.status] = filterApplied[tk.status]
}

function rowStatusBucket(row) {
  const s = row?.[tk.status]
  return s === 0 || s === '0' ? 0 : 1
}

const filteredRows = computed(() => {
  let list = siteStore.tenantList
  const f = filterApplied
  const nameQ = String(f[tk.name] ?? '').trim().toLowerCase()
  if (nameQ) {
    list = list.filter(r =>
      String(r[tk.name] ?? '').toLowerCase().includes(nameQ),
    )
  }
  const domainQ = String(f[tk.domain] ?? '').trim().toLowerCase()
  if (domainQ) {
    list = list.filter(r =>
      String(r[tk.domain] ?? '').toLowerCase().includes(domainQ),
    )
  }
  if (f[tk.planId] != null
    && f[tk.planId] !== ''
    && Number.isFinite(Number(f[tk.planId]))
  ) {
    const pid = Number(f[tk.planId])
    list = list.filter(r => Number(r[tk.planId]) === pid)
  }
  if (f[tk.status] === 0 || f[tk.status] === 1) {
    list = list.filter(r => rowStatusBucket(r) === f[tk.status])
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

const activeTenantFilterCount = computed(() => {
  let n = 0
  const f = filterApplied
  if (String(f[tk.name] ?? '').trim()) {
    n += 1
  }
  if (String(f[tk.domain] ?? '').trim()) {
    n += 1
  }
  if (f[tk.planId] != null
    && f[tk.planId] !== ''
    && Number.isFinite(Number(f[tk.planId]))
  ) {
    n += 1
  }
  if (f[tk.status] === 0 || f[tk.status] === 1) {
    n += 1
  }

  return n
})

async function openTenantFilters() {
  if (!siteStore.plans.length) {
    try {
      await siteStore.getPlans()
    } catch {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('plansLoadError'),
      })
      return
    }
  }
  syncDraftFromApplied()
  filterDialogOpen.value = true
}

function closeTenantFilterDialog() {
  syncDraftFromApplied()
  filterDialogOpen.value = false
}

function applyTenantFilters() {
  filterApplied[tk.name] = String(filterDraft[tk.name] ?? '').trim()
  filterApplied[tk.domain] = String(filterDraft[tk.domain] ?? '').trim()
  const pid = filterDraft[tk.planId]
  filterApplied[tk.planId] =
    pid != null && pid !== '' && Number.isFinite(Number(pid))
      ? Number(pid)
      : null
  const st = filterDraft[tk.status]
  filterApplied[tk.status] =
    st === 0 || st === 1 ? Number(st) : null
  filterDialogOpen.value = false
}

function clearTenantFilters() {
  filterDraft[tk.name] = ''
  filterDraft[tk.domain] = ''
  filterDraft[tk.planId] = null
  filterDraft[tk.status] = null
  filterApplied[tk.name] = ''
  filterApplied[tk.domain] = ''
  filterApplied[tk.planId] = null
  filterApplied[tk.status] = null
  filterDialogOpen.value = false
}

function isTenantStatusZero(row) {
  const s = row?.[tk.status]

  return s === 0 || s === '0'
}

function tenantRowClass(row) {
  return isTenantStatusZero(row) ? 'tenant-row--status-zero' : ''
}

const deleteTenantMessage = computed(() => {
  const row = tenantPendingDelete.value
  if (!row) {
    return ''
  }

  return t('deleteTenantMessage', {
    name: row[tk.name] || row[tk.domain] || row.id,
  })
})

const windowWidth = computed(() => $q.screen.width)
// TODO: take into account drawer width
const showGrid = computed(() => windowWidth.value <= siteBreakpointsPx.XXS)

// Methods
const addTenant = () => {
  tenantBeingEdited.value = null
  addDialogOpen.value = true
}

async function onSaveTenant(payload) {
  const editingId = tenantBeingEdited.value?.id
  addSaving.value = true
  try {
    if (editingId != null) {
      await siteStore.updateTenant(editingId, payload)
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('tenantUpdatedSuccess'),
      })
    } else {
      await siteStore.createTenant(payload)
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('tenantCreatedSuccess'),
      })
    }
    addDialogOpen.value = false
    tablePagination.value = tenantTablePaginationFromStore(
      tablePagination.value,
    )
  } catch (error) {
    const fallback = editingId != null
      ? t('tenantUpdateError')
      : t('tenantCreateError')
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

function isMainTenant(row) {
  if (!row) {
    return false
  }
  const key = String(defaultTenant).toLowerCase()
  const name = String(row[tk.name] ?? '').toLowerCase()
  const domain = String(row[tk.domain] ?? '').toLowerCase()

  return name === key || domain === key
}

function getbadge(activeTenantFilterCount) {
  return activeTenantFilterCount > 0
    ? String(activeTenantFilterCount) : undefined
}

function editRow(row) {
  if (isMainTenant(row)) {
    return
  }
  tenantBeingEdited.value = row
  addDialogOpen.value = true
}
function deleteRow(row) {
  tenantPendingDelete.value = row
  deleteConfirmOpen.value = true
}

function onCancelDeleteTenant() {
  tenantPendingDelete.value = null
}

async function onConfirmDeleteTenant() {
  if (deleteSaving.value) {
    return
  }
  const row = tenantPendingDelete.value
  if (!row?.id) {
    return
  }
  const id = row.id
  deleteSaving.value = true
  try {
    await siteStore.deleteTenant(id)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('tenantDeletedSuccess'),
    })
  } catch (error) {
    const msg =
      error?.response?.data?.message
      || error?.response?.data?.error
      || error?.message
      || t('tenantDeleteError')
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: String(msg),
    })
  } finally {
    deleteSaving.value = false
    tenantPendingDelete.value = null
  }
}

</script>

<style scoped>
  :deep(tbody tr.tenant-row--status-zero td) {
    background-color: rgba(244, 67, 54, 0.12) !important;
  }

  :deep(.q-table--grid .tenant-row--status-zero) {
    background-color: rgba(244, 67, 54, 0.12);
  }

  .tenant-filter-card {
    min-width: min(400px, 100vw - 32px);
    max-width: 440px;
  }

  .tenant-filter-card .primary-action {
    margin-left: 16px;
  }

  .tenant-view-card {
    min-width: min(560px, 100vw - 24px);
    max-width: min(720px, 100vw - 24px);
  }

  .tenant-view-body {
    max-height: min(520px, 70vh);
    overflow-y: auto;
  }
</style>

