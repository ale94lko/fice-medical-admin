import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'

const api = axios.create({ baseURL: 'https://8abee00f087d.ngrok-free.app' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')

  if (token && !config.url.includes('/login')) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
}, error => {
  return Promise.reject(error)
})

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api

  // Para Composition API (provide/inject)
  app.provide('api', api)
})

export const apiInstance = api
