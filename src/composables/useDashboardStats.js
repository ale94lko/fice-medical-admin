import { ref, computed, onMounted } from 'vue'
import {
  apiPaths,
  catalogFieldKeys,
  permissionFieldKeys,
  planFieldKeys,
  tenantFieldKeys,
  userFieldKeys,
} from 'components/constants.js'
import {
  isMainTenant,
  mapCatalog,
  mapPermission,
  mapPlan,
  mapRole,
  mapTenant,
  mapUser,
} from 'components/helpers.js'
import { fetchAllPaginatedRaw }
  from 'src/utils/permission-catalog-tree.js'

export const dashboardChartPalette = [
  '#0f766e',
  '#14b8a6',
  '#0ea5e9',
  '#16a34a',
  '#d97706',
  '#6366f1',
  '#ec4899',
  '#64748b',
]

function isStatusInactive(status) {
  return status === 0 || status === '0'
}

function countStatusSplit(rows, statusKey) {
  let active = 0
  let inactive = 0
  for (const row of rows) {
    if (isStatusInactive(row?.[statusKey])) {
      inactive += 1
    } else {
      active += 1
    }
  }

  return { active, inactive, total: rows.length }
}

function groupCount(rows, keyFn, labelFn) {
  const map = new Map()
  for (const row of rows) {
    const key = keyFn(row)
    if (key == null || key === '') {
      continue
    }
    const label = labelFn(row, key)
    const prev = map.get(key) ?? { label, value: 0 }
    prev.value += 1
    map.set(key, prev)
  }

  return [...map.values()]
    .sort((a, b) => b.value - a.value)
}

function toBarItems(groups, colorOffset = 0) {
  return groups.map((g, idx) => ({
    label: g.label,
    value: g.value,
    color: dashboardChartPalette[
      (idx + colorOffset) % dashboardChartPalette.length
    ],
  }))
}

function toDonutSegments(groups, colorOffset = 0) {
  return groups
    .filter(g => g.value > 0)
    .map((g, idx) => ({
      label: g.label,
      value: g.value,
      color: dashboardChartPalette[
        (idx + colorOffset) % dashboardChartPalette.length
      ],
    }))
}

