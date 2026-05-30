import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { apiInstance } from 'boot/axios'
import {
  apiPaths,
  fieldTypes,
  htmlAutocomplete,
  htmlInputTypes,
  qSelectOptionKeys,
  quasarNotifyTypes,
  selectBehaviors,
  roleFieldKeys,
  tenantFieldKeys,
  userFieldKeys,
  userFormDefaults,
} from 'components/constants.js'
import {
  buildPermissionCodeToIdMap,
  extractRoleTemplatePermissionIds,
  intIdList,
  isMainTenant,
  isValidEmail,
  mapRole,
  mapTenant,
  roleByIdPath,
  rolesByTenantPath,
  tenantSubTenantsPath,
} from 'components/helpers.js'
import {
  buildPermissionTreeNodes,
  collectPermissionIdsFromTree,
  fetchAllPaginatedRaw,
  filterPermissionTreeByModuleIds,
  moduleIdsFromPermissionIds,
} from 'src/utils/permission-catalog-tree.js'

const uk = userFieldKeys
const rk = roleFieldKeys

function resolveDefaultUserTenantId(mappedTenants, tenantKey) {
  const key = String(tenantKey ?? '').trim().toLowerCase()
  const ttk = tenantFieldKeys
  const list = (mappedTenants || []).filter(Boolean)
  if (key) {
    for (const tenant of list) {
      const domain = String(tenant[ttk.domain] ?? '').trim().toLowerCase()
      const name = String(tenant[ttk.name] ?? '').trim().toLowerCase()
      const schema = String(tenant[ttk.schemaName] ?? '').trim().toLowerCase()
      const idNum = Number(tenant.id)
      if (!Number.isFinite(idNum)) {
        continue
      }
      if (domain === key || name === key || schema === key) {
        return idNum
      }
    }
  }
  const first = list.find(row => Number.isFinite(Number(row.id)))

  return first ? Number(first.id) : null
}

async function fetchRoleSelectOptionById(roleId) {
  const id = Number(roleId)
  if (!Number.isFinite(id)) {
    return null
  }
  try {
    const res = await apiInstance.get(roleByIdPath(id))
    const root = res.data?.data ?? res.data
    const mapped = mapRole(root)
    if (!mapped) {
      return null
    }
    const label = String(mapped[rk.name] ?? '').trim() || String(id)

    return { label, value: id }
  } catch {
    return { label: String(id), value: id }
  }
}

async function buildRoleOptionsWithAssignments(
  apiOptions,
  assignedIds,
  knownFromUser = [],
) {
  const byId = new Map()
  for (const o of [...(apiOptions || []), ...(knownFromUser || [])]) {
    const n = Number(o?.value)
    const label = String(o?.label ?? '').trim()
    if (Number.isFinite(n) && label) {
      byId.set(n, { label, value: n })
    }
  }
  const missing = (assignedIds || [])
    .map(x => Number(x))
    .filter(id => Number.isFinite(id) && !byId.has(id))
  if (missing.length > 0) {
    const fetched = await Promise.all(
      missing.map(id => fetchRoleSelectOptionById(id)),
    )
    for (const opt of fetched) {
      if (opt) {
        byId.set(opt.value, opt)
      }
    }
  }
  const sorted = [...byId.values()]
  sorted.sort((a, b) => a.label.localeCompare(b.label))

  return sorted
}

function mergeMissingSelectOptions(options, selectedValues, labelForId) {
  const opts = [...(options || [])]
  const existing = new Set(opts.map(o => Number(o.value)))
  const ids = Array.isArray(selectedValues) ? selectedValues : []
  for (const raw of ids) {
    const id = Number(raw)
    if (!Number.isFinite(id) || existing.has(id)) {
      continue
    }
    opts.push({
      label: labelForId(id),
      value: id,
    })
    existing.add(id)
  }
  opts.sort((a, b) => String(a.label).localeCompare(String(b.label)))

  return opts
}

