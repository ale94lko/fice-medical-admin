<template>
  <q-page class="admin-page">
    <q-table
      class="table admin-data-table"
      row-key="id"
      binary-state-sort
      v-model:pagination="tablePagination"
      :rows-per-page-options="[10, 20, 50, 100]"
      :grid="showGrid"
      :title="t('plans')"
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
          :disable="loading || planFormSaving || deleteSaving"
          :title="t('addPlan')"
          :label="t('addPlan')"
          @click="addPlan"/>
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
          :badge="getbadge(activePlanFilterCount)"
          @click="openPlanFilters"/>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            round
            icon="visibility"
            color="primary"
            :size="siteBreakpoints.SM"
            :disable="planFormSaving || deleteSaving"
            :title="t('viewPlan')"
            :aria-label="t('viewPlan')"
            @click="openViewPlan(props.row)"/>
          <q-btn
            flat
            round
            icon="edit"
            color="primary"
            :size="siteBreakpoints.SM"
            :disable="planFormSaving || deleteSaving"
            :title="t('editPlan')"
            :aria-label="t('editPlan')"
            @click="openEditPlan(props.row)"/>
          <q-btn
            flat
            round
            icon="delete"
            color="primary"
            :size="siteBreakpoints.SM"
            :disable="deleteSaving || planFormSaving"
            :title="t('deletePlanTitle')"
            :aria-label="t('deletePlanTitle')"
            @click="deleteRow(props.row)"/>
        </q-td>
      </template>
    </q-table>

    <Dialog
      v-model="planFormDialogOpen"
      :title="planFormDialogTitle"
      :fields="planFormFields"
      :initial-values="planFormInitialValues"
      :on-open="onPlanFormDialogOpen"
      :after-open="afterPlanFormOpen"
      :format-payload="formatPlanPayload"
      :saving="planFormSaving"
      @save="onSavePlanForm"/>

    <q-dialog
      v-model="filterDialogOpen"
      persistent
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card class="plan-filter-card">
        <q-toolbar class="q-px-md app-dialog-toolbar">
          <q-toolbar-title>{{ t('planFiltersTitle') }}</q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            :title="t('close')"
            :aria-label="t('close')"
            @click="closePlanFilterDialog"/>
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
            v-model="filterDraft[pk.status]"
            outlined
            dense
            clearable
            emit-value
            map-options
            :options="statusFilterOptions"
            :label="t('status')"
            :behavior="selectBehaviors.menu"/>
          <q-select
            v-model="filterDraft[pk.billingCycle]"
            outlined
            dense
            clearable
            emit-value
            map-options
            :options="billingCycleFilterOptions"
            :label="t('planBillingCycle')"
            :behavior="selectBehaviors.menu"/>
        </q-card-section>
        <q-separator />
        <q-card-actions align="center" class="q-pa-md">
          <q-btn
            no-caps
            padding="7px 30px"
            outline
            color="primary"
            class="app-btn-outline"
            :title="t('roleFilterClear')"
            :label="t('roleFilterClear')"
            @click="clearPlanFilters"/>
          <q-btn
            no-caps
            class="primary-action"
            color="primary"
            padding="7px 30px"
            :title="t('roleFilterApply')"
            :label="t('roleFilterApply')"
            @click="applyPlanFilters"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <ModalComponent
      v-model="deleteConfirmOpen"
      :title="t('deletePlanTitle')"
      :message="deletePlanMessage"
      :confirm-text="t('confirm')"
      :cancel-text="t('cancel')"
      @confirm="onConfirmDeletePlan"
      @cancel="onCancelDeletePlan"/>

    <q-dialog
      v-model="viewPlanDialogOpen"
      :transition-show="quasarTransitions.scale"
      :transition-hide="quasarTransitions.scale">
      <q-card v-if="planViewing" class="plan-view-card">
        <q-toolbar class="q-px-md app-dialog-toolbar">
          <q-toolbar-title>{{ t('viewPlanTitle') }}</q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            :title="t('close')"
            :aria-label="t('close')"
            @click="closeViewPlan"/>
        </q-toolbar>
        <q-card-section class="plan-view-body q-px-lg q-py-md">
          <div class="row q-col-gutter-md">
            <div
              v-for="item in planDetailRows"
              class="col-12 col-sm-6"
              :key="item.key">
              <div class="text-caption text-grey-7">{{ item.label }}</div>
              <div class="text-body2 text-grey-9">{{ item.value }}</div>
            </div>
            <div class="col-12">
              <q-field
                class="full-width plan-view-permission-qfield"
                outlined
                stack-label
                readonly
                :model-value="viewPlanTicked"
                :label="t('permissions')">
                <template #control>
                  <div
                    class="relative-position full-width permission-tree-scroll">
                    <q-inner-loading
                      :showing="permissionsTreeLoading"
                      color="primary"/>
                    <q-tree
                      :nodes="viewPlanPermissionTreeNodes"
                      node-key="nodeKey"
                      label-key="label"
                      children-key="children"
                      tick-strategy="leaf"
                      dense
                      no-connectors
                      default-expand-all
                      class="full-width q-pt-sm text-body2"
                      v-model:ticked="viewPlanTicked"
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
            :title="t('close')"
            :label="t('close')"
            @click="closeViewPlan"/>
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
  planBillingCycles,
  planFieldKeys,
  planFormDefaults,
  planListColumnKeys,
  quasarNotifyTypes,
  quasarTableAlign,
  quasarTransitions,
  selectBehaviors,
  siteBreakpoints,
  siteBreakpointsPx,
} from 'components/constants.js'
import Dialog from 'components/Dialog.vue'
import ModalComponent from 'components/ModalComponent.vue'
import { clonePermissionTreeForViewReadonly } from 'components/helpers.js'
import { usePlanForm } from 'src/composables/usePlanForm.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { sortRowsByColumns } from 'src/utils/table-sort.js'

