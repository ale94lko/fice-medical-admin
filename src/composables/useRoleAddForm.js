import { computed, nextTick, ref, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { apiInstance } from 'boot/axios'
import {
  apiPaths,
  defaultTenant,
  fieldTypes,
  htmlInputTypes,
  qSelectOptionKeys,
  quasarNotifyTypes,
  inputNormalizeKeys,
  roleFieldKeys,
  selectBehaviors,
  tenantFieldKeys,
} from 'components/constants.js'
import {
  buildPermissionCodeToIdMap,
  buildRoleCreateBody,
  buildRoleUpdateBody,
  extractRoleTemplatePermissionIds,
  mapRole,
  mapTenant,
  roleByIdPath,
} from 'components/helpers.js'
import {
  buildPermissionTreeNodes,
  fetchAllPaginatedRaw,
} from 'src/utils/permission-catalog-tree.js'

function resolveDefaultRoleTenantId(mappedTenants, tenantKey) {
  const key = String(tenantKey ?? '').trim().toLowerCase()
  const ttk = tenantFieldKeys
  const list = (mappedTenants || []).filter(Boolean)
  if (key) {
    for (const t of list) {
      const domain = String(t[ttk.domain] ?? '').trim().toLowerCase()
      const name = String(t[ttk.name] ?? '').trim().toLowerCase()
      const schema = String(t[ttk.schemaName] ?? '').trim().toLowerCase()
      const idNum = Number(t.id)
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

export function useRoleAddForm(editingRoleRef) {
  const { t } = useI18n()
  const $q = useQuasar()
  const rk = roleFieldKeys

  const isEditMode = computed(() => {
    const row = unref(editingRoleRef)
    const id = row?.id ?? row?.role_id

    return id != null && id !== '' && Number.isFinite(Number(id))
  })

  const permissionTreeNodes = ref([])
  const permissionsTreeLoading = ref(false)
  const knownPermissionIds = ref(new Set())
  const permissionCodeToId = ref(new Map())
  const roleTemplateOptions = ref([])
  const templatePermissionIdsByRoleId = ref(new Map())
  const templateRoleApplyLoading = ref(false)
  const tenantSelectOptions = ref([])
  const roleTenantsLoading = ref(false)
  const defaultNewRoleTenantId = ref(null)
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
          .map(row => {
            const id = Number(
              row.id ?? row.permission_id ?? row.permissionId,
            )

            return Number.isFinite(id) ? id : null
          })
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

    if (isEditMode.value) {
      tenantSelectOptions.value = []
      defaultNewRoleTenantId.value = null
      roleTemplateOptions.value = []
      templatePermissionIdsByRoleId.value = new Map()

      return
    }

    roleTenantsLoading.value = true
    try {
      const tenantRawRows = await fetchAllPaginatedRaw(
        apiPaths.tenantsList,
        { active: true },
      )
      const ttk = tenantFieldKeys
      const mapped = tenantRawRows.map(mapTenant).filter(Boolean)
      tenantSelectOptions.value = mapped
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
      defaultNewRoleTenantId.value = resolveDefaultRoleTenantId(
        mapped,
        defaultTenant,
      )
    } catch {
      tenantSelectOptions.value = []
      defaultNewRoleTenantId.value = null
      $q.notify({
        type: quasarNotifyTypes.warning,
        message: t('tenantListError'),
      })
    } finally {
      roleTenantsLoading.value = false
    }

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

  const tenantSelectRule = val =>
    (val != null && val !== '' && Number.isFinite(Number(val)))
    || t('fieldRequired')

  const fields = computed(() => {
    const requiredRule = val =>
      (!!val && String(val).trim().length > 0) || t('fieldRequired')

    const nameField = {
      key: rk.name,
      kind: fieldTypes.input,
      labelKey: rk.name,
      inputType: htmlInputTypes.text,
      rules: [requiredRule],
    }
    if (!isEditMode.value) {
      nameField.inputNormalizeKey = inputNormalizeKeys.roleName
    }

    const baseFields = [
      nameField,
      {
        key: rk.tenantId,
        kind: fieldTypes.select,
        labelKey: 'tenants',
        rules: [tenantSelectRule],
        options: () => tenantSelectOptions.value,
        optionLabel: qSelectOptionKeys.label,
        optionValue: qSelectOptionKeys.value,
        loading: roleTenantsLoading,
        selectBehavior: selectBehaviors.menu,
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

    if (isEditMode.value) {
      return baseFields.filter(
        f => f.key !== rk.tenantId && f.key !== rk.templateRoleId,
      )
    }

    return baseFields
  })

  function formatRolePayload(form) {
    const row = unref(editingRoleRef)
    const id = row?.id ?? row?.role_id
    if (id != null && id !== '' && Number.isFinite(Number(id))) {
      return buildRoleUpdateBody(form, Number(id))
    }

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
    defaultNewRoleTenantId,
  }
}