function mapTenantsToSelectOptions(mappedTenants) {
  const ttk = tenantFieldKeys

  return (mappedTenants || [])
    .map(row => {
      const idNum = Number(row.id)
      if (!Number.isFinite(idNum)) {
        return null
      }
      const label = String(
        row[ttk.name] ?? row[ttk.domain] ?? `#${idNum}`,
      ).trim() || String(idNum)

      return { label, value: idNum }
    })
    .filter(Boolean)
}

function mapRoleRowsToUserSelectData(roleRows, nameKey, codeToIdMap) {
  const options = []
  const permissionIdsByRoleId = new Map()
  for (const row of roleRows) {
    const mapped = mapRole(row)
    if (!mapped) {
      continue
    }
    const raw = extractRoleTemplatePermissionIds(
      { data: row },
      codeToIdMap,
    )
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

function mapSubtenantRowsToSelectOptions(rows) {
  return (rows || [])
    .map(row => {
      const idNum = Number(row?.id)
      if (!Number.isFinite(idNum)) {
        return null
      }
      const name = String(row?.name ?? '').trim()
      const code = String(row?.code ?? '').trim()
      let label = name || code || String(idNum)
      if (name && code) {
        label = `${name} (${code})`
      }

      return { label, value: idNum }
    })
    .filter(Boolean)
}

function extractSubtenantList(root) {
  if (!root) {
    return []
  }
  if (Array.isArray(root)) {
    return root
  }
  if (Array.isArray(root.items)) {
    return root.items
  }

  return []
}

function extractRoleList(root) {
  return extractSubtenantList(root)
}

function buildTenantPlanModuleIdsMap(mappedTenants) {
  const map = new Map()
  for (const tenant of mappedTenants || []) {
    const id = Number(tenant?.id)
    if (!Number.isFinite(id)) {
      continue
    }
    const moduleIds = Array.isArray(tenant.planModuleIds)
      ? tenant.planModuleIds
        .map(x => Number(x))
        .filter(Number.isFinite)
      : []
    map.set(id, moduleIds)
  }

  return map
}

function pruneFormPermissionsToAllowed(form, allowedIds) {
  const cur = form[uk.permissions]
  if (!Array.isArray(cur)) {
    return
  }
  const next = cur
    .map(x => Number(x))
    .filter(id => Number.isFinite(id) && allowedIds.has(id))
  if (next.length !== cur.length) {
    writeFormPermissions(form, next)
  }
}

function createUserAddFormCatalog() {
  return {
    rolesOptions: ref([]),
    rolesListLoading: ref(false),
    tenantSelectOptions: ref([]),
    userTenantsLoading: ref(false),
    defaultNewUserTenantId: ref(null),
    tenantPlanModuleIdsByTenantId: ref(new Map()),
    subtenantSelectOptions: ref([]),
    subtenantsLoading: ref(false),
    allPermissionTreeNodes: ref([]),
    permissionTreeNodes: ref([]),
    permissionsTreeLoading: ref(false),
    permissionCodeToId: ref(new Map()),
    knownPermissionIds: ref(new Set()),
    rolePermissionIdsByRoleId: ref(new Map()),
  }
}

function clearFormPermissions(form) {
  const cur = form[uk.permissions]
  if (Array.isArray(cur)) {
    cur.splice(0, cur.length)
  } else {
    form[uk.permissions] = []
  }
}

function writeFormPermissions(form, merged) {
  const cur = form[uk.permissions]
  if (Array.isArray(cur)) {
    cur.splice(0, cur.length, ...merged)
  } else {
    form[uk.permissions] = merged.slice()
  }
}

function clearFormSubtenantIds(form) {
  const cur = form[uk.allowedSubtenantIds]
  if (Array.isArray(cur)) {
    cur.splice(0, cur.length)
  } else {
    form[uk.allowedSubtenantIds] = []
  }
}

function clearFormRoles(form) {
  const cur = form[uk.roles]
  if (Array.isArray(cur)) {
    cur.splice(0, cur.length)
  } else {
    form[uk.roles] = []
  }
  clearFormPermissions(form)
}

function normalizeRoleIdList(roleIds) {
  return Array.isArray(roleIds)
    ? roleIds.map(x => Number(x)).filter(Number.isFinite)
    : []
}

function diffRoleIdLists(nextRoleIds, previousRoleIds) {
  const ids = normalizeRoleIdList(nextRoleIds)
  const prev = normalizeRoleIdList(previousRoleIds)
  const idSet = new Set(ids)
  const prevSet = new Set(prev)

  return {
    ids,
    added: ids.filter(rid => !prevSet.has(rid)),
    removed: prev.filter(rid => !idSet.has(rid)),
  }
}

function restoreSavedPermissionsToForm(form, savedPermissionIds, allowedIds) {
  if (!savedPermissionIds.length) {
    return
  }
  const allowed = allowedIds instanceof Set ? allowedIds : new Set()
  const restored = savedPermissionIds.filter(
    pid => !allowed.size || allowed.has(pid),
  )
  restored.sort((a, b) => a - b)
  writeFormPermissions(form, restored)
}

function formatUserFormPayload(form, editingRef, catalog) {
  const roles = intIdList(form[uk.roles])
  const permissions = intIdList(form[uk.permissions])
  const allowedSubtenantIds = intIdList(form[uk.allowedSubtenantIds])

  const tenantId = Number(form[uk.tenantId])
  const modules = Number.isFinite(tenantId)
    ? (catalog.tenantPlanModuleIdsByTenantId.value.get(tenantId) ?? [])
    : []

  const out = {
    [uk.username]: String(form[uk.username] ?? '').trim(),
    [uk.status]: Number(form[uk.status]),
    description: String(form[uk.description] ?? '').trim(),
    roles,
    permissions,
    modules,
    allowedSubtenantIds,
  }
  if (Number.isFinite(tenantId)) {
    out[uk.tenantId] = tenantId
  }
  if (!editingRef?.value) {
    out[uk.password] = String(form[uk.password] ?? '').trim()
    out.changePassword = Boolean(form[uk.changePassword])
  } else {
    delete out[uk.changePassword]
    delete out.changePassword
    delete out.change_password
  }

  return out
}

function createUserAddFormLoaders(ctx) {
  const {
    t,
    $q,
    catalog,
    editingRef,
    rolesPermissionFetchSeqRef,
    subtenantFetchSeqRef,
    rolesLoadSeqRef,
    previousRoleIdsRef,
    skipRolePermissionSyncRef,
  } = ctx

  function applyTenantPermissionFilter(tenantId, form) {
    const id = Number(tenantId)
    let moduleIds = Number.isFinite(id)
      ? [...(catalog.tenantPlanModuleIdsByTenantId.value.get(id) ?? [])]
      : []
    const isEdit = Boolean(editingRef?.value)
    if (form && isEdit) {
      const savedPerms = intIdList(form[uk.permissions])
      if (
        savedPerms.length > 0
        && catalog.allPermissionTreeNodes.value.length > 0
      ) {
        const extra = moduleIdsFromPermissionIds(
          catalog.allPermissionTreeNodes.value,
          savedPerms,
        )
        moduleIds = [...new Set([...moduleIds, ...extra])]
      }
    }
    const filtered = moduleIds.length === 0
      ? []
      : filterPermissionTreeByModuleIds(
        catalog.allPermissionTreeNodes.value,
        moduleIds,
      )
    catalog.permissionTreeNodes.value = filtered
    catalog.knownPermissionIds.value = collectPermissionIdsFromTree(filtered)
    if (form) {
      pruneFormPermissionsToAllowed(form, catalog.knownPermissionIds.value)
    }
  }

  async function loadPermissionCatalog(opts = {}) {
    const catalogLoaded =
      catalog.allPermissionTreeNodes.value.length > 0
    if (opts.force !== true && catalogLoaded) {
      return
    }
    catalog.permissionsTreeLoading.value = true
    try {
      const [moduleRows, permissionRows] = await Promise.all([
        fetchAllPaginatedRaw(apiPaths.modulesList),
        fetchAllPaginatedRaw(apiPaths.permissionsList),
      ])
      catalog.allPermissionTreeNodes.value = buildPermissionTreeNodes(
        moduleRows,
        permissionRows,
        t,
      )
      catalog.permissionTreeNodes.value = []
      catalog.permissionCodeToId.value = buildPermissionCodeToIdMap(
        permissionRows,
      )
      catalog.knownPermissionIds.value = new Set()
    } catch {
      catalog.allPermissionTreeNodes.value = []
      catalog.permissionTreeNodes.value = []
      catalog.permissionCodeToId.value = new Map()
      catalog.knownPermissionIds.value = new Set()
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('rolePermissionsLoadError'),
      })
    } finally {
      catalog.permissionsTreeLoading.value = false
    }
  }

  async function fetchRolePermissionIds(roleId) {
    const res = await apiInstance.get(roleByIdPath(roleId))

    return extractRoleTemplatePermissionIds(
      res.data,
      catalog.permissionCodeToId.value,
    )
  }

  async function resolveRolePermissionIds(roleId, seq) {
    let perms = catalog.rolePermissionIdsByRoleId.value.get(roleId)
    if (Array.isArray(perms) && perms.length > 0) {
      return { perms, stale: false }
    }
    try {
      perms = await fetchRolePermissionIds(roleId)
    } catch {
      if (seq === rolesPermissionFetchSeqRef.current) {
        $q.notify({
          type: quasarNotifyTypes.warning,
          message: t('roleTemplatePermissionsLoadError'),
        })
      }

      return { perms: [], stale: false }
    }
    if (seq !== rolesPermissionFetchSeqRef.current) {
      return { perms: [], stale: true }
    }
    catalog.rolePermissionIdsByRoleId.value.set(roleId, perms)

    return { perms, stale: false }
  }

  async function syncPermissionsForRoleDelta(form, added, removed, seq) {
    const current = new Set(
      intIdList(form[uk.permissions])
        .map(x => Number(x))
        .filter(Number.isFinite),
    )
    for (const rid of removed) {
      const { perms, stale } = await resolveRolePermissionIds(rid, seq)
      if (stale) {
        return null
      }
      for (const p of perms) {
        const n = Number(p)
        if (Number.isFinite(n)) {
          current.delete(n)
        }
      }
    }
    for (const rid of added) {
      const { perms, stale } = await resolveRolePermissionIds(rid, seq)
      if (stale) {
        return null
      }
      for (const p of perms) {
        const n = Number(p)
        if (Number.isFinite(n)) {
          current.add(n)
        }
      }
    }

    return current
  }

  async function afterRolesSelected(form, roleIds) {
    if (skipRolePermissionSyncRef.current) {
      return
    }
    const { ids, added, removed } = diffRoleIdLists(
      roleIds,
      previousRoleIdsRef.value,
    )
    if (added.length === 0 && removed.length === 0) {
      return
    }
    const seq = ++rolesPermissionFetchSeqRef.current
    const current = await syncPermissionsForRoleDelta(form, added, removed, seq)
    if (!current) {
      return
    }
    previousRoleIdsRef.value = ids.slice()
    const allowed = catalog.knownPermissionIds.value
    const merged = [...current]
      .filter(pid => !allowed.size || allowed.has(pid))
      .sort((a, b) => a - b)
    writeFormPermissions(form, merged)
    await nextTick()
  }

  async function loadUserTenantOptions() {
    catalog.userTenantsLoading.value = true
    try {
      const tenantRawRows = await fetchAllPaginatedRaw(
        apiPaths.tenantsList,
        { active: true },
      )
      const allMapped = tenantRawRows.map(mapTenant).filter(Boolean)
      const editTenantId = Number(editingRef?.value?.[uk.tenantId])
      const forSelect = allMapped.filter(t => {
        if (!isMainTenant(t)) {
          return true
        }

        return Number.isFinite(editTenantId) && Number(t.id) === editTenantId
      })
      catalog.tenantSelectOptions.value = mapTenantsToSelectOptions(forSelect)
      catalog.tenantPlanModuleIdsByTenantId.value =
        buildTenantPlanModuleIdsMap(allMapped)
      catalog.defaultNewUserTenantId.value =
        resolveDefaultUserTenantId(forSelect, '')
    } catch {
      catalog.tenantSelectOptions.value = []
      catalog.tenantPlanModuleIdsByTenantId.value = new Map()
      catalog.defaultNewUserTenantId.value = null
      $q.notify({
        type: quasarNotifyTypes.warning,
        message: t('tenantListError'),
      })
    } finally {
      catalog.userTenantsLoading.value = false
    }
  }

  async function loadSubtenantsForTenant(tenantId) {
    const id = Number(tenantId)
    if (!Number.isFinite(id)) {
      catalog.subtenantSelectOptions.value = []

      return
    }
    const seq = ++subtenantFetchSeqRef.current
    catalog.subtenantsLoading.value = true
    try {
      const res = await apiInstance.get(tenantSubTenantsPath(id))
      const list = extractSubtenantList(res.data?.data)
      if (seq !== subtenantFetchSeqRef.current) {
        return
      }
      const editSubs = editingRef?.value?.[uk.allowedSubtenantIds]
      const preserveSubs = Array.isArray(editSubs) ? editSubs : []
      catalog.subtenantSelectOptions.value = mergeMissingSelectOptions(
        mapSubtenantRowsToSelectOptions(list),
        preserveSubs,
        id => `${t('userAllowedSubTenants')} #${id}`,
      )
    } catch {
      if (seq !== subtenantFetchSeqRef.current) {
        return
      }
      catalog.subtenantSelectOptions.value = []
      $q.notify({
        type: quasarNotifyTypes.warning,
        message: t('userSubtenantsLoadError'),
      })
    } finally {
      if (seq === subtenantFetchSeqRef.current) {
        catalog.subtenantsLoading.value = false
      }
    }
  }

  async function loadRolesForTenant(tenantId) {
    const id = Number(tenantId)
    if (!Number.isFinite(id)) {
      catalog.rolesOptions.value = []
      catalog.rolePermissionIdsByRoleId.value = new Map()

      return
    }
    const seq = ++rolesLoadSeqRef.current
    catalog.rolesListLoading.value = true
    try {
      const res = await apiInstance.get(rolesByTenantPath(id))
      const roleRows = extractRoleList(res.data?.data)
      if (seq !== rolesLoadSeqRef.current) {
        return
      }
      const { options, permissionIdsByRoleId } = mapRoleRowsToUserSelectData(
        roleRows,
        rk.name,
        catalog.permissionCodeToId.value,
      )
      const editRow = editingRef?.value
      const preserveRoles = Array.isArray(editRow?.[uk.roles])
        ? editRow[uk.roles]
        : []
      const knownRoleOpts = Array.isArray(editRow?.roleSelectOptions)
        ? editRow.roleSelectOptions
        : []
      catalog.rolesOptions.value = await buildRoleOptionsWithAssignments(
        options,
        preserveRoles,
        knownRoleOpts,
      )
      catalog.rolePermissionIdsByRoleId.value = permissionIdsByRoleId
    } catch {
      if (seq !== rolesLoadSeqRef.current) {
        return
      }
      catalog.rolesOptions.value = []
      catalog.rolePermissionIdsByRoleId.value = new Map()
      $q.notify({
        type: quasarNotifyTypes.warning,
        message: t('userRolesPermissionsLoadError'),
      })
    } finally {
      if (seq === rolesLoadSeqRef.current) {
        catalog.rolesListLoading.value = false
      }
    }
  }

  async function afterTenantSelected(form, tenantId) {
    clearFormSubtenantIds(form)
    clearFormRoles(form)
    applyTenantPermissionFilter(tenantId, form)
    await loadSubtenantsForTenant(tenantId)
    await loadRolesForTenant(tenantId)
    await nextTick()
  }

  async function onDialogOpen() {
    rolesLoadSeqRef.current += 1
    previousRoleIdsRef.value = []
    catalog.rolePermissionIdsByRoleId.value = new Map()
    catalog.rolesOptions.value = []
    catalog.subtenantSelectOptions.value = []
    await loadPermissionCatalog()
    await loadUserTenantOptions()
    const editRow = editingRef?.value
    const tenantToLoad =
      editRow?.[uk.tenantId] ?? catalog.defaultNewUserTenantId.value
    if (Number.isFinite(Number(tenantToLoad))) {
      applyTenantPermissionFilter(Number(tenantToLoad))
      await loadSubtenantsForTenant(Number(tenantToLoad))
      await loadRolesForTenant(Number(tenantToLoad))
    } else {
      catalog.permissionTreeNodes.value = []
      catalog.knownPermissionIds.value = new Set()
    }
  }

  async function onDialogReady(form) {
    const tenantId = Number(form?.[uk.tenantId])
    if (!Number.isFinite(tenantId)) {
      return
    }
    skipRolePermissionSyncRef.current = true
    try {
      const editRow = editingRef?.value
      const isEdit = Boolean(editRow)
      const savedRoleIds = intIdList(form[uk.roles])
      const savedSubtenantIds = intIdList(form[uk.allowedSubtenantIds])
      const savedPermissionIds = intIdList(form[uk.permissions])
      applyTenantPermissionFilter(tenantId, form)
      const knownRoleOpts = Array.isArray(editRow?.roleSelectOptions)
        ? editRow.roleSelectOptions
        : []
      catalog.rolesOptions.value = await buildRoleOptionsWithAssignments(
        catalog.rolesOptions.value,
        savedRoleIds,
        knownRoleOpts,
      )
      if (savedRoleIds.length > 0) {
        form[uk.roles] = savedRoleIds
      }
      const knownSubOpts = Array.isArray(editRow?.subtenantSelectOptions)
        ? editRow.subtenantSelectOptions
        : []
      catalog.subtenantSelectOptions.value = mergeMissingSelectOptions(
        knownSubOpts.concat(catalog.subtenantSelectOptions.value),
        savedSubtenantIds,
        id => `${t('userAllowedSubTenants')} #${id}`,
      )
      if (savedSubtenantIds.length > 0) {
        form[uk.allowedSubtenantIds] = savedSubtenantIds
      }
      if (isEdit) {
        previousRoleIdsRef.value = savedRoleIds.slice()
        restoreSavedPermissionsToForm(
          form,
          savedPermissionIds,
          catalog.knownPermissionIds.value,
        )
      } else if (savedRoleIds.length > 0) {
        previousRoleIdsRef.value = []
        skipRolePermissionSyncRef.current = false
        await afterRolesSelected(form, savedRoleIds)
        skipRolePermissionSyncRef.current = true
        form[uk.roles] = savedRoleIds
      } else {
        previousRoleIdsRef.value = []
      }
      await nextTick()
    } finally {
      skipRolePermissionSyncRef.current = false
    }
  }

  return {
    loadPermissionCatalog,
    afterRolesSelected,
    afterTenantSelected,
    onDialogOpen,
    onDialogReady,
  }
}

