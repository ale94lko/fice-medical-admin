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
