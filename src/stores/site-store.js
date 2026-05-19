import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'
import {
  apiPaths,
  tenantFieldKeys,
  userFieldKeys,
} from 'components/constants.js'
import {
  buildTenantRequestBody,
  buildUserChangePasswordBody,
  buildUserRegisterBody,
  buildUserUpdateBody,
  coerceTenantMutationRoot,
  coerceUserMutationRoot,
  extractPlansList,
  buildPermissionUpdateBody,
  enrichPermissionsModuleNames,
  extractTenantList,
  extractTenantListPagination,
  extractTenantMutationResponse,
  extractUserMutationResponse,
  fetchAllEnvelopeList,
  mapPermission,
  mapPlanRow,
  mapRole,
  mapTenant,
  mapUser,
  mergeTenantWithPayload,
  mergeUserWithPayload,
  roleByIdPath,
  tenantByIdPath,
  userByIdPath,
} from 'components/helpers.js'

export const useSiteStore = defineStore('site', {
  state: () => ({
    tenantList: [],
    tenantListPagination: null,
    tenantListQuery: { page: 1, limit: 20 },
    userList: [],
    userListPagination: null,
    userListQuery: { page: 1, limit: 20 },
    roleList: [],
    roleListPagination: null,
    roleListQuery: { page: 1, limit: 20 },
    permissionList: [],
    permissionListPagination: null,
    permissionListQuery: { page: 1, limit: 20 },
    plans: [],
  }),
  getters: {
    planSelectOptions(state) {
      return state.plans
        .map(p => ({
          label: p.name,
          value: p.id,
        }))
        .filter(o => Number.isFinite(o.value))
        .sort((a, b) => a.label.localeCompare(b.label))
    },
  },
  actions: {
    async getPlans() {
      try {
        const response = await apiInstance.get(apiPaths.plans)
        const list = extractPlansList(response.data.data)
        this.plans = list.map(mapPlanRow).filter(Boolean)
      } catch (error) {
        console.error('Error fetching plans:', error)
        this.plans = []
        throw error
      }
    },
    async getTenantList(params = {}) {
      try {
        const page = Number(params.page ?? this.tenantListQuery.page ?? 1)
        const limit = Number(params.limit ?? this.tenantListQuery.limit ?? 20)
        const safePage = Number.isFinite(page) && page >= 1 ? page : 1
        const safeLimit = Number.isFinite(limit) && limit >= 1 ? limit : 20
        this.tenantListQuery = { page: safePage, limit: safeLimit }

        const apiPage = Math.max(0, safePage - 1)
        const response = await apiInstance.get(apiPaths.tenantsList, {
          params: {
            page: apiPage,
            limit: safeLimit,
          },
        })

        const tenantRoot = response?.data?.data
        if (!tenantRoot) {
          this.tenantList = []
          this.tenantListPagination = null
          return
        }
        const list = extractTenantList(tenantRoot)

        this.tenantList = list
          .map(mapTenant)
          .filter(Boolean)
        this.tenantListPagination = extractTenantListPagination(tenantRoot)
      } catch (error) {
        console.error('Error fetching tenants:', error)
        throw error
      }
    },
    async createTenant(payload) {
      try {
        const body = buildTenantRequestBody(payload)
        const response = await apiInstance.post(
          apiPaths.tenantsCreate,
          body,
        )
        const raw = extractTenantMutationResponse(response.data)
        const mapped = mapTenant(coerceTenantMutationRoot(raw))
        const created = mergeTenantWithPayload(
          mapped,
          payload,
          this.plans,
        )
        await this.getTenantList()
        return created
      } catch (error) {
        console.error('Error creating tenant:', error)
        throw error
      }
    },
    async updateTenant(id, payload) {
      try {
        const body = buildTenantRequestBody(payload)
        const response = await apiInstance.patch(
          tenantByIdPath(id),
          body,
        )
        const raw = extractTenantMutationResponse(response.data)
        const mapped = mapTenant(coerceTenantMutationRoot(raw))
        let updated = mergeTenantWithPayload(
          mapped,
          payload,
          this.plans,
        )
        if (updated && updated.id == null && id != null) {
          updated = { ...updated, id }
        }
        if (updated && updated.id != null) {
          const idx = this.tenantList.findIndex(
            t => String(t.id) === String(updated.id),
          )
          if (idx >= 0) {
            this.tenantList.splice(idx, 1, updated)
          } else {
            await this.getTenantList()
          }
        } else {
          await this.getTenantList()
        }
        return updated
      } catch (error) {
        console.error('Error updating tenant:', error)
        throw error
      }
    },
    async deleteTenant(id) {
      return this.updateTenant(id, { [tenantFieldKeys.status]: 0 })
    },
    async getUserById(id) {
      try {
        const response = await apiInstance.get(userByIdPath(id))
        const raw = extractUserMutationResponse(response.data)
        const root = coerceUserMutationRoot(raw) ?? raw

        return mapUser(root)
      } catch (error) {
        console.error('Error fetching user:', error)
        throw error
      }
    },
    async getUserList(params = {}) {
      try {
        const page = Number(params.page ?? this.userListQuery.page ?? 1)
        const limit = Number(params.limit ?? this.userListQuery.limit ?? 20)
        const safePage = Number.isFinite(page) && page >= 1 ? page : 1
        const safeLimit = Number.isFinite(limit) && limit >= 1 ? limit : 20
        this.userListQuery = { page: safePage, limit: safeLimit }

        const offset = (safePage - 1) * safeLimit
        const response = await apiInstance.get(apiPaths.usersList, {
          params: { offset, limit: safeLimit },
        })

        const userRoot = response?.data?.data
        if (!userRoot) {
          this.userList = []
          this.userListPagination = null
          return
        }
        const list = extractTenantList(userRoot)

        this.userList = list
          .map(mapUser)
          .filter(Boolean)
        this.userListPagination = extractTenantListPagination(userRoot)
      } catch (error) {
        console.error('Error fetching users:', error)
        throw error
      }
    },
    async createUser(payload) {
      try {
        const body = buildUserRegisterBody(payload)
        const response = await apiInstance.post(
          apiPaths.usersRegister,
          body,
        )
        const raw = extractUserMutationResponse(response.data)
        const mapped = mapUser(coerceUserMutationRoot(raw))
        const created = mergeUserWithPayload(mapped, payload)
        await this.getUserList()
        return created
      } catch (error) {
        console.error('Error creating user:', error)
        throw error
      }
    },
    async changeUserPassword(payload) {
      try {
        const body = buildUserChangePasswordBody(payload)
        await apiInstance.patch(apiPaths.usersChangePassword, body)
        return true
      } catch (error) {
        console.error('Error changing user password:', error)
        throw error
      }
    },
    async updateUser(id, payload) {
      try {
        const body = buildUserUpdateBody(id, payload)
        const response = await apiInstance.post(
          apiPaths.usersUpdate,
          body,
        )
        const raw = extractUserMutationResponse(response.data)
        const mapped = mapUser(coerceUserMutationRoot(raw))
        let updated = mergeUserWithPayload(mapped, payload)
        if (updated && updated.id == null && id != null) {
          updated = { ...updated, id }
        }
        if (updated && updated.id != null) {
          const idx = this.userList.findIndex(
            u => String(u.id) === String(updated.id),
          )
          if (idx >= 0) {
            this.userList.splice(idx, 1, updated)
          } else {
            await this.getUserList()
          }
        } else {
          await this.getUserList()
        }
        return updated
      } catch (error) {
        console.error('Error updating user:', error)
        throw error
      }
    },
    async deleteUser(id) {
      const row = this.userList.find(
        u => String(u.id) === String(id),
      )
      const base = row
        ? { ...row, [userFieldKeys.status]: 0 }
        : { id, [userFieldKeys.status]: 0 }

      return this.updateUser(id, base)
    },
    async getRoleList(params = {}) {
      try {
        const page = Number(params.page ?? this.roleListQuery.page ?? 1)
        const limit = Number(params.limit ?? this.roleListQuery.limit ?? 20)
        const safePage = Number.isFinite(page) && page >= 1 ? page : 1
        const safeLimit = Number.isFinite(limit) && limit >= 1 ? limit : 20
        this.roleListQuery = { page: safePage, limit: safeLimit }

        const apiPage = Math.max(0, safePage - 1)
        const response = await apiInstance.get(apiPaths.rolesList, {
          params: { page: apiPage, limit: safeLimit },
        })

        const root = response?.data?.data
        if (!root) {
          this.roleList = []
          this.roleListPagination = null

          return
        }
        const list = extractTenantList(root)

        this.roleList = list
          .map(mapRole)
          .filter(Boolean)
        this.roleListPagination = extractTenantListPagination(root)
      } catch (error) {
        console.error('Error fetching roles:', error)
        throw error
      }
    },
    async createRole(payload) {
      try {
        await apiInstance.post(apiPaths.rolesCreate, payload)
        await this.getRoleList()
      } catch (error) {
        console.error('Error creating role:', error)
        throw error
      }
    },
    async updateRole(payload) {
      try {
        await apiInstance.patch(apiPaths.rolesUpdate, payload)
        await this.getRoleList({
          page: this.roleListQuery.page,
          limit: this.roleListQuery.limit,
        })
      } catch (error) {
        console.error('Error updating role:', error)
        throw error
      }
    },
    async deleteRole(id) {
      try {
        await apiInstance.delete(roleByIdPath(id))
        await this.getRoleList()
      } catch (error) {
        console.error('Error deleting role:', error)
        throw error
      }
    },
    async getPermissionList(params = {}) {
      try {
        const page = Number(
          params.page ?? this.permissionListQuery.page ?? 1,
        )
        const limit = Number(
          params.limit ?? this.permissionListQuery.limit ?? 20,
        )
        const safePage = Number.isFinite(page) && page >= 1 ? page : 1
        const safeLimit = Number.isFinite(limit) && limit >= 1 ? limit : 20
        this.permissionListQuery = { page: safePage, limit: safeLimit }

        const apiPage = Math.max(0, safePage - 1)
        const response = await apiInstance.get(apiPaths.permissionsList, {
          params: { page: apiPage, limit: safeLimit },
        })

        let moduleRows = []
        try {
          moduleRows = await fetchAllEnvelopeList(
            (path, cfg) => apiInstance.get(path, cfg),
            apiPaths.modulesList,
          )
        } catch {
          moduleRows = []
        }

        const root = response?.data?.data
        if (!root) {
          this.permissionList = []
          this.permissionListPagination = null

          return
        }
        const list = extractTenantList(root)
        const mapped = list.map(mapPermission).filter(Boolean)

        this.permissionList = enrichPermissionsModuleNames(
          mapped,
          moduleRows,
        )
        this.permissionListPagination = extractTenantListPagination(root)
      } catch (error) {
        console.error('Error fetching permissions:', error)
        throw error
      }
    },
    async updatePermission(id, payload) {
      try {
        const idNum = Number(id)
        if (!Number.isFinite(idNum)) {
          throw new Error('Invalid permission id')
        }
        const body = buildPermissionUpdateBody(payload)
        await apiInstance.patch(apiPaths.permissionsUpdate, {
          id: idNum,
          ...body,
        })
        await this.getPermissionList({
          page: this.permissionListQuery.page,
          limit: this.permissionListQuery.limit,
        })
      } catch (error) {
        console.error('Error updating permission:', error)
        throw error
      }
    },
  },
})
