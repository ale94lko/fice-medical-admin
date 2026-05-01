<template>
  <q-page>
    <q-table
      class="table"
      row-key="id"
      :rows-per-page-options="[20, 50, 100, t('all')]"
      :grid="showGrid"
      :title="t('tenants')"
      :rows="filteredRows"
      :columns="columns"
      :table-row-class-fn="tenantRowClass"
      :card-class-fn="tenantRowClass"
      :rows-per-page-label="t('rowsPerPage')">
      <template v-slot:top>
        <q-btn
          no-caps
          color="primary"
          icon="add"
          :disable="loading || addSaving || deleteSaving"
          :label="t('addTenant')"
          @click="addTenant" />
        <q-space />
        <q-btn
          color="secondary"
          class="text-teal-10"
          icon="filter_alt"
          :disable="loading || deleteSaving"
          :label="t('filters')"
          :badge="getbadge(activeTenantFilterCount)"
          badge-color="primary"
          @click="openTenantFilters"
        />
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            v-if="!isMainTenant(props.row)"
            flat
            round
            icon="edit"
            color="primary"
            :size="siteBreakpoints.SM"
            :disable="addSaving || deleteSaving"
            @click="editRow(props.row)"
          />
          <q-btn
            v-if="!isTenantStatusZero(props.row) && !isMainTenant(props.row)"
            flat
            round
            icon="delete"
            color="primary"
            :size="siteBreakpoints.SM"
            :disable="deleteSaving"
            @click="deleteRow(props.row)"
          />
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
      transition-show="scale"
      transition-hide="scale">
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
            v-model="filterDraft.name"
            outlined
            dense
            clearable
            :label="t('name')"
          />
          <q-input
            v-model="filterDraft.domain"
            outlined
            dense
            clearable
            :label="t('domain')"
          />
          <q-select
            v-model="filterDraft.planId"
            outlined
            dense
            clearable
            emit-value
            map-options
            :options="planFilterOptions"
            option-label="label"
            option-value="value"
            :label="t('planName')"
          />
          <q-select
            v-model="filterDraft.status"
            outlined
            dense
            clearable
            emit-value
            map-options
            :options="statusFilterOptions"
            option-label="label"
            option-value="value"
            :label="t('status')"
          />
        </q-card-section>
        <q-separator />
        <q-card-actions align="center" class="q-pa-md">
          <q-btn
            no-caps
            padding="7px 30px"
            color="secondary"
            class="text-teal-10"
            :label="t('tenantFilterClear')"
            @click="clearTenantFilters"
          />
          <q-btn
            no-caps
            class="primary-action"
            color="primary"
            padding="7px 30px"
            :label="t('tenantFilterApply')"
            @click="applyTenantFilters"
          />
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
  formatNationalPhoneDisplay,
  formatPhoneWithCountryCode,
  nationalPhoneDigitsFromStored,
  siteBreakpoints,
  siteBreakpointsPx,
} from 'components/constants.js'
import Dialog from 'components/Dialog.vue'
import ModalComponent from 'components/ModalComponent.vue'
import {
  TENANT_EDITABLE_KEYS_ON_EDIT,
  useTenantAddForm,
} from 'src/composables/useTenantAddForm.js'

