import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'
import { clientStatus } from 'src/components/constants'

export const useSiteStore = defineStore('site', {
  state: () => ({
    clientList: [],
  }),
  actions: {
    async getClientList(t) {
      try {
        const response = await apiInstance.get(
          '/client/v1/all-clients?limit=10&offset=0'
        )

        if (!response) {
          return
        }

        for (const client of response.data) {
          client.name = client.first_name + ' ' + client.last_name
          client.clinicians = ''
          client.dob = new Date(client.dob).toLocaleDateString(
            'en-US',
            {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }
          )
          client['admission_date'] = new Date(
            client['admission_date']
          ).toLocaleDateString(
            'en-US',
            {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }
          )
          switch (client.status) {
            case clientStatus.CLOSED:
              client.status = t('closed')
              break

            case clientStatus.OPEN:
              client.status = t('open')
              break

            default:
              client.status = 'unknown'
          }
        }

        this.clientList = response.data
      } catch (error) {
        console.error('Error fetching clients:', error)
        throw error
      }
    },
  }
})
