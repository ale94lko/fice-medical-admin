import { apiInstance } from 'boot/axios'
import {
  extractTenantList,
  extractTenantListPagination,
} from 'components/helpers.js'

export async function fetchAllPaginatedRaw(path, extraQuery = {}) {
  const limit = 100
  let page = 0
  const combined = []
  while (true) {
    const response = await apiInstance.get(path, {
      params: { page, limit, ...extraQuery },
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

export function buildPermissionTreeNodes(
  moduleRows,
  permissionRows,
  translate,
) {
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

export function filterPermissionTreeByModuleIds(treeNodes, moduleIds) {
  if (!Array.isArray(treeNodes) || treeNodes.length === 0) {
    return []
  }
  const allowed = new Set(
    (moduleIds || [])
      .map(id => Number(id))
      .filter(Number.isFinite),
  )
  if (allowed.size === 0) {
    return []
  }

  return treeNodes.filter(branch => {
    const key = branch?.nodeKey
    if (typeof key !== 'string' || !key.startsWith('m-')) {
      return false
    }
    if (key === 'm-uncategorized') {
      return false
    }
    const mid = Number(key.slice(2))

    return Number.isFinite(mid) && allowed.has(mid)
  })
}

export function collectPermissionIdsFromTree(treeNodes) {
  const ids = new Set()
  for (const branch of treeNodes || []) {
    for (const leaf of branch.children || []) {
      const n = Number(leaf.nodeKey)
      if (Number.isFinite(n)) {
        ids.add(n)
      }
    }
  }

  return ids
}

export function collectPermissionIdsForModuleIds(treeNodes, moduleIds) {
  const filtered = filterPermissionTreeByModuleIds(treeNodes, moduleIds)

  return collectPermissionIdsFromTree(filtered)
}

export function moduleIdsFromPermissionIds(treeNodes, permissionIds) {
  const want = new Set(
    (permissionIds || [])
      .map(id => Number(id))
      .filter(Number.isFinite),
  )
  if (want.size === 0) {
    return []
  }
  const moduleIds = new Set()
  for (const branch of treeNodes || []) {
    const key = branch?.nodeKey
    if (typeof key !== 'string' || !key.startsWith('m-')) {
      continue
    }
    if (key === 'm-uncategorized') {
      continue
    }
    const mid = Number(key.slice(2))
    if (!Number.isFinite(mid)) {
      continue
    }
    for (const leaf of branch.children || []) {
      const pid = Number(leaf.nodeKey)
      if (Number.isFinite(pid) && want.has(pid)) {
        moduleIds.add(mid)
        break
      }
    }
  }

  return [...moduleIds].sort((a, b) => a - b)
}
