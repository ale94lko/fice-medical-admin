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
  buildModulePatchBody,
  buildPermissionUpdateBody,
  catalogByIdPath,
  enrichPermissionsModuleNames,
  extractCatalogList,
  mapCatalog,
  mapModule,
  mapPlan,
  moduleByIdPath,
  moduleUpdateByIdPath,
  planByIdPath,
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
    moduleList: [],
    moduleListPagination: null,
    moduleListQuery: { page: 1, limit: 20 },
    planList: [],
    planListPagination: null,
    planListQuery: { page: 1, limit: 20 },
    catalogList: [],
    catalogListPagination: null,
    catalogListQuery: { page: 1, limit: 20 },
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
    async getPlanList(params = {}) {
      try {
        const page = Number(params.page ?? this.planListQuery.page ?? 1)
        const limit = Number(params.limit ?? this.planListQuery.limit ?? 20)
        const safePage = Number.isFinite(page) && page >= 1 ? page : 1
        const safeLimit = Number.isFinite(limit) && limit >= 1 ? limit : 20
        this.planListQuery = { page: safePage, limit: safeLimit }

        const apiPage = Math.max(0, safePage - 1)
        const response = await apiInstance.get(apiPaths.plans, {
          params: { page: apiPage, limit: safeLimit },
        })

        const root = response?.data?.data
        if (!root) {
          this.planList = []
          this.planListPagination = null

          return
        }
        const list = extractPlansList(root)

        this.planList = list.map(mapPlan).filter(Boolean)
        this.planListPagination = extractTenantListPagination(root)
        this.plans = this.planList.map(mapPlanRow).filter(Boolean)
      } catch (error) {
        console.error('Error fetching plan list:', error)
        throw error
      }
    },
    async createPlan(payload) {
      try {
        await apiInstance.post(apiPaths.plans, payload)
        await this.getPlanList({
          page: this.planListQuery.page,
          limit: this.planListQuery.limit,
        })
        await this.getPlans()
      } catch (error) {
        console.error('Error creating plan:', error)
        throw error
      }
    },
    async updatePlan(id, payload) {
      try {
        await apiInstance.patch(planByIdPath(id), payload)
        await this.getPlanList({
          page: this.planListQuery.page,
          limit: this.planListQuery.limit,
        })
        await this.getPlans()
      } catch (error) {
        console.error('Error updating plan:', error)
        throw error
      }
    },
    async deletePlan(id) {
      try {
        await apiInstance.delete(planByIdPath(id))
        await this.getPlanList()
        await this.getPlans()
      } catch (error) {
        console.error('Error deleting plan:', error)
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
        const body = buildUserUpdateBody(payload)
        delete body.change_password
        const response = await apiInstance.patch(userByIdPath(id), body)
        const raw = extractUserMutationResponse(response.data)
        const mapped = mapUser(coerceUserMutationRoot(raw))
        let updated = mergeUserWithPayload(mapped, payload)
        if (updated && updated.id == null && id != null) {
          updated = { ...updated, id }
        }
        try {
          const fresh = await this.getUserById(id)
          if (fresh) {
            updated = mergeUserWithPayload(fresh, payload) ?? updated
          }
        } catch {
          // Keep PATCH merge when detail fetch fails
        }
        await this.getUserList({
          page: this.userListQuery.page,
          limit: this.userListQuery.limit,
        })
        if (updated?.id != null) {
          const fromList = this.userList.find(
            u => String(u.id) === String(updated.id),
          )
          if (fromList) {
            updated = mergeUserWithPayload(fromList, payload) ?? updated
          }
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
    async getModuleList(params = {}) {
      try {
        const page = Number(params.page ?? this.moduleListQuery.page ?? 1)
        const limit = Number(params.limit ?? this.moduleListQuery.limit ?? 20)
        const safePage = Number.isFinite(page) && page >= 1 ? page : 1
        const safeLimit = Number.isFinite(limit) && limit >= 1 ? limit : 20
        this.moduleListQuery = { page: safePage, limit: safeLimit }

        const apiPage = Math.max(0, safePage - 1)
        const response = await apiInstance.get(apiPaths.modulesList, {
          params: { page: apiPage, limit: safeLimit },
        })

        const root = response?.data?.data
        if (!root) {
          this.moduleList = []
          this.moduleListPagination = null

          return
        }
        const list = extractTenantList(root)

        this.moduleList = list.map(mapModule).filter(Boolean)
        this.moduleListPagination = extractTenantListPagination(root)
      } catch (error) {
        console.error('Error fetching modules:', error)
        throw error
      }
    },
    async getModuleById(id) {
      try {
        const response = await apiInstance.get(moduleByIdPath(id))
        const raw = response?.data?.data ?? response?.data

        return mapModule(raw)
      } catch (error) {
        console.error('Error fetching module:', error)
        throw error
      }
    },
    async updateModule(id, payload) {
      try {
        const idNum = Number(id)
        if (!Number.isFinite(idNum)) {
          throw new Error('Invalid module id')
        }
        const body = buildModulePatchBody(payload)
        await apiInstance.patch(moduleUpdateByIdPath(idNum), body)
        await this.getModuleList({
          page: this.moduleListQuery.page,
          limit: this.moduleListQuery.limit,
        })
      } catch (error) {
        console.error('Error updating module:', error)
        throw error
      }
    },
    async deleteModule(id) {
      try {
        await apiInstance.delete(moduleByIdPath(id))
        await this.getModuleList()
      } catch (error) {
        console.error('Error deleting module:', error)
        throw error
      }
    },
    async getCatalogList(params = {}) {
      try {
        const page = Number(params.page ?? this.catalogListQuery.page ?? 1)
        const limit = Number(params.limit ?? this.catalogListQuery.limit ?? 20)
        const safePage = Number.isFinite(page) && page >= 1 ? page : 1
        const safeLimit = Number.isFinite(limit) && limit >= 1 ? limit : 20
        this.catalogListQuery = { page: safePage, limit: safeLimit }

        const apiPage = Math.max(0, safePage - 1)
        const response = await apiInstance.get(apiPaths.catalogList, {
          params: { page: apiPage, limit: safeLimit },
        })

        const root = response?.data?.data
        if (!root) {
          this.catalogList = []
          this.catalogListPagination = null

          return
        }
        const list = extractCatalogList(root)

        this.catalogList = list.map(mapCatalog).filter(Boolean)
        this.catalogListPagination = extractTenantListPagination(root)
      } catch (error) {
        console.error('Error fetching catalogs:', error)
        throw error
      }
    },
    async getCatalogById(id) {
      const response = await apiInstance.get(catalogByIdPath(id))
      const root = response?.data?.data ?? response?.data

      return mapCatalog(root)
    },
    async createCatalog(payload) {
      try {
        await apiInstance.post(apiPaths.catalogCreate, payload)
        await this.getCatalogList({
          page: this.catalogListQuery.page,
          limit: this.catalogListQuery.limit,
        })
      } catch (error) {
        console.error('Error creating catalog:', error)
        throw error
      }
    },
    async updateCatalog(id, payload) {
      try {
        await apiInstance.patch(catalogByIdPath(id), payload)
        await this.getCatalogList({
          page: this.catalogListQuery.page,
          limit: this.catalogListQuery.limit,
        })
      } catch (error) {
        console.error('Error updating catalog:', error)
        throw error
      }
    },
    async deleteCatalog(id) {
      try {
        await apiInstance.delete(catalogByIdPath(id))
        await this.getCatalogList()
      } catch (error) {
        console.error('Error deleting catalog:', error)
        throw error
      }
    },
  },
})