const $q = useQuasar()
const loading = ref(false)
const addDialogOpen = ref(false)
const addSaving = ref(false)
const deleteConfirmOpen = ref(false)
const tenantPendingDelete = ref(null)
const deleteSaving = ref(false)
const tenantBeingEdited = ref(null)

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
    name: row.name ?? '',
    domain: row.domain ?? '',
    planId: row.planId ?? null,
    status: row.status === 0 || row.status === '0' ? 0 : 1,
    timezone: row.timezone ?? 'UTC-08:00',
    locale: row.locale ?? 'en_US',
    contactEmail: row.contactEmail ?? '',
    contactPhone: formatNationalPhoneDisplay(
      row.country ?? countryCodeUsa,
      nationalPhoneDigitsFromStored(
        row.country ?? countryCodeUsa,
        row.contactPhone ?? '',
      ),
    ),
    contactAddress: row.contactAddress ?? '',
    notes: row.notes ?? '',
  }
  if (row.country) {
    seed.country = row.country
  }
  if (row.state) {
    seed.state = row.state
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

// Load data when component is mounted
onMounted(async() => {
  loading.value = true
  try {
    await siteStore.getTenantList()
  } catch {
    $q.notify({
      type: 'negative',
      message: t('tenantListError'),
    })
  } finally {
    loading.value = false
  }
})

// Computed properties
const columns = computed(() => [
  {
    name: 'name',
    required: true,
    label: t('name'),
    align: 'left',
    field: row => row.name,
    sortable: true,
  },
  {
    name: 'domain',
    required: true,
    label: t('domain'),
    align: 'left',
    field: row => row.domain,
    sortable: true,
  },
  {
    name: 'planName',
    required: true,
    label: t('planName'),
    align: 'left',
    field: row => row.planName,
    sortable: false,
  },
  {
    name: 'contactEmail',
    required: true,
    label: t('contactEmail'),
    align: 'left',
    field: row => row.contactEmail ?? '',
    sortable: true,
  },
  {
    name: 'contactPhone',
    required: true,
    label: t('contactPhone'),
    align: 'left',
    field: row =>
      formatPhoneWithCountryCode(
        row.country ?? countryCodeUsa,
        row.contactPhone ?? '',
      ),
    sortable: false,
  },
  {
    name: 'actions',
    required: true,
    label: t('actions'),
    align: 'center',
    field: row => row.actions,
    sortable: false,
  },
])
const filterDialogOpen = ref(false)
const filterDraft = reactive({
  name: '',
  domain: '',
  planId: null,
  status: null,
})
const filterApplied = reactive({
  name: '',
  domain: '',
  planId: null,
  status: null,
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
  filterDraft.name = filterApplied.name
  filterDraft.domain = filterApplied.domain
  filterDraft.planId = filterApplied.planId
  filterDraft.status = filterApplied.status
}

function rowStatusBucket(row) {
  const s = row?.status
  return s === 0 || s === '0' ? 0 : 1
}

const filteredRows = computed(() => {
  let list = siteStore.tenantList
  const f = filterApplied
  const nameQ = String(f.name ?? '').trim().toLowerCase()
  if (nameQ) {
    list = list.filter(r =>
      String(r.name ?? '').toLowerCase().includes(nameQ),
    )
  }
  const domainQ = String(f.domain ?? '').trim().toLowerCase()
  if (domainQ) {
    list = list.filter(r =>
      String(r.domain ?? '').toLowerCase().includes(domainQ),
    )
  }
  if (f.planId != null
    && f.planId !== ''
    && Number.isFinite(Number(f.planId))
  ) {
    const pid = Number(f.planId)
    list = list.filter(r => Number(r.planId) === pid)
  }
  if (f.status === 0 || f.status === 1) {
    list = list.filter(r => rowStatusBucket(r) === f.status)
  }
  return list
})

const activeTenantFilterCount = computed(() => {
  let n = 0
  const f = filterApplied
  if (String(f.name ?? '').trim()) {
    n += 1
  }
  if (String(f.domain ?? '').trim()) {
    n += 1
  }
  if (f.planId != null
    && f.planId !== ''
    && Number.isFinite(Number(f.planId))
  ) {
    n += 1
  }
  if (f.status === 0 || f.status === 1) {
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
        type: 'negative',
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
  filterApplied.name = String(filterDraft.name ?? '').trim()
  filterApplied.domain = String(filterDraft.domain ?? '').trim()
  const pid = filterDraft.planId
  filterApplied.planId =
    pid != null && pid !== '' && Number.isFinite(Number(pid))
      ? Number(pid)
      : null
  const st = filterDraft.status
  filterApplied.status =
    st === 0 || st === 1 ? Number(st) : null
  filterDialogOpen.value = false
}

function clearTenantFilters() {
  filterDraft.name = ''
  filterDraft.domain = ''
  filterDraft.planId = null
  filterDraft.status = null
  filterApplied.name = ''
  filterApplied.domain = ''
  filterApplied.planId = null
  filterApplied.status = null
  filterDialogOpen.value = false
}

function isTenantStatusZero(row) {
  const s = row?.status
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
  return t('deleteTenantMessage', { name: row.name || row.domain || row.id })
})

// Responsive logic
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
        type: 'positive',
        message: t('tenantUpdatedSuccess'),
      })
    } else {
      await siteStore.createTenant(payload)
      $q.notify({
        type: 'positive',
        message: t('tenantCreatedSuccess'),
      })
    }
    addDialogOpen.value = false
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
      type: 'negative',
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
  const name = String(row.name ?? '').toLowerCase()
  const domain = String(row.domain ?? '').toLowerCase()
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
      type: 'positive',
      message: t('tenantDeletedSuccess'),
    })
  } catch (error) {
    const msg =
      error?.response?.data?.message
      || error?.response?.data?.error
      || error?.message
      || t('tenantDeleteError')
    $q.notify({
      type: 'negative',
      message: String(msg),
    })
  } finally {
    deleteSaving.value = false
    tenantPendingDelete.value = null
  }
}

</script>

<style scoped>
/*
 * status === 0: light red — set on every td (incl. actions slot), not only tr,
 * because Quasar / q-td defaults paint cells white.
 */
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
</style>

