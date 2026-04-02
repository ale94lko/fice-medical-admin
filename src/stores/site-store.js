import { defineStore } from 'pinia'
// import { apiInstance } from 'boot/axios'
// import { clientStatus } from 'src/components/constants'

export const useSiteStore = defineStore('site', {
  state: () => ({
    userList: [],
  }),
  actions: {
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
