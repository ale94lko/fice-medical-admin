import { computed, nextTick, ref, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  apiPaths,
  fieldTypes,
  htmlInputTypes,
  planBillingCycles,
  planFieldKeys,
  planFormDefaults,
  quasarNotifyTypes,
  selectBehaviors,
} from 'components/constants.js'
import {
  buildPlanCreateBody,
  buildPlanUpdateBody,
  intIdList,
} from 'components/helpers.js'
import {
  buildPermissionTreeNodes,
  collectPermissionIdsForModuleIds,
  collectPermissionIdsFromTree,
  fetchAllPaginatedRaw,
  filterPermissionTreeByModuleIds,
} from 'src/utils/permission-catalog-tree.js'

function writeFormPermissions(form, permKey, merged) {
  const cur = form[permKey]
  if (Array.isArray(cur)) {
    cur.splice(0, cur.length, ...merged)
  } else {
    form[permKey] = merged.slice()
  }
}

function pruneFormPermissionsToAllowed(form, permKey, allowedIds) {
  const cur = form[permKey]
  if (!Array.isArray(cur)) {
    return
  }
  const next = cur
    .map(x => Number(x))
    .filter(id => Number.isFinite(id) && allowedIds.has(id))
  if (next.length !== cur.length) {
    writeFormPermissions(form, permKey, next)
  }
}