const pk = planFieldKeys

const $q = useQuasar()
const loading = ref(false)
const planEditingRow = ref(null)
const planFormDialogOpen = ref(false)
const planFormSaving = ref(false)
const deleteConfirmOpen = ref(false)
const planPendingDelete = ref(null)
const deleteSaving = ref(false)
const viewPlanDialogOpen = ref(false)
const planViewing = ref(null)
const viewPlanTicked = ref([])
let viewPlanTreeSeq = 0

const siteStore = useSiteStore()
const { t } = useI18n()

const {
  fields: planFormFields,
  onDialogOpen: onPlanFormDialogOpen,
  afterPlanFormOpen,
  formatPlanPayload,
  permissionTreeNodes,
  permissionsTreeLoading,
  loadPermissionCatalog,
} = usePlanForm(planEditingRow)

const planFormDialogTitle = computed(() =>
  planEditingRow.value ? t('editPlan') : t('newPlan'),
)

const planFormInitialValues = computed(() => {
  if (!planFormDialogOpen.value) {
    return null
  }
  const editRow = planEditingRow.value
  if (!editRow) {
    return {
      [pk.name]: '',
      [pk.description]: '',
      [pk.price]: 0,
      [pk.status]: planFormDefaults.statusActive,
      [pk.billingCycle]: planFormDefaults.billingCycle,
      [pk.features]: '',
      [pk.modules]: [],
      [pk.permissions]: [],
    }
  }

  return {
    [pk.name]: editRow[pk.name] ?? '',
    [pk.description]: editRow[pk.description] ?? '',
    [pk.price]: editRow[pk.price] ?? 0,
    [pk.status]: editRow[pk.status] ?? planFormDefaults.statusActive,
    [pk.billingCycle]:
      editRow[pk.billingCycle] ?? planFormDefaults.billingCycle,
    [pk.features]: editRow[pk.features] ?? '',
    [pk.modules]: Array.isArray(editRow[pk.modules])
      ? editRow[pk.modules].slice()
      : [],
    [pk.permissions]: Array.isArray(editRow[pk.permissions])
      ? editRow[pk.permissions].slice()
      : [],
  }
})

const viewPlanPermissionTreeNodes = computed(() =>
  clonePermissionTreeForViewReadonly(permissionTreeNodes.value),
)

const statusFilterOptions = computed(() => [
  { label: t('tenantStatusActive'), value: 1 },
  { label: t('tenantStatusInactive'), value: 0 },
])

const billingCycleFilterOptions = computed(() => [
  { label: t('planBillingMonthly'), value: planBillingCycles.monthly },
  { label: t('planBillingYearly'), value: planBillingCycles.yearly },
  {
    label: t('planBillingQuarterly'),
    value: planBillingCycles.quarterly,
  },
])

