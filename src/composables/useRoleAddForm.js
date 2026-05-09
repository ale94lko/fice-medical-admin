import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { apiInstance } from 'boot/axios'
import {
  apiPaths,
  fieldTypes,
  htmlInputTypes,
  quasarNotifyTypes,
  roleFieldKeys,
} from 'components/constants.js'
import {
  buildPermissionCodeToIdMap,
  buildRoleCreateBody,
  extractRoleTemplatePermissionIds,
  extractTenantList,
  extractTenantListPagination,
  mapRole,
  roleByIdPath,
} from 'components/helpers.js'

async function fetchAllPaginatedRaw(path) {
  const limit = 100
  let page = 0
  const combined = []
  while (true) {
    const response = await apiInstance.get(path, {
      params: { page, limit },
    })
    const root = response?.data?.data
    const batch = extractTenantList(root)
    const meta = extractTenantListPagination(root)
    combined.push(...batch)
    const total = meta?.total
    if (batch.length === 0) {
      break
    }
    if (typeof total === 'number' && combined.length >= total) {
      break
    }
    if (batch.length < limit) {
      break
    }
    page += 1
  }

  return combined.filter(r => r && typeof r === 'object')
}

function permissionRowId(row) {
  const id = Number(
    row.id ?? row.permission_id ?? row.permissionId,
  )

  return Number.isFinite(id) ? id : null
}

function permissionRowLabel(row, idFallback) {
  return String(
    row.name ?? row.title ?? row.display_name ?? row.code ?? idFallback ?? '',
  ).trim()
}

function permissionRowModuleId(row) {
  const raw = row.module_id ?? row.moduleId ?? row.module?.id
  if (raw == null || raw === '') {
    return null
  }
  const n = Number(raw)

  return Number.isFinite(n) ? n : null
}

function moduleRowId(row) {
  const id = Number(row.id)

  return Number.isFinite(id) ? id : null
}

function moduleRowLabel(row, idFallback) {
  return String(row.name ?? '').trim() || `Module ${idFallback}`
}

function sortedModuleNodes(moduleRows) {
  const modules = []
  for (const row of moduleRows) {
    const id = moduleRowId(row)
    if (id == null) {
      continue
    }
    modules.push({
      id,
      label: moduleRowLabel(row, id),
    })
  }
  modules.sort((a, b) => a.label.localeCompare(b.label))

  return modules
}

function assignPermissionsToModules(permissionRows, byModule) {
  const uncategorized = []
  for (const row of permissionRows) {
    const pid = permissionRowId(row)
    if (pid == null) {
      continue
    }
    const mid = permissionRowModuleId(row)
    const label = permissionRowLabel(row, pid)
    const leaf = { nodeKey: pid, label }
    if (mid != null && byModule.has(mid)) {
      byModule.get(mid).push(leaf)
    } else {
      uncategorized.push(leaf)
    }
  }

  return uncategorized
}

function moduleBranchesFromMap(modules, byModule) {
  const tree = []
  for (const m of modules) {
    const children = (byModule.get(m.id) ?? []).slice()
    children.sort((a, b) => a.label.localeCompare(b.label))
    if (children.length === 0) {
      continue
    }
    tree.push({
      nodeKey: `m-${m.id}`,
      label: m.label,
      children,
    })
  }

  return tree
}

function buildPermissionTreeNodes(moduleRows, permissionRows, translate) {
  const modules = sortedModuleNodes(moduleRows)
  const byModule = new Map(modules.map(m => [m.id, []]))
  const uncategorized = assignPermissionsToModules(permissionRows, byModule)
  const tree = moduleBranchesFromMap(modules, byModule)

  if (uncategorized.length > 0) {
    uncategorized.sort((a, b) => a.label.localeCompare(b.label))
    tree.push({
      nodeKey: 'm-uncategorized',
      label: translate('permissionsUncategorized'),
      children: uncategorized,
    })
  }

  return tree
}

function mapRoleRowsToTemplateSelectData(roleRows, nameKey, codeToIdMap) {
  const options = []
  const permissionIdsByRoleId = new Map()
  for (const row of roleRows) {
    const mapped = mapRole(row)
    if (!mapped) {
      continue
    }
    const raw = extractRoleTemplatePermissionIds({ data: row }, codeToIdMap)
    permissionIdsByRoleId.set(mapped.id, raw)
    const labelBase = String(mapped[nameKey] ?? mapped.id ?? '').trim()
    options.push({
      label: labelBase || String(mapped.id),
      value: mapped.id,
    })
  }
  options.sort((a, b) => a.label.localeCompare(b.label))

  return { options, permissionIdsByRoleId }
}

