import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { apiInstance } from 'boot/axios'
import {
  apiPaths,
  fieldTypes,
  htmlAutocomplete,
  htmlInputTypes,
  quasarNotifyTypes,
  selectBehaviors,
  roleFieldKeys,
  userFieldKeys,
  userFormDefaults,
} from 'components/constants.js'
import {
  buildPermissionCodeToIdMap,
  extractRoleTemplatePermissionIds,
  mapRole,
  roleByIdPath,
} from 'components/helpers.js'
import {
  buildPermissionTreeNodes,
  fetchAllPaginatedRaw,
} from 'src/utils/permission-catalog-tree.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function useUserAddForm(editingRef) {
  const { t } = useI18n()
  const $q = useQuasar()
  const uk = userFieldKeys
  const rk = roleFieldKeys

  const rolesOptions = ref([])
  const rolesListLoading = ref(false)
  const permissionTreeNodes = ref([])
  const permissionsTreeLoading = ref(false)
  const permissionCodeToId = ref(new Map())
  const knownPermissionIds = ref(new Set())
  const rolePermissionIdsByRoleId = ref(new Map())
  let rolesPermissionFetchSeq = 0

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
      permissionCodeToId.value = buildPermissionCodeToIdMap(permissionRows)
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
    } catch {
      permissionTreeNodes.value = []
      permissionCodeToId.value = new Map()
      knownPermissionIds.value = new Set()
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('rolePermissionsLoadError'),
      })
    } finally {
      permissionsTreeLoading.value = false
    }
  }

  async function fetchRolePermissionIds(roleId) {
    const res = await apiInstance.get(roleByIdPath(roleId))

    return extractRoleTemplatePermissionIds(
      res.data,
      permissionCodeToId.value,
    )
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

  async function resolveRolePermissionIds(roleId, seq) {
    let perms = rolePermissionIdsByRoleId.value.get(roleId)
    if (Array.isArray(perms) && perms.length > 0) {
      return { perms, stale: false }
    }
    try {
      perms = await fetchRolePermissionIds(roleId)
    } catch {
      if (seq === rolesPermissionFetchSeq) {
        $q.notify({
          type: quasarNotifyTypes.warning,
          message: t('roleTemplatePermissionsLoadError'),
        })
      }

      return { perms: [], stale: false }
    }
    if (seq !== rolesPermissionFetchSeq) {
      return { perms: [], stale: true }
    }
    rolePermissionIdsByRoleId.value.set(roleId, perms)

    return { perms, stale: false }
  }

  async function afterRolesSelected(form, roleIds) {
    const ids = Array.isArray(roleIds)
      ? roleIds.map(x => Number(x)).filter(Number.isFinite)
      : []
    const seq = ++rolesPermissionFetchSeq

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

    const allowed = knownPermissionIds.value
    const merged = [...aggregated].filter(
      pid => !allowed.size || allowed.has(pid),
    )
    merged.sort((a, b) => a - b)
    writeFormPermissions(form, merged)
    await nextTick()
  }

  async function onDialogOpen() {
    rolePermissionIdsByRoleId.value = new Map()
    await loadPermissionCatalog()

    rolesListLoading.value = true
    try {
      const roleRows = await fetchAllPaginatedRaw(apiPaths.rolesList)
      const options = []
      const permissionIdsByRoleId = new Map()
      for (const row of roleRows) {
        const mapped = mapRole(row)
        if (!mapped) {
          continue
        }
        const raw = extractRoleTemplatePermissionIds(
          { data: row },
          permissionCodeToId.value,
        )
        permissionIdsByRoleId.set(mapped.id, raw)
        const labelBase = String(
          mapped[rk.name] ?? mapped.id ?? '',
        ).trim()
        options.push({
          label: labelBase || String(mapped.id),
          value: mapped.id,
        })
      }
      options.sort((a, b) => a.label.localeCompare(b.label))
      rolesOptions.value = options
      rolePermissionIdsByRoleId.value = permissionIdsByRoleId
    } catch {
      rolesOptions.value = []
      rolePermissionIdsByRoleId.value = new Map()
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('userRolesPermissionsLoadError'),
      })
    } finally {
      rolesListLoading.value = false
    }
  }

  const fields = computed(() => {
    const requiredRule = val =>
      (!!val && String(val).trim().length > 0) || t('fieldRequired')
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

    const identityFields = [
      {
        key: uk.username,
        kind: fieldTypes.input,
        labelKey: uk.username,
        inputName: 'fice-user-register-username',
        autocomplete: htmlAutocomplete.off,
        rules: [requiredRule],
      },
      {
        key: uk.email,
        kind: fieldTypes.input,
        labelKey: 'email',
        inputType: htmlInputTypes.email,
        inputName: 'fice-user-register-email',
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
      ? [...identityFields, statusField]
      : [...identityFields, passwordField, statusField]

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
        options: () => rolesOptions.value,
        loading: rolesListLoading,
        afterModelUpdate: afterRolesSelected,
      },
      {
        key: uk.permissions,
        kind: fieldTypes.permissionTree,
        labelKey: 'permissions',
        defaultValue: [],
        treeNodes: () => permissionTreeNodes.value,
        loading: permissionsTreeLoading,
        treeNoNodesLabelKey: 'permissionTreeEmpty',
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

  function formatUserPayload(form) {
    const roles = Array.isArray(form[uk.roles])
      ? form[uk.roles]
        .map(x => Number(x))
        .filter(Number.isFinite)
      : []
    const permissions = Array.isArray(form[uk.permissions])
      ? form[uk.permissions]
        .map(x => Number(x))
        .filter(Number.isFinite)
      : []

    const out = {
      [uk.username]: String(form[uk.username] ?? '').trim(),
      [uk.email]: String(form[uk.email] ?? '').trim(),
      [uk.status]: Number(form[uk.status]),
      description: String(form[uk.description] ?? '').trim(),
      changePassword: Boolean(form[uk.changePassword]),
      roles,
      permissions,
      modules: [],
      allowedSubtenantIds: [],
    }
    if (!editingRef?.value) {
      out[uk.password] = String(form[uk.password] ?? '').trim()
    }

    return out
  }

  return {
    fields,
    formatUserPayload,
    onDialogOpen,
  }
}
