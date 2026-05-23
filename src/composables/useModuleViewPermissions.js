import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { apiPaths, quasarNotifyTypes } from 'components/constants.js'
import { fetchAllPaginatedRaw } from 'src/utils/permission-catalog-tree.js'

function permissionRowModuleId(row) {
  const raw = row.module_id ?? row.moduleId ?? row.module?.id
  if (raw == null || raw === '') {
    return null
  }
  const n = Number(raw)

  return Number.isFinite(n) ? n : null
}

function mapPermissionListItem(row) {
  const id = Number(row.id ?? row.permission_id ?? row.permissionId)
  if (!Number.isFinite(id)) {
    return null
  }
  const label = String(
    row.name ?? row.title ?? row.display_name ?? row.code ?? id,
  ).trim()
  const description = String(row.description ?? '').trim()

  return {
    id,
    label: label || String(id),
    description,
  }
}

export function useModuleViewPermissions() {
  const { t } = useI18n()
  const $q = useQuasar()

  const allPermissionRows = ref([])
  const modulePermissionItems = ref([])
  const modulePermissionsLoading = ref(false)

  async function loadPermissionsCatalog(opts = {}) {
    if (opts.force !== true && allPermissionRows.value.length > 0) {
      return
    }
    modulePermissionsLoading.value = true
    try {
      allPermissionRows.value = await fetchAllPaginatedRaw(
        apiPaths.permissionsList,
      )
    } catch {
      allPermissionRows.value = []
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('rolePermissionsLoadError'),
      })
    } finally {
      modulePermissionsLoading.value = false
    }
  }

  function applyModulePermissions(moduleId) {
    const id = Number(moduleId)
    if (!Number.isFinite(id)) {
      modulePermissionItems.value = []

      return
    }
    const items = []
    for (const row of allPermissionRows.value) {
      if (permissionRowModuleId(row) !== id) {
        continue
      }
      const item = mapPermissionListItem(row)
      if (item) {
        items.push(item)
      }
    }
    items.sort((a, b) => a.label.localeCompare(b.label))
    modulePermissionItems.value = items
  }

  function resetModulePermissions() {
    modulePermissionItems.value = []
  }

  return {
    loadPermissionsCatalog,
    applyModulePermissions,
    resetModulePermissions,
    modulePermissionItems,
    modulePermissionsLoading,
  }
}