export function useRoleAddForm() {
  const { t } = useI18n()
  const $q = useQuasar()
  const rk = roleFieldKeys

  const permissionTreeNodes = ref([])
  const permissionsTreeLoading = ref(false)
  const knownPermissionIds = ref(new Set())
  const permissionCodeToId = ref(new Map())
  const roleTemplateOptions = ref([])
  const templatePermissionIdsByRoleId = ref(new Map())
  const templateRoleApplyLoading = ref(false)
  let templatePermissionFetchSeq = 0

  function applyTemplatePermissionIdsToForm(form, rawIds) {
    const allowed = knownPermissionIds.value
    const filtered = allowed.size
      ? rawIds.filter(pid => allowed.has(pid))
      : rawIds
    const permKey = rk.permissions
    const cur = form[permKey]
    if (Array.isArray(cur)) {
      cur.splice(0, cur.length, ...filtered)
    } else {
      form[permKey] = filtered.slice()
    }
  }

  async function loadPermissionCatalog(opts = {}) {
    if (opts.force !== true && permissionTreeNodes.value.length > 0) {
      return
    }
    permissionsTreeLoading.value = true
    try {
      const [moduleRows, permissionRows] = await Promise.all([
        fetchAllPaginatedRaw(apiPaths.modulesList),
        fetchAllPaginatedRaw(apiPaths.permissionsList),
      ])
      permissionTreeNodes.value = buildPermissionTreeNodes(
        moduleRows,
        permissionRows,
        t,
      )
      knownPermissionIds.value = new Set(
        permissionRows
          .map(permissionRowId)
          .filter(id => id != null),
      )
      permissionCodeToId.value = buildPermissionCodeToIdMap(permissionRows)
    } catch {
      permissionTreeNodes.value = []
      knownPermissionIds.value = new Set()
      permissionCodeToId.value = new Map()
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('rolePermissionsLoadError'),
      })
    } finally {
      permissionsTreeLoading.value = false
    }
  }

  async function onDialogOpen() {
    await loadPermissionCatalog()

    try {
      const roleRows = await fetchAllPaginatedRaw(apiPaths.rolesList)
      const templateData = mapRoleRowsToTemplateSelectData(
        roleRows,
        rk.name,
        permissionCodeToId.value,
      )
      const { options, permissionIdsByRoleId } = templateData
      roleTemplateOptions.value = options
      templatePermissionIdsByRoleId.value = permissionIdsByRoleId
    } catch {
      roleTemplateOptions.value = []
      templatePermissionIdsByRoleId.value = new Map()
      $q.notify({
        type: quasarNotifyTypes.warning,
        message: t('roleTemplateListLoadError'),
      })
    }
  }

  async function afterTemplateRoleSelected(form, roleId) {
    if (roleId == null || roleId === '') {
      return
    }
    const id = Number(roleId)
    if (!Number.isFinite(id)) {
      return
    }
    const seq = ++templatePermissionFetchSeq

    if (templatePermissionIdsByRoleId.value.has(id)) {
      if (seq !== templatePermissionFetchSeq) {
        return
      }
      const raw = templatePermissionIdsByRoleId.value.get(id) ?? []
      applyTemplatePermissionIdsToForm(form, raw)
      await nextTick()

      return
    }

    templateRoleApplyLoading.value = true
    try {
      const res = await apiInstance.get(roleByIdPath(id))
      if (seq !== templatePermissionFetchSeq) {
        return
      }
      const raw = extractRoleTemplatePermissionIds(
        res.data,
        permissionCodeToId.value,
      )
      applyTemplatePermissionIdsToForm(form, raw)
      await nextTick()
    } catch {
      if (seq === templatePermissionFetchSeq) {
        $q.notify({
          type: quasarNotifyTypes.negative,
          message: t('roleTemplatePermissionsLoadError'),
        })
      }
    } finally {
      if (seq === templatePermissionFetchSeq) {
        templateRoleApplyLoading.value = false
      }
    }
  }

  const permissionsRule = val =>
    (Array.isArray(val) && val.length > 0) || t('fieldRequired')

  const fields = computed(() => {
    const requiredRule = val =>
      (!!val && String(val).trim().length > 0) || t('fieldRequired')

    return [
      {
        key: rk.name,
        kind: fieldTypes.input,
        labelKey: rk.name,
        inputType: htmlInputTypes.text,
        rules: [requiredRule],
      },
      {
        key: rk.templateRoleId,
        kind: fieldTypes.select,
        labelKey: 'roleTemplateFromExisting',
        hintKey: 'roleTemplateHint',
        defaultValue: null,
        clearable: true,
        options: () => roleTemplateOptions.value,
        loading: templateRoleApplyLoading,
        afterModelUpdate: afterTemplateRoleSelected,
      },
      {
        key: rk.permissions,
        kind: fieldTypes.permissionTree,
        labelKey: 'permissions',
        defaultValue: [],
        rules: [permissionsRule],
        treeNodes: () => permissionTreeNodes.value,
        loading: permissionsTreeLoading,
        treeNoNodesLabelKey: 'permissionTreeEmpty',
      },
      {
        key: rk.description,
        kind: fieldTypes.textarea,
        labelKey: 'description',
        rows: 4,
        autogrow: false,
      },
    ]
  })

  function formatRolePayload(form) {
    return buildRoleCreateBody(form)
  }

  return {
    fields,
    onDialogOpen,
    formatRolePayload,
    loadPermissionCatalog,
    permissionTreeNodes,
    permissionsTreeLoading,
    permissionCodeToId,
    knownPermissionIds,
  }
}
