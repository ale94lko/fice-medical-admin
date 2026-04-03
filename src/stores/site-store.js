import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'
// import { clientStatus } from 'src/components/constants'

export const useSiteStore = defineStore('site', {
  state: () => ({
    tenantList: [],
    userList: [],
  }),
  actions: {
    async getTenantList(t) {
      try {
        console.warn(t)
        const response = await apiInstance.get(
          '/admin-tenant/v1/tenants'
        )

        if (!response) {
          return
        }
        const tenantList = response.data.data

        for (const tenant of Object.values(tenantList)) {
          tenant.planName = tenant?.plan?.name || ''
        }

        this.tenantList = tenantList
      } catch (error) {
        console.error('Error fetching tenants:', error)
        throw error
      }
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
  }
})
