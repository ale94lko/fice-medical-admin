import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { defaultTenant } from 'components/constants.js'

const api = axios.create({
  baseURL: 'https://d9be-79-116-146-1.ngrok-free.app',
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')

  if (token && !config.url.includes('/login')) {
    config.headers.Authorization = `Bearer ${token}`
  }

  config.headers['X-Tenant-Key'] = defaultTenant

  return config
}, error => {
  return Promise.reject(error)
})

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
  app.provide('api', api)
})

export const apiInstance = api
