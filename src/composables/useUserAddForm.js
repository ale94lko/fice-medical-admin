import { computed, ref, unref } from 'vue'
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
  userFieldKeys,
  userFormDefaults,
} from 'components/constants.js'
import {
  extractTenantList,
  extractTenantListPagination,
} from 'components/helpers.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const USER_EDITABLE_KEYS_ON_EDIT = [
  userFieldKeys.username,
  userFieldKeys.email,
  userFieldKeys.status,
  userFieldKeys.password,
]

function mapRowToSelectOption(row) {
  const id = Number(
    row.id ?? row.role_id ?? row.permission_id ?? row.permissionId,
  )
  const label = String(
    row.name ?? row.title ?? row.display_name ?? row.code ?? id,
  ).trim()

  return { label, value: id }
}

async function fetchAllPaginatedItems(path) {
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

  return combined
    .map(mapRowToSelectOption)
    .filter(o => Number.isFinite(o.value))
}

export function useUserAddForm(editingRef) {
  const { t } = useI18n()
  const $q = useQuasar()
  const uk = userFieldKeys

  const rolesOptions = ref([])
  const permissionsOptions = ref([])
  const rolesListLoading = ref(false)
  const permissionsListLoading = ref(false)

  async function onDialogOpen() {
    if (unref(editingRef)) {
      return
    }
    rolesListLoading.value = true
    permissionsListLoading.value = true
    try {
      const [roles, permissions] = await Promise.all([
        fetchAllPaginatedItems(apiPaths.rolesList),
        fetchAllPaginatedItems(apiPaths.permissionsList),
      ])
      rolesOptions.value = roles
      permissionsOptions.value = permissions
    } catch {
      rolesOptions.value = []
      permissionsOptions.value = []
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('userRolesPermissionsLoadError'),
      })
    } finally {
      rolesListLoading.value = false
      permissionsListLoading.value = false
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
    const passwordRule = val => {
      if (isEdit) {
        return true
      }
      return (!!val && String(val).trim().length > 0) || t('fieldRequired')
    }
    const rolesRule = val =>
      (Array.isArray(val) && val.length > 0) || t('fieldRequired')

    const baseFields = [
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
      {
        key: uk.password,
        kind: fieldTypes.input,
        labelKey: 'password',
        inputType: htmlInputTypes.password,
        inputName: 'fice-user-register-password',
        autocomplete: htmlAutocomplete.newPassword,
        hintKey: isEdit ? 'userPasswordLeaveBlankHint' : undefined,
        rules: [passwordRule],
      },
      {
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
      },
    ]

    if (isEdit) {
      return baseFields
    }

    return [
      ...baseFields,
      {
        key: uk.roles,
        kind: fieldTypes.select,
        labelKey: 'roles',
        selectBehavior: selectBehaviors.menu,
        multiple: true,
        useInput: true,
        defaultValue: [],
        rules: [rolesRule],
        options: () => rolesOptions.value,
        loading: rolesListLoading,
      },
      {
        key: uk.permissions,
        kind: fieldTypes.select,
        labelKey: 'permissions',
        selectBehavior: selectBehaviors.menu,
        multiple: true,
        useInput: true,
        defaultValue: [],
        options: () => permissionsOptions.value,
        loading: permissionsListLoading,
      },
      {
        key: uk.changePassword,
        kind: fieldTypes.checkbox,
        labelKey: 'userRequirePasswordChange',
        defaultValue: true,
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

    return {
      [uk.username]: String(form[uk.username] ?? '').trim(),
      [uk.email]: String(form[uk.email] ?? '').trim(),
      [uk.password]: String(form[uk.password] ?? '').trim(),
      [uk.status]: Number(form[uk.status]),
      description: String(form[uk.description] ?? '').trim(),
      changePassword: Boolean(form[uk.changePassword]),
      roles,
      permissions,
      modules: [],
      allowedSubtenantIds: [],
    }
  }

  function formatUserUpdatePayload(form) {
    const out = {
      [uk.username]: String(form[uk.username] ?? '').trim(),
      [uk.email]: String(form[uk.email] ?? '').trim(),
      [uk.status]: Number(form[uk.status]),
    }
    const pw = String(form[uk.password] ?? '').trim()
    if (pw.length > 0) {
      out[uk.password] = pw
    }

    return out
  }

  return {
    fields,
    formatUserPayload,
    formatUserUpdatePayload,
    onDialogOpen,
  }
}
