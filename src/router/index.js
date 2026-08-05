import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory
} from 'vue-router'
import routes from './routes'
import { useAuthStore } from 'stores/auth-store.js'

const CHUNK_LOAD_ERROR_RE = new RegExp(
  [
    'loading dynamically imported module',
    'Failed to fetch dynamically imported module',
    'Importing a module script failed',
    'ChunkLoadError',
  ].join('|'),
  'i',
)

function isChunkLoadError(error) {
  const msg = String(error?.message || error || '')

  return CHUNK_LOAD_ERROR_RE.test(msg)
}

function reloadForStaleChunk(Router, to) {
  if (typeof window === 'undefined') {
    return
  }
  const key = 'chunk-reload'
  const already = sessionStorage.getItem(key)
  if (already === to.fullPath) {
    return
  }
  sessionStorage.setItem(key, to.fullPath)
  const base = String(Router.options.history.base || '').replace(/\/$/, '')
  window.location.assign(
    `${window.location.origin}${base}${to.fullPath}`,
  )
}

export default defineRouter(function() {
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
    if (typeof sessionStorage !== 'undefined') {
      const key = 'chunk-reload'
      if (sessionStorage.getItem(key) === to.fullPath) {
        sessionStorage.removeItem(key)
      }
    }
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

        const accessValid = token != null && expireAt
          && !Number.isNaN(expireAt.getTime())
          && now < expireAt
        const canUseRefresh = token != null && authStore.refreshToken != null

        if (accessValid || canUseRefresh) {
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

  // After a new GitHub Pages deploy, hashed chunks change. A tab still
  // running the old entry tries to import deleted files → recover once.
  Router.onError((error, to) => {
    if (isChunkLoadError(error)) {
      reloadForStaleChunk(Router, to)
    }
  })

  authStore.router = Router

  return Router
})
