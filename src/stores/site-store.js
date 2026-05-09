import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'
import {
  apiPaths,
  tenantFieldKeys,
  userFieldKeys,
} from 'components/constants.js'
import {
  buildTenantRequestBody,
  buildUserRegisterBody,
  buildUserRequestBody,
  coerceTenantMutationRoot,
  coerceUserMutationRoot,
  extractPlansList,
  extractTenantList,
  extractTenantListPagination,
  extractTenantMutationResponse,
  extractUserMutationResponse,
  mapPlanRow,
  mapTenant,
  mapUser,
  mergeTenantWithPayload,
  mergeUserWithPayload,
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
          params: { page: apiPage, limit: safeLimit },
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
    async getUserList(params = {}) {
      try {
        const page = Number(params.page ?? this.userListQuery.page ?? 1)
        const limit = Number(params.limit ?? this.userListQuery.limit ?? 20)
        const safePage = Number.isFinite(page) && page >= 1 ? page : 1
        const safeLimit = Number.isFinite(limit) && limit >= 1 ? limit : 20
        this.userListQuery = { page: safePage, limit: safeLimit }

        const apiPage = Math.max(0, safePage - 1)
        const response = await apiInstance.get(apiPaths.usersList, {
          params: { page: apiPage, limit: safeLimit },
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
    async updateUser(id, payload) {
      try {
        const body = buildUserRequestBody(payload)
        const response = await apiInstance.patch(
          userByIdPath(id),
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
      return this.updateUser(id, { [userFieldKeys.status]: 0 })
    },
  },
})
