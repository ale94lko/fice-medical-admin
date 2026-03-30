import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory
} from 'vue-router'
import routes from './routes'
import { useAuthStore } from 'stores/auth-store.js'

export default defineRouter(function(/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  const authStore = useAuthStore()
  authStore.init()

  Router.beforeEach(async(to, from, next) => {
    if (to.meta.requiresAuth) {
      try {
        let expireAt = new Date(authStore.expireAt)
        let token = authStore.token
        const now = new Date()

        if (authStore.token == null) {
          authStore.restoreSession()
          expireAt = new Date(authStore.expireAt)
          token = authStore.token
        }

        if (now < expireAt && token != null) {
          next()
        } else {
          next('/login')
        }
      } catch (error) {
        console.log(error)
        next('/login')
      }
    } else {
      next()
    }
  })

  authStore.router = Router

  return Router
})
