import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'
import { apiPaths, tenantFieldKeys } from 'components/constants.js'
import {
  buildTenantRequestBody,
  coerceTenantMutationRoot,
  extractPlansList,
  extractTenantList,
  extractTenantListPagination,
  extractTenantMutationResponse,
  mapPlanRow,
  mapTenant,
  mergeTenantWithPayload,
  tenantByIdPath,
} from 'components/helpers.js'

export const useSiteStore = defineStore('site', {
  state: () => ({
    tenantList: [],
    tenantListPagination: null,
    tenantListQuery: { page: 1, limit: 20 },
    userList: [],
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
    async getUserList(t) {
      try {
        console.warn(t)
        // const response = await apiInstance.get(
        //   '/client/v1/all-clients?limit=10&offset=0'
        // )
        //
        // if (!response) {
        //   return
        // }
        //
        // this.clientList = response.data
      } catch (error) {
        console.error('Error fetching users:', error)
        throw error
      }
    },
  },
})
