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
  isMainTenant,
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
} from 'src/utils/permission-catalog-tree.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
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

function formatUserFormPayload(form, editingRef) {
  const roles = Array.isArray(form[uk.roles])
    ? form[uk.roles].map(x => Number(x)).filter(Number.isFinite)
    : []
  const permissions = Array.isArray(form[uk.permissions])
    ? form[uk.permissions].map(x => Number(x)).filter(Number.isFinite)
    : []
  const allowedSubtenantIds = Array.isArray(form[uk.allowedSubtenantIds])
    ? form[uk.allowedSubtenantIds].map(x => Number(x)).filter(Number.isFinite)
    : []

  const tenantId = Number(form[uk.tenantId])

  const out = {
    [uk.username]: String(form[uk.username] ?? '').trim(),
    [uk.status]: Number(form[uk.status]),
    description: String(form[uk.description] ?? '').trim(),
    changePassword: Boolean(form[uk.changePassword]),
    roles,
    permissions,
    modules: [],
    allowedSubtenantIds,
  }
  if (Number.isFinite(tenantId)) {
    out[uk.tenantId] = tenantId
  }
  if (!editingRef?.value) {
    out[uk.password] = String(form[uk.password] ?? '').trim()
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
  } = ctx

  function applyTenantPermissionFilter(tenantId, form) {
    const id = Number(tenantId)
    const moduleIds = Number.isFinite(id)
      ? catalog.tenantPlanModuleIdsByTenantId.value.get(id) ?? []
      : []
    const filtered = filterPermissionTreeByModuleIds(
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

  async function afterRolesSelected(form, roleIds) {
    const ids = Array.isArray(roleIds)
      ? roleIds.map(x => Number(x)).filter(Number.isFinite)
      : []
    const seq = ++rolesPermissionFetchSeqRef.current

    if (ids.length === 0) {
      clearFormPermissions(form)
      await nextTick()

      return
    }

    const aggregated = new Set()
    for (const rid of ids) {
      const { perms, stale } = await resolveRolePermissionIds(rid, seq)
      if (stale) {
        return
      }
      for (const p of perms) {
        const n = Number(p)
        if (Number.isFinite(n)) {
          aggregated.add(n)
        }
      }
    }

    const allowed = catalog.knownPermissionIds.value
    const merged = [...aggregated].filter(
      pid => !allowed.size || allowed.has(pid),
    )
    merged.sort((a, b) => a - b)
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
      const mapped = tenantRawRows
        .map(mapTenant)
        .filter(Boolean)
        .filter(t => !isMainTenant(t))
      catalog.tenantSelectOptions.value = mapTenantsToSelectOptions(mapped)
      catalog.tenantPlanModuleIdsByTenantId.value =
        buildTenantPlanModuleIdsMap(mapped)
      catalog.defaultNewUserTenantId.value =
        resolveDefaultUserTenantId(mapped, '')
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
      catalog.subtenantSelectOptions.value = mapSubtenantRowsToSelectOptions(
        list,
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
      catalog.rolesOptions.value = options
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

  function onDialogReady(form) {
    const tenantId = form?.[uk.tenantId]
    if (Number.isFinite(Number(tenantId))) {
      applyTenantPermissionFilter(Number(tenantId), form)
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
      return EMAIL_RE.test(v) || t('invalidEmail')
    }
    const isEdit = Boolean(editingRef?.value)
    const passwordRule = val =>
      (!!val && String(val).trim().length > 0) || t('fieldRequired')
    const rolesRule = val =>
      (Array.isArray(val) && val.length > 0) || t('fieldRequired')
    const tenantSelectRule = val =>
      (val != null && val !== '' && Number.isFinite(Number(val)))
      || t('fieldRequired')
    const optionalSelectSpacerRule = () => true

    const identityFields = [
      {
        key: uk.username,
        kind: fieldTypes.input,
        labelKey: 'email',
        inputType: htmlInputTypes.email,
        inputName: 'fice-user-register-username',
        autocomplete: htmlAutocomplete.off,
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
      clearable: true,
      defaultValue: [],
      rules: [optionalSelectSpacerRule],
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
    const baseFields = isEdit
      ? [...identityFields, statusField, tenantField, subtenantField]
      : [
        ...identityFields,
        passwordField,
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
      {
        key: uk.changePassword,
        kind: fieldTypes.checkbox,
        labelKey: 'userRequirePasswordChange',
        defaultValue: !isEdit,
        alwaysShow: true,
      },
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
  const loaders = createUserAddFormLoaders({
    t,
    $q,
    catalog,
    editingRef,
    rolesPermissionFetchSeqRef,
    subtenantFetchSeqRef,
    rolesLoadSeqRef,
  })
  const fields = createUserAddFormFields({ t, catalog, editingRef, loaders })

  return {
    fields,
    formatUserPayload: form => formatUserFormPayload(form, editingRef),
    onDialogOpen: loaders.onDialogOpen,
    onDialogReady: loaders.onDialogReady,
    defaultNewUserTenantId: catalog.defaultNewUserTenantId,
  }
}