const tablePagination = ref({
  sortBy: pk.name,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

function planTablePaginationFromStore(paginationPayload) {
  const meta = siteStore.planListPagination
  const total = meta?.total != null && Number.isFinite(Number(meta.total))
    ? Number(meta.total)
    : siteStore.planList.length
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

async function loadPlans(paginationPayload) {
  loading.value = true
  try {
    await siteStore.getPlanList({
      page: paginationPayload.page,
      limit: paginationPayload.rowsPerPage,
    })
    tablePagination.value = planTablePaginationFromStore(paginationPayload)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('planListError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function onTableRequest(props) {
  return loadPlans(props.pagination)
}

watch(planFormDialogOpen, open => {
  if (!open) {
    planEditingRow.value = null
  }
})

watch(
  [viewPlanDialogOpen, planViewing],
  async([open, row]) => {
    if (!open) {
      viewPlanTreeSeq += 1
      viewPlanTicked.value = []
      planViewing.value = null

      return
    }
    if (!row) {
      return
    }
    const seq = ++viewPlanTreeSeq
    await loadPermissionCatalog()
    if (seq !== viewPlanTreeSeq || !viewPlanDialogOpen.value) {
      return
    }
    const raw = Array.isArray(row[pk.permissions])
      ? row[pk.permissions].map(id => Number(id)).filter(Number.isFinite)
      : []
    viewPlanTicked.value = raw.slice()
    await nextTick()
  },
)

onMounted(() => {
  loadPlans(tablePagination.value)
})

function planStatusLabel(status) {
  const n = Number(status)

  return n === 1 ? t('tenantStatusActive') : t('tenantStatusInactive')
}

function planBillingLabel(cycle) {
  const v = String(cycle ?? '').trim().toLowerCase()
  if (v === planBillingCycles.monthly) {
    return t('planBillingMonthly')
  }
  if (v === planBillingCycles.yearly) {
    return t('planBillingYearly')
  }
  if (v === planBillingCycles.quarterly) {
    return t('planBillingQuarterly')
  }

  return v || '—'
}

function formatPrice(value) {
  const n = Number(value)

  return Number.isFinite(n) ? n.toFixed(2) : '—'
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
    name: pk.price,
    required: true,
    label: t('planPrice'),
    align: quasarTableAlign.right,
    field: row => formatPrice(row[pk.price]),
    sortable: true,
  },
  {
    name: pk.billingCycle,
    required: true,
    label: t('planBillingCycle'),
    align: quasarTableAlign.left,
    field: row => planBillingLabel(row[pk.billingCycle]),
    sortable: true,
  },
  {
    name: pk.status,
    required: true,
    label: t('status'),
    align: quasarTableAlign.left,
    field: row => planStatusLabel(row[pk.status]),
    sortable: true,
  },
  {
    name: planListColumnKeys.actions,
    required: true,
    label: t('actions'),
    align: quasarTableAlign.center,
    field: () => null,
    sortable: false,
  },
])

const filterDialogOpen = ref(false)
const filterDraft = reactive({
  [pk.name]: '',
  [pk.description]: '',
  [pk.status]: null,
  [pk.billingCycle]: null,
})
const filterApplied = reactive({
  [pk.name]: '',
  [pk.description]: '',
  [pk.status]: null,
  [pk.billingCycle]: null,
})

function syncDraftFromApplied() {
  filterDraft[pk.name] = filterApplied[pk.name]
  filterDraft[pk.description] = filterApplied[pk.description]
  filterDraft[pk.status] = filterApplied[pk.status]
  filterDraft[pk.billingCycle] = filterApplied[pk.billingCycle]
}

const filteredRows = computed(() => {
  let list = siteStore.planList
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
  const statusVal = filterApplied[pk.status]
  if (statusVal != null && Number.isFinite(Number(statusVal))) {
    const want = Number(statusVal)
    list = list.filter(r => Number(r[pk.status]) === want)
  }
  const cycle = String(filterApplied[pk.billingCycle] ?? '').trim()
  if (cycle) {
    list = list.filter(r =>
      String(r[pk.billingCycle] ?? '').trim() === cycle,
    )
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

const activePlanFilterCount = computed(() => {
  let n = 0
  if (String(filterApplied[pk.name] ?? '').trim()) {
    n += 1
  }
  if (String(filterApplied[pk.description] ?? '').trim()) {
    n += 1
  }
  if (
    filterApplied[pk.status] != null
    && Number.isFinite(Number(filterApplied[pk.status]))
  ) {
    n += 1
  }
  if (String(filterApplied[pk.billingCycle] ?? '').trim()) {
    n += 1
  }

  return n
})

function openPlanFilters() {
  syncDraftFromApplied()
  filterDialogOpen.value = true
}

function closePlanFilterDialog() {
  syncDraftFromApplied()
  filterDialogOpen.value = false
}

function applyPlanFilters() {
  filterApplied[pk.name] = String(filterDraft[pk.name] ?? '').trim()
  filterApplied[pk.description] = String(
    filterDraft[pk.description] ?? '',
  ).trim()
  const st = filterDraft[pk.status]
  filterApplied[pk.status] =
    st != null && Number.isFinite(Number(st)) ? Number(st) : null
  const cycle = filterDraft[pk.billingCycle]
  filterApplied[pk.billingCycle] =
    cycle != null && String(cycle).trim() ? String(cycle).trim() : null
  filterDialogOpen.value = false
}

function clearPlanFilters() {
  filterDraft[pk.name] = ''
  filterDraft[pk.description] = ''
  filterDraft[pk.status] = null
  filterDraft[pk.billingCycle] = null
  filterApplied[pk.name] = ''
  filterApplied[pk.description] = ''
  filterApplied[pk.status] = null
  filterApplied[pk.billingCycle] = null
  filterDialogOpen.value = false
}

function dashText(v) {
  const s = String(v ?? '').trim()

  return s || '—'
}

const planDetailRows = computed(() => {
  const r = planViewing.value
  if (!r) {
    return []
  }

  return [
    { key: 'id', label: t('planId'), value: String(r.id) },
    { key: pk.name, label: t('name'), value: dashText(r[pk.name]) },
    {
      key: pk.description,
      label: t('description'),
      value: dashText(r[pk.description]),
    },
    {
      key: pk.price,
      label: t('planPrice'),
      value: formatPrice(r[pk.price]),
    },
    {
      key: pk.billingCycle,
      label: t('planBillingCycle'),
      value: planBillingLabel(r[pk.billingCycle]),
    },
    {
      key: pk.status,
      label: t('status'),
      value: planStatusLabel(r[pk.status]),
    },
    {
      key: pk.features,
      label: t('planFeatures'),
      value: dashText(r[pk.features]),
    },
    {
      key: 'modules',
      label: t('planModules'),
      value: dashText(r.moduleNames),
    },
  ]
})

function openViewPlan(row) {
  planViewing.value = row
  viewPlanDialogOpen.value = true
}

function closeViewPlan() {
  viewPlanDialogOpen.value = false
}

const windowWidth = computed(() => $q.screen.width)
const showGrid = computed(() => windowWidth.value <= siteBreakpointsPx.XXS)

function addPlan() {
  planEditingRow.value = null
  planFormDialogOpen.value = true
}

function openEditPlan(row) {
  planEditingRow.value = row
  planFormDialogOpen.value = true
}

async function onSavePlanForm(payload) {
  planFormSaving.value = true
  const isEdit = Boolean(planEditingRow.value?.id)
  try {
    if (isEdit) {
      await siteStore.updatePlan(planEditingRow.value.id, payload)
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('planUpdatedSuccess'),
      })
    } else {
      await siteStore.createPlan(payload)
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('planCreatedSuccess'),
      })
    }
    planFormDialogOpen.value = false
    tablePagination.value = planTablePaginationFromStore(
      tablePagination.value,
    )
  } catch (error) {
    const fallbackKey = isEdit ? 'planUpdateError' : 'planCreateError'
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
    planFormSaving.value = false
  }
}

function getbadge(n) {
  return n > 0 ? String(n) : undefined
}

function deleteRow(row) {
  planPendingDelete.value = row
  deleteConfirmOpen.value = true
}

function onCancelDeletePlan() {
  planPendingDelete.value = null
}

const deletePlanMessage = computed(() => {
  const row = planPendingDelete.value
  if (!row) {
    return ''
  }

  return t('deletePlanMessage', {
    name: row[pk.name] || row.id,
  })
})

async function onConfirmDeletePlan() {
  if (deleteSaving.value) {
    return
  }
  const row = planPendingDelete.value
  if (!row?.id) {
    return
  }
  const id = row.id
  deleteSaving.value = true
  try {
    await siteStore.deletePlan(id)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('planDeletedSuccess'),
    })
    await loadPlans(tablePagination.value)
  } catch (error) {
    const msg =
      error?.response?.data?.message
      || error?.response?.data?.error
      || error?.message
      || t('planDeleteError')
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: String(msg),
    })
  } finally {
    deleteSaving.value = false
    planPendingDelete.value = null
    deleteConfirmOpen.value = false
  }
}
</script>

<style scoped>
  .plan-filter-card {
    min-width: min(400px, 100vw - 32px);
    max-width: 440px;
  }

  .plan-filter-card .primary-action {
    margin-left: 16px;
  }

  .plan-view-card {
    min-width: min(520px, 100vw - 24px);
    max-width: min(720px, 100vw - 24px);
  }

  .plan-view-body {
    max-height: min(640px, 78vh);
    overflow-y: auto;
  }

  .permission-tree-scroll {
    max-height: 320px;
    overflow-y: auto;
  }

  .plan-view-permission-qfield :deep(.q-field__control) {
    padding-top: 6px;
  }
</style>