export function usePlanForm(editingPlanRef) {
  const { t } = useI18n()
  const $q = useQuasar()
  const pk = planFieldKeys

  const allPermissionTreeNodes = ref([])
  const permissionTreeNodes = ref([])
  const permissionsTreeLoading = ref(false)
  const moduleSelectOptions = ref([])
  const modulesLoading = ref(false)
  let lastModuleIds = []

  const billingCycleOptions = computed(() => [
    { label: t('planBillingMonthly'), value: planBillingCycles.monthly },
    { label: t('planBillingYearly'), value: planBillingCycles.yearly },
    {
      label: t('planBillingQuarterly'),
      value: planBillingCycles.quarterly,
    },
  ])

  const statusOptions = computed(() => [
    { label: t('tenantStatusActive'), value: 1 },
    { label: t('tenantStatusInactive'), value: 0 },
  ])

  async function loadModuleOptions() {
    if (moduleSelectOptions.value.length > 0) {
      return
    }
    modulesLoading.value = true
    try {
      const moduleRows = await fetchAllPaginatedRaw(apiPaths.modulesList)
      const out = []
      for (const row of moduleRows) {
        const id = Number(row.id)
        if (!Number.isFinite(id)) {
          continue
        }
        const label = String(row.name ?? '').trim() || String(id)
        out.push({ label, value: id })
      }
      out.sort((a, b) => a.label.localeCompare(b.label))
      moduleSelectOptions.value = out
    } catch {
      moduleSelectOptions.value = []
    } finally {
      modulesLoading.value = false
    }
  }

  async function loadPermissionCatalog() {
    if (allPermissionTreeNodes.value.length > 0) {
      return
    }
    permissionsTreeLoading.value = true
    try {
      const [moduleRows, permissionRows] = await Promise.all([
        fetchAllPaginatedRaw(apiPaths.modulesList),
        fetchAllPaginatedRaw(apiPaths.permissionsList),
      ])
      allPermissionTreeNodes.value = buildPermissionTreeNodes(
        moduleRows,
        permissionRows,
        t,
      )
      permissionTreeNodes.value = []
    } catch {
      allPermissionTreeNodes.value = []
      permissionTreeNodes.value = []
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('rolePermissionsLoadError'),
      })
    } finally {
      permissionsTreeLoading.value = false
    }
  }

  function applyModulesToPermissionTree(form, moduleIds, opts = {}) {
    const { autoSelectNew = false } = opts
    const ids = intIdList(moduleIds)

    if (ids.length === 0) {
      permissionTreeNodes.value = []
      writeFormPermissions(form, pk.permissions, [])
      lastModuleIds = []

      return
    }

    const filtered = filterPermissionTreeByModuleIds(
      allPermissionTreeNodes.value,
      ids,
    )
    permissionTreeNodes.value = filtered
    const allowed = new Set(collectPermissionIdsFromTree(filtered))

    const prevSet = new Set(
      lastModuleIds.map(id => Number(id)).filter(Number.isFinite),
    )
    const added = ids.filter(id => !prevSet.has(id))

    if (autoSelectNew && added.length > 0) {
      const newPermIds = collectPermissionIdsForModuleIds(
        allPermissionTreeNodes.value,
        added,
      )
      const ticked = new Set(intIdList(form[pk.permissions]))
      for (const pid of newPermIds) {
        if (allowed.has(pid)) {
          ticked.add(pid)
        }
      }
      writeFormPermissions(
        form,
        pk.permissions,
        [...ticked].sort((a, b) => a - b),
      )
    } else {
      pruneFormPermissionsToAllowed(form, pk.permissions, allowed)
    }

    lastModuleIds = ids.slice()
  }

  async function afterModulesSelected(form, moduleIds) {
    applyModulesToPermissionTree(form, moduleIds, { autoSelectNew: true })
    await nextTick()
  }

  async function afterPlanFormOpen(form) {
    applyModulesToPermissionTree(form, form[pk.modules], {
      autoSelectNew: false,
    })
    await nextTick()
  }

  async function onDialogOpen() {
    lastModuleIds = []
    permissionTreeNodes.value = []
    await Promise.all([loadModuleOptions(), loadPermissionCatalog()])
  }

  const fields = computed(() => {
    const requiredRule = val =>
      (!!val && String(val).trim().length > 0) || t('fieldRequired')
    const selectRequiredRule = val =>
      (val != null && String(val).trim().length > 0) || t('fieldRequired')
    const priceRule = val => {
      const n = Number(val)
      if (!Number.isFinite(n) || n < 0) {
        return t('planPriceInvalid')
      }

      return true
    }

    return [
      {
        key: pk.name,
        kind: fieldTypes.input,
        labelKey: pk.name,
        inputType: htmlInputTypes.text,
        rules: [requiredRule],
      },
      {
        key: pk.price,
        kind: fieldTypes.input,
        labelKey: pk.price,
        inputType: htmlInputTypes.text,
        rules: [requiredRule, priceRule],
      },
      {
        key: pk.status,
        kind: fieldTypes.select,
        labelKey: pk.status,
        selectBehavior: selectBehaviors.menu,
        rules: [selectRequiredRule],
        options: statusOptions,
        defaultValue: planFormDefaults.statusActive,
      },
      {
        key: pk.billingCycle,
        kind: fieldTypes.select,
        labelKey: 'planBillingCycle',
        selectBehavior: selectBehaviors.menu,
        rules: [selectRequiredRule],
        options: billingCycleOptions,
        defaultValue: planFormDefaults.billingCycle,
      },
      {
        key: pk.features,
        kind: fieldTypes.textarea,
        labelKey: 'planFeatures',
        rows: 3,
        autogrow: false,
      },
      {
        key: pk.modules,
        kind: fieldTypes.select,
        labelKey: 'planModules',
        multiple: true,
        clearable: true,
        options: () => moduleSelectOptions.value,
        loading: modulesLoading,
        defaultValue: [],
        afterModelUpdate: (form, value) =>
          afterModulesSelected(form, value),
      },
      {
        key: pk.permissions,
        kind: fieldTypes.permissionTree,
        labelKey: 'permissions',
        defaultValue: [],
        treeNodes: () => permissionTreeNodes.value,
        loading: permissionsTreeLoading,
        treeNoNodesLabelKey: 'planPermissionsSelectModules',
        disable: form => intIdList(form[pk.modules]).length === 0,
      },
      {
        key: pk.description,
        kind: fieldTypes.textarea,
        labelKey: pk.description,
        rows: 3,
        autogrow: false,
      },
    ]
  })

  function formatPlanPayload(form) {
    const row = unref(editingPlanRef)
    const id = row?.id
    if (id != null && id !== '' && Number.isFinite(Number(id))) {
      return buildPlanUpdateBody(form, Number(id))
    }

    return buildPlanCreateBody(form)
  }

  return {
    fields,
    onDialogOpen,
    afterPlanFormOpen,
    formatPlanPayload,
    permissionTreeNodes,
    permissionsTreeLoading,
    loadPermissionCatalog,
  }
}