export function useDashboardStats() {
  const loading = ref(true)
  const error = ref(false)
  const lastUpdated = ref(null)

  const tenants = ref([])
  const users = ref([])
  const roles = ref([])
  const permissions = ref([])
  const modules = ref([])
  const plans = ref([])
  const catalogs = ref([])

  async function refresh() {
    loading.value = true
    error.value = false
    try {
      const [
        tenantRows,
        userRows,
        roleRows,
        permissionRows,
        moduleRows,
        planRows,
        catalogRows,
      ] = await Promise.all([
        fetchAllPaginatedRaw(apiPaths.tenantsList),
        fetchAllPaginatedRaw(apiPaths.usersList),
        fetchAllPaginatedRaw(apiPaths.rolesList),
        fetchAllPaginatedRaw(apiPaths.permissionsList),
        fetchAllPaginatedRaw(apiPaths.modulesList),
        fetchAllPaginatedRaw(apiPaths.plans),
        fetchAllPaginatedRaw(apiPaths.catalogList),
      ])

      tenants.value = tenantRows.map(mapTenant).filter(Boolean)
      users.value = userRows.map(mapUser).filter(Boolean)
      roles.value = roleRows.map(mapRole).filter(Boolean)
      permissions.value = permissionRows.map(mapPermission).filter(Boolean)
      modules.value = moduleRows
      plans.value = planRows.map(mapPlan).filter(Boolean)
      catalogs.value = catalogRows.map(mapCatalog).filter(Boolean)
      lastUpdated.value = new Date()
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  }

  const tk = tenantFieldKeys
  const uk = userFieldKeys
  const pk = permissionFieldKeys
  const plk = planFieldKeys
  const ck = catalogFieldKeys

  const clientTenants = computed(() =>
    tenants.value.filter(t => !isMainTenant(t)),
  )

  const summary = computed(() => {
    const tenantSplit = countStatusSplit(tenants.value, tk.status)
    const clientSplit = countStatusSplit(clientTenants.value, tk.status)
    const userSplit = countStatusSplit(users.value, uk.status)
    const planSplit = countStatusSplit(plans.value, plk.status)
    const catalogSplit = countStatusSplit(catalogs.value, ck.status)
    const catalogItems = catalogs.value.reduce(
      (sum, c) => sum + (c.itemCount ?? 0),
      0,
    )
    const planPrices = plans.value
      .map(p => p[plk.price])
      .filter(p => Number.isFinite(p) && p > 0)
    const avgPlanPrice = planPrices.length
      ? planPrices.reduce((a, b) => a + b, 0) / planPrices.length
      : 0
    const usersPwdChange = users.value.filter(
      u => u[uk.changePassword] === true,
    ).length

    return {
      tenants: tenantSplit.total,
      tenantsActive: tenantSplit.active,
      tenantsInactive: tenantSplit.inactive,
      clientTenants: clientSplit.total,
      clientTenantsActive: clientSplit.active,
      users: userSplit.total,
      usersActive: userSplit.active,
      usersInactive: userSplit.inactive,
      usersPwdChange,
      roles: roles.value.length,
      permissions: permissions.value.length,
      modules: modules.value.length,
      plans: planSplit.total,
      plansActive: planSplit.active,
      avgPlanPrice,
      catalogs: catalogSplit.total,
      catalogsActive: catalogSplit.active,
      catalogItems,
    }
  })

  const tenantStatusSegments = computed(() => {
    const split = countStatusSplit(clientTenants.value, tk.status)

    return toDonutSegments([
      { label: 'active', value: split.active },
      { label: 'inactive', value: split.inactive },
    ])
  })

  const userStatusSegments = computed(() => {
    const split = countStatusSplit(users.value, uk.status)

    return toDonutSegments([
      { label: 'active', value: split.active },
      { label: 'inactive', value: split.inactive },
    ], 2)
  })

  const tenantsByPlan = computed(() => {
    const groups = groupCount(
      clientTenants.value,
      row => {
        const name = String(row[tk.planName] ?? '').trim()
        const id = row[tk.planId]

        return name || (Number.isFinite(id) ? `plan-${id}` : null)
      },
      row => {
        const name = String(row[tk.planName] ?? '').trim()

        return name || String(row[tk.planId] ?? '—')
      },
    )

    return toBarItems(groups.slice(0, 8))
  })

  const usersByTenant = computed(() => {
    const tenantNameById = new Map(
      tenants.value.map(t => [Number(t.id), String(t[tk.name] ?? '').trim()]),
    )

    const groups = groupCount(
      users.value,
      row => row[uk.tenantId],
      (row, key) => {
        const name = tenantNameById.get(Number(key))

        return name || `#${key}`
      },
    )

    return toBarItems(groups.slice(0, 8), 3)
  })

  const permissionsByModule = computed(() => {
    const groups = groupCount(
      permissions.value,
      row => row[pk.moduleId] ?? row[pk.moduleName] ?? 'other',
      row => {
        const name = String(row[pk.moduleName] ?? '').trim()

        return name || String(row[pk.moduleId] ?? '—')
      },
    )

    return toBarItems(groups.slice(0, 10), 1)
  })

  const planBillingSegments = computed(() => {
    const groups = groupCount(
      plans.value,
      row => String(row[plk.billingCycle] ?? '').trim() || 'other',
      row => String(row[plk.billingCycle] ?? '').trim() || 'other',
    )

    return toDonutSegments(groups, 4)
  })

  const catalogScopeSegments = computed(() => {
    const groups = groupCount(
      catalogs.value,
      row => String(row[ck.scope] ?? '').trim() || 'other',
      row => String(row[ck.scope] ?? '').trim() || 'other',
    )

    return toDonutSegments(groups, 5)
  })

  const featuredTenants = computed(() =>
    [...clientTenants.value]
      .filter(t => !isStatusInactive(t[tk.status]))
      .sort((a, b) =>
        String(a[tk.name] ?? '').localeCompare(String(b[tk.name] ?? '')),
      )
      .slice(0, 6),
  )

  onMounted(refresh)

  return {
    loading,
    error,
    lastUpdated,
    refresh,
    summary,
    tenantStatusSegments,
    userStatusSegments,
    tenantsByPlan,
    usersByTenant,
    permissionsByModule,
    planBillingSegments,
    catalogScopeSegments,
    featuredTenants,
  }
}