function createUserAddFormFields(ctx) {
  const { t, catalog, editingRef, loaders } = ctx

  return computed(() => {
    const selectRequiredRule = val =>
      (val === 0 || val === 1 || val === '0' || val === '1')
      || t('fieldRequired')
    const emailRule = val => {
      const v = String(val ?? '').trim()
      if (!v) {
        return t('fieldRequired')
      }
      return isValidEmail(v) || t('invalidEmail')
    }
    const isEdit = Boolean(editingRef?.value)
    const passwordRule = val =>
      (!!val && String(val).trim().length > 0) || t('fieldRequired')
    const rolesRule = val =>
      (Array.isArray(val) && val.length > 0) || t('fieldRequired')
    const tenantSelectRule = val =>
      (val != null && val !== '' && Number.isFinite(Number(val)))
      || t('fieldRequired')

    const identityFields = [
      {
        key: uk.username,
        kind: fieldTypes.input,
        labelKey: 'email',
        inputType: htmlInputTypes.email,
        inputName: 'fice-user-register-username',
        autocomplete: htmlAutocomplete.off,
        lazyRules: false,
        rules: [emailRule],
      },
    ]
    const passwordField = {
      key: uk.password,
      kind: fieldTypes.input,
      labelKey: 'password',
      inputType: htmlInputTypes.password,
      inputName: 'fice-user-register-password',
      autocomplete: htmlAutocomplete.newPassword,
      rules: [passwordRule],
    }
    const tenantField = {
      key: uk.tenantId,
      kind: fieldTypes.select,
      labelKey: 'tenants',
      rules: [tenantSelectRule],
      options: () => catalog.tenantSelectOptions.value,
      optionLabel: qSelectOptionKeys.label,
      optionValue: qSelectOptionKeys.value,
      loading: catalog.userTenantsLoading,
      selectBehavior: selectBehaviors.menu,
      afterModelUpdate: loaders.afterTenantSelected,
    }
    const subtenantField = {
      key: uk.allowedSubtenantIds,
      kind: fieldTypes.select,
      labelKey: 'userAllowedSubTenants',
      multiple: true,
      defaultValue: [],
      rules: [rolesRule],
      options: () => catalog.subtenantSelectOptions.value,
      optionLabel: qSelectOptionKeys.label,
      optionValue: qSelectOptionKeys.value,
      loading: catalog.subtenantsLoading,
      selectBehavior: selectBehaviors.menu,
      disable: form => !Number.isFinite(Number(form[uk.tenantId])),
    }
    const statusField = {
      key: uk.status,
      kind: fieldTypes.select,
      labelKey: 'status',
      selectBehavior: selectBehaviors.menu,
      rules: [selectRequiredRule],
      defaultValue: userFormDefaults.statusActive,
      alwaysShow: true,
      options: () => [
        { label: t('tenantStatusActive'), value: 1 },
        { label: t('tenantStatusInactive'), value: 0 },
      ],
    }
    const baseFields = [
      ...identityFields,
      ...(isEdit ? [] : [passwordField]),
      tenantField,
      subtenantField,
      statusField,
    ]

    return [
      ...baseFields,
      {
        key: uk.roles,
        kind: fieldTypes.select,
        labelKey: 'roles',
        selectBehavior: selectBehaviors.menu,
        multiple: true,
        defaultValue: [],
        rules: [rolesRule],
        options: () => catalog.rolesOptions.value,
        loading: catalog.rolesListLoading,
        disable: form => !Number.isFinite(Number(form[uk.tenantId])),
        afterModelUpdate: loaders.afterRolesSelected,
      },
      {
        key: uk.permissions,
        kind: fieldTypes.permissionTree,
        labelKey: 'permissions',
        defaultValue: [],
        treeNodes: () => catalog.permissionTreeNodes.value,
        loading: catalog.permissionsTreeLoading,
        treeNoNodesLabelKey: 'permissionTreeEmpty',
        disable: form => !Number.isFinite(Number(form[uk.tenantId])),
      },
      ...(isEdit
        ? []
        : [{
          key: uk.changePassword,
          kind: fieldTypes.checkbox,
          labelKey: 'userRequirePasswordChange',
          defaultValue: true,
          alwaysShow: true,
        }]),
      {
        key: uk.description,
        kind: fieldTypes.textarea,
        labelKey: 'description',
        rows: 4,
        autogrow: false,
      },
    ]
  })
}

export function useUserAddForm(editingRef) {
  const { t } = useI18n()
  const $q = useQuasar()
  const catalog = createUserAddFormCatalog()
  const rolesPermissionFetchSeqRef = { current: 0 }
  const subtenantFetchSeqRef = { current: 0 }
  const rolesLoadSeqRef = { current: 0 }
  const previousRoleIdsRef = ref([])
  const skipRolePermissionSyncRef = { current: false }
  const loaders = createUserAddFormLoaders({
    t,
    $q,
    catalog,
    editingRef,
    rolesPermissionFetchSeqRef,
    subtenantFetchSeqRef,
    rolesLoadSeqRef,
    previousRoleIdsRef,
    skipRolePermissionSyncRef,
  })
  const fields = createUserAddFormFields({ t, catalog, editingRef, loaders })

  return {
    fields,
    formatUserPayload: form => formatUserFormPayload(form, editingRef, catalog),
    onDialogOpen: loaders.onDialogOpen,
    onDialogReady: loaders.onDialogReady,
    defaultNewUserTenantId: catalog.defaultNewUserTenantId,
  }
}
